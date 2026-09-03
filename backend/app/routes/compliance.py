from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.compliance import ComplianceFramework, ComplianceRequirement
from app.models.auth import User, UserRole
from app.schemas.compliance import (
    ComplianceFrameworkResponse,
    ComplianceRequirementResponse,
    ComplianceRequirementUpdate
)
from app.utils.security import get_current_user, require_roles
from app.utils.audit import log_audit_event

router = APIRouter(prefix="/api/compliance", tags=["Regulatory Compliance"])

@router.get("", response_model=List[ComplianceFrameworkResponse])
def get_compliance_frameworks(db: Session = Depends(get_db)):
    """Retrieve all compliance reporting frameworks and requirements."""
    frameworks = db.query(ComplianceFramework).all()
    # Ensure completion percentages reflect requirements
    for f in frameworks:
        reqs = f.requirements
        if reqs:
            completed = sum(1 for r in reqs if r.status == "Completed")
            f.completed_requirements = completed
            f.total_requirements = len(reqs)
            f.completion_pct = round((sum(r.completion_pct for r in reqs) / (len(reqs) * 100.0)) * 100.0, 1)
    db.commit()
    return frameworks

@router.get("/requirements", response_model=List[ComplianceRequirementResponse])
def get_compliance_requirements(
    framework_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """List individual disclosure requirements with filters."""
    query = db.query(ComplianceRequirement)
    if framework_id:
        query = query.filter(ComplianceRequirement.framework_id == framework_id)
    if status:
        query = query.filter(ComplianceRequirement.status == status)

    return query.order_by(ComplianceRequirement.disclosure_code).all()

@router.patch("/requirements/{id}", response_model=ComplianceRequirementResponse)
def update_compliance_requirement(
    id: int,
    payload: ComplianceRequirementUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.SUSTAINABILITY_MANAGER, UserRole.AUDITOR]))
):
    """Update progress, status, or evidence attachment for a compliance disclosure."""
    req = db.query(ComplianceRequirement).filter(ComplianceRequirement.id == id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Compliance requirement not found")

    old_status = req.status
    if payload.status is not None:
        req.status = payload.status
        if payload.status == "Completed":
            req.completion_pct = 100.0
        elif payload.status == "Not Started":
            req.completion_pct = 0.0

    if payload.completion_pct is not None:
        req.completion_pct = payload.completion_pct
        if req.completion_pct >= 100.0:
            req.status = "Completed"

    if payload.evidence_available is not None:
        req.evidence_available = payload.evidence_available

    if payload.notes is not None:
        req.notes = payload.notes

    db.commit()
    db.refresh(req)

    log_audit_event(
        db=db,
        user_email=current_user.email,
        action="UPDATE",
        resource="ComplianceRequirement",
        resource_id=str(req.id),
        old_value=f"Status: {old_status}",
        new_value=f"Status: {req.status}, Progress: {req.completion_pct}%"
    )

    return req
