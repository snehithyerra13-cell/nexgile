from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.audit import Notification
from app.schemas.audit import NotificationResponse

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])

@router.get("", response_model=List[NotificationResponse])
def get_notifications(db: Session = Depends(get_db)):
    """Retrieve system alerts and notifications."""
    return db.query(Notification).order_by(Notification.created_at.desc()).all()

@router.patch("/{id}/read", response_model=NotificationResponse)
def mark_notification_read(id: int, db: Session = Depends(get_db)):
    """Mark notification as read."""
    n = db.query(Notification).filter(Notification.id == id).first()
    if not n:
        raise HTTPException(status_code=404, detail="Notification not found")
    n.is_read = True
    db.commit()
    db.refresh(n)
    return n

@router.post("/mark-all-read")
def mark_all_notifications_read(db: Session = Depends(get_db)):
    """Mark all active notifications as read."""
    db.query(Notification).update({Notification.is_read: True})
    db.commit()
    return {"status": "success", "message": "All notifications marked as read"}
