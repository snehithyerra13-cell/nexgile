from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class ReductionInitiativeBase(BaseModel):
    facility_id: Optional[int] = None
    name: str
    description: Optional[str] = None
    category: str
    responsible_owner: str
    start_date: str = "2024-01-01"
    end_date: str = "2025-12-31"
    baseline_emissions_tco2e: float = 10000.0
    estimated_annual_reduction_tco2e: float
    implementation_cost_usd: float
    annual_savings_usd: float
    priority: str = "High"
    status: str = "In Progress"
    progress_pct: float = 50.0
    confidence_pct: float = 85.0

class ReductionInitiativeCreate(ReductionInitiativeBase):
    organization_id: Optional[int] = 1

class ReductionInitiativeUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    responsible_owner: Optional[str] = None
    facility_id: Optional[int] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    baseline_emissions_tco2e: Optional[float] = None
    estimated_annual_reduction_tco2e: Optional[float] = None
    implementation_cost_usd: Optional[float] = None
    annual_savings_usd: Optional[float] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    progress_pct: Optional[float] = None
    confidence_pct: Optional[float] = None

class ReductionInitiativeResponse(ReductionInitiativeBase):
    id: int
    organization_id: int
    roi_pct: float
    marginal_abatement_cost: float
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class CarbonTargetResponse(BaseModel):
    id: int
    organization_id: int
    name: str
    baseline_year: int
    baseline_emissions_tco2e: float
    target_year: int
    target_reduction_pct: float
    current_emissions_tco2e: float
    required_annual_reduction_pct: float
    scope_coverage: str
    status: str

    class Config:
        from_attributes = True

class ScenarioCalculateRequest(BaseModel):
    renewable_elec_pct: float = 50.0 # 0 - 100%
    fleet_electrification_pct: float = 40.0 # 0 - 100%
    supplier_reduction_pct: float = 25.0 # 0 - 100%
    travel_reduction_pct: float = 30.0 # 0 - 100%
    energy_efficiency_pct: float = 15.0 # 0 - 100%

class ScenarioCalculateResponse(BaseModel):
    baseline_emissions_tco2e: float
    current_emissions_tco2e: float
    target_2030_emissions_tco2e: float
    projected_emissions_tco2e: float
    projected_reduction_tco2e: float
    projected_reduction_pct: float
    gap_to_2030_target_tco2e: float
    scope1_projected_tco2e: float
    scope2_projected_tco2e: float
    scope3_projected_tco2e: float
    scope1_savings_tco2e: float
    scope2_savings_tco2e: float
    scope3_savings_tco2e: float
    projected_cost_savings_usd: float
    feasibility_score: float # 0 - 100
