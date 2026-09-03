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
  Loader2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

export const Login: React.FC = () => {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('admin@decarbx.com');
  const [password, setPassword] = useState('admin123');
  const [submitting, setSubmitting] = useState(false);

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

  const demoRoles = [
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
        {/* Subtle background glow */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-glow">
            <Leaf className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Nexgile <span className="text-emerald-400 font-semibold">DecarbX</span>
            </h1>
            <p className="text-xs text-slate-400 font-medium tracking-wide uppercase">
              Environmental Intelligence Platform
            </p>
          </div>
        </div>

        {/* Central pitch */}
        <div className="my-12 relative z-10 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-6">
            <Cpu className="w-3.5 h-3.5" />
            <span>Audit-Grade Carbon Accounting & Local AI</span>
          </div>

          <h2 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Environmental Intelligence for Enterprise Decarbonization.
          </h2>

          <p className="text-base text-emerald-400 font-semibold mt-3 tracking-wide">
            Measure. Analyze. Reduce. Report.
          </p>

          <p className="text-sm text-slate-300 mt-4 leading-relaxed">
            Unify Scope 1, 2, and 3 accounting, Product Carbon Footprinting (PCF), supplier decarbonization,
            regulatory compliance (CSRD, CBAM, TCFD), and marginal abatement planning on a single secure platform.
          </p>

          {/* Value props */}
          <div className="mt-8 space-y-3">
            {[
              { icon: BarChart3, text: 'Audit-ready Scopes 1, 2 & 3 Activity Accounting with full data lineage' },
              { icon: Layers, text: 'Product Carbon Footprint (PCF) & 7-Stage Life Cycle Assessment (LCA)' },
              { icon: TrendingDown, text: 'Marginal Abatement Cost Curve (MACC) & What-If Scenario Sandbox' },
              { icon: ShieldCheck, text: 'Pre-configured CSRD, CBAM, TCFD, and CDP compliance frameworks' },
              { icon: Cpu, text: 'Zero External AI APIs — Local scikit-learn anomaly detection & forecasting' },
            ].map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div key={idx} className="flex items-center gap-3 text-xs text-slate-300">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span>{feature.text}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer disclaimer */}
        <div className="relative z-10 pt-6 border-t border-slate-800/80 text-[11px] text-slate-400">
          © 2025 Nexgile Technologies. Demonstration deployment with local seeded database.
        </div>
      </div>

      {/* Right Login & Demo Personas */}
      <div className="lg:w-1/2 p-6 sm:p-12 lg:p-16 flex flex-col justify-center bg-slate-900 overflow-y-auto">
        <div className="max-w-md w-full mx-auto">
          <div className="bg-slate-800/80 rounded-3xl border border-slate-700/80 p-8 shadow-2xl backdrop-blur-md">
            <h3 className="text-xl font-bold text-white tracking-tight">Enterprise Sign In</h3>
            <p className="text-xs text-slate-400 mt-1">Access your corporate decarbonization portal</p>

            {/* Login form */}
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
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
                className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-glow transition disabled:opacity-50 disabled:cursor-not-allowed"
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
                    className="w-full text-left p-2.5 rounded-xl border border-slate-700/60 bg-slate-900/60 hover:bg-emerald-950/40 hover:border-emerald-500/40 transition flex items-center justify-between group"
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
    </div>
  );
};
