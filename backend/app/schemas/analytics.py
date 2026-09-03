from typing import List, Optional
from pydantic import BaseModel

class AnomalyItem(BaseModel):
    id: str
    facility: str
    month: str
    category: str
    actual_value: float
    expected_value: float
    unit: str
    deviation_pct: float
    severity: str # High, Medium, Low
    probable_cause: str
    recommendation: str

class ForecastPoint(BaseModel):
    date: str # e.g. "2025-01"
    month_name: str
    predicted_tco2e: float
    lower_bound: float
    upper_bound: float
    scope1_pred: float
    scope2_pred: float
    scope3_pred: float

class ForecastResponse(BaseModel):
    historical: List[dict]
    forecast: List[ForecastPoint]
    model_r2_score: float
    trend_direction: str
    annual_run_rate_tco2e: float

class HotspotItem(BaseModel):
    name: str
    type: str # Facility, Category, Supplier, ProductMaterial
    emissions_tco2e: float
    share_pct: float
    cumulative_pct: float
    risk_level: str

class HotspotsResponse(BaseModel):
    facilities: List[HotspotItem]
    categories: List[HotspotItem]
    suppliers: List[HotspotItem]
    materials: List[HotspotItem]

class CarbonInsight(BaseModel):
    id: str
    badge: str # HIGH PRIORITY, OPPORTUNITY, ANOMALY, TARGET RISK, EFFICIENCY
    title: str
    category: str
    estimated_impact_tco2e: float
    statement: str
    recommendation: str
    action_url: str

class DashboardSummaryResponse(BaseModel):
    total_emissions_tco2e: float
    scope1_tco2e: float
    scope2_tco2e: float
    scope3_tco2e: float
    carbon_intensity: float # tCO2e / $M revenue or per unit
    reduction_vs_baseline_pct: float
    active_suppliers: int
    data_quality_score: float
    baseline_emissions_tco2e: float
    target_2030_tco2e: float
    target_gap_tco2e: float
    internal_carbon_liability_usd: float
    insights: List[CarbonInsight] = []
