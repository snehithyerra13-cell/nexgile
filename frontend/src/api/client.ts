import axios from 'axios';
import {
  User,
  DashboardSummary,
  MonthlyEmission,
  FacilityEmission,
  CategoryEmission,
  TrajectoryPoint,
  EmissionRecord,
  EmissionFactor,
  DataLineage,
  Product,
  ProductMaterial,
  ProductLifecycleStage,
  Supplier,
  SupplierQuestionnaire,
  ReductionInitiative,
  MACCData,
  CarbonTarget,
  ScenarioCalculateRequest,
  ScenarioCalculateResponse,
  AnomalyItem,
  ForecastResponse,
  HotspotsResponse,
  CarbonInsight,
  ComplianceFramework,
  ComplianceRequirement,
  CarbonFinance,
  DataQualityMetric,
  DataQualityIssue,
  AuditLog,
  Evidence,
  Notification,
  SearchResponse
} from '../types';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    ? ''
    : 'http://localhost:8000');

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to inject JWT bearer token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('decarbx_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for session expiration handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't auto-redirect if checking auth on login page
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('decarbx_token');
        localStorage.removeItem('decarbx_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Grouped API services
export const api = {
  auth: {
    login: (credentials: { email: string; password: string }) =>
      apiClient.post<{ access_token: string; token_type: string; user: User }>('/api/auth/login', credentials),
    getMe: () => apiClient.get<User>('/api/auth/me'),
    getDemoUsers: () => apiClient.get<any[]>('/api/auth/demo-users'),
  },

  dashboard: {
    getSummary: (year?: number, facilityId?: number) =>
      apiClient.get<DashboardSummary>('/api/dashboard/summary', { params: { year, facility_id: facilityId } }),
    getMonthlyEmissions: (year?: number, facilityId?: number) =>
      apiClient.get<MonthlyEmission[]>('/api/dashboard/monthly-emissions', { params: { year, facility_id: facilityId } }),
    getEmissionsByFacility: (year?: number) =>
      apiClient.get<FacilityEmission[]>('/api/dashboard/emissions-by-facility', { params: { year } }),
    getEmissionsByCategory: (year?: number, scope?: string) =>
      apiClient.get<CategoryEmission[]>('/api/dashboard/emissions-by-category', { params: { year, scope } }),
    getTrajectory: () =>
      apiClient.get<TrajectoryPoint[]>('/api/dashboard/trajectory'),
    getTopSuppliers: () =>
      apiClient.get<any[]>('/api/dashboard/top-suppliers'),
  },

  emissions: {
    getAll: (params?: { year?: number; month?: number; facility_id?: number; scope?: string; category?: string; status?: string }) =>
      apiClient.get<EmissionRecord[]>('/api/emissions', { params }),
    getById: (id: number) =>
      apiClient.get<EmissionRecord>(`/api/emissions/${id}`),
    getLineage: (id: number) =>
      apiClient.get<DataLineage>(`/api/emissions/${id}/lineage`),
    create: (data: Partial<EmissionRecord>) =>
      apiClient.post<EmissionRecord>('/api/emissions', data),
    update: (id: number, data: Partial<EmissionRecord>) =>
      apiClient.put<EmissionRecord>(`/api/emissions/${id}`, data),
    updateStatus: (id: number, status: string, notes?: string) =>
      apiClient.patch<EmissionRecord>(`/api/emissions/${id}/status`, { status, notes }),
    delete: (id: number) =>
      apiClient.delete(`/api/emissions/${id}`),
  },

  factors: {
    getAll: (params?: { search?: string; scope?: string; category?: string; geography?: string }) =>
      apiClient.get<EmissionFactor[]>('/api/emission-factors', { params }),
    create: (data: Partial<EmissionFactor>) =>
      apiClient.post<EmissionFactor>('/api/emission-factors', data),
  },

  facilities: {
    getAll: () => apiClient.get<any[]>('/api/facilities'),
    create: (data: any) => apiClient.post('/api/facilities', data),
  },

  products: {
    getAll: () => apiClient.get<Product[]>('/api/products'),
    getById: (id: number) => apiClient.get<Product>(`/api/products/${id}`),
    getLifecycle: (id: number) => apiClient.get<ProductLifecycleStage[]>(`/api/products/${id}/lifecycle`),
    getMaterials: (id: number) => apiClient.get<ProductMaterial[]>(`/api/products/${id}/materials`),
    addMaterial: (id: number, data: Partial<ProductMaterial>) =>
      apiClient.post<ProductMaterial>(`/api/products/${id}/materials`, data),
    create: (data: Partial<Product>) => apiClient.post<Product>('/api/products', data),
  },

  suppliers: {
    getAll: (params?: { category?: string; status?: string }) =>
      apiClient.get<Supplier[]>('/api/suppliers', { params }),
    getById: (id: number) => apiClient.get<Supplier>(`/api/suppliers/${id}`),
    getScope3Scatter: () => apiClient.get<any[]>('/api/suppliers/scope3-scatter'),
    submitQuestionnaire: (data: any) =>
      apiClient.post<SupplierQuestionnaire>('/api/suppliers/submit-questionnaire', data),
    submitEmissions: (data: any) =>
      apiClient.post('/api/suppliers/submit-emissions', data),
    create: (data: Partial<Supplier>) =>
      apiClient.post<Supplier>('/api/suppliers', data),
  },

  reductions: {
    getAll: (params?: { status?: string; priority?: string }) =>
      apiClient.get<ReductionInitiative[]>('/api/reductions', { params }),
    getMaccCurve: () => apiClient.get<MACCData>('/api/reductions/macc-curve'),
    getTargets: () => apiClient.get<CarbonTarget[]>('/api/reductions/targets'),
    create: (data: Partial<ReductionInitiative>) =>
      apiClient.post<ReductionInitiative>('/api/reductions', data),
    update: (id: number, data: Partial<ReductionInitiative>) =>
      apiClient.put<ReductionInitiative>(`/api/reductions/${id}`, data),
    delete: (id: number) => apiClient.delete(`/api/reductions/${id}`),
  },

  scenarios: {
    calculate: (data: ScenarioCalculateRequest) =>
      apiClient.post<ScenarioCalculateResponse>('/api/scenarios/calculate', data),
  },

  analytics: {
    getAnomalies: () => apiClient.get<AnomalyItem[]>('/api/analytics/anomalies'),
    getForecast: (horizonMonths: number = 12) =>
      apiClient.get<ForecastResponse>('/api/analytics/forecast', { params: { horizon_months: horizonMonths } }),
    getHotspots: () => apiClient.get<HotspotsResponse>('/api/analytics/hotspots'),
    getInsights: () => apiClient.get<CarbonInsight[]>('/api/analytics/insights'),
  },

  compliance: {
    getFrameworks: () => apiClient.get<ComplianceFramework[]>('/api/compliance'),
    getRequirements: (params?: { framework_id?: number; status?: string }) =>
      apiClient.get<ComplianceRequirement[]>('/api/compliance/requirements', { params }),
    updateRequirement: (id: number, data: Partial<ComplianceRequirement>) =>
      apiClient.patch<ComplianceRequirement>(`/api/compliance/requirements/${id}`, data),
  },

  reports: {
    preview: (reportType: string, year: number) =>
      apiClient.get<any>('/api/reports/preview', { params: { report_type: reportType, year } }),
    exportJsonUrl: (reportType: string, year: number) =>
      `${API_BASE_URL}/api/reports/export-json?report_type=${reportType}&year=${year}`,
    exportCsvUrl: (reportType: string, year: number) =>
      `${API_BASE_URL}/api/reports/export-csv?report_type=${reportType}&year=${year}`,
  },

  dataManagement: {
    downloadSampleCsvUrl: () => `${API_BASE_URL}/api/data-management/sample-csv`,
    validateCsv: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return apiClient.post<any>('/api/data-management/validate-csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    commitImport: (records: any[]) =>
      apiClient.post<{ status: string; imported_count: number; message: string }>('/api/data-management/commit-import', { records }),
  },

  dataQuality: {
    getMetrics: () => apiClient.get<DataQualityMetric>('/api/data-quality'),
    getIssues: () => apiClient.get<DataQualityIssue[]>('/api/data-quality/issues'),
    resolveIssue: (id: number) => apiClient.patch<DataQualityIssue>(`/api/data-quality/issues/${id}/resolve`),
  },

  finance: {
    getData: () => apiClient.get<CarbonFinance>('/api/finance'),
  },

  audit: {
    getLogs: (params?: { user_email?: string; action?: string; resource?: string; limit?: number }) =>
      apiClient.get<AuditLog[]>('/api/audit-logs', { params }),
  },

  evidence: {
    getAll: (params?: { verification_status?: string; file_type?: string }) =>
      apiClient.get<Evidence[]>('/api/evidence', { params }),
    create: (data: Partial<Evidence>) => apiClient.post<Evidence>('/api/evidence', data),
    verify: (id: number, status: string) =>
      apiClient.patch<Evidence>(`/api/evidence/${id}/verify`, null, { params: { status } }),
  },

  notifications: {
    getAll: () => apiClient.get<Notification[]>('/api/notifications'),
    markRead: (id: number) => apiClient.patch<Notification>(`/api/notifications/${id}/read`),
    markAllRead: () => apiClient.post('/api/notifications/mark-all-read'),
  },

  search: {
    query: (q: string) => apiClient.get<SearchResponse>('/api/search', { params: { q } }),
  },
};
