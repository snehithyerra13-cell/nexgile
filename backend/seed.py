import sys
import os
from datetime import datetime, timedelta

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, SessionLocal, Base
from app.models import (
    User, Organization, UserRole,
    Facility, BusinessUnit, Department,
    EmissionFactor, EmissionRecord,
    Product, ProductLifecycleStage, ProductMaterial,
    Supplier, SupplierQuestionnaire, SupplierSubmission,
    ReductionInitiative, CarbonTarget, ScenarioModel,
    ComplianceFramework, ComplianceRequirement,
    AuditLog, Evidence, Notification,
    CarbonFinance, DataQualityMetric, DataQualityIssue
)
from app.utils.security import get_password_hash

def seed_database():
    print("Initializing Nexgile-DecarbX Database Schema...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        print("Seeding Organization & Business Units...")
        org = Organization(
            name="Nexgile Technologies Global Corp",
            code="NXG-GLOBAL",
            industry="High-Tech & Advanced Hardware Systems",
            country="India",
            currency="USD"
        )
        db.add(org)
        db.commit()
        db.refresh(org)

        bu_mfg = BusinessUnit(organization_id=org.id, name="Manufacturing & Precision Engineering", code="BU-MFG", head="Dr. Rajesh Raman")
        bu_log = BusinessUnit(organization_id=org.id, name="Global Supply Chain & Logistics", code="BU-LOG", head="Priya Sundaram")
        bu_rnd = BusinessUnit(organization_id=org.id, name="Hardware Architecture & R&D", code="BU-RND", head="Arun Chen")
        db.add_all([bu_mfg, bu_log, bu_rnd])
        db.commit()

        print("Seeding 5 Facilities...")
        facilities_data = [
            Facility(organization_id=org.id, business_unit_id=bu_mfg.id, name="Bengaluru Manufacturing Plant", code="FAC-BLR", country="India", city="Bengaluru", facility_type="High-Tech Manufacturing", floor_area_sqm=45000.0, employee_count=850, grid_region="Southern Regional Grid (SR-CEA)"),
            Facility(organization_id=org.id, business_unit_id=bu_log.id, name="Mumbai Distribution Center", code="FAC-BOM", country="India", city="Mumbai", facility_type="Distribution Hub", floor_area_sqm=28000.0, employee_count=320, grid_region="Western Regional Grid (WR-CEA)"),
            Facility(organization_id=org.id, business_unit_id=bu_mfg.id, name="Pune Assembly Plant", code="FAC-PUN", country="India", city="Pune", facility_type="Electronic Assembly", floor_area_sqm=36000.0, employee_count=620, grid_region="Western Regional Grid (WR-CEA)"),
            Facility(organization_id=org.id, business_unit_id=bu_log.id, name="Chennai Warehouse & Staging", code="FAC-CHN", country="India", city="Chennai", facility_type="Logistics Warehouse", floor_area_sqm=22000.0, employee_count=180, grid_region="Southern Regional Grid (SR-CEA)"),
            Facility(organization_id=org.id, business_unit_id=bu_rnd.id, name="Hyderabad R&D Center", code="FAC-HYD", country="India", city="Hyderabad", facility_type="Research & Innovation Lab", floor_area_sqm=18000.0, employee_count=490, grid_region="Southern Regional Grid (SR-CEA)")
        ]
        db.add_all(facilities_data)
        db.commit()
        for f in facilities_data:
            db.refresh(f)

        print("Seeding 7 Demo Users across all roles...")
        users_data = [
            User(organization_id=org.id, email="admin@decarbx.com", hashed_password=get_password_hash("admin123"), full_name="Sarah Jenkins", role=UserRole.ADMIN, title="Chief Sustainability & Compliance Officer"),
            User(organization_id=org.id, email="manager@decarbx.com", hashed_password=get_password_hash("manager123"), full_name="Vikram Mehta", role=UserRole.SUSTAINABILITY_MANAGER, title="Senior Sustainability Director"),
            User(organization_id=org.id, email="accountant@decarbx.com", hashed_password=get_password_hash("accountant123"), full_name="Elena Rostova", role=UserRole.CARBON_ACCOUNTANT, title="Lead Carbon Accounting Specialist"),
            User(organization_id=org.id, email="procurement@decarbx.com", hashed_password=get_password_hash("procurement123"), full_name="Marcus Vance", role=UserRole.PROCUREMENT_MANAGER, title="Global Sustainable Sourcing Lead"),
            User(organization_id=org.id, email="supplier@decarbx.com", hashed_password=get_password_hash("supplier123"), full_name="Chen Wei", role=UserRole.SUPPLIER, title="Apex Precision Materials Account Executive"),
            User(organization_id=org.id, email="auditor@decarbx.com", hashed_password=get_password_hash("auditor123"), full_name="Claire Moreau", role=UserRole.AUDITOR, title="Independent Lead ESG Assurance Partner"),
            User(organization_id=org.id, email="executive@decarbx.com", hashed_password=get_password_hash("executive123"), full_name="Devan Nair", role=UserRole.EXECUTIVE, title="Chief Operating Officer & Board Director")
        ]
        db.add_all(users_data)
        db.commit()

        print("Seeding 18+ Emission Factors...")
        factors_data = [
            EmissionFactor(factor_name="Grid Electricity - Southern India Grid", activity_type="Grid Electricity", category="Electricity", scope="Scope 2", geography="India (SR)", unit="kgCO2e/kWh", factor_value=0.7082, source="Central Electricity Authority (CEA) v19", year=2024, version="v19.0", is_demo=True, notes="Location-based regional emission factor"),
            EmissionFactor(factor_name="Grid Electricity - Western India Grid", activity_type="Grid Electricity", category="Electricity", scope="Scope 2", geography="India (WR)", unit="kgCO2e/kWh", factor_value=0.7320, source="Central Electricity Authority (CEA) v19", year=2024, version="v19.0", is_demo=True),
            EmissionFactor(factor_name="Natural Gas - Industrial Boiler", activity_type="Natural Gas", category="Stationary Combustion", scope="Scope 1", geography="India", unit="kgCO2e/m3", factor_value=2.0214, source="DEFRA / GHG Protocol", year=2024, version="v2.1", is_demo=True),
            EmissionFactor(factor_name="Diesel Generator - Stationary", activity_type="Stationary Diesel", category="Stationary Combustion", scope="Scope 1", geography="Global", unit="kgCO2e/liter", factor_value=2.6878, source="DEFRA 2024", year=2024, version="v1.0", is_demo=True),
            EmissionFactor(factor_name="Fleet Petrol / Gasoline (Cars & Vans)", activity_type="Fleet Petrol", category="Mobile Combustion", scope="Scope 1", geography="Global", unit="kgCO2e/liter", factor_value=2.3144, source="UK DEFRA 2024", year=2024, version="v1.0", is_demo=True),
            EmissionFactor(factor_name="Fleet Diesel (Delivery Vans & Trucks)", activity_type="Fleet Diesel", category="Mobile Combustion", scope="Scope 1", geography="Global", unit="kgCO2e/liter", factor_value=2.6870, source="UK DEFRA 2024", year=2024, version="v1.0", is_demo=True),
            EmissionFactor(factor_name="Refrigerant Fugitive - R-410A", activity_type="R-410A Fugitive", category="Fugitive Emissions", scope="Scope 1", geography="Global", unit="kgCO2e/kg", factor_value=2088.0, source="IPCC AR5 Assessment", year=2024, version="AR5", is_demo=True),
            EmissionFactor(factor_name="Primary Aluminum Ingot", activity_type="Raw Aluminum", category="Purchased Goods & Services", scope="Scope 3", geography="Asia", unit="kgCO2e/kg", factor_value=8.4500, source="International Aluminium Institute", year=2024, version="v3.2", is_demo=True),
            EmissionFactor(factor_name="Recycled Secondary Aluminum", activity_type="Recycled Aluminum", category="Purchased Goods & Services", scope="Scope 3", geography="Asia", unit="kgCO2e/kg", factor_value=0.8200, source="European Aluminium Eco-Profile", year=2024, version="v2.0", is_demo=True),
            EmissionFactor(factor_name="Structural Steel Plate", activity_type="Steel Plate", category="Purchased Goods & Services", scope="Scope 3", geography="India", unit="kgCO2e/kg", factor_value=1.8900, source="worldsteel Association", year=2024, version="v2023", is_demo=True),
            EmissionFactor(factor_name="Semiconductor IC & Microcontroller", activity_type="Semiconductors", category="Purchased Goods & Services", scope="Scope 3", geography="Global", unit="kgCO2e/unit", factor_value=1.4500, source="IMEC Sustainable Semiconductor", year=2024, version="v1.4", is_demo=True),
            EmissionFactor(factor_name="Polycarbonate Polymer Resin", activity_type="Polycarbonate Resin", category="Purchased Goods & Services", scope="Scope 3", geography="Global", unit="kgCO2e/kg", factor_value=3.4200, source="PlasticsEurope Eco-profile", year=2024, version="v4.1", is_demo=True),
            EmissionFactor(factor_name="Heavy Goods Vehicle (HGV) Road Freight", activity_type="Road Diesel Freight", category="Upstream Transportation", scope="Scope 3", geography="India", unit="kgCO2e/tonne-km", factor_value=0.1042, source="GLEC Framework v3.0", year=2024, version="v3.0", is_demo=True),
            EmissionFactor(factor_name="Air Cargo Freight (Domestic & Regional)", activity_type="Air Cargo", category="Upstream Transportation", scope="Scope 3", geography="Global", unit="kgCO2e/tonne-km", factor_value=0.8450, source="ICAO Carbon Calculator", year=2024, version="v2024", is_demo=True),
            EmissionFactor(factor_name="Business Travel - Domestic Flight Economy", activity_type="Flight Domestic", category="Business Travel", scope="Scope 3", geography="India", unit="kgCO2e/passenger-km", factor_value=0.1585, source="DEFRA Business Travel", year=2024, version="v2024", is_demo=True),
            EmissionFactor(factor_name="Business Travel - Long Haul Business Class", activity_type="Flight Long-Haul", category="Business Travel", scope="Scope 3", geography="International", unit="kgCO2e/passenger-km", factor_value=0.4320, source="DEFRA Business Travel", year=2024, version="v2024", is_demo=True),
            EmissionFactor(factor_name="Industrial Landfill Waste (Non-hazardous)", activity_type="Landfill Waste", category="Waste Generated", scope="Scope 3", geography="India", unit="kgCO2e/tonne", factor_value=482.00, source="US EPA WARM Model", year=2024, version="v16", is_demo=True),
            EmissionFactor(factor_name="Corrugated Cardboard Packaging", activity_type="Cardboard Packaging", category="Purchased Goods & Services", scope="Scope 3", geography="Global", unit="kgCO2e/kg", factor_value=0.9200, source="FEFCO European Database", year=2024, version="v2023", is_demo=True)
        ]
        db.add_all(factors_data)
        db.commit()
        for ef in factors_data:
            db.refresh(ef)

        fac_blr, fac_bom, fac_pun, fac_chn, fac_hyd = facilities_data

        print("Seeding 12 Suppliers...")
        suppliers_data = [
            Supplier(organization_id=org.id, name="Apex Precision Alloys Ltd", code="SUP-APEX", country="India", category="Raw Materials", annual_spend_usd=14200000.0, annual_emissions_tco2e=18450.0, carbon_intensity=1.30, data_quality_score=94.0, risk_score=28.0, engagement_status="Verified", sbti_committed=True, target_status="1.5°C Approved (Net Zero by 2040)", contact_email="esg@apexalloys.com", latest_submission_date="2024-10-15"),
            Supplier(organization_id=org.id, name="Dynasty Semiconductor Fabrication", code="SUP-DYNASTY", country="Taiwan", category="Electronics Components", annual_spend_usd=28500000.0, annual_emissions_tco2e=14200.0, carbon_intensity=0.50, data_quality_score=91.0, risk_score=35.0, engagement_status="Verified", sbti_committed=True, target_status="Validated 1.5°C Near-Term Target", contact_email="sustainability@dynastysemi.com", latest_submission_date="2024-11-02"),
            Supplier(organization_id=org.id, name="EcoSteel Global Foundry", code="SUP-ECOSTEEL", country="India", category="Raw Materials", annual_spend_usd=11800000.0, annual_emissions_tco2e=12800.0, carbon_intensity=1.08, data_quality_score=82.0, risk_score=52.0, engagement_status="Needs Improvement", sbti_committed=False, target_status="Target In Development", contact_email="compliance@ecosteel.in", latest_submission_date="2024-06-20"),
            Supplier(organization_id=org.id, name="TransLogix Express Multi-Modal", code="SUP-TRANSLOG", country="India", category="Logistics & Freight", annual_spend_usd=9400000.0, annual_emissions_tco2e=8920.0, carbon_intensity=0.95, data_quality_score=88.0, risk_score=44.0, engagement_status="Submitted", sbti_committed=True, target_status="SBTi Committed", contact_email="fleet.carbon@translogix.com", latest_submission_date="2024-09-14"),
            Supplier(organization_id=org.id, name="PolyMatrix Advanced Polymers", code="SUP-POLY", country="Germany", category="Chemicals & Plastics", annual_spend_usd=7600000.0, annual_emissions_tco2e=5640.0, carbon_intensity=0.74, data_quality_score=93.0, risk_score=32.0, engagement_status="Verified", sbti_committed=True, target_status="Approved Science Based Target", contact_email="sustain@polymatrix.de", latest_submission_date="2024-10-28"),
            Supplier(organization_id=org.id, name="Zenith Corrugated & Sustainable Packaging", code="SUP-ZENITH", country="India", category="Packaging", annual_spend_usd=4200000.0, annual_emissions_tco2e=2450.0, carbon_intensity=0.58, data_quality_score=89.0, risk_score=26.0, engagement_status="Verified", sbti_committed=True, target_status="Well-Below 2°C Target", contact_email="green@zenithpackaging.com", latest_submission_date="2024-11-10"),
            Supplier(organization_id=org.id, name="Kinetix Precision Connectors", code="SUP-KINETIX", country="Japan", category="Electronics Components", annual_spend_usd=6800000.0, annual_emissions_tco2e=3120.0, carbon_intensity=0.46, data_quality_score=86.0, risk_score=38.0, engagement_status="Submitted", sbti_committed=False, target_status="Internal 2030 Target Only", contact_email="csr@kinetix.co.jp", latest_submission_date="2024-08-30"),
            Supplier(organization_id=org.id, name="Sovereign Thermal Systems", code="SUP-SOV", country="India", category="Equipment & Tooling", annual_spend_usd=5100000.0, annual_emissions_tco2e=2890.0, carbon_intensity=0.57, data_quality_score=78.0, risk_score=61.0, engagement_status="Needs Improvement", sbti_committed=False, target_status="No Formal Target", contact_email="audit@sovereignthermal.in", latest_submission_date="2024-04-12"),
            Supplier(organization_id=org.id, name="GreenVolt Industrial Batteries", code="SUP-GREENVOLT", country="South Korea", category="Energy Storage", annual_spend_usd=8300000.0, annual_emissions_tco2e=2150.0, carbon_intensity=0.26, data_quality_score=95.0, risk_score=19.0, engagement_status="Verified", sbti_committed=True, target_status="Net Zero by 2035 Aligned", contact_email="esg@greenvolt.kr", latest_submission_date="2024-11-18"),
            Supplier(organization_id=org.id, name="Falcon Global Freightways", code="SUP-FALCON", country="Singapore", category="Logistics & Freight", annual_spend_usd=6200000.0, annual_emissions_tco2e=3400.0, carbon_intensity=0.55, data_quality_score=72.0, risk_score=58.0, engagement_status="Pending", sbti_committed=False, target_status="Questionnaire Pending", contact_email="ops@falconfreight.sg", latest_submission_date=None),
            Supplier(organization_id=org.id, name="Nexus Molded Cables & Wire", code="SUP-NEXUS", country="India", category="Wiring & Harness", annual_spend_usd=3100000.0, annual_emissions_tco2e=1420.0, carbon_intensity=0.46, data_quality_score=80.0, risk_score=42.0, engagement_status="Submitted", sbti_committed=False, target_status="Committed to 2030 Target", contact_email="info@nexuscables.in", latest_submission_date="2024-09-05"),
            Supplier(organization_id=org.id, name="Vanguard Industrial Fasteners", code="SUP-VANGUARD", country="USA", category="Mechanical Hardware", annual_spend_usd=2900000.0, annual_emissions_tco2e=870.0, carbon_intensity=0.30, data_quality_score=85.0, risk_score=33.0, engagement_status="Verified", sbti_committed=True, target_status="1.5°C Near-Term Target", contact_email="sustainability@vanguardfast.com", latest_submission_date="2024-10-01")
        ]
        db.add_all(suppliers_data)
        db.commit()
        for sup in suppliers_data:
            db.refresh(sup)

        # Seed Questionnaires
        for sup in suppliers_data[:6]:
            q = SupplierQuestionnaire(
                supplier_id=sup.id,
                reporting_year=2024,
                ghg_inventory_available=True,
                scope1_emissions=round(sup.annual_emissions_tco2e * 0.35, 1),
                scope2_emissions=round(sup.annual_emissions_tco2e * 0.45, 1),
                scope3_emissions=round(sup.annual_emissions_tco2e * 0.20, 1),
                renewable_energy_pct=42.0 if sup.sbti_committed else 18.0,
                emissions_reduction_target="45% reduction in absolute Scope 1+2 emissions by 2030" if sup.sbti_committed else "20% energy intensity reduction",
                sbti_status="Approved 1.5°C Target" if sup.sbti_committed else "Not Committed",
                pcf_available=True,
                verification_status="Third-Party Verified (ISO 14064-3)" if sup.data_quality_score > 90 else "Self-Declared",
                environmental_certifications="ISO 14001:2015, ISO 50001:2018, EcoVadis Gold",
                sustainability_score=round(sup.data_quality_score - (sup.risk_score * 0.2), 1),
                status=sup.engagement_status,
                submitted_at=datetime.utcnow() - timedelta(days=25)
            )
            db.add(q)
        db.commit()

        print("Seeding 8 Products with 7 Lifecycle Stages & BOM...")
        products_defs = [
            ("NX-SRV-9000", "Nexgile AI HyperScale Server Rack Unit", "Enterprise Hardware", 32.5, 45000, 18.5, 14.8),
            ("NX-EDGE-400", "DecarbX Industrial IoT Smart Gateway", "Industrial IoT", 2.2, 120000, 4.8, 3.9),
            ("NX-BATT-MOD", "UltraCap Modular Energy Storage Block", "Power Systems", 48.0, 25000, 28.4, 21.0),
            ("NX-OPT-100G", "High-Bandwidth Photonic Transceiver", "Telecommunications", 0.45, 200000, 1.95, 1.45),
            ("NX-CTRL-PRO", "Programmable Logic Automation Controller", "Automation Hardware", 4.1, 75000, 7.2, 5.8),
            ("NX-EV-CHG", "Dual-Port Level-3 Commercial EV Fast Charger", "Clean Mobility", 85.0, 18000, 45.6, 36.2),
            ("NX-THERM-X", "Micro-Channel High-Efficiency Heat Exchanger", "Thermal Systems", 14.2, 60000, 11.4, 8.9),
            ("NX-ROBOT-ARM", "6-Axis Precision Collaborative Robotic Arm", "Robotics & Cobots", 24.0, 12000, 22.8, 17.5)
        ]

        products_entities = []
        for sku, name, cat, wt, prod, cur_pcf, tgt_pcf in products_defs:
            p = Product(
                organization_id=org.id,
                sku=sku,
                name=name,
                category=cat,
                weight_kg=wt,
                unit="unit",
                annual_production=prod,
                total_pcf=cur_pcf,
                target_pcf=tgt_pcf,
                description=f"High-reliability enterprise system manufactured in ISO 14001 certified cleanrooms."
            )
            db.add(p)
            products_entities.append(p)
        db.commit()
        for p in products_entities:
            db.refresh(p)

        # Lifecycle stages for each product
        stage_ratios = [
            ("Raw Materials", 0.38, "Extraction and smelting of high-purity aluminum, structural copper, and silicon."),
            ("Manufacturing", 0.26, "Cleanroom surface-mount assembly, reflow soldering, and automated CNC testing."),
            ("Packaging", 0.05, "100% recycled biodegradable moulded pulp and corrugated buffer materials."),
            ("Transportation", 0.08, "Multi-modal road logistics and maritime containerized transport."),
            ("Distribution", 0.03, "Regional distribution hub handling and inventory cross-docking."),
            ("Product Use", 0.14, "Lifetime power dissipation during 5-year operational lifecycle at customer premises."),
            ("End of Life", 0.06, "WEEE compliant disassembly, component recovery, and metal recycling.")
        ]

        for p in products_entities:
            for sname, ratio, desc in stage_ratios:
                stage_val = round(p.total_pcf * ratio, 2)
                st = ProductLifecycleStage(
                    product_id=p.id,
                    stage_name=sname,
                    emissions_kg_co2e=stage_val,
                    percentage=round(ratio * 100.0, 1),
                    details=desc
                )
                db.add(st)

        # BOM Materials for primary product (Server Rack)
        p1 = products_entities[0]
        materials_p1 = [
            ProductMaterial(product_id=p1.id, material_name="Chassis Machined Aluminum Ingot", quantity=14.5, unit="kg", supplier_name="Apex Precision Alloys Ltd", emission_factor=8.45, calculated_emissions=122.5, recycled_percentage=15.0),
            ProductMaterial(product_id=p1.id, material_name="Mainboard Multi-Layer PCB Assembly", quantity=3.2, unit="unit", supplier_name="Dynasty Semiconductor Fabrication", emission_factor=12.4, calculated_emissions=39.68, recycled_percentage=0.0),
            ProductMaterial(product_id=p1.id, material_name="Hot-Swap Structural Steel Enclosure", quantity=8.0, unit="kg", supplier_name="EcoSteel Global Foundry", emission_factor=1.89, calculated_emissions=15.12, recycled_percentage=25.0),
            ProductMaterial(product_id=p1.id, material_name="Flame-Retardant Polycarbonate Front Bezel", quantity=2.1, unit="kg", supplier_name="PolyMatrix Advanced Polymers", emission_factor=3.42, calculated_emissions=7.18, recycled_percentage=30.0),
            ProductMaterial(product_id=p1.id, material_name="Internal Power Busbars (Electrolytic Copper)", quantity=1.8, unit="kg", supplier_name="Apex Precision Alloys Ltd", emission_factor=4.10, calculated_emissions=7.38, recycled_percentage=10.0),
            ProductMaterial(product_id=p1.id, material_name="Heavy Duty Modular Shipping Buffer", quantity=2.9, unit="kg", supplier_name="Zenith Corrugated & Sustainable Packaging", emission_factor=0.92, calculated_emissions=2.67, recycled_percentage=100.0)
        ]
        db.add_all(materials_p1)
        db.commit()

        print("Seeding 60+ Realistic Historical & Current Emission Records...")
        # Populate records across 12 months for 2024 to enable full forecasting & anomaly analysis
        records_to_seed = []
        
        # Helper: monthly base variations
        # Summer cooling peaks in Jun-Jul, Winter slight peaks in Dec
        for m in range(1, 13):
            month_factor = 1.0 + (0.15 if m in [5, 6, 7] else (-0.05 if m in [1, 2] else 0.05 if m in [11, 12] else 0.0))

            # 1. BLR Facility (Largest Manufacturing)
            # Scope 2 Electricity
            kwh_blr = 1850000.0 * month_factor
            ems_elec_blr = round((kwh_blr * 0.7082) / 1000.0, 2)
            records_to_seed.append(EmissionRecord(
                organization_id=org.id, facility_id=fac_blr.id, department="Cleanroom Fabrication",
                reporting_year=2024, reporting_month=m, scope="Scope 2", category="Electricity",
                activity_type="Grid Electricity (SR)", activity_amount=round(kwh_blr, 1), activity_unit="kWh",
                emission_factor_value=0.7082, emission_factor_unit="kgCO2e/kWh",
                emission_factor_source="CEA v19", calculated_emissions=ems_elec_blr,
                uncertainty_percentage=3.5, data_quality_score=96.0, status="Approved", notes="Smart sub-meter logged"
            ))

            # Scope 1 Stationary Combustion (Boiler / Process Gas)
            gas_blr = 42000.0 * month_factor
            records_to_seed.append(EmissionRecord(
                organization_id=org.id, facility_id=fac_blr.id, department="Thermal Heat Plant",
                reporting_year=2024, reporting_month=m, scope="Scope 1", category="Stationary Combustion",
                activity_type="Natural Gas", activity_amount=round(gas_blr, 1), activity_unit="m3",
                emission_factor_value=2.0214, emission_factor_unit="kgCO2e/m3",
                emission_factor_source="GHG Protocol", calculated_emissions=round((gas_blr * 2.0214) / 1000.0, 2),
                uncertainty_percentage=4.0, data_quality_score=94.0, status="Approved"
            ))

            # Scope 1 Backup Generator (Diesel)
            # Add anomaly in Month 9 (September) at BLR
            diesel_blr = (16500.0 if m == 9 else 3800.0) * month_factor
            records_to_seed.append(EmissionRecord(
                organization_id=org.id, facility_id=fac_blr.id, department="Facilities & Utilities",
                reporting_year=2024, reporting_month=m, scope="Scope 1", category="Stationary Combustion",
                activity_type="Stationary Diesel", activity_amount=round(diesel_blr, 1), activity_unit="liters",
                emission_factor_value=2.6878, emission_factor_unit="kgCO2e/liter",
                emission_factor_source="DEFRA 2024", calculated_emissions=round((diesel_blr * 2.6878) / 1000.0, 2),
                uncertainty_percentage=5.0, data_quality_score=92.0,
                status="Approved", notes="Generator run-time log" if m != 9 else "ANOMALY: Grid substation maintenance spike"
            ))

            # 2. Pune Facility (Assembly)
            # Scope 2 Electricity (Western Grid)
            kwh_pun = 1120000.0 * month_factor
            records_to_seed.append(EmissionRecord(
                organization_id=org.id, facility_id=fac_pun.id, department="Automated Assembly",
                reporting_year=2024, reporting_month=m, scope="Scope 2", category="Electricity",
                activity_type="Grid Electricity (WR)", activity_amount=round(kwh_pun, 1), activity_unit="kWh",
                emission_factor_value=0.7320, emission_factor_unit="kgCO2e/kWh",
                emission_factor_source="CEA v19", calculated_emissions=round((kwh_pun * 0.7320) / 1000.0, 2),
                uncertainty_percentage=3.8, data_quality_score=95.0, status="Approved"
            ))

            # Scope 1 Mobile Fleet
            fleet_pun = 8500.0 * month_factor
            records_to_seed.append(EmissionRecord(
                organization_id=org.id, facility_id=fac_pun.id, department="Logistics Fleet",
                reporting_year=2024, reporting_month=m, scope="Scope 1", category="Mobile Combustion",
                activity_type="Fleet Diesel", activity_amount=round(fleet_pun, 1), activity_unit="liters",
                emission_factor_value=2.6870, emission_factor_unit="kgCO2e/liter",
                emission_factor_source="DEFRA 2024", calculated_emissions=round((fleet_pun * 2.6870) / 1000.0, 2),
                uncertainty_percentage=6.0, data_quality_score=89.0, status="Approved"
            ))

            # 3. Mumbai Distribution Center (Scope 3 Upstream Freight & Electricity)
            freight_bom = 245000.0 * month_factor
            records_to_seed.append(EmissionRecord(
                organization_id=org.id, facility_id=fac_bom.id, department="Outbound Logistics",
                reporting_year=2024, reporting_month=m, scope="Scope 3", category="Upstream Transportation",
                activity_type="Road Diesel Freight", activity_amount=round(freight_bom, 1), activity_unit="tonne-km",
                emission_factor_value=0.1042, emission_factor_unit="kgCO2e/tonne-km",
                emission_factor_source="GLEC v3", calculated_emissions=round((freight_bom * 0.1042) / 1000.0, 2),
                uncertainty_percentage=8.0, data_quality_score=87.0, status="Approved"
            ))

            # 4. Chennai Warehouse (Scope 3 Purchased Goods - Aluminum & Steel)
            alum_chn = 42000.0 * month_factor
            records_to_seed.append(EmissionRecord(
                organization_id=org.id, facility_id=fac_chn.id, department="Procurement Ingestion",
                reporting_year=2024, reporting_month=m, scope="Scope 3", category="Purchased Goods & Services",
                activity_type="Raw Aluminum", activity_amount=round(alum_chn, 1), activity_unit="kg",
                emission_factor_value=8.4500, emission_factor_unit="kgCO2e/kg",
                emission_factor_source="IAI 2024", calculated_emissions=round((alum_chn * 8.45) / 1000.0, 2),
                uncertainty_percentage=5.5, data_quality_score=93.0, status="Approved"
            ))

            # 5. Hyderabad R&D Center (Business Travel & Refrigerants)
            flight_hyd = 85000.0 * month_factor
            records_to_seed.append(EmissionRecord(
                organization_id=org.id, facility_id=fac_hyd.id, department="Engineering Operations",
                reporting_year=2024, reporting_month=m, scope="Scope 3", category="Business Travel",
                activity_type="Flight Domestic", activity_amount=round(flight_hyd, 1), activity_unit="passenger-km",
                emission_factor_value=0.1585, emission_factor_unit="kgCO2e/passenger-km",
                emission_factor_source="DEFRA", calculated_emissions=round((flight_hyd * 0.1585) / 1000.0, 2),
                uncertainty_percentage=7.0, data_quality_score=91.0, status="Approved"
            ))

        # Add 2023 Historical Baseline Data for month-by-month and year-over-year forecasting
        for m in range(1, 13):
            records_to_seed.append(EmissionRecord(
                organization_id=org.id, facility_id=fac_blr.id, department="Operations",
                reporting_year=2023, reporting_month=m, scope="Scope 2", category="Electricity",
                activity_type="Grid Electricity (SR)", activity_amount=2100000.0, activity_unit="kWh",
                emission_factor_value=0.7082, emission_factor_unit="kgCO2e/kWh",
                emission_factor_source="CEA v18", calculated_emissions=1487.22,
                uncertainty_percentage=4.0, data_quality_score=90.0, status="Approved"
            ))

        db.add_all(records_to_seed)
        db.commit()

        print("Seeding 8 Reduction Initiatives with MACC and ROI...")
        inits_data = [
            ReductionInitiative(organization_id=org.id, facility_id=fac_blr.id, name="Solar PV Rooftop Installation (Phase 1 - 3.5 MWp)", description="Rooftop solar arrays across Bengaluru main fabrication buildings.", category="Renewable Energy", responsible_owner="Vikram Mehta", start_date="2024-02-01", end_date="2024-11-30", baseline_emissions_tco2e=14200.0, estimated_annual_reduction_tco2e=4250.0, implementation_cost_usd=2100000.0, annual_savings_usd=620000.0, priority="High", status="In Progress", progress_pct=85.0, confidence_pct=95.0, roi_pct=24.5, marginal_abatement_cost=-47.05),
            ReductionInitiative(organization_id=org.id, facility_id=fac_pun.id, name="Chiller Plant Variable Frequency Drive (VFD) Retrofit", description="High-efficiency inverter-driven chillers and cooling tower automation.", category="Energy Efficiency", responsible_owner="Sunil Rao", start_date="2024-03-15", end_date="2024-08-30", baseline_emissions_tco2e=6800.0, estimated_annual_reduction_tco2e=1850.0, implementation_cost_usd=480000.0, annual_savings_usd=195000.0, priority="High", status="Completed", progress_pct=100.0, confidence_pct=92.0, roi_pct=31.2, marginal_abatement_cost=-53.51),
            ReductionInitiative(organization_id=org.id, facility_id=fac_bom.id, name="Fleet Commercial Electric Vehicle Transition (50 Delivery Vans)", description="Replacement of diesel vans with zero-emission electric cargo vans.", category="Fleet Electrification", responsible_owner="Priya Sundaram", start_date="2024-06-01", end_date="2025-06-30", baseline_emissions_tco2e=4500.0, estimated_annual_reduction_tco2e=1200.0, implementation_cost_usd=1650000.0, annual_savings_usd=280000.0, priority="Medium", status="In Progress", progress_pct=40.0, confidence_pct=88.0, roi_pct=11.5, marginal_abatement_cost=41.67),
            ReductionInitiative(organization_id=org.id, facility_id=fac_blr.id, name="Tier-1 Supplier Recycled Aluminum Mandate (80% Scrap)", description="Enforce minimum 80% post-consumer scrap in aluminum extrusion billets.", category="Supply Chain Engagement", responsible_owner="Marcus Vance", start_date="2024-01-01", end_date="2025-12-31", baseline_emissions_tco2e=18500.0, estimated_annual_reduction_tco2e=5400.0, implementation_cost_usd=350000.0, annual_savings_usd=120000.0, priority="High", status="In Progress", progress_pct=60.0, confidence_pct=85.0, roi_pct=21.4, marginal_abatement_cost=-9.26),
            ReductionInitiative(organization_id=org.id, facility_id=fac_hyd.id, name="Compressed Air Leak Detection & Smart Pressure Regulation", description="Ultrasonic acoustic leak detection and automated zero-loss condensate drains.", category="Energy Efficiency", responsible_owner="Kavita Nair", start_date="2024-04-01", end_date="2024-07-31", baseline_emissions_tco2e=2200.0, estimated_annual_reduction_tco2e=680.0, implementation_cost_usd=95000.0, annual_savings_usd=74000.0, priority="Medium", status="Completed", progress_pct=100.0, confidence_pct=96.0, roi_pct=57.9, marginal_abatement_cost=-80.88),
            ReductionInitiative(organization_id=org.id, facility_id=fac_chn.id, name="Logistics Route Optimization & Multi-Modal Rail Consolidation", description="AI routing engine for load consolidation and freight modal shift to rail.", category="Supply Chain Engagement", responsible_owner="Deepak Verma", start_date="2024-05-01", end_date="2025-03-31", baseline_emissions_tco2e=5800.0, estimated_annual_reduction_tco2e=1450.0, implementation_cost_usd=220000.0, annual_savings_usd=165000.0, priority="Medium", status="In Progress", progress_pct=50.0, confidence_pct=80.0, roi_pct=55.0, marginal_abatement_cost=-83.45),
            ReductionInitiative(organization_id=org.id, facility_id=fac_blr.id, name="Off-Site Virtual Power Purchase Agreement (VPPA - 15 MW Wind)", description="Long-term clean power contract with interstate transmission open access.", category="Renewable Energy", responsible_owner="Sarah Jenkins", start_date="2024-08-01", end_date="2025-12-31", baseline_emissions_tco2e=28000.0, estimated_annual_reduction_tco2e=8900.0, implementation_cost_usd=4500000.0, annual_savings_usd=1100000.0, priority="High", status="Approved", progress_pct=20.0, confidence_pct=90.0, roi_pct=14.4, marginal_abatement_cost=-22.47),
            ReductionInitiative(organization_id=org.id, facility_id=fac_pun.id, name="Thermal Heat Pump Steam Replacement & Electrification", description="High-temperature industrial heat pumps replacing natural gas boilers.", category="Process Electrification", responsible_owner="Vikram Mehta", start_date="2024-09-01", end_date="2026-06-30", baseline_emissions_tco2e=7500.0, estimated_annual_reduction_tco2e=2100.0, implementation_cost_usd=1850000.0, annual_savings_usd=240000.0, priority="Low", status="Proposed", progress_pct=5.0, confidence_pct=75.0, roi_pct=7.0, marginal_abatement_cost=61.90)
        ]
        db.add_all(inits_data)
        db.commit()

        print("Seeding SBTi Carbon Target...")
        target = CarbonTarget(
            organization_id=org.id,
            name="SBTi 1.5°C Corporate Decarbonization Trajectory (Near-Term)",
            baseline_year=2024,
            baseline_emissions_tco2e=150000.0,
            target_year=2030,
            target_reduction_pct=42.0,
            current_emissions_tco2e=128450.0,
            required_annual_reduction_pct=7.0,
            scope_coverage="Scope 1, Scope 2 & Scope 3",
            status="On Track"
        )
        db.add(target)
        db.commit()

        print("Seeding 7 Compliance Frameworks & Disclosures...")
        frameworks_data = [
            ComplianceFramework(code="CSRD", name="Corporate Sustainability Reporting Directive (EU)", description="European ESG disclosure standards mandated by EFRAG under ESRS framework.", completion_pct=78.0, due_date="2025-06-30", status="In Progress", owner="Sarah Jenkins", total_requirements=6, completed_requirements=4),
            ComplianceFramework(code="CBAM", name="Carbon Border Adjustment Mechanism (EU)", description="Transitional reporting of embedded emissions in imported iron, steel, and aluminum products.", completion_pct=64.0, due_date="2025-01-31", status="In Progress", owner="Marcus Vance", total_requirements=4, completed_requirements=2),
            ComplianceFramework(code="TCFD", name="Task Force on Climate-Related Financial Disclosures", description="Governance, strategy, risk management, and metrics/targets climate disclosure.", completion_pct=85.0, due_date="2025-03-31", status="Compliant", owner="Devan Nair", total_requirements=4, completed_requirements=3),
            ComplianceFramework(code="CDP", name="CDP Climate Change Questionnaire (2025)", description="Global corporate disclosure system for investors and purchasers.", completion_pct=72.0, due_date="2025-07-31", status="In Progress", owner="Vikram Mehta", total_requirements=5, completed_requirements=3),
            ComplianceFramework(code="EU_TAXONOMY", name="EU Sustainable Finance Taxonomy", description="Substantial contribution to climate change mitigation and Do No Significant Harm (DNSH) assessment.", completion_pct=55.0, due_date="2025-12-31", status="At Risk", owner="Claire Moreau", total_requirements=3, completed_requirements=1),
            ComplianceFramework(code="SEC", name="SEC Climate-Related Disclosures", description="U.S. Securities and Exchange Commission climate risk disclosure rules for public filers.", completion_pct=48.0, due_date="2026-03-31", status="In Progress", owner="Sarah Jenkins", total_requirements=3, completed_requirements=1),
            ComplianceFramework(code="ESRS", name="European Sustainability Reporting Standards E1 (Climate)", description="ESRS E1 Climate Change topic standard covering GHG metrics and transition plan.", completion_pct=80.0, due_date="2025-06-30", status="In Progress", owner="Elena Rostova", total_requirements=5, completed_requirements=4)
        ]
        db.add_all(frameworks_data)
        db.commit()
        for f in frameworks_data:
            db.refresh(f)

        # Requirements
        f_csrd, f_cbam, f_tcfd, f_cdp, f_eutax, f_sec, f_esrs = frameworks_data

        reqs_data = [
            ComplianceRequirement(framework_id=f_csrd.id, disclosure_code="ESRS E1-6", disclosure_name="Gross Scopes 1, 2, 3 and Total GHG Emissions", category="Emissions", owner="Elena Rostova", status="Completed", evidence_available=True, completion_pct=100.0, notes="Audited by Ernst & Young, verified ISO 14064"),
            ComplianceRequirement(framework_id=f_csrd.id, disclosure_code="ESRS E1-1", disclosure_name="Transition Plan for Climate Change Mitigation", category="Strategy", owner="Sarah Jenkins", status="In Progress", evidence_available=True, completion_pct=85.0, notes="Board approved decarbonization capex plan"),
            ComplianceRequirement(framework_id=f_csrd.id, disclosure_code="ESRS E1-4", disclosure_name="Targets Related to Climate Change Mitigation & Adaptation", category="Targets", owner="Vikram Mehta", status="Completed", evidence_available=True, completion_pct=100.0, notes="SBTi validation letter received"),
            ComplianceRequirement(framework_id=f_csrd.id, disclosure_code="ESRS 2-BP-2", disclosure_name="Disclosures in Relation to Specific Circumstances (Materiality)", category="Governance", owner="Sarah Jenkins", status="Ready for Review", evidence_available=True, completion_pct=90.0),
            ComplianceRequirement(framework_id=f_csrd.id, disclosure_code="ESRS E1-5", disclosure_name="Energy Consumption & Energy Mix Breakdown", category="Energy", owner="Elena Rostova", status="Completed", evidence_available=True, completion_pct=100.0),
            ComplianceRequirement(framework_id=f_csrd.id, disclosure_code="ESRS E1-9", disclosure_name="Anticipated Financial Effects from Material Physical Risks", category="Finance", owner="Devan Nair", status="In Progress", evidence_available=False, completion_pct=40.0),

            ComplianceRequirement(framework_id=f_cbam.id, disclosure_code="CBAM-Art.6", disclosure_name="Quarterly Direct Embedded Emissions (Aluminum)", category="Product Carbon", owner="Marcus Vance", status="Completed", evidence_available=True, completion_pct=100.0),
            ComplianceRequirement(framework_id=f_cbam.id, disclosure_code="CBAM-Art.7", disclosure_name="Indirect Embedded Emissions & Grid Electricity Factors", category="Emissions", owner="Elena Rostova", status="In Progress", evidence_available=True, completion_pct=75.0),
            ComplianceRequirement(framework_id=f_cbam.id, disclosure_code="CBAM-Art.9", disclosure_name="Carbon Price Paid in Country of Origin", category="Finance", owner="Marcus Vance", status="In Progress", evidence_available=False, completion_pct=50.0),
            ComplianceRequirement(framework_id=f_cbam.id, disclosure_code="CBAM-Art.10", disclosure_name="Verification by Accredited Verifier (EU Reg 2018/2067)", category="Assurance", owner="Claire Moreau", status="Not Started", evidence_available=False, completion_pct=25.0),

            ComplianceRequirement(framework_id=f_tcfd.id, disclosure_code="TCFD-Gov-a", disclosure_name="Board Oversight of Climate-Related Risks", category="Governance", owner="Devan Nair", status="Completed", evidence_available=True, completion_pct=100.0),
            ComplianceRequirement(framework_id=f_tcfd.id, disclosure_code="TCFD-Strat-b", disclosure_name="Impact on Organization Businesses, Strategy & Financial Planning", category="Strategy", owner="Sarah Jenkins", status="Completed", evidence_available=True, completion_pct=100.0),
            ComplianceRequirement(framework_id=f_tcfd.id, disclosure_code="TCFD-Risk-a", disclosure_name="Processes for Identifying & Assessing Climate Risks", category="Risk Management", owner="Vikram Mehta", status="Completed", evidence_available=True, completion_pct=100.0),
            ComplianceRequirement(framework_id=f_tcfd.id, disclosure_code="TCFD-Met-c", disclosure_name="Climate Targets (Scopes 1, 2, 3) and Performance vs Targets", category="Metrics", owner="Elena Rostova", status="Ready for Review", evidence_available=True, completion_pct=90.0)
        ]
        db.add_all(reqs_data)
        db.commit()

        print("Seeding Carbon Finance & Data Quality Metrics...")
        cf = CarbonFinance(
            organization_id=org.id,
            internal_carbon_price_usd=75.0,
            annual_carbon_budget_usd=12000000.0,
            allocated_reduction_budget_usd=4500000.0,
            realized_cost_savings_usd=1850000.0,
            currency="USD"
        )
        db.add(cf)

        dq_metric = DataQualityMetric(
            organization_id=org.id,
            completeness=94.5,
            validity=96.2,
            consistency=91.8,
            timeliness=89.0,
            verified_records_pct=87.5,
            estimated_records_pct=12.5,
            overall_score=92.0
        )
        db.add(dq_metric)

        dq_issues = [
            DataQualityIssue(organization_id=org.id, issue_type="Missing Factor", severity="High", description="Unmapped chemical process emission factor for Hyderabad lab experimental solvent.", entity_type="EmissionRecord", status="Open"),
            DataQualityIssue(organization_id=org.id, issue_type="Unverified Supplier Data", severity="Medium", description="Falcon Global Freightways submitted self-reported truck fleet fuel consumption without utility invoices.", entity_type="Supplier", entity_id="10", status="In Review"),
            DataQualityIssue(organization_id=org.id, issue_type="Estimated Meter Reading", severity="Low", description="Chennai warehouse utility electricity meter estimate applied for 4 days during meter upgrade.", entity_type="EmissionRecord", status="Resolved"),
            DataQualityIssue(organization_id=org.id, issue_type="Unusual Emission Value", severity="Medium", description="Stationary diesel spike detected at Bengaluru facility during grid substation maintenance in Sept.", entity_type="EmissionRecord", status="In Review")
        ]
        db.add_all(dq_issues)
        db.commit()

        print("Seeding Notifications & Evidence & Audit Logs...")
        notifs = [
            Notification(title="Supplier Submission Overdue", message="EcoSteel Global Foundry Scope 3 annual GHG submission is 14 days overdue.", category="Supplier", severity="warning", is_read=False, link="/suppliers"),
            Notification(title="Scope 3 Category 1 Increase", message="Purchased goods carbon emissions increased 12% in recent procurement cycle.", category="Emissions", severity="danger", is_read=False, link="/emissions"),
            Notification(title="CSRD Disclosure Review Due", message="ESRS E1-1 Climate Transition Plan internal review is due in 10 days.", category="Compliance", severity="info", is_read=False, link="/compliance"),
            Notification(title="Data Quality Alert", message="Facility Mumbai missing May sub-meter electricity readings (estimated record applied).", category="Facility", severity="warning", is_read=False, link="/data-quality"),
            Notification(title="Reduction Milestone Achieved", message="Solar PV Rooftop Phase 1 at Bengaluru reached 85% completion milestone.", category="Reduction", severity="success", is_read=True, link="/reductions")
        ]
        db.add_all(notifs)

        evidence_items = [
            Evidence(file_name="BESCOM_Electricity_Utility_Invoice_Q3_2024.pdf", file_type="Utility Bill", related_record_type="EmissionRecord", related_record_id="1", uploaded_by="Elena Rostova", verification_status="Verified", file_size_kb=840, notes="Official utility invoice stamped with meter reference."),
            Evidence(file_name="Apex_Alloys_ISO_14064_Verification_Statement_2024.pdf", file_type="Assurance Certificate", related_record_type="Supplier", related_record_id="1", uploaded_by="Chen Wei", verification_status="Verified", file_size_kb=1250, notes="TUV Rheinland Third-Party Verification Certificate."),
            Evidence(file_name="Solar_Rooftop_Commissioning_Inspection_Report.pdf", file_type="Engineering Report", related_record_type="ReductionInitiative", related_record_id="1", uploaded_by="Vikram Mehta", verification_status="Verified", file_size_kb=2400, notes="Grid tie-in test results and generation logs."),
            Evidence(file_name="Falcon_Freight_Self_Reported_Fuel_Log_2024.csv", file_type="CSV Log", related_record_type="Supplier", related_record_id="10", uploaded_by="Marcus Vance", verification_status="Pending", file_size_kb=320, notes="Under auditor review due to variance in ton-km metrics.")
        ]
        db.add_all(evidence_items)

        audit_items = [
            AuditLog(user_email="admin@decarbx.com", action="LOGIN", resource="User", resource_id="1", new_value="Admin user authenticated", ip_address="127.0.0.1"),
            AuditLog(user_email="accountant@decarbx.com", action="CREATE", resource="EmissionRecord", resource_id="1", new_value="Logged Scope 2 Electricity for Bengaluru: 1,850,000 kWh (1,310.17 tCO2e)", ip_address="127.0.0.1"),
            AuditLog(user_email="manager@decarbx.com", action="APPROVE", resource="EmissionRecord", resource_id="1", old_value="Status: Submitted", new_value="Status: Approved", ip_address="127.0.0.1"),
            AuditLog(user_email="procurement@decarbx.com", action="UPDATE", resource="Supplier", resource_id="1", old_value="Status: Submitted", new_value="Status: Verified (Score 94.0)", ip_address="127.0.0.1"),
            AuditLog(user_email="auditor@decarbx.com", action="APPROVE", resource="Evidence", resource_id="1", new_value="Verified BESCOM electricity billing records against sub-meter ledger", ip_address="127.0.0.1")
        ]
        db.add_all(audit_items)
        db.commit()

        print("Seeding completed successfully! All entities, roles, and records populated.")

    except Exception as e:
        print(f"Error during database seeding: {e}")
        db.rollback()
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
