from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.suppliers import Supplier, SupplierQuestionnaire, SupplierSubmission
from app.models.auth import User, UserRole
from app.schemas.suppliers import (
    SupplierCreate,
    SupplierResponse,
    SupplierQuestionnaireSubmit,
    SupplierQuestionnaireResponse,
    SupplierSubmissionCreate
)
from app.utils.security import get_current_user, require_roles
from app.utils.audit import log_audit_event

router = APIRouter(prefix="/api/suppliers", tags=["Supplier Management & Scope 3"])

def calculate_supplier_score(q: SupplierQuestionnaireSubmit) -> float:
    """Deterministic ESG scoring algorithm (0 - 100)."""
    score = 0.0
    if q.ghg_inventory_available:
        score += 20.0
    if q.renewable_energy_pct >= 50.0:
        score += 20.0
    elif q.renewable_energy_pct >= 20.0:
        score += 10.0
    elif q.renewable_energy_pct > 0:
        score += 5.0

    if "SBTi" in q.sbti_status or "Approved" in q.sbti_status:
        score += 20.0
    elif "Committed" in q.sbti_status or q.emissions_reduction_target:
        score += 10.0

    if q.pcf_available:
        score += 15.0

    if "Verified" in q.verification_status or "ISO" in q.verification_status:
        score += 15.0
    elif q.verification_status:
        score += 5.0

    if "ISO 14001" in q.environmental_certifications or "EcoVadis" in q.environmental_certifications:
        score += 10.0

    return min(100.0, score)

