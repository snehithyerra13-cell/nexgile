from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
from app.models.audit import AuditLog

def log_audit_event(
    db: Session,
    user_email: str,
    action: str,
    resource: str,
    resource_id: Optional[str] = None,
    old_value: Optional[str] = None,
    new_value: Optional[str] = None,
    ip_address: str = "127.0.0.1"
):
    """Utility to persist immutable audit records."""
    try:
        log = AuditLog(
            user_email=user_email,
            action=action,
            resource=resource,
            resource_id=str(resource_id) if resource_id is not None else None,
            old_value=old_value,
            new_value=new_value,
            ip_address=ip_address,
            timestamp=datetime.utcnow()
        )
        db.add(log)
        db.commit()
    except Exception as e:
        print(f"Error recording audit log: {e}")
        db.rollback()
