from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.products import Product, ProductLifecycleStage, ProductMaterial
from app.models.auth import User, UserRole
from app.schemas.products import (
    ProductCreate,
    ProductResponse,
    ProductLifecycleStageResponse,
    ProductMaterialCreate,
    ProductMaterialResponse
)
from app.utils.security import get_current_user, require_roles
from app.utils.audit import log_audit_event

router = APIRouter(prefix="/api/products", tags=["Product LCA & PCF"])

@router.get("", response_model=List[ProductResponse])
def get_products(db: Session = Depends(get_db)):
    """List all manufactured products with PCF and lifecycle breakdown."""
    products = db.query(Product).all()
    return products

@router.get("/{id}", response_model=ProductResponse)
def get_product(id: int, db: Session = Depends(get_db)):
    """Get single product details with full LCA stages and BOM materials."""
    product = db.query(Product).filter(Product.id == id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.get("/{id}/lifecycle", response_model=List[ProductLifecycleStageResponse])
def get_product_lifecycle(id: int, db: Session = Depends(get_db)):
    """Get lifecycle stages for a product."""
    product = db.query(Product).filter(Product.id == id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product.lifecycle_stages

@router.get("/{id}/materials", response_model=List[ProductMaterialResponse])
def get_product_materials(id: int, db: Session = Depends(get_db)):
    """Get bill of materials (BOM) sorted by carbon contribution descending."""
    materials = db.query(ProductMaterial)\
                  .filter(ProductMaterial.product_id == id)\
                  .order_by(ProductMaterial.calculated_emissions.desc())\
                  .all()
    return materials

@router.post("/{id}/materials", response_model=ProductMaterialResponse)
def add_product_material(
    id: int,
    payload: ProductMaterialCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.SUSTAINABILITY_MANAGER, UserRole.CARBON_ACCOUNTANT]))
):
    """Add a BOM material item to a product and re-compute raw material stage emissions."""
    product = db.query(Product).filter(Product.id == id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    calc = round(payload.quantity * payload.emission_factor * (1.0 - (payload.recycled_percentage / 100.0)), 3)

    material = ProductMaterial(
        product_id=id,
        material_name=payload.material_name,
        quantity=payload.quantity,
        unit=payload.unit,
        supplier_name=payload.supplier_name,
        supplier_id=payload.supplier_id,
        emission_factor=payload.emission_factor,
        calculated_emissions=calc,
        recycled_percentage=payload.recycled_percentage
    )
    db.add(material)
    db.commit()
    db.refresh(material)

    # Re-calculate Raw Materials stage
    raw_stage = db.query(ProductLifecycleStage)\
                  .filter(ProductLifecycleStage.product_id == id, ProductLifecycleStage.stage_name == "Raw Materials")\
                  .first()
    if raw_stage:
        all_materials = db.query(ProductMaterial).filter(ProductMaterial.product_id == id).all()
        raw_stage.emissions_kg_co2e = round(sum(m.calculated_emissions for m in all_materials), 2)
        
        # Update product total PCF
        all_stages = db.query(ProductLifecycleStage).filter(ProductLifecycleStage.product_id == id).all()
        product.total_pcf = round(sum(s.emissions_kg_co2e for s in all_stages), 2)
        
        # Recalculate percentages
        if product.total_pcf > 0:
            for s in all_stages:
                s.percentage = round((s.emissions_kg_co2e / product.total_pcf) * 100.0, 1)

        db.commit()

    log_audit_event(
        db=db,
        user_email=current_user.email,
        action="CREATE",
        resource="ProductMaterial",
        resource_id=str(material.id),
        new_value=f"{material.material_name} added to {product.name}"
    )

    return material

@router.post("", response_model=ProductResponse)
def create_product(
    payload: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.SUSTAINABILITY_MANAGER]))
):
    """Register a new product and initialize default LCA stages."""
    existing = db.query(Product).filter(Product.sku == payload.sku).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Product with SKU '{payload.sku}' already exists")

    product = Product(
        organization_id=payload.organization_id or 1,
        sku=payload.sku,
        name=payload.name,
        category=payload.category,
        description=payload.description,
        weight_kg=payload.weight_kg,
        unit=payload.unit,
        annual_production=payload.annual_production,
        target_pcf=payload.target_pcf,
        total_pcf=0.0
    )
    db.add(product)
    db.commit()
    db.refresh(product)

    # Initialize standard 7 stages
    default_stages = [
        ("Raw Materials", 4.2),
        ("Manufacturing", 3.1),
        ("Packaging", 0.6),
        ("Transportation", 0.8),
        ("Distribution", 0.4),
        ("Product Use", 2.5),
        ("End of Life", 0.9)
    ]

    total_stage_sum = sum(s[1] for s in default_stages)
    for name, ems in default_stages:
        st = ProductLifecycleStage(
            product_id=product.id,
            stage_name=name,
            emissions_kg_co2e=ems,
            percentage=round((ems / total_stage_sum) * 100.0, 1)
        )
        db.add(st)

    product.total_pcf = round(total_stage_sum, 2)
    db.commit()
    db.refresh(product)

    log_audit_event(
        db=db,
        user_email=current_user.email,
        action="CREATE",
        resource="Product",
        resource_id=str(product.id),
        new_value=f"{product.name} ({product.sku})"
    )

    return product
