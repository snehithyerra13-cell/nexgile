import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  Building,
  Calendar,
  LogOut,
  UserCheck,
  ChevronDown,
  ExternalLink,
  Package,
  Truck,
  Building2,
  Leaf,
  FileSpreadsheet,
  Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { Notification, SearchResultItem, UserRole } from '../../types';
import { Badge } from '../common/Badge';

export const TopNav: React.FC = () => {
  const { user, logout, selectedYear, setSelectedYear, switchUserRole } = useAuth();
  const navigate = useNavigate();

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Notification state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Profile / Role switcher state
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const res = await api.notifications.getAll();
        setNotifications(res.data);
      } catch (err) {
        console.error('Failed to load notifications', err);
      }
    };
    fetchNotifs();
  }, []);

  // Live search debounced
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearchOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await api.search.query(searchQuery);
        setSearchResults(res.data.results);
        setIsSearchOpen(true);
      } catch (err) {
        console.error('Search error', err);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside listeners
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkNotifRead = async (id: number) => {
    try {
      await api.notifications.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const getSearchIcon = (type: string) => {
    switch (type) {
      case 'Product': return <Package className="w-4 h-4 text-emerald-600" />;
      case 'Supplier': return <Truck className="w-4 h-4 text-blue-600" />;
      case 'Facility': return <Building2 className="w-4 h-4 text-amber-600" />;
      case 'Reduction Project': return <Leaf className="w-4 h-4 text-teal-600" />;
      default: return <FileSpreadsheet className="w-4 h-4 text-slate-600" />;
    }
  };

  const allRoles: UserRole[] = [
    'Admin',
    'Sustainability Manager',
    'Carbon Accountant',
    'Procurement Manager',
    'Supplier',
    'Auditor',
    'Executive'
  ];

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between gap-4 sticky top-0 z-20 shadow-xs">
      {/* Search Input */}
      <div ref={searchRef} className="relative w-full max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery.length >= 2 && setIsSearchOpen(true)}
            placeholder="Search products, suppliers, facilities, records..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition shadow-xs"
          />
        </div>

        {/* Search Results Dropdown */}
        {isSearchOpen && (
          <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden z-50">
            <div className="p-2 border-b border-slate-100 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              {searchResults.length > 0 ? `Matching Results (${searchResults.length})` : 'No Results Found'}
            </div>
            <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
              {searchResults.map((item) => (
                <div
                  key={`${item.type}-${item.id}`}
                  onClick={() => {
                    navigate(item.link);
                    setIsSearchOpen(false);
                    setSearchQuery('');
                  }}
                  className="p-3 hover:bg-emerald-50/50 cursor-pointer flex items-center justify-between gap-3 transition"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-slate-100">{getSearchIcon(item.type)}</div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{item.title}</p>
                      <p className="text-[11px] text-slate-500">{item.subtitle}</p>
                    </div>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">{item.type}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* Organization Badge */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-700">
          <Building className="w-3.5 h-3.5 text-emerald-600" />
          <span>Nexgile Technologies Global Corp</span>
        </div>

        {/* Reporting Year Picker */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700">
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-slate-400">FY</span>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer"
          >
            <option value={2024}>2024 (Active)</option>
            <option value={2023}>2023 (Baseline)</option>
            <option value={2025}>2025 (Forecast)</option>
          </select>
        </div>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/75">
                <div>
                  <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">System Intelligence Alerts</h4>
                  <p className="text-[11px] text-slate-500">{unreadCount} unread actionable notifications</p>
                </div>
                <button
                  onClick={async () => {
                    await api.notifications.markAllRead();
                    setNotifications((p) => p.map((n) => ({ ...n, is_read: true })));
                  }}
                  className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700"
                >
                  Mark all read
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <p className="text-center py-6 text-xs text-slate-400">No active alerts</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        handleMarkNotifRead(n.id);
                        navigate(n.link);
                        setIsNotifOpen(false);
                      }}
                      className={`p-3.5 hover:bg-slate-50 cursor-pointer flex items-start gap-3 transition ${
                        !n.is_read ? 'bg-emerald-50/30' : ''
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                          !n.is_read ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-slate-900">{n.title}</p>
                          <span className="text-[10px] text-slate-400 font-medium">{n.category}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{n.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile & Demo Persona Switcher */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 p-1.5 pl-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition"
          >
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-900 leading-tight">{user?.full_name}</p>
              <p className="text-[10px] text-emerald-600 font-semibold">{user?.role}</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold flex items-center justify-center text-xs shadow-xs">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl border border-slate-200 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="p-3 border-b border-slate-100 bg-slate-50 rounded-xl mb-2">
                <p className="text-xs font-bold text-slate-900">{user?.full_name}</p>
                <p className="text-[11px] text-slate-500">{user?.email}</p>
                <div className="mt-2">
                  <Badge variant="emerald" size="sm">
                    {user?.role}
                  </Badge>
                </div>
              </div>

              {/* Demo Persona Switcher */}
              <div className="px-2 py-1.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Quick Switch Demo Role
                </p>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {allRoles.map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        switchUserRole(r);
                        setIsProfileOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition ${
                        user?.role === r
                          ? 'bg-emerald-50 text-emerald-700 font-bold'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span>{r}</span>
                      {user?.role === r && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-100 mt-2 pt-2">
                <button
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
