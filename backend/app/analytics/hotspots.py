from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.emissions import EmissionRecord
from app.models.facilities import Facility
from app.models.suppliers import Supplier
from app.models.products import ProductMaterial
from app.schemas.analytics import HotspotsResponse, HotspotItem

def compute_carbon_hotspots(db: Session) -> HotspotsResponse:
    """
    Computes Pareto distributions across Facilities, Emission Categories,
    Suppliers, and BOM Materials to pinpoint top decarbonization leverage points.
    """
    # 1. Facilities
    fac_records = db.query(
        Facility.name,
        func.sum(EmissionRecord.calculated_emissions).label("total_emissions")
    ).join(EmissionRecord, Facility.id == EmissionRecord.facility_id)\
     .group_by(Facility.name)\
     .order_by(func.sum(EmissionRecord.calculated_emissions).desc())\
     .all()

    total_fac_emissions = sum([r[1] for r in fac_records]) or 1.0
    cum_fac = 0.0
    facility_items: List[HotspotItem] = []
    for name, val in fac_records:
        val = float(val or 0.0)
        share = (val / total_fac_emissions) * 100
        cum_fac += share
        risk = "Critical" if cum_fac <= 50 else ("High" if cum_fac <= 80 else "Medium")
        facility_items.append(HotspotItem(
            name=name,
            type="Facility",
            emissions_tco2e=round(val, 2),
            share_pct=round(share, 1),
            cumulative_pct=round(cum_fac, 1),
            risk_level=risk
        ))

    # 2. Categories
    cat_records = db.query(
        EmissionRecord.category,
        func.sum(EmissionRecord.calculated_emissions).label("total_emissions")
    ).group_by(EmissionRecord.category)\
     .order_by(func.sum(EmissionRecord.calculated_emissions).desc())\
     .all()

    total_cat_emissions = sum([r[1] for r in cat_records]) or 1.0
    cum_cat = 0.0
    category_items: List[HotspotItem] = []
    for name, val in cat_records:
        val = float(val or 0.0)
        share = (val / total_cat_emissions) * 100
        cum_cat += share
        risk = "Critical" if cum_cat <= 50 else ("High" if cum_cat <= 80 else "Medium")
        category_items.append(HotspotItem(
            name=name,
            type="Category",
            emissions_tco2e=round(val, 2),
            share_pct=round(share, 1),
            cumulative_pct=round(cum_cat, 1),
            risk_level=risk
        ))

    # 3. Suppliers
    suppliers = db.query(Supplier).order_by(Supplier.annual_emissions_tco2e.desc()).all()
    total_sup_emissions = sum([s.annual_emissions_tco2e for s in suppliers]) or 1.0
    cum_sup = 0.0
    supplier_items: List[HotspotItem] = []
    for s in suppliers:
        share = (s.annual_emissions_tco2e / total_sup_emissions) * 100
        cum_sup += share
        risk = "Critical" if cum_sup <= 50 else ("High" if cum_sup <= 80 else "Medium")
        supplier_items.append(HotspotItem(
            name=s.name,
            type="Supplier",
            emissions_tco2e=round(s.annual_emissions_tco2e, 2),
            share_pct=round(share, 1),
            cumulative_pct=round(cum_sup, 1),
            risk_level=risk
        ))

    # 4. Materials (BOM)
    materials = db.query(
        ProductMaterial.material_name,
        func.sum(ProductMaterial.calculated_emissions).label("total_emissions")
    ).group_by(ProductMaterial.material_name)\
     .order_by(func.sum(ProductMaterial.calculated_emissions).desc())\
     .all()

    total_mat_emissions = sum([m[1] for m in materials]) or 1.0
    cum_mat = 0.0
    material_items: List[HotspotItem] = []
    for name, val in materials:
        val = float(val or 0.0)
        share = (val / total_mat_emissions) * 100
        cum_mat += share
        risk = "Critical" if cum_mat <= 50 else ("High" if cum_mat <= 80 else "Medium")
        material_items.append(HotspotItem(
            name=name,
            type="ProductMaterial",
            emissions_tco2e=round(val / 1000.0, 3), # Convert kgCO2e to tCO2e for BOM comparison
            share_pct=round(share, 1),
            cumulative_pct=round(cum_mat, 1),
            risk_level=risk
        ))

    return HotspotsResponse(
        facilities=facility_items,
        categories=category_items,
        suppliers=supplier_items,
        materials=material_items
    )
