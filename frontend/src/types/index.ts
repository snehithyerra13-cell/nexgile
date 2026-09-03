export type UserRole =
  | 'Admin'
  | 'Sustainability Manager'
  | 'Carbon Accountant'
  | 'Procurement Manager'
  | 'Supplier'
  | 'Auditor'
  | 'Executive';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  title?: string;
  organization_id?: number;
  supplier_id?: number;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface CarbonInsight {
  id: string;
  badge: 'HIGH PRIORITY' | 'OPPORTUNITY' | 'ANOMALY' | 'TARGET RISK' | 'EFFICIENCY' | string;
  title: string;
  category: string;
  estimated_impact_tco2e: number;
  statement: string;
  recommendation: string;
  action_url: string;
}

export interface DashboardSummary {
  total_emissions_tco2e: number;
  scope1_tco2e: number;
  scope2_tco2e: number;
  scope3_tco2e: number;
  carbon_intensity: number;
  reduction_vs_baseline_pct: number;
  active_suppliers: number;
  data_quality_score: number;
  baseline_emissions_tco2e: number;
  target_2030_tco2e: number;
  target_gap_tco2e: number;
  internal_carbon_liability_usd: number;
  insights: CarbonInsight[];
}

export interface MonthlyEmission {
  month: number;
  month_name: string;
  'Scope 1': number;
  'Scope 2': number;
  'Scope 3': number;
  Total: number;
}

export interface FacilityEmission {
  facility_id: number;
  facility_name: string;
  code: string;
  city: string;
  total_emissions_tco2e: number;
  floor_area_sqm: number;
  employee_count: number;
  intensity_kg_co2e_sqm: number;
}

export interface CategoryEmission {
  category: string;
  scope: string;
  emissions_tco2e: number;
  percentage: number;
}

export interface TrajectoryPoint {
  year: number;
  target_trajectory_tco2e: number;
  actual_emissions_tco2e: number | null;
  baseline_reference_tco2e: number;
}

export interface Facility {
  id: number;
  organization_id: number;
  name: string;
  code: string;
  country: string;
  city: string;
  facility_type: string;
  floor_area_sqm: number;
  employee_count: number;
  grid_region: string;
  is_active: boolean;
  total_emissions_tco2e?: number;
  carbon_intensity_sqm?: number;
}

export interface EmissionRecord {
  id: number;
  organization_id: number;
  facility_id: number;
  facility_name?: string;
  department: string;
  reporting_year: number;
  reporting_month: number;
  scope: 'Scope 1' | 'Scope 2' | 'Scope 3' | string;
  category: string;
  activity_type: string;
  activity_amount: number;
  activity_unit: string;
  emission_factor_id?: number;
  emission_factor_value: number;
  emission_factor_unit: string;
  emission_factor_source: string;
  emission_factor_version: string;
  calculated_emissions: number;
  uncertainty_percentage: number;
  data_quality_score: number;
  status: 'Draft' | 'Submitted' | 'Approved' | 'Rejected' | string;
  notes?: string;
  created_by?: string;
  created_at?: string;
}

export interface EmissionFactor {
  id: number;
  factor_name: string;
  activity_type: string;
  category: string;
  scope: string;
  geography: string;
  unit: string;
  factor_value: number;
  source: string;
  year: number;
  version: string;
  valid_from: string;
  valid_until: string;
  is_demo: boolean;
  notes?: string;
}

export interface DataLineage {
  record_id: number;
  activity_data: string;
  activity_amount: number;
  activity_unit: string;
  emission_factor_value: number;
  emission_factor_unit: string;
  emission_factor_name: string;
  emission_factor_source: string;
  emission_factor_version: string;
  formula: string;
  calculated_emissions_tco2e: number;
  uncertainty_percentage: number;
  data_quality_score: number;
  recorded_by: string;
  created_at: string;
  verified_by_status: string;
}

export interface ProductLifecycleStage {
  id: number;
  product_id: number;
  stage_name: string;
  emissions_kg_co2e: number;
  percentage: number;
  details?: string;
}

export interface ProductMaterial {
  id: number;
  product_id: number;
  material_name: string;
  quantity: number;
  unit: string;
  supplier_name: string;
  supplier_id?: number;
  emission_factor: number;
  calculated_emissions: number;
  recycled_percentage: number;
}

export interface Product {
  id: number;
  organization_id: number;
  sku: string;
  name: string;
  category: string;
  description?: string;
  weight_kg: number;
  unit: string;
  annual_production: number;
  total_pcf: number;
  target_pcf: number;
  created_at?: string;
  lifecycle_stages?: ProductLifecycleStage[];
  materials?: ProductMaterial[];
}

export interface SupplierQuestionnaire {
  id: number;
  supplier_id: number;
  reporting_year: number;
  ghg_inventory_available: boolean;
  scope1_emissions: number;
  scope2_emissions: number;
  scope3_emissions: number;
  renewable_energy_pct: number;
  emissions_reduction_target: string;
  sbti_status: string;
  pcf_available: boolean;
  verification_status: string;
  environmental_certifications: string;
  sustainability_score: number;
  status: string;
  submitted_at?: string;
}

export interface Supplier {
  id: number;
  organization_id: number;
  name: string;
  code: string;
  country: string;
  category: string;
  annual_spend_usd: number;
  annual_emissions_tco2e: number;
  carbon_intensity: number;
  data_quality_score: number;
  risk_score: number;
  engagement_status: 'Invited' | 'Pending' | 'Submitted' | 'Verified' | 'Needs Improvement' | string;
  sbti_committed: boolean;
  target_status: string;
  contact_email?: string;
  latest_submission_date?: string;
  questionnaires?: SupplierQuestionnaire[];
}

