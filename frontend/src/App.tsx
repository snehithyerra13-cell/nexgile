import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AppLayout } from './components/layout/AppLayout';

// Pages
import { Login } from './pages/auth/Login';
import { Dashboard } from './pages/dashboard/Dashboard';
import { Emissions } from './pages/emissions/Emissions';
import { Factors } from './pages/factors/Factors';
import { Facilities } from './pages/facilities/Facilities';
import { Products } from './pages/products/Products';
import { Suppliers } from './pages/suppliers/Suppliers';
import { Reductions } from './pages/reductions/Reductions';
import { Scenarios } from './pages/scenarios/Scenarios';
import { Analytics } from './pages/analytics/Analytics';
import { Compliance } from './pages/compliance/Compliance';
import { Reports } from './pages/reports/Reports';
import { DataManagement } from './pages/data-mgmt/DataManagement';
import { DataQuality } from './pages/data-quality/DataQuality';
import { CarbonFinance } from './pages/finance/CarbonFinance';
import { AuditTrail } from './pages/audit/AuditTrail';
import { EvidencePage } from './pages/evidence/Evidence';
import { SupplierPortal } from './pages/supplier-portal/SupplierPortal';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen w-screen flex items-center justify-center bg-slate-900 text-emerald-400 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold tracking-wider uppercase text-slate-400">Loading DecarbX Environment...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  React.useEffect(() => {
    if (window.location.pathname !== '/' && window.location.pathname !== '') {
      window.history.replaceState(null, '', '/' + (window.location.hash || '#/login'));
    }
  }, []);

  return (
    <ToastProvider>
      <AuthProvider>
        <HashRouter>
          <Routes>
            {/* Public Login Route */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />

            {/* Protected Enterprise Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="emissions" element={<Emissions />} />
              <Route path="factors" element={<Factors />} />
              <Route path="facilities" element={<Facilities />} />
              <Route path="products" element={<Products />} />
              <Route path="suppliers" element={<Suppliers />} />
              <Route path="reductions" element={<Reductions />} />
              <Route path="scenarios" element={<Scenarios />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="compliance" element={<Compliance />} />
              <Route path="reports" element={<Reports />} />
              <Route path="data-management" element={<DataManagement />} />
              <Route path="data-quality" element={<DataQuality />} />
              <Route path="finance" element={<CarbonFinance />} />
              <Route path="audit" element={<AuditTrail />} />
              <Route path="evidence" element={<EvidencePage />} />
              <Route path="supplier-portal" element={<SupplierPortal />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Routes>
        </HashRouter>
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;
