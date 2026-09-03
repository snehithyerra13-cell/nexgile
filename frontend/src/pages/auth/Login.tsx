import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Leaf,
  ShieldCheck,
  TrendingDown,
  BarChart3,
  Cpu,
  Layers,
  ArrowRight,
  User,
  Lock,
  Loader2,
  UserPlus
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../api/client';
import { Modal } from '../../components/common/Modal';

export const Login: React.FC = () => {
  const { login, isLoading } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('admin@decarbx.com');
  const [password, setPassword] = useState('admin123');
  const [submitting, setSubmitting] = useState(false);

  // Register Modal State
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regRole, setRegRole] = useState('Sustainability Manager');
  const [regTitle, setRegTitle] = useState('ESG Specialist');
  const [registering, setRegistering] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const success = await login(email, password);
    setSubmitting(false);
    if (success) {
      navigate('/dashboard');
    }
  };

  const handleQuickLogin = async (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setSubmitting(true);
    const success = await login(demoEmail, demoPass);
    setSubmitting(false);
    if (success) {
      navigate('/dashboard');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegistering(true);
    try {
      await api.auth.register({
        email: regEmail,
        password: regPass,
        full_name: regName,
        role: regRole,
        title: regTitle,
      });
      showToast('success', 'Account Created', `Welcome ${regName}! Signing you in...`);
      setIsRegisterOpen(false);
      const success = await login(regEmail, regPass);
      if (success) {
        navigate('/dashboard');
      }
    } catch (err: any) {
      // If user is already registered in the database, attempt instant login!
      const loginSuccess = await login(regEmail, regPass);
      if (loginSuccess) {
        showToast('success', 'Signed In', `Welcome back ${regName || regEmail}!`);
        setIsRegisterOpen(false);
        navigate('/dashboard');
      } else {
        showToast('info', 'Account Already Registered', 'Your account is already active! Please sign in directly.');
        setEmail(regEmail);
        setIsRegisterOpen(false);
      }
    } finally {
      setRegistering(false);
    }
  };

  const demoRoles = [
    { role: 'Snehith Yerra', email: 'snehithyerra13@gmail.com', pass: 'mypassword123', desc: 'Your registered personal account' },
    { role: 'Admin', email: 'admin@decarbx.com', pass: 'admin123', desc: 'Full system control & config' },
    { role: 'Sustainability Manager', email: 'manager@decarbx.com', pass: 'manager123', desc: 'Emissions, reduction projects & ESG' },
    { role: 'Carbon Accountant', email: 'accountant@decarbx.com', pass: 'accountant123', desc: 'Activity ledgers, factors & calculations' },
    { role: 'Procurement Manager', email: 'procurement@decarbx.com', pass: 'procurement123', desc: 'Suppliers, Scope 3 & supply chain' },
    { role: 'Supplier', email: 'supplier@decarbx.com', pass: 'supplier123', desc: 'Vendor portal & questionnaire' },
    { role: 'Auditor', email: 'auditor@decarbx.com', pass: 'auditor123', desc: 'Assurance, evidence & audit log' },
    { role: 'Executive', email: 'executive@decarbx.com', pass: 'executive123', desc: 'C-suite KPI & finance view' },
  ];

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-slate-900 text-slate-100 font-sans">
      {/* Left branding banner */}
      <div className="lg:w-1/2 p-8 lg:p-16 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/80 border-b lg:border-b-0 lg:border-r border-slate-800">
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-glow">
              <Leaf className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
                Nexgile<span className="text-emerald-400">DecarbX</span>
              </h1>
              <p className="text-xs text-slate-400 font-medium tracking-wide">
                Environmental Intelligence & Decarbonization Platform
              </p>
            </div>
          </div>

          <div className="mt-14 max-w-lg">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
              Enterprise ESG Architecture
            </span>
            <h2 className="text-3xl lg:text-4xl font-black text-white mt-2 leading-tight">
              Audit-Ready Carbon Accounting & Scientific Abatement
            </h2>
            <p className="text-sm text-slate-300 mt-4 leading-relaxed">
              Automate multi-facility Scope 1, 2, and 3 accounting, cradle-to-grave Product Carbon Footprinting (ISO 14067),
              Marginal Abatement Cost curves, and CSRD compliance with local algorithmic machine learning.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-8 max-w-lg">
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <ShieldCheck className="w-4 h-4" />
                <span>Zero External AI API</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Local scikit-learn IsolationForest anomaly detection & linear regressions.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <div className="flex items-center gap-2 text-teal-400 font-bold text-xs">
                <TrendingDown className="w-4 h-4" />
                <span>MACC & What-If Sandbox</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Real-time capital allocation modeling, SBTi 2030 target trajectories, and C-ROI.
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-10 pt-8 mt-8 border-t border-slate-800/80 text-xs text-slate-500 flex items-center justify-between">
          <span>Nexgile Technologies Global Corp © 2024</span>
          <span>ISO 14064 • ISO 14067 • CSRD Ready</span>
        </div>
      </div>

      {/* Right Login / Register Form */}
      <div className="lg:w-1/2 p-8 lg:p-16 flex items-center justify-center bg-slate-900">
        <div className="w-full max-w-md space-y-6">
          <div className="p-8 rounded-3xl bg-slate-800/40 border border-slate-700/60 shadow-2xl backdrop-blur-sm">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-white">Sign In to Platform</h3>
              <p className="text-xs text-slate-400 mt-1">
                Select a demo enterprise persona below or enter your credentials
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Work Email</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition"
                    placeholder="name@company.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || isLoading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-glow transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Enter Platform</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsRegisterOpen(true)}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs flex items-center justify-center gap-2 border border-slate-700 transition cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
                <span>Create New User Account / Register</span>
              </button>
            </form>

            {/* Quick Demo Login Personas */}
            <div className="mt-8 pt-6 border-t border-slate-700/60">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Quick Demo Personas
                </span>
                <span className="text-[10px] text-slate-400">Click to log in instantly</span>
              </div>

              <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-1">
                {demoRoles.map((demo) => (
                  <button
                    key={demo.email}
                    type="button"
                    onClick={() => handleQuickLogin(demo.email, demo.pass)}
                    className="w-full text-left p-2.5 rounded-xl border border-slate-700/60 bg-slate-900/60 hover:bg-emerald-950/40 hover:border-emerald-500/40 transition flex items-center justify-between group cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white group-hover:text-emerald-300">
                          {demo.role}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">({demo.email})</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{demo.desc}</p>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-1 rounded bg-slate-800 text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition">
                      Login
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Register New User Modal */}
      <Modal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        title="Create New User Account"
        subtitle="Register a new user with dedicated role permissions"
      >
        <form onSubmit={handleRegister} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={regName}
              onChange={(e) => setRegName(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
              placeholder="e.g. Rachel Adams"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Email Address (Login ID)</label>
            <input
              type="email"
              required
              value={regEmail}
              onChange={(e) => setRegEmail(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
              placeholder="rachel.adams@decarbx.com"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={regPass}
              onChange={(e) => setRegPass(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
              placeholder="Minimum 6 characters"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Role / Permissions</label>
              <select
                value={regRole}
                onChange={(e) => setRegRole(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
              >
                <option value="Admin">Admin (Full Control)</option>
                <option value="Sustainability Manager">Sustainability Manager</option>
                <option value="Carbon Accountant">Carbon Accountant</option>
                <option value="Procurement Manager">Procurement Manager</option>
                <option value="Supplier">Supplier (Vendor Portal)</option>
                <option value="Auditor">Auditor (Verification)</option>
                <option value="Executive">Executive (C-Suite Analytics)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Job Title</label>
              <input
                type="text"
                value={regTitle}
                onChange={(e) => setRegTitle(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
                placeholder="Senior Carbon Analyst"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsRegisterOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={registering}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm cursor-pointer disabled:opacity-50"
            >
              {registering ? 'Creating...' : 'Create Account & Sign In'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
