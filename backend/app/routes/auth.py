from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.auth import User, UserRole, Organization
from app.schemas.auth import LoginRequest, TokenResponse, UserResponse
from app.utils.security import verify_password, create_access_token, get_current_user
from app.utils.audit import log_audit_event

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate user and return JWT bearer token."""
    user = db.query(User).filter(User.email == payload.email.strip().lower()).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated"
        )

    # Log successful login to audit trail
    log_audit_event(
        db=db,
        user_email=user.email,
        action="LOGIN",
        resource="User",
        resource_id=str(user.id),
        new_value=f"Role: {user.role.value}"
    )

    token = create_access_token(data={"sub": user.email, "role": user.role.value, "user_id": user.id})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Return currently authenticated user details."""
    return UserResponse.model_validate(current_user)

@router.get("/demo-users")
def get_demo_users(db: Session = Depends(get_db)):
    """Returns list of seeded demo personas for one-click UI testing."""
    users = db.query(User).all()
    demo_credentials = {
        "admin@decarbx.com": "admin123",
        "manager@decarbx.com": "manager123",
        "accountant@decarbx.com": "accountant123",
        "procurement@decarbx.com": "procurement123",
        "supplier@decarbx.com": "supplier123",
        "auditor@decarbx.com": "auditor123",
        "executive@decarbx.com": "executive123",
    }
    return [
        {
            "email": u.email,
            "password": demo_credentials.get(u.email, "demo123"),
            "full_name": u.full_name,
            "role": u.role.value,
            "title": u.title
        }
        for u in users
    ]
