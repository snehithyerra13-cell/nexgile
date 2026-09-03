from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Response
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.emissions import EmissionRecord
from app.models.facilities import Facility
from app.models.auth import User, UserRole
from app.utils.security import get_current_user, require_roles
from app.utils.audit import log_audit_event
from app.utils.csv_importer import generate_sample_csv, validate_and_parse_csv

router = APIRouter(prefix="/api/data-management", tags=["Data Management & Ingestion"])

class CommitImportRequest(BaseModel):
    records: List[Dict[str, Any]]

@router.get("/sample-csv")
def download_sample_csv():
    """Generates standard CSV activity data template for batch ingestion."""
    csv_content = generate_sample_csv()
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=DecarbX_Activity_Data_Template.csv"}
    )

@router.post("/validate-csv")
async def validate_csv_upload(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Parses and validates uploaded CSV file without modifying database.
    Returns preview of valid and rejected rows with error diagnostics.
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only standard CSV files are accepted.")

    contents = await file.read()
    try:
        decoded_text = contents.decode("utf-8-sig")
    except UnicodeDecodeError:
        decoded_text = contents.decode("latin-1")

    validation_result = validate_and_parse_csv(decoded_text, db)
    return validation_result

@router.post("/commit-import")
def commit_imported_records(
    payload: CommitImportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.CARBON_ACCOUNTANT, UserRole.SUSTAINABILITY_MANAGER]))
):
    """
    Commits validated activity rows into the emission records table
    and creates audit logs.
    """
    imported_count = 0
    facility_code_cache = {f.code.upper(): f.id for f in db.query(Facility).all()}

    for row in payload.records:
        fac_id = row.get("facility_id") or facility_code_cache.get(str(row.get("facility_code", "")).upper(), 1)
        
        amount = float(row.get("activity_amount", 0.0))
        factor = float(row.get("emission_factor_value", 0.0))
        calc = row.get("calculated_emissions")
        if calc is None or calc <= 0:
            calc = round((amount * factor) / 1000.0, 4)

        record = EmissionRecord(
            organization_id=1,
            facility_id=fac_id,
            department=row.get("department", "Operations"),
            reporting_year=int(row.get("reporting_year", 2024)),
            reporting_month=int(row.get("reporting_month", 1)),
            scope=row.get("scope", "Scope 1"),
            category=row.get("category", "Stationary Combustion"),
            activity_type=row.get("activity_type", "Natural Gas"),
            activity_amount=amount,
            activity_unit=row.get("activity_unit", "m3"),
            emission_factor_value=factor,
            emission_factor_unit=row.get("emission_factor_unit", "kgCO2e/m3"),
            calculated_emissions=calc,
            uncertainty_percentage=5.0,
            data_quality_score=92.0,
            status="Approved",
            notes=f"CSV Bulk Import: {row.get('notes', '')}".strip(),
            created_by=current_user.email
        )
        db.add(record)
        imported_count += 1

    db.commit()

    log_audit_event(
        db=db,
        user_email=current_user.email,
        action="IMPORT",
        resource="EmissionRecord",
        resource_id=f"Batch-{imported_count}",
        new_value=f"Successfully imported {imported_count} activity records via CSV"
    )

    return {
        "status": "success",
        "imported_count": imported_count,
        "message": f"Successfully ingested {imported_count} emission records into enterprise ledger."
    }
