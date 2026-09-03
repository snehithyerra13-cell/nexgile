from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class EmissionFactorBase(BaseModel):
    factor_name: str
    activity_type: str
    category: str
    scope: str
    geography: str = "India"
    unit: str
    factor_value: float
    source: str = "GHG Protocol / DEFRA"
    year: int = 2024
    version: str = "v2.4"
    valid_from: str = "2024-01-01"
    valid_until: str = "2025-12-31"
    is_demo: bool = True
    notes: Optional[str] = None

class EmissionFactorCreate(EmissionFactorBase):
    pass

class EmissionFactorResponse(EmissionFactorBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class EmissionRecordBase(BaseModel):
    facility_id: int
    department: str = "Operations"
    reporting_year: int
    reporting_month: int
    scope: str
    category: str
    activity_type: str
    activity_amount: float
    activity_unit: str
    emission_factor_id: Optional[int] = None
    emission_factor_value: float
    emission_factor_unit: str
    emission_factor_source: str = "GHG Protocol / DEFRA"
    emission_factor_version: str = "v2.4"
    calculated_emissions: Optional[float] = None # Can be auto-computed
    uncertainty_percentage: float = 5.0
    data_quality_score: float = 90.0
    status: str = "Draft"
    notes: Optional[str] = None

class EmissionRecordCreate(EmissionRecordBase):
    organization_id: Optional[int] = 1

class EmissionRecordUpdate(BaseModel):
    facility_id: Optional[int] = None
    department: Optional[str] = None
    reporting_year: Optional[int] = None
    reporting_month: Optional[int] = None
    scope: Optional[str] = None
    category: Optional[str] = None
    activity_type: Optional[str] = None
    activity_amount: Optional[float] = None
    activity_unit: Optional[str] = None
    emission_factor_id: Optional[int] = None
    emission_factor_value: Optional[float] = None
    emission_factor_unit: Optional[str] = None
    emission_factor_source: Optional[str] = None
    emission_factor_version: Optional[str] = None
    calculated_emissions: Optional[float] = None
    uncertainty_percentage: Optional[float] = None
    data_quality_score: Optional[float] = None
    status: Optional[str] = None
    notes: Optional[str] = None

class EmissionRecordStatusUpdate(BaseModel):
    status: str # Draft, Submitted, Approved, Rejected
    notes: Optional[str] = None

class EmissionRecordResponse(EmissionRecordBase):
    id: int
    organization_id: int
    calculated_emissions: float
    created_by: Optional[str] = "system"
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    facility_name: Optional[str] = None

    class Config:
        from_attributes = True

class DataLineageResponse(BaseModel):
    record_id: int
    activity_data: str # e.g. "12,500 kWh"
    activity_amount: float
    activity_unit: str
    emission_factor_value: float
    emission_factor_unit: str
    emission_factor_name: str
    emission_factor_source: str
    emission_factor_version: str
    formula: str # e.g. "Activity Data (12,500 kWh) × Emission Factor (0.708 kgCO2e/kWh) / 1,000"
    calculated_emissions_tco2e: float
    uncertainty_percentage: float
    data_quality_score: float
    recorded_by: str
    created_at: str
    verified_by_status: str
