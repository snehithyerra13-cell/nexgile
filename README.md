# Nexgile-DecarbX Environmental Intelligence Platform

[![Platform Version](https://img.shields.io/badge/platform-v1.0.0-emerald.svg)](https://github.com/nexgile/decarbx)
[![FastAPI](https://img.shields.io/badge/backend-FastAPI%20%7C%20Python%203.13-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/frontend-React%20%7C%20Vite%20%7C%20TypeScript-61DAFB.svg)](https://react.dev)
[![Local AI](https://img.shields.io/badge/AI%2FML-scikit--learn%20(Local%20Only)-orange.svg)](https://scikit-learn.org)
[![Assurance](https://img.shields.io/badge/standard-ISO%2014064%20%7C%20ISO%2014067%20%7C%20CSRD-blue.svg)](https://ghgprotocol.org)

An enterprise-grade, audit-ready Environmental Intelligence, Product Carbon Footprinting (PCF), and Decarbonization Decision Support web application built from scratch for global enterprises.

---

## 🌟 Key Capabilities & Modules

1. **Executive Environmental Dashboard**
   - Live corporate greenhouse gas inventory (Scopes 1, 2, and 3).
   - Monthly stacked emissions trend charts, emissions by facility, emissions by activity domain, and 2030 SBTi reduction trajectory.
   - **DecarbX Intelligence**: Dynamic narrative insights computed on-the-fly from live operational data.

2. **Audit-Grade Carbon Accounting Ledger**
   - Multi-scope activity data logging with automated metric unit conversions.
   - Transparent **Data Lineage Visualizer** detailing the exact formula (`Activity Data × Emission Factor ÷ 1,000 = Emissions tCO2e`), uncertainty margin (±%), data quality score, and timestamp.
   - Review and Approval workflow states: `Draft` → `Submitted` → `Approved` / `Rejected`.

3. **Emission Factor Reference Library**
   - Curated database of 18+ conversion coefficients referenced from CEA India, UK DEFRA, US EPA, and IPCC AR5.
   - Built-in demonstration data disclaimers.

4. **Product Carbon Footprint (PCF) & 7-Stage LCA**
   - Cradle-to-grave Life Cycle Assessment (LCA) compliant with ISO 14067.
   - 7 distinct stages: Raw Materials, Manufacturing, Packaging, Transportation, Distribution, Product Use, End of Life.
   - High-resolution Bill of Materials (BOM) carbon contribution and circular recycled scrap content tracking.

5. **Supplier Decarbonization & Scope 3 Intelligence**
   - Tier-1 vendor directory with annual spend, carbon footprint, risk scoring, and engagement statuses.
   - Interactive Spend vs. Emissions bubble/scatter chart identifying high-spend, high-carbon priority targets.
   - Automated ESG Decarbonization Questionnaire with deterministic scoring algorithm (0–100).
   - Dedicated **Supplier Portal** for vendor direct GHG reporting.

6. **Decarbonization Roadmap & Reduction Planner**
   - Marginal Abatement Cost Curve (MACC) visualization sorting profitable initiatives (`-$N/tCO2e`) on the left and capital projects on the right.
   - Automated capital investment ROI (%) and Abatement Cost calculation.

7. **What-If Decarbonization Sandbox**
   - Dynamic real-time simulation engine responding to 5 interactive levers:
     - Renewable electricity transition % (VPPA / Rooftop Solar)
     - Fleet electrification %
     - Scope 3 supplier carbon reduction %
     - Business flight curtailment %
     - Facility energy efficiency & smart BMS %
   - Real-time recalculation of projected emissions, avoided OPEX savings, target gap, and feasibility scores.

8. **Local AI & Machine Learning Analytics (Zero External APIs)**
   - **Anomaly Detection**: `scikit-learn` `IsolationForest` and Z-score statistics detecting abnormal spikes, diagnosing probable causes, and recommending remediation actions.
   - **Predictive Forecasting**: Linear regression and seasonal trend decomposition projecting 12 months forward with 95% confidence intervals.
   - **Pareto Hotspot Detection**: Multi-dimensional 80/20 ranking across facilities, categories, suppliers, and BOM materials.

9. **Regulatory ESG Compliance Readiness**
   - Pre-configured tracking for European CSRD / ESRS E1, EU Carbon Border Adjustment Mechanism (CBAM), TCFD, SEC Climate Disclosures, CDP, and EU Taxonomy.
   - Requirement-by-requirement disclosure checklist with evidence attachment tracking.

10. **Enterprise Reports Generator**
    - Instant generation of Corporate GHG Inventories, Scope-specific ledgers, PCF audits, and reduction progress reports.
    - One-click export to CSV spreadsheet and structured JSON.
    - Print-ready executive document view.

11. **Bulk Ingestion & CSV Importer**
    - Drag-and-drop CSV activity data uploader.
    - Schema validation engine displaying row-by-row previews of valid records (green) and rejected rows with diagnostics (red).
    - Downloadable standardized CSV template.

12. **Data Assurance & Carbon Finance**
    - Data Quality Index (completeness, validity, consistency, timeliness, verification).
    - Internal Carbon Pricing (ICP) shadow fee ($75/tCO2e) tracking corporate carbon liability against annual carbon budgets.

13. **Role-Based Access Control & Tamper-Evident Audit Trail**
    - 7 distinct enterprise personas with quick demo login buttons.
    - Immutable activity log tracking all creations, updates, deletions, approvals, and logins with user and IP origins.

---

## 👥 Seeded Demo Personas & Credentials

All 7 personas are pre-seeded in the database and accessible on the login screen:

| Role | Email | Password | Primary Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@decarbx.com` | `admin123` | Full administrative control, configurations, overrides |
| **Sustainability Manager** | `manager@decarbx.com` | `manager123` | Record reviews, approval workflows, reduction initiatives |
| **Carbon Accountant** | `accountant@decarbx.com` | `accountant123` | Activity ledgers, CSV bulk ingestion, custom factor creation |
| **Procurement Manager** | `procurement@decarbx.com` | `procurement123` | Supplier scorecards, Scope 3 audits, vendor onboarding |
| **Supplier** | `supplier@decarbx.com` | `supplier123` | Supplier Portal, Scope 1/2/3 submissions, ESG questionnaire |
| **Auditor** | `auditor@decarbx.com` | `auditor123` | Verification assurance, evidence vault, audit trail inspection |
| **Executive** | `executive@decarbx.com` | `executive123` | Strategic dashboards, carbon finance liability, MACC roadmap |

---

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.10+ (Python 3.13 tested and verified)
- Node.js 18+ and npm 9+ (Node v22 tested and verified)

### 1. Backend Setup & Startup
Open a terminal in the project root:

```bash
cd backend

# 1. Install dependencies (if not already installed)
pip install -r requirements.txt

# 2. Seed the database with demonstration data (creates SQLite decarbx.db)
python seed.py

# 3. (Optional) Run full automated test suite (verifies 16 modules)
python test_platform.py

# 4. Launch the FastAPI server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
The backend API will be live at:
- **API Base URL**: `http://localhost:8000`
- **Interactive Swagger Docs**: `http://localhost:8000/docs`
- **ReDoc Documentation**: `http://localhost:8000/redoc`

---

### 2. Frontend Setup & Startup
Open a second terminal in the project root:

```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Start the Vite development server
npm run dev
```
The frontend web application will be accessible at:
- **Web App**: `http://localhost:5173`

---

## 🏗️ Technical Architecture & Monorepo Structure

```
nexgile/
├── backend/
│   ├── app/
│   │   ├── main.py                     # FastAPI application entrypoint & middleware
│   │   ├── database.py                 # SQLite / PostgreSQL engine & session factory
│   │   ├── config.py                   # Environment configuration & JWT settings
│   │   ├── models/                     # SQLAlchemy 2.0 ORM models
│   │   │   ├── auth.py                 # User, Organization, UserRole enum
│   │   │   ├── facilities.py           # Facility, BusinessUnit, Department
│   │   │   ├── emissions.py            # EmissionRecord, EmissionFactor
│   │   │   ├── products.py             # Product, ProductLifecycleStage, ProductMaterial (BOM)
│   │   │   ├── suppliers.py            # Supplier, SupplierQuestionnaire, SupplierSubmission
│   │   │   ├── reductions.py           # ReductionInitiative, CarbonTarget, ScenarioModel
│   │   │   ├── compliance.py           # ComplianceFramework, ComplianceRequirement
│   │   │   ├── audit.py                # AuditLog, Evidence, Notification
│   │   │   └── finance.py              # CarbonFinance, DataQualityMetric, DataQualityIssue
│   │   ├── schemas/                    # Pydantic validation & response schemas
│   │   ├── routes/                     # REST API routers
│   │   │   ├── auth.py                 # /api/auth (login, me, demo-users)
│   │   │   ├── dashboard.py            # /api/dashboard (summary, monthly, facility, trajectory)
│   │   │   ├── emissions.py            # /api/emissions (CRUD, status approval, data lineage)
│   │   │   ├── factors.py              # /api/emission-factors (library, disclaimer)
│   │   │   ├── facilities.py           # /api/facilities (facility metrics)
│   │   │   ├── products.py             # /api/products (LCA stages, BOM materials, PCF)
│   │   │   ├── suppliers.py            # /api/suppliers (scorecards, questionnaire, scatter)
│   │   │   ├── reductions.py           # /api/reductions (initiatives, MACC curve, targets)
│   │   │   ├── scenarios.py            # /api/scenarios (what-if interactive modeling)
│   │   │   ├── analytics.py            # /api/analytics (isolation forest, forecasting, hotspots)
│   │   │   ├── compliance.py           # /api/compliance (CSRD, CBAM, TCFD disclosures)
│   │   │   ├── reports.py              # /api/reports (previews, CSV/JSON export)
│   │   │   ├── data_management.py      # /api/data-management (CSV parse, validate, commit)
│   │   │   ├── data_quality.py         # /api/data-quality (metrics, issue remediation)
│   │   │   ├── finance.py              # /api/finance (internal carbon pricing, budget)
│   │   │   ├── audit.py                # /api/audit-logs (immutable journal)
│   │   │   ├── evidence.py             # /api/evidence (document verification)
│   │   │   ├── notifications.py        # /api/notifications (alerts, mark read)
│   │   │   └── search.py               # /api/search (unified global search)
│   │   ├── analytics/                  # Local ML & statistical heuristics
│   │   │   ├── anomaly_detection.py    # IsolationForest / Z-score detector
│   │   │   ├── forecasting.py          # LinearRegression / seasonal time series forecaster
│   │   │   ├── hotspots.py             # Pareto 80/20 hotspot analyzer
│   │   │   └── insights.py             # Dynamic rule-based carbon insights
│   │   └── utils/
│   │       ├── security.py             # bcrypt password hashing & JWT token generation
│   │       ├── audit.py                # Immutable audit logging helper
│   │       └── csv_importer.py         # CSV schema validator & template generator
│   ├── seed.py                         # Comprehensive realistic database seeder
│   ├── test_platform.py                # 16-module automated integration test suite
│   ├── requirements.txt                # Python dependencies
│   ├── .env.example
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── api/                        # Typed Axios client with interceptors
│   │   ├── components/                 # Reusable UI component library
│   │   │   ├── common/                 # StatCard, Badge, Modal, Drawer, DataTable, PageHeader
│   │   │   └── layout/                 # Sidebar, TopNav, AppLayout
│   │   ├── context/                    # AuthContext, ToastContext
│   │   ├── pages/                      # 16 Feature Views (Dashboard, Emissions, LCA, etc.)
│   │   ├── types/                      # TypeScript definitions matching backend models
│   │   ├── App.tsx                     # React Router & protected routes
│   │   └── main.tsx
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── .env
├── README.md
└── .gitignore
```

---

## 🔒 Security & Local AI Architecture Principles

- **Zero External AI Cloud APIs**: All predictive capabilities (anomaly identification, forward forecasting, hotspot prioritization, and contextual recommendations) are computed on-premise using deterministic rules and local `scikit-learn` algorithms.
- **Zero Paid Subscriptions**: No OpenAI, Gemini, Claude, AWS, or GCP keys required.
- **Audit Lineage**: Every emission calculation preserves the raw physical quantity, standard factor, mathematical expression, uncertainty rating, and author timestamp for assurance verification.
- **Authentication**: Uses salted `bcrypt` password hashes and signed HMAC-SHA256 JWT bearer tokens.

---

## 📄 License
Nexgile-DecarbX is licensed under the MIT License. Developed for enterprise sustainability intelligence.
