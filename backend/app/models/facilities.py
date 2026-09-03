from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class BusinessUnit(Base):
    __tablename__ = "business_units"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    name = Column(String(255), nullable=False)
    code = Column(String(50), nullable=False)
    head = Column(String(255), nullable=True)

    facilities = relationship("Facility", back_populates="business_unit")

class Facility(Base):
    __tablename__ = "facilities"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    business_unit_id = Column(Integer, ForeignKey("business_units.id"), nullable=True)
    name = Column(String(255), nullable=False)
    code = Column(String(50), unique=True, nullable=False)
    country = Column(String(100), default="India")
    city = Column(String(100), nullable=False)
    facility_type = Column(String(100), default="Manufacturing Plant")
    floor_area_sqm = Column(Float, default=15000.0)
    employee_count = Column(Integer, default=350)
    grid_region = Column(String(100), default="Southern Regional Grid")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    organization = relationship("Organization", back_populates="facilities")
    business_unit = relationship("BusinessUnit", back_populates="facilities")
    departments = relationship("Department", back_populates="facility", cascade="all, delete-orphan")
    emissions = relationship("EmissionRecord", back_populates="facility")

class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    facility_id = Column(Integer, ForeignKey("facilities.id"), nullable=False)
    name = Column(String(255), nullable=False)
    code = Column(String(50), nullable=False)
    cost_center = Column(String(50), nullable=True)

    facility = relationship("Facility", back_populates="departments")
