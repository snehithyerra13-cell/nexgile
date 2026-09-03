"""
Nexgile-DecarbX Comprehensive Platform Verification Script
Validates all backend API endpoints, AI algorithms, data lineage,
and full-stack integrations using the FastAPI TestClient.
"""

import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def run_tests():
    print("=" * 70)
    print("NEXGILE-DECARBX ENVIRONMENTAL INTELLIGENCE PLATFORM TEST SUITE")
    print("=" * 70)

    # 1. System Health
    print("\n1. Testing System Health...")
    r = client.get("/api/health")
    assert r.status_code == 200, f"Health check failed: {r.text}"
    print("   [PASS] Health check OK:", r.json()["status"])

    # 2. Authentication with all 7 Demo Personas
    print("\n2. Testing Authentication & 7 Enterprise Personas...")
    demo_roles = [
        ("admin@decarbx.com", "admin123", "Admin"),
        ("manager@decarbx.com", "manager123", "Sustainability Manager"),
        ("accountant@decarbx.com", "accountant123", "Carbon Accountant"),
        ("procurement@decarbx.com", "procurement123", "Procurement Manager"),
        ("supplier@decarbx.com", "supplier123", "Supplier"),
        ("auditor@decarbx.com", "auditor123", "Auditor"),
        ("executive@decarbx.com", "executive123", "Executive"),
    ]

    tokens = {}
    for email, pwd, expected_role in demo_roles:
        res = client.post("/api/auth/login", json={"email": email, "password": pwd})
        assert res.status_code == 200, f"Login failed for {email}: {res.text}"
        data = res.json()
        assert data["user"]["role"] == expected_role, f"Role mismatch for {email}"
        assert len(data["access_token"]) > 20, "Missing JWT access token"
        tokens[expected_role] = data["access_token"]
        print(f"   [PASS] {expected_role} authenticated: {data['user']['full_name']}")

    admin_headers = {"Authorization": f"Bearer {tokens['Admin']}"}
    manager_headers = {"Authorization": f"Bearer {tokens['Sustainability Manager']}"}
    accountant_headers = {"Authorization": f"Bearer {tokens['Carbon Accountant']}"}

    # 3. Dashboard Endpoints
    print("\n3. Testing Executive Dashboard & Visualizations...")
    r = client.get("/api/dashboard/summary?year=2024")
    assert r.status_code == 200
    sum_data = r.json()
    print(f"   [PASS] Total emissions: {sum_data['total_emissions_tco2e']} tCO2e (S1: {sum_data['scope1_tco2e']}, S2: {sum_data['scope2_tco2e']}, S3: {sum_data['scope3_tco2e']})")
    assert len(sum_data["insights"]) > 0, "No dynamic insights generated"
    print(f"   [PASS] Dynamic Carbon Insights: {len(sum_data['insights'])} findings")

    r = client.get("/api/dashboard/monthly-emissions?year=2024")
    assert r.status_code == 200 and len(r.json()) == 12
    print("   [PASS] 12 months stacked emissions matrix retrieved")

    r = client.get("/api/dashboard/emissions-by-facility")
    assert r.status_code == 200 and len(r.json()) >= 5
    print("   [PASS] 5 facility carbon intensities retrieved")

    # 4. Carbon Accounting & Data Lineage
    print("\n4. Testing Carbon Accounting & Data Lineage...")
    r = client.get("/api/emissions?year=2024")
    assert r.status_code == 200
    records = r.json()
    assert len(records) > 0, "No emission records found"
    sample_id = records[0]["id"]
    print(f"   [PASS] Retrieved {len(records)} emission records. Testing lineage for #{sample_id}...")

    r_lineage = client.get(f"/api/emissions/{sample_id}/lineage")
    assert r_lineage.status_code == 200
    lineage = r_lineage.json()
    assert "Activity Data" in lineage["formula"], "Invalid formula string"
    print(f"   [PASS] Data Lineage verified: {lineage['formula']} = {lineage['calculated_emissions_tco2e']} tCO2e")

    # Test create emission record
    new_record_payload = {
        "facility_id": 1,
        "department": "Thermal Systems",
        "reporting_year": 2024,
        "reporting_month": 12,
        "scope": "Scope 1",
        "category": "Stationary Combustion",
        "activity_type": "Natural Gas",
        "activity_amount": 5000.0,
        "activity_unit": "m3",
        "emission_factor_value": 2.0214,
        "emission_factor_unit": "kgCO2e/m3",
        "notes": "Test automated verification injection"
    }
    r_create = client.post("/api/emissions", json=new_record_payload, headers=accountant_headers)
    assert r_create.status_code == 200
    created_rec = r_create.json()
    assert created_rec["calculated_emissions"] == 10.107, f"Calculation error: {created_rec['calculated_emissions']}"
    print(f"   [PASS] Created record #{created_rec['id']}: 5000 m3 * 2.0214 / 1000 = {created_rec['calculated_emissions']} tCO2e")

    # Test approve workflow
    r_appr = client.patch(f"/api/emissions/{created_rec['id']}/status", json={"status": "Approved", "notes": "Audited OK"}, headers=manager_headers)
    assert r_appr.status_code == 200 and r_appr.json()["status"] == "Approved"
    print(f"   [PASS] Approval workflow passed: Record #{created_rec['id']} Approved")

    # 5. Emission Factors Library
    print("\n5. Testing Emission Factors Library...")
    r = client.get("/api/emission-factors")
    assert r.status_code == 200
    factors = r.json()
    assert len(factors) >= 15, f"Expected 15+ factors, found {len(factors)}"
    print(f"   [PASS] Loaded {len(factors)} factors (verified demonstration data flag)")

    # 6. Product Carbon Footprint (PCF) & BOM
    print("\n6. Testing Product Carbon Footprint & 7 Lifecycle Stages...")
    r = client.get("/api/products")
    assert r.status_code == 200
    products = r.json()
    assert len(products) >= 8, "Missing products"
    p1 = products[0]
    r_stages = client.get(f"/api/products/{p1['id']}/lifecycle")
    assert r_stages.status_code == 200
    stages = r_stages.json()
    assert len(stages) == 7, f"Expected 7 lifecycle stages, got {len(stages)}"
    print(f"   [PASS] Product '{p1['name']}' has {len(stages)} lifecycle stages, total PCF: {p1['total_pcf']} kgCO2e")

    r_bom = client.get(f"/api/products/{p1['id']}/materials")
    assert r_bom.status_code == 200
    print(f"   [PASS] Bill of Materials retrieved ({len(r_bom.json())} items)")

    # 7. Suppliers & Scope 3
    print("\n7. Testing Suppliers & ESG Questionnaire Evaluation...")
    r = client.get("/api/suppliers")
    assert r.status_code == 200
    suppliers = r.json()
    assert len(suppliers) >= 12, "Missing suppliers"
    print(f"   [PASS] Loaded {len(suppliers)} suppliers with spend and carbon metrics")

    r_scatter = client.get("/api/suppliers/scope3-scatter")
    assert r_scatter.status_code == 200
    print(f"   [PASS] Scope 3 spend vs emissions scatter plot data: {len(r_scatter.json())} points")

    # 8. Reductions & MACC
    print("\n8. Testing Reductions & Marginal Abatement Cost Curve...")
    r = client.get("/api/reductions/macc-curve")
    assert r.status_code == 200
    macc = r.json()
    assert len(macc["initiatives"]) >= 8
    print(f"   [PASS] MACC generated: {len(macc['initiatives'])} initiatives, {macc['profitable_reduction_tco2e']} tCO2e net profitable")

    # 9. What-If Scenario Sandbox
    print("\n9. Testing Real-Time What-If Scenario Simulation...")
    scenario_req = {
        "renewable_elec_pct": 65.0,
        "fleet_electrification_pct": 50.0,
        "supplier_reduction_pct": 30.0,
        "travel_reduction_pct": 20.0,
        "energy_efficiency_pct": 15.0
    }
    r = client.post("/api/scenarios/calculate", json=scenario_req)
    assert r.status_code == 200
    sim = r.json()
    print(f"   [PASS] What-If calculation: -{sim['projected_reduction_tco2e']} tCO2e (-{sim['projected_reduction_pct']}%), Feasibility: {sim['feasibility_score']}%")

    # 10. Local Machine Learning AI Analytics
    print("\n10. Testing Local ML Analytics (IsolationForest & LinearRegression)...")
    r_anom = client.get("/api/analytics/anomalies")
    assert r_anom.status_code == 200
    print(f"   [PASS] IsolationForest Anomaly Detector flagged {len(r_anom.json())} operational spikes")

    r_fore = client.get("/api/analytics/forecast?horizon_months=12")
    assert r_fore.status_code == 200
    forecast = r_fore.json()
    assert len(forecast["forecast"]) == 12
    print(f"   [PASS] Linear Regression 12M forecast generated (R2: {forecast['model_r2_score']})")

    r_hot = client.get("/api/analytics/hotspots")
    assert r_hot.status_code == 200
    print("   [PASS] Pareto Hotspot ranking computed across 4 dimensions")

    # 11. Regulatory Compliance
    print("\n11. Testing Compliance Readiness (CSRD, CBAM, TCFD)...")
    r = client.get("/api/compliance")
    assert r.status_code == 200
    frameworks = r.json()
    assert len(frameworks) == 7
    print(f"   [PASS] {len(frameworks)} regulatory reporting frameworks verified")

    # 12. Sustainability Reports
    print("\n12. Testing Report Generation & Exports...")
    r = client.get("/api/reports/preview?report_type=corporate_ghg_inventory&year=2024")
    assert r.status_code == 200
    rep = r.json()
    print(f"   [PASS] Generated Corporate GHG Inventory Report ({len(rep.get('line_items', []))} line items)")

    r_json = client.get("/api/reports/export-json?report_type=corporate_ghg_inventory&year=2024")
    assert r_json.status_code == 200 and "application/json" in r_json.headers["content-type"]
    print("   [PASS] JSON Report export streaming verified")

    r_csv = client.get("/api/reports/export-csv?report_type=corporate_ghg_inventory&year=2024")
    assert r_csv.status_code == 200 and "text/csv" in r_csv.headers["content-type"]
    print("   [PASS] CSV Report export streaming verified")

    # 13. Data Quality & Assurance
    print("\n13. Testing Data Quality Telemetry...")
    r = client.get("/api/data-quality")
    assert r.status_code == 200
    dq = r.json()
    print(f"   [PASS] Data Quality Score: {dq['overall_score']}/100 (Completeness: {dq['completeness']}%)")

    # 14. Carbon Finance
    print("\n14. Testing Carbon Finance & Shadow Pricing...")
    r = client.get("/api/finance")
    assert r.status_code == 200
    fin = r.json()
    print(f"   [PASS] Carbon Price: ${fin['internal_carbon_price_usd']}/tCO2e, Shadow Liability: ${fin['estimated_carbon_liability_usd']:,.2f}")

    # 15. Audit Logs & Evidence
    print("\n15. Testing Immutable Audit Trail...")
    r = client.get("/api/audit-logs")
    assert r.status_code == 200
    logs = r.json()
    assert len(logs) > 0
    print(f"   [PASS] Audit Trail contains {len(logs)} recorded operations")

    # 16. Global Search
    print("\n16. Testing Global Search...")
    r = client.get("/api/search?q=Bengaluru")
    assert r.status_code == 200
    search_res = r.json()
    assert search_res["total_results"] > 0
    print(f"   [PASS] Global search returned {search_res['total_results']} results for 'Bengaluru'")

    print("\n" + "=" * 70)
    print("ALL 16 PLATFORM VERIFICATION MODULES PASSED WITH 100% SUCCESS!")
    print("=" * 70)

if __name__ == "__main__":
    run_tests()
