from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.facilities import Facility, BusinessUnit, Department
from app.models.emissions import EmissionRecord
from app.models.auth import User, UserRole
from app.schemas.facilities import FacilityCreate, FacilityResponse
from app.utils.security import get_current_user, require_roles
from app.utils.audit import log_audit_event

router = APIRouter(prefix="/api/facilities", tags=["Facilities"])

@router.get("", response_model=List[FacilityResponse])
def get_facilities(db: Session = Depends(get_db)):
    """List all corporate facilities with computed emission metrics."""
    facilities = db.query(Facility).all()
    
    # Compute total emissions per facility
    totals = db.query(
        EmissionRecord.facility_id,
        func.sum(EmissionRecord.calculated_emissions).label("sum_emissions")
    ).group_by(EmissionRecord.facility_id).all()
    totals_map = {fid: float(val or 0.0) for fid, val in totals}

    result = []
    for f in facilities:
        resp = FacilityResponse.model_validate(f)
        ems = totals_map.get(f.id, 0.0)
        resp.total_emissions_tco2e = round(ems, 2)
        resp.carbon_intensity_sqm = round((ems * 1000.0) / max(f.floor_area_sqm, 1.0), 2)
        result.append(resp)

    return result

@router.post("", response_model=FacilityResponse)
def create_facility(
    payload: FacilityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.SUSTAINABILITY_MANAGER]))
):
    """Add a new corporate facility."""
    existing = db.query(Facility).filter(Facility.code == payload.code.upper()).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Facility code '{payload.code}' already exists")

    facility = Facility(
        organization_id=payload.organization_id or 1,
        business_unit_id=payload.business_unit_id,
        name=payload.name,
        code=payload.code.upper(),
        country=payload.country,
        city=payload.city,
        facility_type=payload.facility_type,
        floor_area_sqm=payload.floor_area_sqm,
        employee_count=payload.employee_count,
        grid_region=payload.grid_region,
        is_active=payload.is_active
    )
    db.add(facility)
    db.commit()
    db.refresh(facility)

    log_audit_event(
        db=db,
        user_email=current_user.email,
        action="CREATE",
        resource="Facility",
        resource_id=str(facility.id),
        new_value=f"{facility.name} ({facility.code})"
    )

    resp = FacilityResponse.model_validate(facility)
    resp.total_emissions_tco2e = 0.0
    resp.carbon_intensity_sqm = 0.0
    return resp
