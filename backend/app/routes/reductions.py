from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.reductions import ReductionInitiative, CarbonTarget
from app.models.auth import User, UserRole
from app.schemas.reductions import (
    ReductionInitiativeCreate,
    ReductionInitiativeUpdate,
    ReductionInitiativeResponse,
    CarbonTargetResponse
)
from app.utils.security import get_current_user, require_roles
from app.utils.audit import log_audit_event

router = APIRouter(prefix="/api/reductions", tags=["Reduction Planner & Targets"])

def calculate_metrics(cost: float, savings: float, reduction_tco2e: float) -> tuple:
    """Calculates ROI percentage and Marginal Abatement Cost ($/tCO2e)."""
    # 5-year project lifetime assumption
    annualized_cost = cost / 5.0
    roi = round(((savings - annualized_cost) / max(cost, 1.0)) * 100.0, 1)
    
    # Net annual cost = annualized capital cost - annual operational savings
    # MAC = Net annual cost / annual reduction tCO2e
    net_annual_cost = annualized_cost - savings
    mac = round(net_annual_cost / max(reduction_tco2e, 0.1), 2)
    return roi, mac

@router.get("", response_model=List[ReductionInitiativeResponse])
def get_initiatives(
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """List reduction initiatives with ROI and Marginal Abatement Cost."""
    query = db.query(ReductionInitiative)
    if status:
        query = query.filter(ReductionInitiative.status == status)
    if priority:
        query = query.filter(ReductionInitiative.priority == priority)

    return query.order_by(ReductionInitiative.marginal_abatement_cost.asc()).all()

@router.get("/macc-curve")
def get_macc_curve(db: Session = Depends(get_db)):
    """
    Returns structured data for the Marginal Abatement Cost Curve (MACC).
    Sorted from most cost-saving (negative $/tCO2e) to highest capital investment.
    """
    initiatives = db.query(ReductionInitiative).order_by(ReductionInitiative.marginal_abatement_cost.asc()).all()
    
    curve_data = []
    cumulative_reduction = 0.0

    for init in initiatives:
        start_x = cumulative_reduction
        cumulative_reduction += init.estimated_annual_reduction_tco2e
        end_x = cumulative_reduction
        
        curve_data.append({
            "id": init.id,
            "name": init.name,
            "category": init.category,
            "mac_usd_per_tco2e": init.marginal_abatement_cost,
            "annual_reduction_tco2e": init.estimated_annual_reduction_tco2e,
            "start_x": round(start_x, 1),
            "end_x": round(end_x, 1),
            "implementation_cost_usd": init.implementation_cost_usd,
            "annual_savings_usd": init.annual_savings_usd,
            "roi_pct": init.roi_pct,
            "status": init.status,
            "priority": init.priority
        })

    return {
        "initiatives": curve_data,
        "total_potential_reduction_tco2e": round(cumulative_reduction, 1),
        "profitable_reduction_tco2e": round(sum(i["annual_reduction_tco2e"] for i in curve_data if i["mac_usd_per_tco2e"] < 0), 1)
    }

@router.get("/targets", response_model=List[CarbonTargetResponse])
def get_carbon_targets(db: Session = Depends(get_db)):
    """Get active corporate decarbonization targets."""
    return db.query(CarbonTarget).all()

@router.post("", response_model=ReductionInitiativeResponse)
def create_initiative(
    payload: ReductionInitiativeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.SUSTAINABILITY_MANAGER]))
):
    """Add a new carbon reduction initiative with auto-computed ROI and MAC."""
    roi, mac = calculate_metrics(
        payload.implementation_cost_usd,
        payload.annual_savings_usd,
        payload.estimated_annual_reduction_tco2e
    )

    init = ReductionInitiative(
        organization_id=payload.organization_id or 1,
        facility_id=payload.facility_id,
        name=payload.name,
        description=payload.description,
        category=payload.category,
        responsible_owner=payload.responsible_owner,
        start_date=payload.start_date,
        end_date=payload.end_date,
        baseline_emissions_tco2e=payload.baseline_emissions_tco2e,
        estimated_annual_reduction_tco2e=payload.estimated_annual_reduction_tco2e,
        implementation_cost_usd=payload.implementation_cost_usd,
        annual_savings_usd=payload.annual_savings_usd,
        priority=payload.priority,
        status=payload.status,
        progress_pct=payload.progress_pct,
        confidence_pct=payload.confidence_pct,
        roi_pct=roi,
        marginal_abatement_cost=mac
    )
    db.add(init)
    db.commit()
    db.refresh(init)

    log_audit_event(
        db=db,
        user_email=current_user.email,
        action="CREATE",
        resource="ReductionInitiative",
        resource_id=str(init.id),
        new_value=f"{init.name}: {init.estimated_annual_reduction_tco2e} tCO2e reduction, MAC: ${mac}/tCO2e"
    )

    return init

@router.put("/{id}", response_model=ReductionInitiativeResponse)
def update_initiative(
    id: int,
    payload: ReductionInitiativeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.SUSTAINABILITY_MANAGER]))
):
    """Update reduction initiative parameters."""
    init = db.query(ReductionInitiative).filter(ReductionInitiative.id == id).first()
    if not init:
        raise HTTPException(status_code=404, detail="Initiative not found")

    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(init, k, v)

    # Recalculate metrics
    roi, mac = calculate_metrics(
        init.implementation_cost_usd,
        init.annual_savings_usd,
        init.estimated_annual_reduction_tco2e
    )
    init.roi_pct = roi
    init.marginal_abatement_cost = mac

    db.commit()
    db.refresh(init)

    log_audit_event(
        db=db,
        user_email=current_user.email,
        action="UPDATE",
        resource="ReductionInitiative",
        resource_id=str(init.id),
        new_value=f"{init.name} updated: progress={init.progress_pct}%, status={init.status}"
    )

    return init

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_initiative(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.SUSTAINABILITY_MANAGER]))
):
    """Remove a reduction initiative."""
    init = db.query(ReductionInitiative).filter(ReductionInitiative.id == id).first()
    if not init:
        raise HTTPException(status_code=404, detail="Initiative not found")

    db.delete(init)
    db.commit()

    log_audit_event(
        db=db,
        user_email=current_user.email,
        action="DELETE",
        resource="ReductionInitiative",
        resource_id=str(id),
        old_value=init.name
    )
    return None
