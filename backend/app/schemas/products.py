from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

class ProductMaterialBase(BaseModel):
    material_name: str
    quantity: float
    unit: str = "kg"
    supplier_name: str = "Primary Tier-1 Supplier"
    supplier_id: Optional[int] = None
    emission_factor: float
    calculated_emissions: float
    recycled_percentage: float = 0.0

class ProductMaterialCreate(ProductMaterialBase):
    product_id: int

class ProductMaterialResponse(ProductMaterialBase):
    id: int
    product_id: int

    class Config:
        from_attributes = True

class ProductLifecycleStageBase(BaseModel):
    stage_name: str
    emissions_kg_co2e: float
    percentage: float = 0.0
    details: Optional[str] = None

class ProductLifecycleStageResponse(ProductLifecycleStageBase):
    id: int
    product_id: int

    class Config:
        from_attributes = True

class ProductBase(BaseModel):
    sku: str
    name: str
    category: str
    description: Optional[str] = None
    weight_kg: float = 1.0
    unit: str = "unit"
    annual_production: int = 100000
    target_pcf: float = 10.0

class ProductCreate(ProductBase):
    organization_id: Optional[int] = 1

class ProductResponse(ProductBase):
    id: int
    organization_id: int
    total_pcf: float
    created_at: Optional[datetime] = None
    lifecycle_stages: List[ProductLifecycleStageResponse] = []
    materials: List[ProductMaterialResponse] = []

    class Config:
        from_attributes = True
