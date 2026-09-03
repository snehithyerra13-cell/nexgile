from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.emissions import EmissionRecord, EmissionFactor
from app.models.facilities import Facility
from app.models.auth import User, UserRole
from app.schemas.emissions import (
    EmissionRecordCreate,
    EmissionRecordUpdate,
    EmissionRecordResponse,
    EmissionRecordStatusUpdate,
    DataLineageResponse
)
from app.utils.security import get_current_user, require_roles
from app.utils.audit import log_audit_event

router = APIRouter(prefix="/api/emissions", tags=["Carbon Accounting"])

@router.get("", response_model=List[EmissionRecordResponse])
def get_emission_records(
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    facility_id: Optional[int] = Query(None),
    scope: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(200),
    db: Session = Depends(get_db)
):
    """List emission records with multi-dimensional filtering."""
    query = db.query(EmissionRecord)

    if year:
        query = query.filter(EmissionRecord.reporting_year == year)
    if month:
        query = query.filter(EmissionRecord.reporting_month == month)
    if facility_id:
        query = query.filter(EmissionRecord.facility_id == facility_id)
    if scope:
        query = query.filter(EmissionRecord.scope == scope)
    if category:
        query = query.filter(EmissionRecord.category == category)
    if status:
        query = query.filter(EmissionRecord.status == status)

    records = query.order_by(
        EmissionRecord.reporting_year.desc(),
        EmissionRecord.reporting_month.desc(),
        EmissionRecord.id.desc()
    ).limit(limit).all()

    # Facility name mapping
    facility_map = {f.id: f.name for f in db.query(Facility).all()}

    output = []
    for r in records:
        resp = EmissionRecordResponse.model_validate(r)
        resp.facility_name = facility_map.get(r.facility_id, "Unknown Facility")
        output.append(resp)

    return output

