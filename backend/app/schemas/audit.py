from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class AuditLogResponse(BaseModel):
    id: int
    user_email: str
    action: str
    resource: str
    resource_id: Optional[str] = None
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    ip_address: str
    timestamp: datetime

    class Config:
        from_attributes = True

class EvidenceCreate(BaseModel):
    file_name: str
    file_type: str = "PDF"
    related_record_type: str = "EmissionRecord"
    related_record_id: Optional[str] = None
    notes: Optional[str] = None

class EvidenceResponse(BaseModel):
    id: int
    file_name: str
    file_type: str
    related_record_type: str
    related_record_id: Optional[str] = None
    uploaded_by: str
    upload_date: datetime
    verification_status: str
    file_size_kb: int
    notes: Optional[str] = None

    class Config:
        from_attributes = True

class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    category: str
    severity: str
    is_read: bool
    link: str
    created_at: datetime

    class Config:
        from_attributes = True
