from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class EmissionFactor(Base):
    __tablename__ = "emission_factors"

    id = Column(Integer, primary_key=True, index=True)
    factor_name = Column(String(255), nullable=False)
    activity_type = Column(String(100), nullable=False)
    category = Column(String(100), nullable=False)
    scope = Column(String(50), nullable=False) # Scope 1, Scope 2, Scope 3
    geography = Column(String(100), default="India")
    unit = Column(String(50), nullable=False) # e.g. kgCO2e/kWh, kgCO2e/liter
    factor_value = Column(Float, nullable=False) # numerical factor
    source = Column(String(100), default="GHG Protocol / DEFRA")
    year = Column(Integer, default=2024)
    version = Column(String(50), default="v2.4")
    valid_from = Column(String(20), default="2024-01-01")
    valid_until = Column(String(20), default="2025-12-31")
    is_demo = Column(Boolean, default=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    emission_records = relationship("EmissionRecord", back_populates="factor")

class EmissionRecord(Base):
    __tablename__ = "emission_records"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    facility_id = Column(Integer, ForeignKey("facilities.id"), nullable=False)
    department = Column(String(100), default="Operations")
    reporting_year = Column(Integer, nullable=False, index=True)
    reporting_month = Column(Integer, nullable=False, index=True) # 1 - 12
    scope = Column(String(50), nullable=False, index=True) # Scope 1, Scope 2, Scope 3
    category = Column(String(100), nullable=False, index=True) # e.g. Stationary Combustion, Electricity
    activity_type = Column(String(100), nullable=False) # e.g. Natural Gas, Grid Power
    activity_amount = Column(Float, nullable=False)
    activity_unit = Column(String(50), nullable=False) # e.g. kWh, Liters, Metric Tonnes
    
    # Emission factor linkage & lineage
    emission_factor_id = Column(Integer, ForeignKey("emission_factors.id"), nullable=True)
    emission_factor_value = Column(Float, nullable=False)
    emission_factor_unit = Column(String(50), nullable=False)
    emission_factor_source = Column(String(100), default="GHG Protocol / DEFRA")
    emission_factor_version = Column(String(50), default="v2.4")

    # Calculated metrics
    # calculated_emissions in Metric Tonnes of CO2 equivalent (tCO2e)
    calculated_emissions = Column(Float, nullable=False)
    uncertainty_percentage = Column(Float, default=5.0)
    data_quality_score = Column(Float, default=90.0)

    # Workflow state: Draft, Submitted, Approved, Rejected
    status = Column(String(50), default="Approved")
    notes = Column(Text, nullable=True)
    created_by = Column(String(100), default="system")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    facility = relationship("Facility", back_populates="emissions")
    factor = relationship("EmissionFactor", back_populates="emission_records")
