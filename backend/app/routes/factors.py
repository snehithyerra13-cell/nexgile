from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.emissions import EmissionFactor
from app.models.auth import User, UserRole
from app.schemas.emissions import EmissionFactorCreate, EmissionFactorResponse
from app.utils.security import get_current_user, require_roles
from app.utils.audit import log_audit_event

router = APIRouter(prefix="/api/emission-factors", tags=["Emission Factors"])

@router.get("", response_model=List[EmissionFactorResponse])
def get_emission_factors(
    search: Optional[str] = Query(None),
    scope: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    geography: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Retrieve emission factor library with search and filters."""
    query = db.query(EmissionFactor)

    if search:
        search_fmt = f"%{search.strip()}%"
        query = query.filter(
            (EmissionFactor.factor_name.ilike(search_fmt)) |
            (EmissionFactor.activity_type.ilike(search_fmt)) |
            (EmissionFactor.source.ilike(search_fmt))
        )
    if scope:
        query = query.filter(EmissionFactor.scope == scope)
    if category:
        query = query.filter(EmissionFactor.category == category)
    if geography:
        query = query.filter(EmissionFactor.geography == geography)

    return query.order_by(EmissionFactor.category, EmissionFactor.factor_name).all()

@router.post("", response_model=EmissionFactorResponse)
def create_emission_factor(
    payload: EmissionFactorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.CARBON_ACCOUNTANT, UserRole.SUSTAINABILITY_MANAGER]))
):
    """Create a new custom emission factor."""
    factor = EmissionFactor(
        factor_name=payload.factor_name,
        activity_type=payload.activity_type,
        category=payload.category,
        scope=payload.scope,
        geography=payload.geography,
        unit=payload.unit,
        factor_value=payload.factor_value,
        source=payload.source,
        year=payload.year,
        version=payload.version,
        valid_from=payload.valid_from,
        valid_until=payload.valid_until,
        is_demo=True,
        notes=payload.notes
    )
    db.add(factor)
    db.commit()
    db.refresh(factor)

    log_audit_event(
        db=db,
        user_email=current_user.email,
        action="CREATE",
        resource="EmissionFactor",
        resource_id=str(factor.id),
        new_value=f"{factor.factor_name}: {factor.factor_value} {factor.unit}"
    )

    return factor
