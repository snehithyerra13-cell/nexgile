from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.analytics import (
    AnomalyItem,
    ForecastResponse,
    HotspotsResponse,
    CarbonInsight
)
from app.analytics.anomaly_detection import detect_emissions_anomalies
from app.analytics.forecasting import generate_emissions_forecast
from app.analytics.hotspots import compute_carbon_hotspots
from app.analytics.insights import generate_carbon_insights

router = APIRouter(prefix="/api/analytics", tags=["AI Analytics (Local Algorithms)"])

@router.get("/anomalies", response_model=List[AnomalyItem])
def get_anomalies(db: Session = Depends(get_db)):
    """
    Detects monthly activity anomalies using local IsolationForest
    and Z-Score statistics. Zero external API calls.
    """
    return detect_emissions_anomalies(db)

@router.get("/forecast", response_model=ForecastResponse)
def get_forecast(
    horizon_months: int = Query(12, ge=3, le=24),
    db: Session = Depends(get_db)
):
    """
    Generates time-series emissions forecast using local scikit-learn
    LinearRegression with seasonal weighting.
    """
    return generate_emissions_forecast(db, horizon_months=horizon_months)

@router.get("/hotspots", response_model=HotspotsResponse)
def get_hotspots(db: Session = Depends(get_db)):
    """
    Identifies high-impact carbon hotspots across facilities,
    categories, suppliers, and BOM materials via Pareto analysis.
    """
    return compute_carbon_hotspots(db)

@router.get("/insights", response_model=List[CarbonInsight])
def get_insights(db: Session = Depends(get_db)):
    """
    Computes dynamic, data-driven narrative insights using deterministic
    heuristic rules evaluated against the current database state.
    """
    return generate_carbon_insights(db)
