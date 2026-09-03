from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.finance import CarbonFinance
from app.models.emissions import EmissionRecord
from app.models.reductions import ReductionInitiative
from app.schemas.finance import CarbonFinanceResponse

router = APIRouter(prefix="/api/finance", tags=["Carbon Finance"])

@router.get("", response_model=CarbonFinanceResponse)
def get_carbon_finance(db: Session = Depends(get_db)):
    """
    Computes internal carbon pricing, enterprise carbon liability,
    annual carbon budget utilization, and avoided cost savings.
    """
    finance = db.query(CarbonFinance).first()
    if not finance:
        finance = CarbonFinance(
            organization_id=1,
            internal_carbon_price_usd=75.0,
            annual_carbon_budget_usd=12000000.0,
            allocated_reduction_budget_usd=4500000.0,
            realized_cost_savings_usd=1850000.0,
            currency="USD"
        )
        db.add(finance)
        db.commit()
        db.refresh(finance)

    # Calculate actual emissions
    records = db.query(EmissionRecord).all()
    total_emissions = sum(r.calculated_emissions for r in records) or 128450.0

    liability = round(total_emissions * finance.internal_carbon_price_usd, 2)
    budget_utilization = round((liability / max(finance.annual_carbon_budget_usd, 1.0)) * 100.0, 1)

    # Actual realized savings from reduction initiatives
    inits = db.query(ReductionInitiative).all()
    savings = sum(i.annual_savings_usd for i in inits) or finance.realized_cost_savings_usd
    alloc_budget = sum(i.implementation_cost_usd for i in inits) or finance.allocated_reduction_budget_usd

    resp = CarbonFinanceResponse(
        id=finance.id,
        organization_id=finance.organization_id,
        internal_carbon_price_usd=finance.internal_carbon_price_usd,
        annual_carbon_budget_usd=finance.annual_carbon_budget_usd,
        allocated_reduction_budget_usd=alloc_budget,
        realized_cost_savings_usd=savings,
        estimated_carbon_liability_usd=liability,
        budget_utilization_pct=budget_utilization,
        currency=finance.currency,
        updated_at=finance.updated_at
    )
    return resp
