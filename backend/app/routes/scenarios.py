from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.emissions import EmissionRecord
from app.models.reductions import CarbonTarget
from app.schemas.reductions import ScenarioCalculateRequest, ScenarioCalculateResponse

router = APIRouter(prefix="/api/scenarios", tags=["What-If Scenario Modeling"])

@router.post("/calculate", response_model=ScenarioCalculateResponse)
def calculate_what_if_scenario(
    payload: ScenarioCalculateRequest,
    db: Session = Depends(get_db)
):
    """
    Simulates multi-variable decarbonization levers in real-time.
    Computes Scope 1, Scope 2, Scope 3 impacts and target gap.
    """
    records = db.query(EmissionRecord).all()

    total_current = sum(r.calculated_emissions for r in records) or 128450.0
    s1_current = sum(r.calculated_emissions for r in records if r.scope == "Scope 1") or 23840.0
    s2_current = sum(r.calculated_emissions for r in records if r.scope == "Scope 2") or 31200.0
    s3_current = sum(r.calculated_emissions for r in records if r.scope == "Scope 3") or 73410.0

    target = db.query(CarbonTarget).first()
    baseline = target.baseline_emissions_tco2e if target else 150000.0
    target_2030 = baseline * 0.58 # 42% reduction = 87,000 tCO2e

    # Scope 1 reductions:
    # - Fleet electrification affects mobile combustion (~35% of Scope 1)
    # - Energy efficiency affects stationary combustion (~65% of Scope 1)
    fleet_savings = (s1_current * 0.35) * (payload.fleet_electrification_pct / 100.0) * 0.85
    s1_eff_savings = (s1_current * 0.65) * (payload.energy_efficiency_pct / 100.0)
    scope1_savings = fleet_savings + s1_eff_savings

    # Scope 2 reductions:
    # - Renewable electricity procurement (PPA/solar) directly abates grid power
    # - Energy efficiency directly cuts kWh demand
    renewable_savings = s2_current * (payload.renewable_elec_pct / 100.0)
    s2_eff_savings = (s2_current - renewable_savings) * (payload.energy_efficiency_pct / 100.0)
    scope2_savings = renewable_savings + s2_eff_savings

    # Scope 3 reductions:
    # - Supplier decarbonization covers ~70% of Scope 3 (purchased goods)
    # - Travel reduction covers ~10% of Scope 3 (business travel & commuting)
    supplier_savings = (s3_current * 0.70) * (payload.supplier_reduction_pct / 100.0)
    travel_savings = (s3_current * 0.10) * (payload.travel_reduction_pct / 100.0)
    scope3_savings = supplier_savings + travel_savings

    total_savings = scope1_savings + scope2_savings + scope3_savings
    projected_total = max(0.0, total_current - total_savings)
    projected_reduction_pct = round((total_savings / max(total_current, 1.0)) * 100.0, 1)

    gap = max(0.0, projected_total - target_2030)

    # Cost savings: assumed average avoided energy/fuel cost = $45/tCO2e + carbon price avoided $75/tCO2e = $120/tCO2e
    cost_savings = round(total_savings * 120.0, 2)

    # Feasibility score based on aggressive percentages (100 is easy, 0 is impossible)
    aggression = (
        payload.renewable_elec_pct * 0.25 +
        payload.fleet_electrification_pct * 0.20 +
        payload.supplier_reduction_pct * 0.30 +
        payload.travel_reduction_pct * 0.10 +
        payload.energy_efficiency_pct * 0.15
    )
    feasibility = max(10.0, round(100.0 - (aggression * 0.65), 1))

    return ScenarioCalculateResponse(
        baseline_emissions_tco2e=round(baseline, 2),
        current_emissions_tco2e=round(total_current, 2),
        target_2030_emissions_tco2e=round(target_2030, 2),
        projected_emissions_tco2e=round(projected_total, 2),
        projected_reduction_tco2e=round(total_savings, 2),
        projected_reduction_pct=projected_reduction_pct,
        gap_to_2030_target_tco2e=round(gap, 2),
        scope1_projected_tco2e=round(max(0.0, s1_current - scope1_savings), 2),
        scope2_projected_tco2e=round(max(0.0, s2_current - scope2_savings), 2),
        scope3_projected_tco2e=round(max(0.0, s3_current - scope3_savings), 2),
        scope1_savings_tco2e=round(scope1_savings, 2),
        scope2_savings_tco2e=round(scope2_savings, 2),
        scope3_savings_tco2e=round(scope3_savings, 2),
        projected_cost_savings_usd=cost_savings,
        feasibility_score=feasibility
    )
