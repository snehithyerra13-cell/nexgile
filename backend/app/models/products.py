from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    sku = Column(String(100), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False) # e.g. Electronics, Industrial Hardware, Automotive Component
    description = Column(Text, nullable=True)
    weight_kg = Column(Float, default=1.0)
    unit = Column(String(50), default="unit")
    annual_production = Column(Integer, default=100000) # units produced per year
    target_pcf = Column(Float, default=10.0) # Target kgCO2e per unit
    total_pcf = Column(Float, default=12.5) # Sum of stages in kgCO2e per unit
    created_at = Column(DateTime, default=datetime.utcnow)

    organization = relationship("Organization", back_populates="products")
    lifecycle_stages = relationship("ProductLifecycleStage", back_populates="product", cascade="all, delete-orphan")
    materials = relationship("ProductMaterial", back_populates="product", cascade="all, delete-orphan")

class ProductLifecycleStage(Base):
    __tablename__ = "product_lifecycle_stages"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    stage_name = Column(String(100), nullable=False) # Raw Materials, Manufacturing, Packaging, Transportation, Distribution, Product Use, End of Life
    emissions_kg_co2e = Column(Float, nullable=False)
    percentage = Column(Float, default=0.0)
    details = Column(Text, nullable=True)

    product = relationship("Product", back_populates="lifecycle_stages")

class ProductMaterial(Base):
    __tablename__ = "product_materials"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    material_name = Column(String(255), nullable=False)
    quantity = Column(Float, nullable=False)
    unit = Column(String(50), default="kg")
    supplier_name = Column(String(255), default="Primary Tier-1 Supplier")
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True)
    emission_factor = Column(Float, nullable=False) # kgCO2e per unit of material
    calculated_emissions = Column(Float, nullable=False) # kgCO2e
    recycled_percentage = Column(Float, default=0.0)

    product = relationship("Product", back_populates="materials")
