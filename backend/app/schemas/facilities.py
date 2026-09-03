from typing import Optional
from pydantic import BaseModel

class FacilityBase(BaseModel):
    name: str
    code: str
    country: str = "India"
    city: str
    facility_type: str = "Manufacturing Plant"
    floor_area_sqm: float = 15000.0
    employee_count: int = 350
    grid_region: str = "Southern Regional Grid"
    is_active: bool = True

class FacilityCreate(FacilityBase):
    organization_id: Optional[int] = 1
    business_unit_id: Optional[int] = None

class FacilityResponse(FacilityBase):
    id: int
    organization_id: int
    total_emissions_tco2e: Optional[float] = 0.0
    carbon_intensity_sqm: Optional[float] = 0.0

    class Config:
        from_attributes = True
