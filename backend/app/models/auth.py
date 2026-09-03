import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class UserRole(str, enum.Enum):
    ADMIN = "Admin"
    SUSTAINABILITY_MANAGER = "Sustainability Manager"
    CARBON_ACCOUNTANT = "Carbon Accountant"
    PROCUREMENT_MANAGER = "Procurement Manager"
    SUPPLIER = "Supplier"
    AUDITOR = "Auditor"
    EXECUTIVE = "Executive"

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(50), unique=True, nullable=False)
    industry = Column(String(100), default="Technology & Advanced Manufacturing")
    country = Column(String(100), default="India")
    currency = Column(String(10), default="USD")
    created_at = Column(DateTime, default=datetime.utcnow)

    users = relationship("User", back_populates="organization", cascade="all, delete-orphan")
    facilities = relationship("Facility", back_populates="organization", cascade="all, delete-orphan")
    products = relationship("Product", back_populates="organization", cascade="all, delete-orphan")
    suppliers = relationship("Supplier", back_populates="organization", cascade="all, delete-orphan")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.SUSTAINABILITY_MANAGER, nullable=False)
    title = Column(String(100), default="Sustainability Analyst")
    is_active = Column(Boolean, default=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    organization = relationship("Organization", back_populates="users")