@router.get("", response_model=List[SupplierResponse])
def get_suppliers(
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Retrieve suppliers list with filters and scorecards."""
    query = db.query(Supplier)
    if category:
        query = query.filter(Supplier.category == category)
    if status:
        query = query.filter(Supplier.engagement_status == status)

    return query.order_by(Supplier.annual_emissions_tco2e.desc()).all()

@router.get("/scope3-scatter")
def get_supplier_scope3_scatter(db: Session = Depends(get_db)):
    """
    Returns spend vs emissions data points for bubble/scatter chart
    to highlight high-spend, high-emission priority decarbonization targets.
    """
    suppliers = db.query(Supplier).all()
    return [
        {
            "id": s.id,
            "name": s.name,
            "code": s.code,
            "category": s.category,
            "spend_usd": s.annual_spend_usd,
            "emissions_tco2e": s.annual_emissions_tco2e,
            "carbon_intensity": s.carbon_intensity,
            "risk_score": s.risk_score,
            "engagement_status": s.engagement_status,
            "sbti_committed": s.sbti_committed
        }
        for s in suppliers
    ]

@router.get("/{id}", response_model=SupplierResponse)
def get_supplier(id: int, db: Session = Depends(get_db)):
    """Get single supplier profile and historical questionnaires."""
    supplier = db.query(Supplier).filter(Supplier.id == id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return supplier

@router.post("/submit-questionnaire", response_model=SupplierQuestionnaireResponse)
def submit_questionnaire(
    payload: SupplierQuestionnaireSubmit,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Submits a supplier ESG decarbonization questionnaire and computes
    a deterministic sustainability score.
    """
    supplier = db.query(Supplier).filter(Supplier.id == payload.supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    score = calculate_supplier_score(payload)

    # Determine status
    eval_status = "Verified" if score >= 75.0 else ("Needs Improvement" if score < 45.0 else "Submitted")

    questionnaire = SupplierQuestionnaire(
        supplier_id=payload.supplier_id,
        reporting_year=payload.reporting_year,
        ghg_inventory_available=payload.ghg_inventory_available,
        scope1_emissions=payload.scope1_emissions,
        scope2_emissions=payload.scope2_emissions,
        scope3_emissions=payload.scope3_emissions,
        renewable_energy_pct=payload.renewable_energy_pct,
        emissions_reduction_target=payload.emissions_reduction_target,
        sbti_status=payload.sbti_status,
        pcf_available=payload.pcf_available,
        verification_status=payload.verification_status,
        environmental_certifications=payload.environmental_certifications,
        sustainability_score=score,
        status=eval_status,
        submitted_at=datetime.utcnow()
    )
    db.add(questionnaire)

    # Update supplier record
    supplier.latest_submission_date = datetime.utcnow().strftime("%Y-%m-%d")
    supplier.engagement_status = eval_status
    supplier.risk_score = round(max(5.0, 100.0 - score), 1)
    if payload.scope1_emissions + payload.scope2_emissions > 0:
        supplier.annual_emissions_tco2e = round(payload.scope1_emissions + payload.scope2_emissions, 1)
        supplier.carbon_intensity = round((supplier.annual_emissions_tco2e * 1000.0) / max(supplier.annual_spend_usd, 1.0), 2)

    db.commit()
    db.refresh(questionnaire)

    log_audit_event(
        db=db,
        user_email=current_user.email,
        action="CREATE",
        resource="SupplierQuestionnaire",
        resource_id=str(questionnaire.id),
        new_value=f"Supplier {supplier.name} Score: {score}/100"
    )

    return questionnaire

@router.post("/submit-emissions")
def submit_supplier_emissions(
    payload: SupplierSubmissionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Allows supplier to report Scope 1, 2, 3 emissions directly."""
    supplier = db.query(Supplier).filter(Supplier.id == payload.supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    sub = SupplierSubmission(
        supplier_id=payload.supplier_id,
        reporting_year=payload.reporting_year,
        scope1_tco2e=payload.scope1_tco2e,
        scope2_tco2e=payload.scope2_tco2e,
        scope3_tco2e=payload.scope3_tco2e,
        renewable_pct=payload.renewable_pct,
        verification_status=payload.verification_status,
        notes=payload.notes,
        submission_date=datetime.utcnow()
    )
    db.add(sub)

    supplier.annual_emissions_tco2e = round(payload.scope1_tco2e + payload.scope2_tco2e, 1)
    supplier.latest_submission_date = datetime.utcnow().strftime("%Y-%m-%d")
    db.commit()

    log_audit_event(
        db=db,
        user_email=current_user.email,
        action="CREATE",
        resource="SupplierSubmission",
        resource_id=str(sub.id),
        new_value=f"{supplier.name}: S1={payload.scope1_tco2e}, S2={payload.scope2_tco2e}, S3={payload.scope3_tco2e}"
    )

    return {"status": "success", "message": "Emissions successfully recorded for supplier"}

@router.post("", response_model=SupplierResponse)
def create_supplier(
    payload: SupplierCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.PROCUREMENT_MANAGER, UserRole.SUSTAINABILITY_MANAGER]))
):
    """Register a new vendor in the supplier directory."""
    existing = db.query(Supplier).filter(Supplier.code == payload.code.upper()).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Supplier code '{payload.code}' already exists")

    supplier = Supplier(
        organization_id=payload.organization_id or 1,
        name=payload.name,
        code=payload.code.upper(),
        country=payload.country,
        category=payload.category,
        annual_spend_usd=payload.annual_spend_usd,
        annual_emissions_tco2e=payload.annual_emissions_tco2e,
        carbon_intensity=payload.carbon_intensity,
        data_quality_score=payload.data_quality_score,
        risk_score=payload.risk_score,
        engagement_status=payload.engagement_status,
        sbti_committed=payload.sbti_committed,
        target_status=payload.target_status,
        contact_email=payload.contact_email,
        latest_submission_date=payload.latest_submission_date
    )
    db.add(supplier)
    db.commit()
    db.refresh(supplier)

    log_audit_event(
        db=db,
        user_email=current_user.email,
        action="CREATE",
        resource="Supplier",
        resource_id=str(supplier.id),
        new_value=f"{supplier.name} ({supplier.code})"
    )

    return supplier
