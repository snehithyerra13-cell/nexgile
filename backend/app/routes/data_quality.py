from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.finance import DataQualityMetric, DataQualityIssue
from app.models.auth import User, UserRole
from app.schemas.finance import DataQualityMetricResponse, DataQualityIssueResponse
from app.utils.security import get_current_user, require_roles
from app.utils.audit import log_audit_event

router = APIRouter(prefix="/api/data-quality", tags=["Data Quality & Assurance"])

@router.get("", response_model=DataQualityMetricResponse)
def get_data_quality_metrics(db: Session = Depends(get_db)):
    """Retrieve current data quality health metrics and dimensions."""
    metric = db.query(DataQualityMetric).first()
    if not metric:
        metric = DataQualityMetric(
            organization_id=1,
            completeness=94.5,
            validity=96.2,
            consistency=91.8,
            timeliness=89.0,
            verified_records_pct=87.5,
            estimated_records_pct=12.5,
            overall_score=92.0
        )
        db.add(metric)
        db.commit()
        db.refresh(metric)
    return metric

@router.get("/issues", response_model=List[DataQualityIssueResponse])
def get_data_quality_issues(db: Session = Depends(get_db)):
    """List data quality anomalies, unverified logs, and estimation warnings."""
    return db.query(DataQualityIssue).order_by(DataQualityIssue.status.desc(), DataQualityIssue.created_at.desc()).all()

@router.patch("/issues/{id}/resolve", response_model=DataQualityIssueResponse)
def resolve_data_quality_issue(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.CARBON_ACCOUNTANT, UserRole.AUDITOR]))
):
    """Mark a data quality issue as resolved."""
    issue = db.query(DataQualityIssue).filter(DataQualityIssue.id == id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    issue.status = "Resolved"
    db.commit()
    db.refresh(issue)

    log_audit_event(
        db=db,
        user_email=current_user.email,
        action="UPDATE",
        resource="DataQualityIssue",
        resource_id=str(issue.id),
        new_value=f"Resolved issue: {issue.issue_type}"
    )

    return issue
