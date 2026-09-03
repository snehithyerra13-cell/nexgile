from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from app.database import Base

class CarbonFinance(Base):
    __tablename__ = "carbon_finances"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    internal_carbon_price_usd = Column(Float, default=75.0) # $75 / tCO2e
    annual_carbon_budget_usd = Column(Float, default=12000000.0) # $12M
    allocated_reduction_budget_usd = Column(Float, default=4500000.0) # $4.5M for reduction projects
    realized_cost_savings_usd = Column(Float, default=1850000.0) # Annual savings from initiatives
    currency = Column(String(10), default="USD")
    updated_at = Column(DateTime, default=datetime.utcnow)

class DataQualityMetric(Base):
    __tablename__ = "data_quality_metrics"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    completeness = Column(Float, default=94.5) # %
    validity = Column(Float, default=96.2) # %
    consistency = Column(Float, default=91.8) # %
    timeliness = Column(Float, default=89.0) # %
    verified_records_pct = Column(Float, default=87.5) # %
    estimated_records_pct = Column(Float, default=12.5) # %
    overall_score = Column(Float, default=92.0) # Out of 100
    updated_at = Column(DateTime, default=datetime.utcnow)

class DataQualityIssue(Base):
    __tablename__ = "data_quality_issues"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    issue_type = Column(String(100), nullable=False) # Missing factor, Unverified supplier data, Estimated meter reading, Duplicate transaction, Unusual emission value
    severity = Column(String(20), default="Medium") # High, Medium, Low
    description = Column(Text, nullable=False)
    entity_type = Column(String(50), default="EmissionRecord")
    entity_id = Column(String(50), nullable=True)
    status = Column(String(50), default="Open") # Open, In Review, Resolved
    created_at = Column(DateTime, default=datetime.utcnow)
