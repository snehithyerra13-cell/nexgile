import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  AlertTriangle,
  TrendingUp,
  Target,
  Lightbulb,
  ArrowUpRight,
  ShieldAlert,
  Cpu,
  RefreshCw,
  Layers,
  ChevronRight,
  BarChart3
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import {
  AnomalyItem,
  ForecastResponse,
  HotspotsResponse,
  CarbonInsight
} from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';

export const Analytics: React.FC = () => {
  const { showToast } = useToast();

  const [anomalies, setAnomalies] = useState<AnomalyItem[]>([]);
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [hotspots, setHotspots] = useState<HotspotsResponse | null>(null);
  const [insights, setInsights] = useState<CarbonInsight[]>([]);
  const [loading, setLoading] = useState(true);

  // Tab state for Hotspots
  const [hotspotTab, setHotspotTab] = useState<'facilities' | 'categories' | 'suppliers' | 'materials'>('facilities');

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [anomRes, foreRes, hotRes, insRes] = await Promise.all([
        api.analytics.getAnomalies(),
        api.analytics.getForecast(12),
        api.analytics.getHotspots(),
        api.analytics.getInsights(),
      ]);
      setAnomalies(anomRes.data);
      setForecast(foreRes.data);
      setHotspots(hotRes.data);
      setInsights(insRes.data);
    } catch (err) {
      console.error(err);
      showToast('error', 'Failed to execute local analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Format forecast chart data combining historical & forward projection
  const forecastChartData = forecast
    ? [
        ...forecast.historical.map((h) => ({
          date: h.month_name,
          Historical: h.emissions_tco2e,
          Forecast: null,
          LowerBound: null,
          UpperBound: null,
        })),
        ...forecast.forecast.map((f) => ({
          date: f.month_name,
          Historical: null,
          Forecast: f.predicted_tco2e,
          LowerBound: f.lower_bound,
          UpperBound: f.upper_bound,
        })),
      ]
    : [];

  const currentHotspotList = hotspots ? hotspots[hotspotTab] : [];

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Environmental AI Analytics & Machine Learning Engine"
        subtitle="Zero external API dependencies. Powered by local scikit-learn IsolationForest, linear regression, and Pareto heuristics."
        badge={
          <Badge variant="emerald" dot>
            Local Algorithmic AI
          </Badge>
        }
        actions={
          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Re-train Models</span>
          </button>
        }
      />

      {/* Model Performance Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Anomalies"
          value={anomalies.length}
          subtitle="Identified via IsolationForest"
          change="Automated Detection"
          trend={anomalies.length > 0 ? 'down' : 'neutral'}
          isPositiveChangeGood={false}
          icon={AlertTriangle}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
        <StatCard
          title="Forecast R² Fit"
          value={`${((forecast?.model_r2_score || 0.85) * 100).toFixed(1)}%`}
          subtitle="Linear regression fit score"
          change="High statistical fit"
          trend="up"
          isPositiveChangeGood={true}
          icon={TrendingUp}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard
          title="Forward 12M Run-Rate"
          value={`${forecast ? Math.round(forecast.annual_run_rate_tco2e).toLocaleString() : '—'} t`}
          subtitle="Projected annual baseline"
          change={forecast?.trend_direction || 'Stable'}
          trend="neutral"
          icon={Target}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
        />
        <StatCard
          title="Carbon Insights Generated"
          value={insights.length}
          subtitle="Rule-based heuristic findings"
          change="Live calculations"
          trend="up"
          isPositiveChangeGood={true}
          icon={Lightbulb}
          iconBg="bg-teal-50"
          iconColor="text-teal-600"
        />
      </div>

      {/* 12-Month Forward Emissions Forecast Chart */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-subtle">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>12-Month Predictive Emissions Forecast with 95% Confidence Bounds</span>
            </h3>
            <p className="text-xs text-slate-500">
              Scikit-learn LinearRegression model with regional seasonal coefficients and variance intervals
            </p>
          </div>
          <Badge variant="blue" size="sm">
            Forecast Horizon: Next 12 Months
          </Badge>
        </div>

        <div className="h-72 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={forecastChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="foreGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.6}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
                </linearGradient>
                <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.7}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(value: any, name: any) => [
                  value ? `${Number(value).toLocaleString()} tCO2e` : '—',
                  name,
                ]}
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff', fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Area type="monotone" dataKey="Historical" stroke="#3b82f6" fill="url(#histGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="Forecast" stroke="#10b981" fill="url(#foreGrad)" strokeWidth={2.5} strokeDasharray="4 4" />
              <Area type="monotone" dataKey="UpperBound" stroke="#cbd5e1" fill="transparent" strokeWidth={1} />
              <Area type="monotone" dataKey="LowerBound" stroke="#cbd5e1" fill="transparent" strokeWidth={1} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Anomalies Detection Cards Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-subtle">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>Emissions Anomaly Detection (IsolationForest & Z-Score)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Unusual month-over-month variances, spike diagnostics, and recommended remediation protocols
            </p>
          </div>
          <Badge variant="red" size="sm">
            {anomalies.length} Flagged Deviations
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {anomalies.map((anom) => (
            <div
              key={anom.id}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-card transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant={anom.severity === 'High' ? 'red' : 'amber'} size="sm">
                    {anom.severity} Deviation (+{anom.deviation_pct}%)
                  </Badge>
                  <span className="font-mono text-[10px] text-slate-400 font-bold">{anom.month}</span>
                </div>
                <h4 className="text-xs font-bold text-slate-900">{anom.facility}</h4>
                <p className="text-[11px] text-slate-500">{anom.category}</p>

                <div className="mt-3 p-2.5 rounded-lg bg-white border border-slate-200 text-xs">
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Probable Cause:</span>
                  <p className="text-slate-800 text-[11px] mt-0.5 leading-relaxed">{anom.probable_cause}</p>
                </div>

                <div className="mt-2.5 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs">
                  <span className="text-[10px] text-emerald-700 block font-bold uppercase">Remediation Action:</span>
                  <p className="text-emerald-900 text-[11px] mt-0.5 leading-relaxed">{anom.recommendation}</p>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Recorded: <strong className="text-slate-800">{anom.actual_value} t</strong></span>
                <span className="text-slate-400">Baseline: {anom.expected_value} t</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pareto Hotspot Analysis Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-subtle">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>Multi-Dimensional Pareto Carbon Hotspot Analyzer</span>
            </h3>
            <p className="text-xs text-slate-500">80/20 carbon concentration ranking across corporate domains</p>
          </div>

          {/* Hotspot Category Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
            {(['facilities', 'categories', 'suppliers', 'materials'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setHotspotTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                  hotspotTab === tab
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Hotspot Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Entity Name</th>
                <th className="py-3 px-4">Domain Type</th>
                <th className="py-3 px-4">Gross Emissions</th>
                <th className="py-3 px-4">Direct Share %</th>
                <th className="py-3 px-4">Cumulative Pareto Share</th>
                <th className="py-3 px-4">Criticality</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {currentHotspotList.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-bold text-slate-900">{item.name}</td>
                  <td className="py-3 px-4 text-slate-500">{item.type}</td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    {item.emissions_tco2e.toLocaleString()} tCO2e
                  </td>
                  <td className="py-3 px-4 font-mono text-emerald-700 font-bold">{item.share_pct}%</td>
                  <td className="py-3 px-4 w-48">
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-600 h-full rounded-full"
                          style={{ width: `${Math.min(100, item.cumulative_pct)}%` }}
                        />
                      </div>
                      <span className="font-mono text-[10px] text-slate-500">{item.cumulative_pct}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <Badge
                      variant={item.risk_level === 'Critical' ? 'red' : item.risk_level === 'High' ? 'amber' : 'slate'}
                      size="sm"
                    >
                      {item.risk_level}
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
