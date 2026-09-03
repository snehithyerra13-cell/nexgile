import React, { useState, useEffect } from 'react';
import {
  TrendingDown,
  Plus,
  DollarSign,
  Target,
  CheckCircle,
  Clock,
  ArrowRight,
  Calculator,
  Percent,
  Edit2,
  Trash2,
  AlertCircle
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine
} from 'recharts';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { ReductionInitiative, MACCData, CarbonTarget } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';

export const Reductions: React.FC = () => {
  const { showToast } = useToast();

  const [initiatives, setInitiatives] = useState<ReductionInitiative[]>([]);
  const [maccData, setMaccData] = useState<MACCData | null>(null);
  const [target, setTarget] = useState<CarbonTarget | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInit, setEditingInit] = useState<ReductionInitiative | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Renewable Energy');
  const [owner, setOwner] = useState('Vikram Mehta');
  const [reductionTco2e, setReductionTco2e] = useState<number>(3500);
  const [costUsd, setCostUsd] = useState<number>(1500000);
  const [savingsUsd, setSavingsUsd] = useState<number>(450000);
  const [priority, setPriority] = useState('High');
  const [status, setStatus] = useState('In Progress');
  const [progress, setProgress] = useState(40);

  const fetchReductions = async () => {
    setLoading(true);
    try {
      const [initsRes, maccRes, targetRes] = await Promise.all([
        api.reductions.getAll({ status: statusFilter !== 'All' ? statusFilter : undefined }),
        api.reductions.getMaccCurve(),
        api.reductions.getTargets(),
      ]);
      setInitiatives(initsRes.data);
      setMaccData(maccRes.data);
      if (targetRes.data.length > 0) setTarget(targetRes.data[0]);
    } catch (err) {
      console.error(err);
      showToast('error', 'Failed to load reduction initiatives');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReductions();
  }, [statusFilter]);

  const handleOpenAddModal = () => {
    setEditingInit(null);
    setName('');
    setCategory('Renewable Energy');
    setOwner('Vikram Mehta');
    setReductionTco2e(3200);
    setCostUsd(1400000);
    setSavingsUsd(420000);
    setPriority('High');
    setStatus('In Progress');
    setProgress(30);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (init: ReductionInitiative) => {
    setEditingInit(init);
    setName(init.name);
    setCategory(init.category);
    setOwner(init.responsible_owner);
    setReductionTco2e(init.estimated_annual_reduction_tco2e);
    setCostUsd(init.implementation_cost_usd);
    setSavingsUsd(init.annual_savings_usd);
    setPriority(init.priority);
    setStatus(init.status);
    setProgress(init.progress_pct);
    setIsModalOpen(true);
  };

  const handleSaveInitiative = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingInit) {
        await api.reductions.update(editingInit.id, {
          name,
          category,
          responsible_owner: owner,
          estimated_annual_reduction_tco2e: reductionTco2e,
          implementation_cost_usd: costUsd,
          annual_savings_usd: savingsUsd,
          priority,
          status,
          progress_pct: progress,
        });
        showToast('success', 'Initiative Updated', `Saved changes to ${name}`);
      } else {
        await api.reductions.create({
          name,
          category,
          responsible_owner: owner,
          estimated_annual_reduction_tco2e: reductionTco2e,
          implementation_cost_usd: costUsd,
          annual_savings_usd: savingsUsd,
          priority,
          status,
          progress_pct: progress,
          confidence_pct: 85.0,
        });
        showToast('success', 'Initiative Registered', `Added ${name} to pipeline`);
      }
      setIsModalOpen(false);
      fetchReductions();
    } catch (err: any) {
      showToast('error', 'Failed to save', err.response?.data?.detail || 'Validation error');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Delete this reduction initiative?')) {
      try {
        await api.reductions.delete(id);
        showToast('info', 'Initiative Deleted');
        fetchReductions();
      } catch (err) {
        showToast('error', 'Error deleting initiative');
      }
    }
  };

  const totalPipelineReduction = initiatives.reduce((sum, i) => sum + i.estimated_annual_reduction_tco2e, 0);
  const totalCost = initiatives.reduce((sum, i) => sum + i.implementation_cost_usd, 0);
  const totalSavings = initiatives.reduce((sum, i) => sum + i.annual_savings_usd, 0);

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Decarbonization Roadmap & Reduction Planner"
        subtitle="Capital allocation optimization, Marginal Abatement Cost Curve (MACC), and SBTi 2030 milestone tracking."
        badge={
          <Badge variant="emerald" dot>
            Target Year 2030
          </Badge>
        }
        actions={
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Reduction Initiative</span>
          </button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Reduction Potential"
          value={`${totalPipelineReduction.toLocaleString()} tCO2e`}
          subtitle="Annualized across active projects"
          change="39.8% of 2030 goal"
          trend="up"
          isPositiveChangeGood={true}
          icon={TrendingDown}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard
          title="Capital Capex Required"
          value={`$${(totalCost / 1000000).toFixed(2)}M`}
          subtitle="Budget Allocated: $4.5M"
          change="Within budget"
          trend="neutral"
          icon={DollarSign}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          title="Annual Cost Savings"
          value={`$${(totalSavings / 1000000).toFixed(2)}M/yr`}
          subtitle="Avoided electricity & fuel"
          change="28.4% blended ROI"
          trend="up"
          isPositiveChangeGood={true}
          icon={Percent}
          iconBg="bg-teal-50"
          iconColor="text-teal-600"
        />
        <StatCard
          title="SBTi Target 2030"
          value="42% Cut"
          subtitle="Required: 63,000 tCO2e reduction"
          change="On Track"
          trend="down"
          icon={Target}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
        />
      </div>

      {/* Marginal Abatement Cost Curve (MACC) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-subtle">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Marginal Abatement Cost Curve (MACC)
            </h3>
            <p className="text-xs text-slate-500">
              Negative values (below line) generate net financial savings; positive values require net capital investment per tCO2e abated
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-slate-600 font-medium">Net Profitable (&lt;$0/t)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
              <span className="text-slate-600 font-medium">Net Cost (&gt;$0/t)</span>
            </div>
          </div>
        </div>

        <div className="h-72 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={maccData?.initiatives || []}
              margin={{ top: 20, right: 20, bottom: 40, left: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <ReferenceLine y={0} stroke="#94a3b8" strokeWidth={1.5} />
              <XAxis
                dataKey="name"
                angle={-20}
                textAnchor="end"
                interval={0}
                tick={{ fontSize: 10, fill: '#475569' }}
                height={55}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickFormatter={(v) => `$${v}`}
                unit=" $/t"
              />
              <Tooltip
                formatter={(value: any, name: any, props: any) => [
                  `$${value}/tCO2e (Abating ${props.payload.annual_reduction_tco2e.toLocaleString()} tCO2e/yr)`,
                  'Marginal Abatement Cost',
                ]}
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff', fontSize: '12px' }}
              />
              <Bar dataKey="mac_usd_per_tco2e" radius={[4, 4, 4, 4]}>
                {maccData?.initiatives.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.mac_usd_per_tco2e < 0 ? '#059669' : '#64748b'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Initiatives Pipeline Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-subtle">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">Decarbonization Project Pipeline</h3>
            <p className="text-xs text-slate-500">Status, capital budget, ROI, and delivery milestones</p>
          </div>
          <div className="flex items-center gap-2">
            {['All', 'In Progress', 'Approved', 'Completed', 'Proposed'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
                  statusFilter === st
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Initiative Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Annual Abatement</th>
                <th className="py-3 px-4">Cost / Savings</th>
                <th className="py-3 px-4">Abatement Cost</th>
                <th className="py-3 px-4">ROI %</th>
                <th className="py-3 px-4">Progress</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {initiatives.map((init) => (
                <tr key={init.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    <p className="text-xs font-bold text-slate-900">{init.name}</p>
                    <p className="text-[10px] text-slate-400 font-normal">Owner: {init.responsible_owner}</p>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">{init.category}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">
                    -{init.estimated_annual_reduction_tco2e.toLocaleString()} tCO2e
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 font-mono text-[11px]">
                    ${(init.implementation_cost_usd / 1000).toFixed(0)}k / +${(init.annual_savings_usd / 1000).toFixed(0)}k/yr
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold">
                    <span className={init.marginal_abatement_cost < 0 ? 'text-emerald-600' : 'text-slate-700'}>
                      ${init.marginal_abatement_cost}/t
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900 font-mono">{init.roi_pct}%</td>
                  <td className="py-3.5 px-4 w-32">
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all"
                          style={{ width: `${init.progress_pct}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">{init.progress_pct}%</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge
                      variant={
                        init.status === 'Completed'
                          ? 'emerald'
                          : init.status === 'In Progress'
                          ? 'blue'
                          : init.status === 'Approved'
                          ? 'purple'
                          : 'slate'
                      }
                      size="sm"
                      dot
                    >
                      {init.status}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenEditModal(init)}
                        className="p-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-500"
                        title="Edit Project"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(init.id)}
                        className="p-1 rounded-lg border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-400"
                        title="Delete Project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingInit ? `Edit Project: ${editingInit.name}` : 'New Reduction Initiative'}
        subtitle="Automated Marginal Abatement Cost and ROI calculation"
      >
        <form onSubmit={handleSaveInitiative} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Initiative Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
              placeholder="e.g. Clean Heat Pump Replacement"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
              >
                <option value="Renewable Energy">Renewable Energy</option>
                <option value="Energy Efficiency">Energy Efficiency</option>
                <option value="Process Electrification">Process Electrification</option>
                <option value="Fleet Electrification">Fleet Electrification</option>
                <option value="Supply Chain Engagement">Supply Chain Engagement</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Responsible Owner</label>
              <input
                type="text"
                required
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Annual Cut (tCO2e)</label>
              <input
                type="number"
                required
                value={reductionTco2e}
                onChange={(e) => setReductionTco2e(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Capex Cost ($ USD)</label>
              <input
                type="number"
                required
                value={costUsd}
                onChange={(e) => setCostUsd(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Annual Savings ($)</label>
              <input
                type="number"
                required
                value={savingsUsd}
                onChange={(e) => setSavingsUsd(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
              >
                <option value="Proposed">Proposed</option>
                <option value="Approved">Approved</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Progress (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={progress}
                onChange={(e) => setProgress(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm"
            >
              Commit Initiative
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
