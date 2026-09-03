from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class ComplianceFramework(Base):
    __tablename__ = "compliance_frameworks"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False) # CSRD, ESRS, CBAM, TCFD, EU_TAXONOMY, SEC, CDP
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    completion_pct = Column(Float, default=0.0)
    due_date = Column(String(20), default="2025-12-31")
    status = Column(String(50), default="In Progress") # Compliant, In Progress, At Risk, Action Required
    owner = Column(String(100), default="Sustainability & Legal Compliance")
    total_requirements = Column(Integer, default=10)
    completed_requirements = Column(Integer, default=6)
    created_at = Column(DateTime, default=datetime.utcnow)

    requirements = relationship("ComplianceRequirement", back_populates="framework", cascade="all, delete-orphan")

class ComplianceRequirement(Base):
    __tablename__ = "compliance_requirements"

    id = Column(Integer, primary_key=True, index=True)
    framework_id = Column(Integer, ForeignKey("compliance_frameworks.id"), nullable=False)
    disclosure_code = Column(String(50), nullable=False) # e.g. ESRS E1-6, CBAM-Art.6, TCFD-Metrics-a
    disclosure_name = Column(String(255), nullable=False)
    category = Column(String(100), default="Climate Change")
    owner = Column(String(100), default="Carbon Accounting Team")
    status = Column(String(50), default="In Progress") # Not Started, In Progress, Ready for Review, Completed
    evidence_available = Column(Boolean, default=False)
    completion_pct = Column(Float, default=50.0)
    notes = Column(Text, nullable=True)

    framework = relationship("ComplianceFramework", back_populates="requirements")
