from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

class SupplierBase(BaseModel):
    name: str
    code: str
    country: str = "India"
    category: str
    annual_spend_usd: float = 1000000.0
    annual_emissions_tco2e: float = 5000.0
    carbon_intensity: float = 5.0
    data_quality_score: float = 85.0
    risk_score: float = 45.0
    engagement_status: str = "Submitted"
    sbti_committed: bool = False
    target_status: str = "1.5°C Aligned Target Set"
    contact_email: Optional[str] = None
    latest_submission_date: Optional[str] = None

class SupplierCreate(SupplierBase):
    organization_id: Optional[int] = 1

class SupplierQuestionnaireResponse(BaseModel):
    id: int
    supplier_id: int
    reporting_year: int
    ghg_inventory_available: bool
    scope1_emissions: float
    scope2_emissions: float
    scope3_emissions: float
    renewable_energy_pct: float
    emissions_reduction_target: str
    sbti_status: str
    pcf_available: bool
    verification_status: str
    environmental_certifications: str
    sustainability_score: float
    status: str
    submitted_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class SupplierQuestionnaireSubmit(BaseModel):
    supplier_id: int
    reporting_year: int = 2024
    ghg_inventory_available: bool = True
    scope1_emissions: float
    scope2_emissions: float
    scope3_emissions: float
    renewable_energy_pct: float
    emissions_reduction_target: str
    sbti_status: str
    pcf_available: bool
    verification_status: str
    environmental_certifications: str

class SupplierSubmissionCreate(BaseModel):
    supplier_id: int
    reporting_year: int = 2024
    scope1_tco2e: float
    scope2_tco2e: float
    scope3_tco2e: float
    renewable_pct: float = 0.0
    verification_status: str = "Self-Reported"
    notes: Optional[str] = None

class SupplierResponse(SupplierBase):
    id: int
    organization_id: int
    created_at: Optional[datetime] = None
    questionnaires: List[SupplierQuestionnaireResponse] = []

    class Config:
        from_attributes = True
