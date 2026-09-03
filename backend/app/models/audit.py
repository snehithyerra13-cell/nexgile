from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from app.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_email = Column(String(255), nullable=False)
    action = Column(String(50), nullable=False) # CREATE, UPDATE, DELETE, IMPORT, LOGIN, APPROVE, REJECT
    resource = Column(String(100), nullable=False) # EmissionRecord, Product, Supplier, ReductionInitiative, Compliance
    resource_id = Column(String(50), nullable=True)
    old_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    ip_address = Column(String(50), default="127.0.0.1")
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

class Evidence(Base):
    __tablename__ = "evidence_records"

    id = Column(Integer, primary_key=True, index=True)
    file_name = Column(String(255), nullable=False)
    file_type = Column(String(50), default="PDF") # PDF, CSV, Invoice, Utility Bill, Certificate
    related_record_type = Column(String(100), default="EmissionRecord")
    related_record_id = Column(String(50), nullable=True)
    uploaded_by = Column(String(100), default="Carbon Accountant")
    upload_date = Column(DateTime, default=datetime.utcnow)
    verification_status = Column(String(50), default="Verified") # Verified, Pending, Flagged
    file_size_kb = Column(Integer, default=520)
    notes = Column(Text, nullable=True)

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    category = Column(String(50), default="General") # Supplier, Emissions, Compliance, Facility, Reduction
    severity = Column(String(20), default="info") # info, warning, danger, success
    is_read = Column(Boolean, default=False)
    link = Column(String(255), default="/dashboard")
    created_at = Column(DateTime, default=datetime.utcnow)
