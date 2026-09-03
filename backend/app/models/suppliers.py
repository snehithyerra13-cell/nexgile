from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    name = Column(String(255), nullable=False)
    code = Column(String(50), unique=True, nullable=False)
    country = Column(String(100), default="India")
    category = Column(String(100), nullable=False) # e.g. Raw Materials, Electronics Components, Logistics, Packaging
    annual_spend_usd = Column(Float, default=1000000.0)
    annual_emissions_tco2e = Column(Float, default=5000.0)
    carbon_intensity = Column(Float, default=5.0) # tCO2e per $1,000 spend
    data_quality_score = Column(Float, default=85.0)
    risk_score = Column(Float, default=45.0) # 0-100 (high = higher carbon risk)
    engagement_status = Column(String(50), default="Submitted") # Invited, Pending, Submitted, Verified, Needs Improvement
    sbti_committed = Column(Boolean, default=False)
    target_status = Column(String(100), default="1.5°C Aligned Target Set")
    contact_email = Column(String(255), nullable=True)
    latest_submission_date = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    organization = relationship("Organization", back_populates="suppliers")
    questionnaires = relationship("SupplierQuestionnaire", back_populates="supplier", cascade="all, delete-orphan")
    submissions = relationship("SupplierSubmission", back_populates="supplier", cascade="all, delete-orphan")

class SupplierQuestionnaire(Base):
    __tablename__ = "supplier_questionnaires"

    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)
    reporting_year = Column(Integer, default=2024)
    ghg_inventory_available = Column(Boolean, default=True)
    scope1_emissions = Column(Float, default=1200.0)
    scope2_emissions = Column(Float, default=2400.0)
    scope3_emissions = Column(Float, default=4800.0)
    renewable_energy_pct = Column(Float, default=35.0)
    emissions_reduction_target = Column(String(255), default="30% reduction by 2030 from 2022 baseline")
    sbti_status = Column(String(100), default="Near-Term Target Approved")
    pcf_available = Column(Boolean, default=True)
    verification_status = Column(String(100), default="Third-Party Verified (ISO 14064)")
    environmental_certifications = Column(String(255), default="ISO 14001, ISO 50001, EcoVadis Gold")
    sustainability_score = Column(Float, default=82.5) # Calculated score 0-100
    status = Column(String(50), default="Verified") # Pending Review, Verified, Action Required
    submitted_at = Column(DateTime, default=datetime.utcnow)

    supplier = relationship("Supplier", back_populates="questionnaires")

class SupplierSubmission(Base):
    __tablename__ = "supplier_submissions"

    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)
    reporting_year = Column(Integer, default=2024)
    scope1_tco2e = Column(Float, nullable=False)
    scope2_tco2e = Column(Float, nullable=False)
    scope3_tco2e = Column(Float, nullable=False)
    renewable_pct = Column(Float, default=0.0)
    verification_status = Column(String(50), default="Verified")
    submission_date = Column(DateTime, default=datetime.utcnow)
    notes = Column(Text, nullable=True)

    supplier = relationship("Supplier", back_populates="submissions")
