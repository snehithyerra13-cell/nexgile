import io
import csv
import json
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.emissions import EmissionRecord
from app.models.facilities import Facility
from app.models.products import Product
from app.models.suppliers import Supplier
from app.models.reductions import ReductionInitiative, CarbonTarget
from app.models.compliance import ComplianceFramework

router = APIRouter(prefix="/api/reports", tags=["Sustainability Reports"])

def build_report_data(report_type: str, year: int, db: Session) -> dict:
    """Builds comprehensive structured data for preview, JSON, and CSV export."""
    facilities = {f.id: f.name for f in db.query(Facility).all()}

    if report_type == "corporate_ghg_inventory":
        records = db.query(EmissionRecord).filter(EmissionRecord.reporting_year == year).all()
        s1 = sum(r.calculated_emissions for r in records if r.scope == "Scope 1")
        s2 = sum(r.calculated_emissions for r in records if r.scope == "Scope 2")
        s3 = sum(r.calculated_emissions for r in records if r.scope == "Scope 3")
        total = s1 + s2 + s3
        
        target = db.query(CarbonTarget).first()
        baseline = target.baseline_emissions_tco2e if target else 150000.0

        return {
            "title": f"Corporate GHG Emissions Inventory — FY{year}",
            "generated_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC"),
            "organization": "Nexgile Technologies Global Corp",
            "reporting_year": year,
            "standards_followed": "GHG Protocol Corporate Accounting and Reporting Standard (ISO 14064-1)",
            "summary": {
                "total_emissions_tco2e": round(total, 2),
                "scope1_tco2e": round(s1, 2),
                "scope2_location_based_tco2e": round(s2, 2),
                "scope3_value_chain_tco2e": round(s3, 2),
                "baseline_emissions_tco2e": baseline,
                "reduction_vs_baseline_pct": round(((baseline - total) / baseline) * 100.0, 1) if baseline > 0 else 0.0
            },
            "line_items": [
                {
                    "facility": facilities.get(r.facility_id, f"Facility #{r.facility_id}"),
                    "month": r.reporting_month,
                    "scope": r.scope,
                    "category": r.category,
                    "activity_type": r.activity_type,
                    "activity_amount": r.activity_amount,
                    "activity_unit": r.activity_unit,
                    "emission_factor": r.emission_factor_value,
                    "emission_factor_unit": r.emission_factor_unit,
                    "emissions_tco2e": round(r.calculated_emissions, 2),
                    "status": r.status
                }
                for r in records
            ]
        }

    elif report_type in ["scope1", "scope2", "scope3"]:
        scope_name = "Scope 1" if report_type == "scope1" else ("Scope 2" if report_type == "scope2" else "Scope 3")
        records = db.query(EmissionRecord).filter(
            EmissionRecord.reporting_year == year,
            EmissionRecord.scope == scope_name
        ).all()
        total = sum(r.calculated_emissions for r in records)

        return {
            "title": f"{scope_name} Detailed Activity & Emissions Ledger — FY{year}",
            "generated_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC"),
            "reporting_year": year,
            "scope": scope_name,
            "total_emissions_tco2e": round(total, 2),
            "record_count": len(records),
            "line_items": [
                {
                    "facility": facilities.get(r.facility_id, f"Facility #{r.facility_id}"),
                    "month": r.reporting_month,
                    "category": r.category,
                    "activity_type": r.activity_type,
                    "amount": f"{r.activity_amount:,.1f} {r.activity_unit}",
                    "factor": f"{r.emission_factor_value} {r.emission_factor_unit}",
                    "calculated_tco2e": round(r.calculated_emissions, 2),
                    "uncertainty": f"{r.uncertainty_percentage}%",
                    "status": r.status
                }
                for r in records
            ]
        }

    elif report_type == "product_pcf":
        products = db.query(Product).all()
        return {
            "title": "Product Carbon Footprint (PCF) & Life Cycle Assessment Report",
            "generated_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC"),
            "standard": "ISO 14067 Product Carbon Footprint Standard",
            "products_assessed": len(products),
            "line_items": [
                {
                    "sku": p.sku,
                    "name": p.name,
                    "category": p.category,
                    "annual_production": p.annual_production,
                    "total_pcf_kg_co2e": p.total_pcf,
                    "target_pcf_kg_co2e": p.target_pcf,
                    "annual_footprint_tco2e": round((p.total_pcf * p.annual_production) / 1000.0, 1),
                    "stages_count": len(p.lifecycle_stages)
                }
                for p in products
            ]
        }

    elif report_type == "supplier_sustainability":
        suppliers = db.query(Supplier).all()
        return {
            "title": "Scope 3 Supplier Sustainability & Engagement Audit",
            "generated_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC"),
            "total_suppliers": len(suppliers),
            "total_upstream_emissions_tco2e": round(sum(s.annual_emissions_tco2e for s in suppliers), 1),
            "line_items": [
                {
                    "supplier_code": s.code,
                    "supplier_name": s.name,
                    "category": s.category,
                    "annual_spend_usd": s.annual_spend_usd,
                    "annual_emissions_tco2e": s.annual_emissions_tco2e,
                    "carbon_intensity": s.carbon_intensity,
                    "engagement_status": s.engagement_status,
                    "risk_score": s.risk_score,
                    "sbti_committed": "Yes" if s.sbti_committed else "No"
                }
                for s in suppliers
            ]
        }

    elif report_type == "reduction_progress":
        initiatives = db.query(ReductionInitiative).all()
        return {
            "title": "Decarbonization Roadmap & Reduction Initiatives Portfolio",
            "generated_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC"),
            "total_initiatives": len(initiatives),
            "total_annual_reduction_potential_tco2e": round(sum(i.estimated_annual_reduction_tco2e for i in initiatives), 1),
            "total_capital_investment_usd": round(sum(i.implementation_cost_usd for i in initiatives), 2),
            "total_annual_savings_usd": round(sum(i.annual_savings_usd for i in initiatives), 2),
            "line_items": [
                {
                    "initiative": i.name,
                    "category": i.category,
                    "status": i.status,
                    "progress_pct": f"{i.progress_pct}%",
                    "annual_reduction_tco2e": i.estimated_annual_reduction_tco2e,
                    "marginal_abatement_cost_usd": f"${i.marginal_abatement_cost}/tCO2e",
                    "roi_pct": f"{i.roi_pct}%",
                    "owner": i.responsible_owner
                }
                for i in initiatives
            ]
        }

    elif report_type == "compliance_readiness":
        frameworks = db.query(ComplianceFramework).all()
        return {
            "title": "ESG Regulatory Compliance Readiness Assessment",
            "generated_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC"),
            "frameworks_count": len(frameworks),
            "line_items": [
                {
                    "framework": f.name,
                    "code": f.code,
                    "status": f.status,
                    "completion_pct": f"{f.completion_pct}%",
                    "due_date": f.due_date,
                    "owner": f.owner,
                    "completed_requirements": f"{f.completed_requirements} / {f.total_requirements}"
                }
                for f in frameworks
            ]
        }

    return {"error": "Invalid report type"}

