from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class CarbonFinanceResponse(BaseModel):
    id: int
    organization_id: int
    internal_carbon_price_usd: float
    annual_carbon_budget_usd: float
    allocated_reduction_budget_usd: float
    realized_cost_savings_usd: float
    estimated_carbon_liability_usd: float
    budget_utilization_pct: float
    currency: str
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class DataQualityMetricResponse(BaseModel):
    id: int
    organization_id: int
    completeness: float
    validity: float
    consistency: float
    timeliness: float
    verified_records_pct: float
    estimated_records_pct: float
    overall_score: float
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class DataQualityIssueResponse(BaseModel):
    id: int
    organization_id: int
    issue_type: str
    severity: str
    description: str
    entity_type: str
    entity_id: Optional[str] = None
    status: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
