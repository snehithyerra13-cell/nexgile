import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileSpreadsheet,
  BookOpen,
  Building2,
  Package,
  Truck,
  TrendingDown,
  Sliders,
  Sparkles,
  ShieldCheck,
  FileText,
  UploadCloud,
  CheckCircle,
  DollarSign,
  History,
  FolderLock,
  ChevronLeft,
  ChevronRight,
  Leaf,
  Layers,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../common/Badge';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}

interface NavItem {
  label: string;
  path: string;
  icon: any;
  badge?: string;
  highlight?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
  const { user } = useAuth();

  const isSupplier = user?.role === 'Supplier';

  const navItems: NavItem[] = isSupplier
    ? [
        { label: 'Supplier Portal', path: '/supplier-portal', icon: UserCheck, badge: 'Active' },
        { label: 'Emissions Reporting', path: '/emissions', icon: FileSpreadsheet },
        { label: 'Evidence Docs', path: '/evidence', icon: FolderLock },
      ]
    : [
        { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { label: 'Carbon Accounting', path: '/emissions', icon: FileSpreadsheet },
        { label: 'Emission Factors', path: '/factors', icon: BookOpen },
        { label: 'Facilities', path: '/facilities', icon: Building2 },
        { label: 'Product LCA & PCF', path: '/products', icon: Package },
        { label: 'Suppliers & Scope 3', path: '/suppliers', icon: Truck },
        { label: 'Reduction Planner', path: '/reductions', icon: TrendingDown },
        { label: 'What-If Scenarios', path: '/scenarios', icon: Sliders },
        { label: 'AI Analytics', path: '/analytics', icon: Sparkles, highlight: true },
        { label: 'Compliance & CSRD', path: '/compliance', icon: ShieldCheck },
        { label: 'Reports', path: '/reports', icon: FileText },
        { label: 'Data Management', path: '/data-management', icon: UploadCloud },
        { label: 'Data Quality', path: '/data-quality', icon: CheckCircle },
        { label: 'Carbon Finance', path: '/finance', icon: DollarSign },
        { label: 'Audit Trail', path: '/audit', icon: History },
        { label: 'Evidence Vault', path: '/evidence', icon: FolderLock },
      ];

  return (
    <aside
      className={`bg-slate-900 text-slate-300 border-r border-slate-800 transition-all duration-300 flex flex-col shrink-0 select-none z-30 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white font-bold shadow-glow shrink-0">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col truncate">
              <span className="font-extrabold text-white text-base tracking-tight flex items-center gap-1.5">
                Nexgile <span className="text-emerald-400 font-semibold">DecarbX</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">
                Environmental Intelligence
              </span>
            </div>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition shrink-0"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation list */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`
              }
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                  item.highlight ? 'text-emerald-400 animate-pulse' : ''
                }`}
              />
              {!collapsed && (
                <div className="flex items-center justify-between flex-1 truncate">
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
                      {item.badge}
                    </span>
                  )}
                  {item.highlight && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
                      ML AI
                    </span>
                  )}
                </div>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Bottom user role pill */}
      {!collapsed && user && (
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/30">
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <div className="w-8 h-8 rounded-lg bg-emerald-700/30 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-xs shrink-0">
              {user.full_name.charAt(0)}
            </div>
            <div className="truncate flex-1">
              <p className="text-xs font-bold text-white truncate">{user.full_name}</p>
              <p className="text-[10px] text-emerald-400 font-medium truncate">{user.role}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
