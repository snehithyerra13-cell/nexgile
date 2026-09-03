from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.audit import Evidence
from app.models.auth import User, UserRole
from app.schemas.audit import EvidenceResponse, EvidenceCreate
from app.utils.security import get_current_user, require_roles
from app.utils.audit import log_audit_event

router = APIRouter(prefix="/api/evidence", tags=["Evidence Management"])

@router.get("", response_model=List[EvidenceResponse])
def get_evidence_records(
    verification_status: Optional[str] = Query(None),
    file_type: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """List verification evidence files and documents."""
    query = db.query(Evidence)
    if verification_status:
        query = query.filter(Evidence.verification_status == verification_status)
    if file_type:
        query = query.filter(Evidence.file_type == file_type)

    return query.order_by(Evidence.upload_date.desc()).all()

@router.post("", response_model=EvidenceResponse)
def create_evidence_record(
    payload: EvidenceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Register new audit evidence document."""
    ev = Evidence(
        file_name=payload.file_name,
        file_type=payload.file_type,
        related_record_type=payload.related_record_type,
        related_record_id=payload.related_record_id,
        uploaded_by=current_user.full_name,
        upload_date=datetime.utcnow(),
        verification_status="Pending",
        file_size_kb=740,
        notes=payload.notes
    )
    db.add(ev)
    db.commit()
    db.refresh(ev)

    log_audit_event(
        db=db,
        user_email=current_user.email,
        action="CREATE",
        resource="Evidence",
        resource_id=str(ev.id),
        new_value=f"{ev.file_name} ({ev.file_type})"
    )

    return ev

@router.patch("/{id}/verify", response_model=EvidenceResponse)
def verify_evidence_record(
    id: int,
    status: str = Query(..., regex="^(Verified|Pending|Flagged)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.AUDITOR, UserRole.SUSTAINABILITY_MANAGER]))
):
    """Auditor verification for uploaded documentation."""
    ev = db.query(Evidence).filter(Evidence.id == id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Evidence not found")

    old_status = ev.verification_status
    ev.verification_status = status
    db.commit()
    db.refresh(ev)

    log_audit_event(
        db=db,
        user_email=current_user.email,
        action="APPROVE" if status == "Verified" else "UPDATE",
        resource="Evidence",
        resource_id=str(ev.id),
        old_value=f"Status: {old_status}",
        new_value=f"Status: {status}"
    )

    return ev
