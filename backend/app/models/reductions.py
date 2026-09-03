from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from app.database import Base

class ReductionInitiative(Base):
    __tablename__ = "reduction_initiatives"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    facility_id = Column(Integer, ForeignKey("facilities.id"), nullable=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=False) # Renewable Energy, Process Electrification, Energy Efficiency, Supply Chain Engagement, Fleet Electrification
    responsible_owner = Column(String(100), nullable=False)
    start_date = Column(String(20), default="2024-01-01")
    end_date = Column(String(20), default="2025-12-31")
    baseline_emissions_tco2e = Column(Float, default=10000.0)
    estimated_annual_reduction_tco2e = Column(Float, nullable=False)
    implementation_cost_usd = Column(Float, nullable=False)
    annual_savings_usd = Column(Float, nullable=False)
    priority = Column(String(20), default="High") # High, Medium, Low
    status = Column(String(50), default="In Progress") # Proposed, Approved, In Progress, Completed
    progress_pct = Column(Float, default=50.0)
    confidence_pct = Column(Float, default=85.0)
    roi_pct = Column(Float, default=24.5) # Calculated ROI %
    marginal_abatement_cost = Column(Float, default=-15.0) # USD per tCO2e avoided (negative = net profitable)
    created_at = Column(DateTime, default=datetime.utcnow)

class CarbonTarget(Base):
    __tablename__ = "carbon_targets"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    name = Column(String(255), default="SBTi 1.5°C Near-Term Corporate Target")
    baseline_year = Column(Integer, default=2024)
    baseline_emissions_tco2e = Column(Float, default=150000.0)
    target_year = Column(Integer, default=2030)
    target_reduction_pct = Column(Float, default=42.0)
    current_emissions_tco2e = Column(Float, default=128450.0)
    required_annual_reduction_pct = Column(Float, default=7.0)
    scope_coverage = Column(String(100), default="Scope 1, 2 & 3")
    status = Column(String(50), default="On Track")
    created_at = Column(DateTime, default=datetime.utcnow)

class ScenarioModel(Base):
    __tablename__ = "scenarios"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    renewable_elec_pct = Column(Float, default=50.0)
    fleet_electrification_pct = Column(Float, default=40.0)
    supplier_reduction_pct = Column(Float, default=25.0)
    travel_reduction_pct = Column(Float, default=30.0)
    energy_efficiency_pct = Column(Float, default=15.0)
    projected_emissions_tco2e = Column(Float, default=95000.0)
    projected_reduction_pct = Column(Float, default=26.0)
    gap_to_target_tco2e = Column(Float, default=8000.0)
    created_at = Column(DateTime, default=datetime.utcnow)