@router.get("/{id}", response_model=EmissionRecordResponse)
def get_emission_record(id: int, db: Session = Depends(get_db)):
    """Retrieve single emission record details."""
    record = db.query(EmissionRecord).filter(EmissionRecord.id == id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Emission record not found")
    
    facility = db.query(Facility).filter(Facility.id == record.facility_id).first()
    resp = EmissionRecordResponse.model_validate(record)
    resp.facility_name = facility.name if facility else "Unknown Facility"
    return resp

@router.get("/{id}/lineage", response_model=DataLineageResponse)
def get_record_data_lineage(id: int, db: Session = Depends(get_db)):
    """
    Returns complete audit-grade data lineage:
    Activity Data -> Emission Factor -> Calculation Formula -> Final tCO2e
    """
    record = db.query(EmissionRecord).filter(EmissionRecord.id == id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Emission record not found")

    factor_name = "Custom Emission Factor"
    if record.emission_factor_id:
        factor = db.query(EmissionFactor).filter(EmissionFactor.id == record.emission_factor_id).first()
        if factor:
            factor_name = factor.factor_name

    formula = f"Activity Data ({record.activity_amount:,.2f} {record.activity_unit}) × Emission Factor ({record.emission_factor_value:.4f} {record.emission_factor_unit}) / 1,000"

    return DataLineageResponse(
        record_id=record.id,
        activity_data=f"{record.activity_amount:,.2f} {record.activity_unit}",
        activity_amount=record.activity_amount,
        activity_unit=record.activity_unit,
        emission_factor_value=record.emission_factor_value,
        emission_factor_unit=record.emission_factor_unit,
        emission_factor_name=factor_name,
        emission_factor_source=record.emission_factor_source,
        emission_factor_version=record.emission_factor_version,
        formula=formula,
        calculated_emissions_tco2e=record.calculated_emissions,
        uncertainty_percentage=record.uncertainty_percentage,
        data_quality_score=record.data_quality_score,
        recorded_by=record.created_by,
        created_at=record.created_at.strftime("%Y-%m-%d %H:%M UTC") if record.created_at else "2024-01-01",
        verified_by_status=record.status
    )

@router.post("", response_model=EmissionRecordResponse)
def create_emission_record(
    payload: EmissionRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new activity data emission record with automatic calculation."""
    # Verify facility exists
    facility = db.query(Facility).filter(Facility.id == payload.facility_id).first()
    if not facility:
        raise HTTPException(status_code=400, detail="Invalid facility ID")

    # If emission_factor_id provided, sync factor details
    if payload.emission_factor_id:
        ef = db.query(EmissionFactor).filter(EmissionFactor.id == payload.emission_factor_id).first()
        if ef:
            payload.emission_factor_value = ef.factor_value
            payload.emission_factor_unit = ef.unit
            payload.emission_factor_source = ef.source
            payload.emission_factor_version = ef.version

    # Calculate emissions: activity_amount * emission_factor / 1000 => tCO2e
    calculated = payload.calculated_emissions
    if calculated is None:
        calculated = round((payload.activity_amount * payload.emission_factor_value) / 1000.0, 4)

    record = EmissionRecord(
        organization_id=payload.organization_id or 1,
        facility_id=payload.facility_id,
        department=payload.department,
        reporting_year=payload.reporting_year,
        reporting_month=payload.reporting_month,
        scope=payload.scope,
        category=payload.category,
        activity_type=payload.activity_type,
        activity_amount=payload.activity_amount,
        activity_unit=payload.activity_unit,
        emission_factor_id=payload.emission_factor_id,
        emission_factor_value=payload.emission_factor_value,
        emission_factor_unit=payload.emission_factor_unit,
        emission_factor_source=payload.emission_factor_source,
        emission_factor_version=payload.emission_factor_version,
        calculated_emissions=calculated,
        uncertainty_percentage=payload.uncertainty_percentage,
        data_quality_score=payload.data_quality_score,
        status="Submitted", # New submissions go to review
        notes=payload.notes,
        created_by=current_user.email
    )

    db.add(record)
    db.commit()
    db.refresh(record)

    log_audit_event(
        db=db,
        user_email=current_user.email,
        action="CREATE",
        resource="EmissionRecord",
        resource_id=str(record.id),
        new_value=f"{record.scope} - {record.activity_type}: {record.calculated_emissions} tCO2e"
    )

    resp = EmissionRecordResponse.model_validate(record)
    resp.facility_name = facility.name
    return resp

@router.put("/{id}", response_model=EmissionRecordResponse)
def update_emission_record(
    id: int,
    payload: EmissionRecordUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an existing emission record."""
    record = db.query(EmissionRecord).filter(EmissionRecord.id == id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Emission record not found")

    old_summary = f"{record.activity_type}: {record.activity_amount} {record.activity_unit} ({record.calculated_emissions} tCO2e)"

    update_data = payload.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(record, field, val)

    # Recalculate if amount or factor changed
    if "activity_amount" in update_data or "emission_factor_value" in update_data:
        record.calculated_emissions = round((record.activity_amount * record.emission_factor_value) / 1000.0, 4)

    db.commit()
    db.refresh(record)

    log_audit_event(
        db=db,
        user_email=current_user.email,
        action="UPDATE",
        resource="EmissionRecord",
        resource_id=str(record.id),
        old_value=old_summary,
        new_value=f"{record.activity_type}: {record.activity_amount} {record.activity_unit} ({record.calculated_emissions} tCO2e)"
    )

    facility = db.query(Facility).filter(Facility.id == record.facility_id).first()
    resp = EmissionRecordResponse.model_validate(record)
    resp.facility_name = facility.name if facility else "Unknown Facility"
    return resp

@router.patch("/{id}/status", response_model=EmissionRecordResponse)
def update_record_status(
    id: int,
    payload: EmissionRecordStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.SUSTAINABILITY_MANAGER, UserRole.AUDITOR]))
):
    """
    Approve, reject, or mark submitted for an emission record.
    Restricted to Admin, Sustainability Manager, or Auditor.
    """
    record = db.query(EmissionRecord).filter(EmissionRecord.id == id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Emission record not found")

    old_status = record.status
    record.status = payload.status
    if payload.notes:
        record.notes = (record.notes or "") + f" [Status Note: {payload.notes}]"

    db.commit()
    db.refresh(record)

    action_label = "APPROVE" if payload.status == "Approved" else ("REJECT" if payload.status == "Rejected" else "UPDATE")
    log_audit_event(
        db=db,
        user_email=current_user.email,
        action=action_label,
        resource="EmissionRecord",
        resource_id=str(record.id),
        old_value=f"Status: {old_status}",
        new_value=f"Status: {record.status}"
    )

    facility = db.query(Facility).filter(Facility.id == record.facility_id).first()
    resp = EmissionRecordResponse.model_validate(record)
    resp.facility_name = facility.name if facility else "Unknown Facility"
    return resp

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_emission_record(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.SUSTAINABILITY_MANAGER, UserRole.CARBON_ACCOUNTANT]))
):
    """Delete an emission record."""
    record = db.query(EmissionRecord).filter(EmissionRecord.id == id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Emission record not found")

    record_summary = f"ID: {record.id}, {record.category} - {record.calculated_emissions} tCO2e"
    db.delete(record)
    db.commit()

    log_audit_event(
        db=db,
        user_email=current_user.email,
        action="DELETE",
        resource="EmissionRecord",
        resource_id=str(id),
        old_value=record_summary
    )
    return None
