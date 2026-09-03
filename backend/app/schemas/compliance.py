from typing import List, Optional
from pydantic import BaseModel

class ComplianceRequirementBase(BaseModel):
    disclosure_code: str
    disclosure_name: str
    category: str = "Climate Change"
    owner: str = "Carbon Accounting Team"
    status: str = "In Progress"
    evidence_available: bool = False
    completion_pct: float = 50.0
    notes: Optional[str] = None

class ComplianceRequirementUpdate(BaseModel):
    status: Optional[str] = None
    evidence_available: Optional[bool] = None
    completion_pct: Optional[float] = None
    notes: Optional[str] = None

class ComplianceRequirementResponse(ComplianceRequirementBase):
    id: int
    framework_id: int

    class Config:
        from_attributes = True

class ComplianceFrameworkResponse(BaseModel):
    id: int
    code: str
    name: str
    description: Optional[str] = None
    completion_pct: float
    due_date: str
    status: str
    owner: str
    total_requirements: int
    completed_requirements: int
    requirements: List[ComplianceRequirementResponse] = []

    class Config:
        from_attributes = True
