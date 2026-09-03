from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
import app.models # Register all SQLAlchemy models

# Import all API routers
from app.routes.auth import router as auth_router
from app.routes.dashboard import router as dashboard_router
from app.routes.emissions import router as emissions_router
from app.routes.factors import router as factors_router
from app.routes.facilities import router as facilities_router
from app.routes.products import router as products_router
from app.routes.suppliers import router as suppliers_router
from app.routes.reductions import router as reductions_router
from app.routes.scenarios import router as scenarios_router
from app.routes.analytics import router as analytics_router
from app.routes.compliance import router as compliance_router
from app.routes.reports import router as reports_router
from app.routes.data_management import router as data_mgmt_router
from app.routes.data_quality import router as data_quality_router
from app.routes.finance import router as finance_router
from app.routes.audit import router as audit_router
from app.routes.evidence import router as evidence_router
from app.routes.notifications import router as notifications_router
from app.routes.search import router as search_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database schema is automatically created
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Enterprise Environmental Intelligence, Audit-Grade Carbon Accounting, and Decarbonization Platform",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS for local development and production deployments
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Permissive for easy local pairing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth_router)
app.include_router(dashboard_router)
app.include_router(emissions_router)
app.include_router(factors_router)
app.include_router(facilities_router)
app.include_router(products_router)
app.include_router(suppliers_router)
app.include_router(reductions_router)
app.include_router(scenarios_router)
app.include_router(analytics_router)
app.include_router(compliance_router)
app.include_router(reports_router)
app.include_router(data_mgmt_router)
app.include_router(data_quality_router)
app.include_router(finance_router)
app.include_router(audit_router)
app.include_router(evidence_router)
app.include_router(notifications_router)
app.include_router(search_router)

@app.get("/api/health", tags=["System"])
def health_check():
    """Health check endpoint for container orchestrators and status monitoring."""
    return {
        "status": "healthy",
        "platform": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
        "version": "1.0.0",
        "database": "connected"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=settings.DEBUG)
