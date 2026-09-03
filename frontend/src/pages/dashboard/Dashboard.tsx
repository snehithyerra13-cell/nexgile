import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Factory,
  Flame,
  Zap,
  Truck,
  TrendingDown,
  Target,
  Sparkles,
  ArrowUpRight,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Award
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import {
  DashboardSummary,
  MonthlyEmission,
  FacilityEmission,
  CategoryEmission,
  TrajectoryPoint,
  CarbonInsight
} from '../../types';
import { StatCard } from '../../components/common/StatCard';
import { PageHeader } from '../../components/common/PageHeader';
import { Badge } from '../../components/common/Badge';

export const Dashboard: React.FC = () => {
  const { selectedYear, selectedFacility } = useAuth();
  const navigate = useNavigate();

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyEmission[]>([]);
  const [facilityData, setFacilityData] = useState<FacilityEmission[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryEmission[]>([]);
  const [trajectoryData, setTrajectoryData] = useState<TrajectoryPoint[]>([]);
  const [topSuppliers, setTopSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [sumRes, monthRes, facRes, catRes, trajRes, supRes] = await Promise.all([
        api.dashboard.getSummary(selectedYear, selectedFacility || undefined),
        api.dashboard.getMonthlyEmissions(selectedYear, selectedFacility || undefined),
        api.dashboard.getEmissionsByFacility(selectedYear),
        api.dashboard.getEmissionsByCategory(selectedYear),
        api.dashboard.getTrajectory(),
        api.dashboard.getTopSuppliers(),
      ]);

      setSummary(sumRes.data);
      setMonthlyData(monthRes.data);
      setFacilityData(facRes.data);
      setCategoryData(catRes.data);
      setTrajectoryData(trajRes.data);
      setTopSuppliers(supRes.data);
    } catch (err) {
      console.error('Error loading dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [selectedYear, selectedFacility]);

  // Scope donut pie data
  const scopePieData = summary
    ? [
        { name: 'Scope 1 (Direct)', value: summary.scope1_tco2e, color: '#f59e0b' },
        { name: 'Scope 2 (Electricity)', value: summary.scope2_tco2e, color: '#0d9488' },
        { name: 'Scope 3 (Value Chain)', value: summary.scope3_tco2e, color: '#3b82f6' },
      ]
    : [];

  const getInsightBadgeColor = (badge: string) => {
    switch (badge) {
      case 'HIGH PRIORITY': return 'red';
      case 'OPPORTUNITY': return 'emerald';
      case 'ANOMALY': return 'amber';
      case 'TARGET RISK': return 'purple';
      default: return 'blue';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <PageHeader
        title="Executive Environmental Intelligence Dashboard"
        subtitle="Holistic corporate emissions inventory, decarbonization trajectories, and local AI recommendations."
        badge={
          <Badge variant="emerald" dot>
            Reporting FY{selectedYear}
          </Badge>
        }
        actions={
          <button
            onClick={fetchAllData}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Telemetry</span>
          </button>
        }
      />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Corporate Emissions"
          value={`${summary ? summary.total_emissions_tco2e.toLocaleString() : '—'} tCO2e`}
          subtitle="Net GHG Footprint (ISO 14064)"
          change={`${summary?.reduction_vs_baseline_pct || 12.4}% vs 2024 Base`}
          trend="down"
          icon={Factory}
          iconBg="bg-slate-900"
          iconColor="text-white"
        />
        <StatCard
          title="Scope 1 Direct"
          value={`${summary ? summary.scope1_tco2e.toLocaleString() : '—'} tCO2e`}
          subtitle="Combustion & Mobile Fleet"
          change="Direct fuel & gas"
          trend="neutral"
          icon={Flame}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
        <StatCard
          title="Scope 2 Purchased Power"
          value={`${summary ? summary.scope2_tco2e.toLocaleString() : '—'} tCO2e`}
          subtitle="Location-Based Grid Electricity"
          change="Clean PPA in progress"
          trend="neutral"
          icon={Zap}
          iconBg="bg-teal-50"
          iconColor="text-teal-600"
        />
        <StatCard
          title="Scope 3 Value Chain"
          value={`${summary ? summary.scope3_tco2e.toLocaleString() : '—'} tCO2e`}
          subtitle="Purchased Goods & Logistics"
          change="Top Decarb Leverage"
          trend="neutral"
          icon={Truck}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
      </div>

      {/* Secondary KPI Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Carbon Intensity"
          value={`${summary?.carbon_intensity || 112.8} tCO2e`}
          subtitle="Per $1M Gross Revenue"
          change="Top quartile benchmark"
          trend="down"
          icon={TrendingDown}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard
          title="2030 SBTi Trajectory Gap"
          value={`${summary ? summary.target_gap_tco2e.toLocaleString() : '0'} tCO2e`}
          subtitle="Goal: 42% Reduction by 2030"
          change="On Track"
          trend="down"
          icon={Target}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
        />
        <StatCard
          title="Active Suppliers"
          value={summary?.active_suppliers || 12}
          subtitle="Scope 3 Tier-1 Partners"
          change="83% Verified ESG"
          trend="up"
          isPositiveChangeGood={true}
          icon={Truck}
          iconBg="bg-sky-50"
          iconColor="text-sky-600"
        />
        <StatCard
          title="Data Assurance Quality"
          value={`${summary?.data_quality_score || 92}%`}
          subtitle="Completeness & Meter Verifications"
          change="Audit Ready"
          trend="up"
          isPositiveChangeGood={true}
          icon={Award}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
      </div>

      {/* DecarbX Local AI Intelligence Panel */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-emerald-950 rounded-2xl border border-slate-800 p-6 text-white shadow-card relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full bg-emerald-500/10 rounded-l-full blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">DecarbX Intelligence & Local AI</h2>
              <p className="text-xs text-slate-400">Heuristic reasoning & anomaly detection generated on local server</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/analytics')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition"
          >
            <span>Explore Deep ML Analytics</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Insight Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 relative z-10 mt-4">
          {summary?.insights?.slice(0, 4).map((ins) => (
            <div
              key={ins.id}
              onClick={() => navigate(ins.action_url)}
              className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500/40 rounded-xl p-4 cursor-pointer transition flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant={getInsightBadgeColor(ins.badge) as any} size="sm">
                    {ins.badge}
                  </Badge>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-400 transition" />
                </div>
                <h3 className="text-xs font-bold text-white leading-snug">{ins.title}</h3>
                <p className="text-[11px] text-slate-300 mt-1.5 leading-relaxed">{ins.statement}</p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex items-center justify-between text-[10px] text-emerald-400 font-semibold">
                <span>Avoid ~{ins.estimated_impact_tco2e.toLocaleString()} tCO2e</span>
                <span className="text-slate-400 group-hover:underline">Action →</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Monthly Stacked Emissions Trend */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-subtle flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">Monthly Emissions by Scope (FY{selectedYear})</h3>
              <p className="text-xs text-slate-500">Stacked corporate carbon profile across 12 reporting months</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-slate-600 font-medium">Scope 1</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-600" />
                <span className="text-slate-600 font-medium">Scope 2</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <span className="text-slate-600 font-medium">Scope 3</span>
              </div>
            </div>
          </div>

          <div className="h-72 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="scope1Grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="scope2Grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="scope3Grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month_name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value: any, name: any) => [`${Number(value).toLocaleString()} tCO2e`, name]}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="Scope 1" stackId="1" stroke="#f59e0b" fill="url(#scope1Grad)" />
                <Area type="monotone" dataKey="Scope 2" stackId="1" stroke="#0d9488" fill="url(#scope2Grad)" />
                <Area type="monotone" dataKey="Scope 3" stackId="1" stroke="#3b82f6" fill="url(#scope3Grad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Scope Distribution Donut */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-subtle flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">Emissions by Scope</h3>
            <p className="text-xs text-slate-500">Breakdown of operational vs value chain emissions</p>
          </div>

          <div className="h-56 w-full flex items-center justify-center my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={scopePieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {scopePieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [`${Number(value).toLocaleString()} tCO2e`, 'Emissions']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 border-t border-slate-100 pt-3 text-xs">
            {scopePieData.map((s) => {
              const total = summary?.total_emissions_tco2e || 1;
              const pct = ((s.value / total) * 100).toFixed(1);
              return (
                <div key={s.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="text-slate-700 font-medium">{s.name}</span>
                  </div>
                  <div className="font-bold text-slate-900">
                    {pct}% <span className="font-normal text-slate-400">({Math.round(s.value).toLocaleString()} t)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Second Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SBTi Target Trajectory Line Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-subtle flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">SBTi 1.5°C Reduction Trajectory</h3>
              <p className="text-xs text-slate-500">Corporate emissions vs 42% decarbonization glidepath to 2030</p>
            </div>
            <Badge variant="purple" size="sm">
              Target 2030: 87,000 t
            </Badge>
          </div>

          <div className="h-64 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trajectoryData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value: any, name: any) => [`${Number(value).toLocaleString()} tCO2e`, name]}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Line
                  type="monotone"
                  dataKey="target_trajectory_tco2e"
                  name="SBTi Target Trajectory"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="actual_emissions_tco2e"
                  name="Actual Corporate Emissions"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#10b981' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Facility Emissions Comparison */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-subtle flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">Emissions by Facility</h3>
              <p className="text-xs text-slate-500">Gross operational footprint across 5 primary locations</p>
            </div>
            <button
              onClick={() => navigate('/facilities')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
            >
              View facilities →
            </button>
          </div>

          <div className="h-64 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={facilityData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="code" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value: any) => [`${Number(value).toLocaleString()} tCO2e`, 'Emissions']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="total_emissions_tco2e" fill="#059669" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Suppliers & Priority Action Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-subtle">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">Top Emitting Value Chain Suppliers (Scope 3)</h3>
            <p className="text-xs text-slate-500">Priority vendors for collaborative supplier decarbonization engagement</p>
          </div>
          <button
            onClick={() => navigate('/suppliers')}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
          >
            All Suppliers ({summary?.active_suppliers || 12}) →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Supplier Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Annual Spend</th>
                <th className="py-3 px-4">Carbon Footprint</th>
                <th className="py-3 px-4">SBTi Target Status</th>
                <th className="py-3 px-4">Engagement Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {topSuppliers.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-bold text-slate-900">{s.name}</td>
                  <td className="py-3 px-4 text-slate-600">{s.category}</td>
                  <td className="py-3 px-4 text-slate-700 font-mono">${(s.annual_spend_usd / 1000000).toFixed(1)}M</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{s.annual_emissions_tco2e.toLocaleString()} tCO2e</td>
                  <td className="py-3 px-4">
                    {s.sbti_committed ? (
                      <Badge variant="emerald" size="sm">
                        SBTi Committed
                      </Badge>
                    ) : (
                      <Badge variant="slate" size="sm">
                        Self-Target Only
                      </Badge>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <Badge
                      variant={
                        s.engagement_status === 'Verified'
                          ? 'emerald'
                          : s.engagement_status === 'Needs Improvement'
                          ? 'red'
                          : 'blue'
                      }
                      size="sm"
                    >
                      {s.engagement_status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
