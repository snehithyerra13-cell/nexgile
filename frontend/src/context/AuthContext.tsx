import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../api/client';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  selectedFacility: number | null;
  setSelectedFacility: (id: number | null) => void;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  switchUserRole: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('decarbx_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedYear, setSelectedYear] = useState<number>(2024);
  const [selectedFacility, setSelectedFacility] = useState<number | null>(null);

  const { showToast } = useToast();

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('decarbx_token');
      const savedUser = localStorage.getItem('decarbx_user');

      if (savedToken && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          setToken(savedToken);
          // Verify with backend silently
          const meRes = await api.auth.getMe();
          setUser(meRes.data);
          localStorage.setItem('decarbx_user', JSON.stringify(meRes.data));
        } catch {
          // Token invalid
          localStorage.removeItem('decarbx_token');
          localStorage.removeItem('decarbx_user');
          setUser(null);
          setToken(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, pass: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const res = await api.auth.login({ email, password: pass });
      const { access_token, user: userData } = res.data;

      localStorage.setItem('decarbx_token', access_token);
      localStorage.setItem('decarbx_user', JSON.stringify(userData));

      setToken(access_token);
      setUser(userData);
      showToast('success', 'Authentication Successful', `Welcome back, ${userData.full_name}`);
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Invalid email or password';
      showToast('error', 'Login Failed', msg);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('decarbx_token');
    localStorage.removeItem('decarbx_user');
    setUser(null);
    setToken(null);
    showToast('info', 'Logged Out', 'Session terminated successfully');
  };

  const switchUserRole = async (targetRole: UserRole) => {
    const roleEmailMap: Record<UserRole, { email: string; pass: string }> = {
      'Admin': { email: 'admin@decarbx.com', pass: 'admin123' },
      'Sustainability Manager': { email: 'manager@decarbx.com', pass: 'manager123' },
      'Carbon Accountant': { email: 'accountant@decarbx.com', pass: 'accountant123' },
      'Procurement Manager': { email: 'procurement@decarbx.com', pass: 'procurement123' },
      'Supplier': { email: 'supplier@decarbx.com', pass: 'supplier123' },
      'Auditor': { email: 'auditor@decarbx.com', pass: 'auditor123' },
      'Executive': { email: 'executive@decarbx.com', pass: 'executive123' },
    };

    const creds = roleEmailMap[targetRole];
    if (creds) {
      await login(creds.email, creds.pass);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        selectedYear,
        setSelectedYear,
        selectedFacility,
        setSelectedFacility,
        login,
        logout,
        switchUserRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
