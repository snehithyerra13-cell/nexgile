from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.emissions import EmissionRecord
from app.models.facilities import Facility
from app.models.suppliers import Supplier
from app.models.reductions import CarbonTarget
from app.schemas.analytics import CarbonInsight

def generate_carbon_insights(db: Session) -> List[CarbonInsight]:
    """
    Evaluates corporate GHG metrics and generates dynamic, prioritized
    natural-language insights and recommendations using deterministic rules.
    """
    insights: List[CarbonInsight] = []

    # 1. Total and Scope Breakdown
    scope_totals = db.query(
        EmissionRecord.scope,
        func.sum(EmissionRecord.calculated_emissions).label("sum_emissions")
    ).filter(EmissionRecord.status == "Approved")\
     .group_by(EmissionRecord.scope).all()

    if not scope_totals:
        scope_totals = db.query(
            EmissionRecord.scope,
            func.sum(EmissionRecord.calculated_emissions).label("sum_emissions")
        ).group_by(EmissionRecord.scope).all()

    scope_dict = {s[0]: float(s[1] or 0.0) for s in scope_totals}
    grand_total = sum(scope_dict.values()) or 1.0

    scope3_total = scope_dict.get("Scope 3", 0.0)
    scope3_pct = (scope3_total / grand_total) * 100.0

    if scope3_pct > 45.0:
        insights.append(CarbonInsight(
            id="INSIGHT-SCOPE3-DOMINANCE",
            badge="HIGH PRIORITY",
            title="Scope 3 Value Chain Dominance",
            category="Value Chain & Procurement",
            estimated_impact_tco2e=round(scope3_total * 0.20, 0),
            statement=f"Scope 3 accounts for {scope3_pct:.1f}% ({scope3_total:,.0f} tCO2e) of total corporate emissions.",
            recommendation="Initiate mandatory supplier emissions disclosure and prioritize green procurement criteria for top 10 vendors.",
            action_url="/suppliers"
        ))

    # 2. Electricity & Renewable Transition Opportunity
    elec_records = db.query(
        func.sum(EmissionRecord.calculated_emissions)
    ).filter(EmissionRecord.category.ilike("%Electricity%")).scalar()
    elec_emissions = float(elec_records or 0.0)

    if elec_emissions > 0:
        renewable_reduction = elec_emissions * 0.35 # 35% transition
        insights.append(CarbonInsight(
            id="INSIGHT-RENEWABLE-OPPORTUNITY",
            badge="OPPORTUNITY",
            title="Clean Power Purchase Agreement (PPA) Potential",
            category="Scope 2 Decarbonization",
            estimated_impact_tco2e=round(renewable_reduction, 0),
            statement=f"Transitioning 35% of grid electricity consumption across manufacturing hubs could avoid approximately {renewable_reduction:,.0f} tCO2e/year.",
            recommendation="Execute corporate virtual PPA contracts and expand on-site solar rooftop arrays across Bengaluru and Pune facilities.",
            action_url="/reductions"
        ))

    # 3. Top Supplier Concentration
    top_supplier = db.query(Supplier).order_by(Supplier.annual_emissions_tco2e.desc()).first()
    if top_supplier and top_supplier.annual_emissions_tco2e > 0:
        sup_share = (top_supplier.annual_emissions_tco2e / max(scope3_total, 1.0)) * 100.0
        insights.append(CarbonInsight(
            id="INSIGHT-SUPPLIER-CONCENTRATION",
            badge="HIGH PRIORITY",
            title="Supplier Carbon Concentration Risk",
            category="Supply Chain",
            estimated_impact_tco2e=round(top_supplier.annual_emissions_tco2e * 0.15, 0),
            statement=f"Supplier '{top_supplier.name}' represents {sup_share:.1f}% ({top_supplier.annual_emissions_tco2e:,.0f} tCO2e) of upstream emissions.",
            recommendation=f"Schedule a supplier collaborative decarbonization workshop with {top_supplier.name} and co-fund energy audits.",
            action_url=f"/suppliers"
        ))

    # 4. Facility Month-over-Month Surge Anomaly
    # Compare recent months
    recent_facility_emissions = db.query(
        Facility.name,
        EmissionRecord.reporting_month,
        func.sum(EmissionRecord.calculated_emissions)
    ).join(EmissionRecord, Facility.id == EmissionRecord.facility_id)\
     .filter(EmissionRecord.reporting_year == 2024)\
     .group_by(Facility.name, EmissionRecord.reporting_month)\
     .all()

    fac_monthly = {}
    for fname, month, val in recent_facility_emissions:
        fac_monthly.setdefault(fname, {})[month] = float(val or 0.0)

    for fname, mdict in fac_monthly.items():
        if 11 in mdict and 10 in mdict and mdict[10] > 0:
            pct_change = ((mdict[11] - mdict[10]) / mdict[10]) * 100.0
            if pct_change > 12.0:
                insights.append(CarbonInsight(
                    id=f"INSIGHT-ANOM-{fname.replace(' ', '-')}",
                    badge="ANOMALY",
                    title=f"{fname} Unscheduled Emissions Spike",
                    category="Operations & Energy",
                    estimated_impact_tco2e=round(mdict[11] - mdict[10], 0),
                    statement=f"Facility {fname} recorded a {pct_change:.1f}% emissions increase in recent month ({mdict[11]:,.0f} vs {mdict[10]:,.0f} tCO2e).",
                    recommendation="Investigate chiller plant logs and diesel backup runtimes during peak demand intervals.",
                    action_url="/emissions"
                ))
                break

    # 5. Target Trajectory Gap Risk
    target = db.query(CarbonTarget).first()
    if target:
        expected_current = target.baseline_emissions_tco2e * (1.0 - (target.target_reduction_pct / 100.0) * ((2024 - target.baseline_year) / max(1, target.target_year - target.baseline_year)))
        gap = grand_total - (target.baseline_emissions_tco2e * (1.0 - (target.target_reduction_pct / 100.0)))
        insights.append(CarbonInsight(
            id="INSIGHT-TARGET-GAP",
            badge="TARGET RISK",
            title="2030 SBTi Trajectory Gap",
            category="Corporate Strategy",
            estimated_impact_tco2e=round(max(0.0, gap * 0.10), 0),
            statement=f"At the current run-rate of {grand_total:,.0f} tCO2e, the organization faces a gap of {gap:,.0f} tCO2e to achieve the 2030 target of {target.baseline_emissions_tco2e * (1.0 - target.target_reduction_pct/100.0):,.0f} tCO2e.",
            recommendation="Accelerate capital allocation for Phase 2 energy efficiency and supplier Scope 3 reduction initiatives.",
            action_url="/scenarios"
        ))

    return insights
