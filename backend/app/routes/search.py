from typing import List, Dict, Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.products import Product
from app.models.suppliers import Supplier
from app.models.facilities import Facility
from app.models.emissions import EmissionRecord
from app.models.reductions import ReductionInitiative

router = APIRouter(prefix="/api/search", tags=["Global Search"])

@router.get("")
def global_search(q: str = Query(..., min_length=2), db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Unified search across Products, Suppliers, Facilities,
    Emission records, and Reduction Initiatives.
    """
    pattern = f"%{q.strip()}%"
    results = []

    # 1. Products
    products = db.query(Product).filter(
        (Product.name.ilike(pattern)) | (Product.sku.ilike(pattern)) | (Product.category.ilike(pattern))
    ).limit(5).all()
    for p in products:
        results.append({
            "type": "Product",
            "id": p.id,
            "title": f"{p.name} ({p.sku})",
            "subtitle": f"PCF: {p.total_pcf} kgCO2e | Category: {p.category}",
            "link": "/products",
            "icon": "Package"
        })

    # 2. Suppliers
    suppliers = db.query(Supplier).filter(
        (Supplier.name.ilike(pattern)) | (Supplier.code.ilike(pattern)) | (Supplier.category.ilike(pattern))
    ).limit(5).all()
    for s in suppliers:
        results.append({
            "type": "Supplier",
            "id": s.id,
            "title": f"{s.name} ({s.code})",
            "subtitle": f"Emissions: {s.annual_emissions_tco2e:,.0f} tCO2e | Status: {s.engagement_status}",
            "link": "/suppliers",
            "icon": "Truck"
        })

    # 3. Facilities
    facilities = db.query(Facility).filter(
        (Facility.name.ilike(pattern)) | (Facility.city.ilike(pattern)) | (Facility.code.ilike(pattern))
    ).limit(5).all()
    for f in facilities:
        results.append({
            "type": "Facility",
            "id": f.id,
            "title": f"{f.name} ({f.code})",
            "subtitle": f"{f.city}, {f.country} | Area: {f.floor_area_sqm:,.0f} m²",
            "link": "/facilities",
            "icon": "Building2"
        })

    # 4. Reduction Initiatives
    inits = db.query(ReductionInitiative).filter(
        (ReductionInitiative.name.ilike(pattern)) | (ReductionInitiative.category.ilike(pattern))
    ).limit(5).all()
    for i in inits:
        results.append({
            "type": "Reduction Project",
            "id": i.id,
            "title": i.name,
            "subtitle": f"Est. Reduction: {i.estimated_annual_reduction_tco2e:,.0f} tCO2e/yr | MAC: ${i.marginal_abatement_cost}",
            "link": "/reductions",
            "icon": "Leaf"
        })

    # 5. Emission Records
    em_records = db.query(EmissionRecord).filter(
        (EmissionRecord.activity_type.ilike(pattern)) | (EmissionRecord.category.ilike(pattern))
    ).limit(5).all()
    for r in em_records:
        results.append({
            "type": "Emission Record",
            "id": r.id,
            "title": f"{r.scope}: {r.activity_type}",
            "subtitle": f"{r.activity_amount:,.1f} {r.activity_unit} => {r.calculated_emissions} tCO2e ({r.reporting_year})",
            "link": "/emissions",
            "icon": "FileSpreadsheet"
        })

    return {
        "query": q,
        "total_results": len(results),
        "results": results
    }
