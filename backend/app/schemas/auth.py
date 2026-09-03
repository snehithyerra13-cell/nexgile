from typing import Optional
from pydantic import BaseModel, EmailStr
from app.models.auth import UserRole

class LoginRequest(BaseModel):
    email: str
    password: str

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: UserRole = UserRole.SUSTAINABILITY_MANAGER
    title: Optional[str] = None
    organization_id: Optional[int] = 1
    supplier_id: Optional[int] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: UserRole
    title: Optional[str] = None
    organization_id: Optional[int] = None
    supplier_id: Optional[int] = None

    class Config:
        from_attributes = True

TokenResponse.model_rebuild()