export interface ReductionInitiative {
  id: number;
  organization_id: number;
  facility_id?: number;
  name: string;
  description?: string;
  category: string;
  responsible_owner: string;
  start_date: string;
  end_date: string;
  baseline_emissions_tco2e: number;
  estimated_annual_reduction_tco2e: number;
  implementation_cost_usd: number;
  annual_savings_usd: number;
  priority: 'High' | 'Medium' | 'Low' | string;
  status: 'Proposed' | 'Approved' | 'In Progress' | 'Completed' | string;
  progress_pct: number;
  confidence_pct: number;
  roi_pct: number;
  marginal_abatement_cost: number;
}

export interface MACCInitiative {
  id: number;
  name: string;
  category: string;
  mac_usd_per_tco2e: number;
  annual_reduction_tco2e: number;
  start_x: number;
  end_x: number;
  implementation_cost_usd: number;
  annual_savings_usd: number;
  roi_pct: number;
  status: string;
  priority: string;
}

export interface CarbonTarget {
  id: number;
  organization_id: number;
  name: string;
  baseline_year: number;
  baseline_emissions_tco2e: number;
  target_year: number;
  target_reduction_pct: number;
  current_emissions_tco2e: number;
  required_annual_reduction_pct: number;
  scope_coverage: string;
  status: string;
}

export interface MACCData {
  initiatives: MACCInitiative[];
  total_potential_reduction_tco2e: number;
  profitable_reduction_tco2e: number;
}

export interface ScenarioCalculateRequest {
  renewable_elec_pct: number;
  fleet_electrification_pct: number;
  supplier_reduction_pct: number;
  travel_reduction_pct: number;
  energy_efficiency_pct: number;
}

export interface ScenarioCalculateResponse {
  baseline_emissions_tco2e: number;
  current_emissions_tco2e: number;
  target_2030_emissions_tco2e: number;
  projected_emissions_tco2e: number;
  projected_reduction_tco2e: number;
  projected_reduction_pct: number;
  gap_to_2030_target_tco2e: number;
  scope1_projected_tco2e: number;
  scope2_projected_tco2e: number;
  scope3_projected_tco2e: number;
  scope1_savings_tco2e: number;
  scope2_savings_tco2e: number;
  scope3_savings_tco2e: number;
  projected_cost_savings_usd: number;
  feasibility_score: number;
}

export interface AnomalyItem {
  id: string;
  facility: string;
  month: string;
  category: string;
  actual_value: number;
  expected_value: number;
  unit: string;
  deviation_pct: number;
  severity: 'High' | 'Medium' | 'Low';
  probable_cause: string;
  recommendation: string;
}

export interface ForecastPoint {
  date: string;
  month_name: string;
  predicted_tco2e: number;
  lower_bound: number;
  upper_bound: number;
  scope1_pred: number;
  scope2_pred: number;
  scope3_pred: number;
}

export interface ForecastResponse {
  historical: { date: string; month_name: string; emissions_tco2e: number; is_forecast: boolean }[];
  forecast: ForecastPoint[];
  model_r2_score: number;
  trend_direction: string;
  annual_run_rate_tco2e: number;
}

export interface HotspotItem {
  name: string;
  type: string;
  emissions_tco2e: number;
  share_pct: number;
  cumulative_pct: number;
  risk_level: string;
}

export interface HotspotsResponse {
  facilities: HotspotItem[];
  categories: HotspotItem[];
  suppliers: HotspotItem[];
  materials: HotspotItem[];
}

export interface ComplianceRequirement {
  id: number;
  framework_id: number;
  disclosure_code: string;
  disclosure_name: string;
  category: string;
  owner: string;
  status: 'Not Started' | 'In Progress' | 'Ready for Review' | 'Completed' | string;
  evidence_available: boolean;
  completion_pct: number;
  notes?: string;
}

export interface ComplianceFramework {
  id: number;
  code: string;
  name: string;
  description?: string;
  completion_pct: number;
  due_date: string;
  status: string;
  owner: string;
  total_requirements: number;
  completed_requirements: number;
  requirements?: ComplianceRequirement[];
}

export interface CarbonFinance {
  id: number;
  organization_id: number;
  internal_carbon_price_usd: number;
  annual_carbon_budget_usd: number;
  allocated_reduction_budget_usd: number;
  realized_cost_savings_usd: number;
  estimated_carbon_liability_usd: number;
  budget_utilization_pct: number;
  currency: string;
}

export interface DataQualityMetric {
  id: number;
  completeness: number;
  validity: number;
  consistency: number;
  timeliness: number;
  verified_records_pct: number;
  estimated_records_pct: number;
  overall_score: number;
}

export interface DataQualityIssue {
  id: number;
  issue_type: string;
  severity: 'High' | 'Medium' | 'Low' | string;
  description: string;
  entity_type: string;
  entity_id?: string;
  status: 'Open' | 'In Review' | 'Resolved' | string;
  created_at?: string;
}

export interface AuditLog {
  id: number;
  user_email: string;
  action: string;
  resource: string;
  resource_id?: string;
  old_value?: string;
  new_value?: string;
  ip_address: string;
  timestamp: string;
}

export interface Evidence {
  id: number;
  file_name: string;
  file_type: string;
  related_record_type: string;
  related_record_id?: string;
  uploaded_by: string;
  upload_date: string;
  verification_status: 'Verified' | 'Pending' | 'Flagged' | string;
  file_size_kb: number;
  notes?: string;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  category: string;
  severity: 'info' | 'warning' | 'danger' | 'success' | string;
  is_read: boolean;
  link: string;
  created_at: string;
}

export interface SearchResultItem {
  type: string;
  id: number;
  title: string;
  subtitle: string;
  link: string;
  icon: string;
}

export interface SearchResponse {
  query: string;
  total_results: number;
  results: SearchResultItem[];
}