@router.get("/preview")
def preview_report(
    report_type: str = Query("corporate_ghg_inventory"),
    year: int = Query(2024),
    db: Session = Depends(get_db)
):
    """Generates structured report preview with summary KPIs and table rows."""
    return build_report_data(report_type, year, db)

@router.get("/export-json")
def export_report_json(
    report_type: str = Query("corporate_ghg_inventory"),
    year: int = Query(2024),
    db: Session = Depends(get_db)
):
    """Exports generated report data as a downloadable JSON file."""
    data = build_report_data(report_type, year, db)
    json_str = json.dumps(data, indent=2)
    filename = f"DecarbX_{report_type}_{year}_{datetime.utcnow().strftime('%Y%m%d')}.json"
    return Response(
        content=json_str,
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/export-csv")
def export_report_csv(
    report_type: str = Query("corporate_ghg_inventory"),
    year: int = Query(2024),
    db: Session = Depends(get_db)
):
    """Exports generated report line items as a downloadable CSV spreadsheet."""
    data = build_report_data(report_type, year, db)
    line_items = data.get("line_items", [])

    output = io.StringIO()
    if line_items:
        headers = list(line_items[0].keys())
        writer = csv.DictWriter(output, fieldnames=headers)
        writer.writeheader()
        for row in line_items:
            writer.writerow(row)
    else:
        output.write("No records found for selected criteria.\n")

    filename = f"DecarbX_{report_type}_{year}_{datetime.utcnow().strftime('%Y%m%d')}.csv"
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
