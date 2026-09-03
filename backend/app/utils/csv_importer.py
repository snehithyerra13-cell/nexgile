import io
import csv
from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from app.models.facilities import Facility
from app.models.emissions import EmissionRecord

REQUIRED_HEADERS = [
    "facility_code",
    "reporting_year",
    "reporting_month",
    "scope",
    "category",
    "activity_type",
    "activity_amount",
    "activity_unit",
    "emission_factor_value",
    "emission_factor_unit"
]

def generate_sample_csv() -> str:
    """Returns downloadable standard CSV template with realistic demo rows."""
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(REQUIRED_HEADERS + ["department", "notes"])
    writer.writerow(["FAC-BLR", "2024", "11", "Scope 2", "Electricity", "Grid Electricity", "145000", "kWh", "0.708", "kgCO2e/kWh", "Manufacturing Operations", "Grid billed consumption"])
    writer.writerow(["FAC-PUN", "2024", "11", "Scope 1", "Stationary Combustion", "Natural Gas", "8200", "m3", "2.021", "kgCO2e/m3", "Thermal Heat Plant", "Boiler gas meter reading"])
    writer.writerow(["FAC-BOM", "2024", "11", "Scope 3", "Upstream Transportation", "Diesel Freight", "12500", "tonne-km", "0.104", "kgCO2e/tonne-km", "Logistics", "Consolidated warehouse freight"])
    writer.writerow(["FAC-CHN", "2024", "11", "Scope 1", "Mobile Combustion", "Fleet Diesel", "3200", "liters", "2.687", "kgCO2e/liter", "Fleet Management", "Delivery vans"])
    return output.getvalue()

def validate_and_parse_csv(content: str, db: Session) -> Dict[str, Any]:
    """
    Parses CSV content and performs validation checks on each row.
    Returns preview data, valid rows, invalid rows with error explanations.
    """
    f = io.StringIO(content.strip())
    reader = csv.DictReader(f)

    if not reader.fieldnames:
        return {
            "success": False,
            "error": "The uploaded CSV file is empty or has no header row.",
            "valid_rows": [],
            "invalid_rows": [],
            "total_rows": 0
        }

    # Normalize header names (lowercase, stripped)
    header_map = {h.lower().strip(): h for h in reader.fieldnames}
    missing_headers = [req for req in REQUIRED_HEADERS if req not in header_map]
    if missing_headers:
        return {
            "success": False,
            "error": f"Missing required CSV columns: {', '.join(missing_headers)}",
            "valid_rows": [],
            "invalid_rows": [],
            "total_rows": 0
        }

    # Fetch facility code lookup
    facility_map = {f.code.upper(): f.id for f in db.query(Facility).all()}

    valid_rows = []
    invalid_rows = []
    row_num = 1 # 1-based, header was row 0

    for raw_row in reader:
        row_num += 1
        # Extract normalized keys
        row = {req: raw_row.get(header_map[req], "").strip() for req in REQUIRED_HEADERS}
        row["department"] = raw_row.get(header_map.get("department", "department"), "Operations").strip()
        row["notes"] = raw_row.get(header_map.get("notes", "notes"), "").strip()

        errors = []

        # Validate facility
        fac_code = row["facility_code"].upper()
        if not fac_code:
            errors.append("Facility code is required.")
        elif fac_code not in facility_map:
            errors.append(f"Facility code '{fac_code}' does not exist in system.")

        # Validate year & month
        try:
            year = int(row["reporting_year"])
            if year < 2015 or year > 2035:
                errors.append(f"Year {year} out of valid reporting range (2015-2035).")
        except ValueError:
            errors.append("Reporting year must be an integer.")

        try:
            month = int(row["reporting_month"])
            if month < 1 or month > 12:
                errors.append(f"Month {month} must be between 1 and 12.")
        except ValueError:
            errors.append("Reporting month must be an integer (1-12).")

        # Validate scope
        scope = row["scope"]
        if scope not in ["Scope 1", "Scope 2", "Scope 3"]:
            errors.append(f"Invalid scope '{scope}'. Must be 'Scope 1', 'Scope 2', or 'Scope 3'.")

        # Validate activity amount
        try:
            amount = float(row["activity_amount"])
            if amount < 0:
                errors.append("Activity amount cannot be negative.")
        except ValueError:
            errors.append("Activity amount must be a numeric value.")
            amount = 0.0

        # Validate emission factor
        try:
            factor = float(row["emission_factor_value"])
            if factor < 0:
                errors.append("Emission factor cannot be negative.")
        except ValueError:
            errors.append("Emission factor value must be a numeric value.")
            factor = 0.0

        if not row["activity_unit"]:
            errors.append("Activity unit is required.")

        if not row["emission_factor_unit"]:
            errors.append("Emission factor unit is required.")

        # Calculate emissions: amount * factor / 1000 if factor is in kgCO2e, or direct
        # Standard convention: activity_amount * factor / 1000 => tCO2e
        calc_emissions = round((amount * factor) / 1000.0, 4) if not errors else 0.0

        preview_record = {
            "row_index": row_num,
            "facility_code": fac_code,
            "facility_id": facility_map.get(fac_code),
            "reporting_year": year if "year" in locals() and isinstance(year, int) else 2024,
            "reporting_month": month if "month" in locals() and isinstance(month, int) else 1,
            "scope": scope,
            "category": row["category"],
            "activity_type": row["activity_type"],
            "activity_amount": amount,
            "activity_unit": row["activity_unit"],
            "emission_factor_value": factor,
            "emission_factor_unit": row["emission_factor_unit"],
            "department": row["department"],
            "notes": row["notes"],
            "calculated_emissions": calc_emissions,
            "errors": errors
        }

        if errors:
            invalid_rows.append(preview_record)
        else:
            valid_rows.append(preview_record)

    return {
        "success": True,
        "total_rows": len(valid_rows) + len(invalid_rows),
        "valid_count": len(valid_rows),
        "invalid_count": len(invalid_rows),
        "valid_rows": valid_rows,
        "invalid_rows": invalid_rows
    }
