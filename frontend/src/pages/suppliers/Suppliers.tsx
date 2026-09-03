import React, { useState, useEffect } from 'react';
import {
  Truck,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  FileQuestion,
  TrendingDown,
  ShieldCheck,
  Send,
  DollarSign,
  Award
} from 'lucide-react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { Supplier, SupplierQuestionnaire } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable, Column } from '../../components/common/DataTable';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';

export const Suppliers: React.FC = () => {
  const { showToast } = useToast();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [scatterData, setScatterData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('All');

  // Questionnaires & Modals
  const [isQuestionnaireModalOpen, setIsQuestionnaireModalOpen] = useState(false);
  const [selectedSupplierForQ, setSelectedSupplierForQ] = useState<Supplier | null>(null);

  // Questionnaire form
  const [qScope1, setQScope1] = useState(1500.0);
  const [qScope2, setQScope2] = useState(2200.0);
  const [qScope3, setQScope3] = useState(4800.0);
  const [qRenewable, setQRenewable] = useState(45.0);
  const [qSbtiStatus, setQSbtiStatus] = useState('Approved 1.5°C Target');
  const [qPcfAvailable, setQPcfAvailable] = useState(true);
  const [qVerification, setQVerification] = useState('Third-Party Verified (ISO 14064)');
  const [qCertifications, setQCertifications] = useState('ISO 14001, ISO 50001, EcoVadis Gold');

  // Add Supplier Modal
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [newSupName, setNewSupName] = useState('');
  const [newSupCode, setNewSupCode] = useState('');
  const [newSupCategory, setNewSupCategory] = useState('Raw Materials');
  const [newSupSpend, setNewSupSpend] = useState(5000000);
  const [newSupEmissions, setNewSupEmissions] = useState(4500);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const [supRes, scRes] = await Promise.all([
        api.suppliers.getAll({ status: statusFilter !== 'All' ? statusFilter : undefined }),
        api.suppliers.getScope3Scatter(),
      ]);
      setSuppliers(supRes.data);
      setScatterData(scRes.data);
    } catch (err) {
      console.error(err);
      showToast('error', 'Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [statusFilter]);

  const handleOpenQuestionnaire = (sup: Supplier) => {
    setSelectedSupplierForQ(sup);
    setQScope1(Math.round(sup.annual_emissions_tco2e * 0.35));
    setQScope2(Math.round(sup.annual_emissions_tco2e * 0.45));
    setQScope3(Math.round(sup.annual_emissions_tco2e * 0.20));
    setQRenewable(sup.sbti_committed ? 45.0 : 15.0);
    setQSbtiStatus(sup.sbti_committed ? 'Approved 1.5°C Target' : 'Not Committed');
    setQPcfAvailable(true);
    setIsQuestionnaireModalOpen(true);
  };

  const handleSubmitQuestionnaire = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierForQ) return;
    try {
      const res = await api.suppliers.submitQuestionnaire({
        supplier_id: selectedSupplierForQ.id,
        reporting_year: 2024,
        ghg_inventory_available: true,
        scope1_emissions: qScope1,
        scope2_emissions: qScope2,
        scope3_emissions: qScope3,
        renewable_energy_pct: qRenewable,
        emissions_reduction_target: '35% reduction by 2030 from 2022 baseline',
        sbti_status: qSbtiStatus,
        pcf_available: qPcfAvailable,
        verification_status: qVerification,
        environmental_certifications: qCertifications,
      });

      showToast('success', 'Questionnaire Evaluated', `${selectedSupplierForQ.name} scored ${res.data.sustainability_score}/100`);
      setIsQuestionnaireModalOpen(false);
      fetchSuppliers();
    } catch (err: any) {
      showToast('error', 'Submission Failed', err.response?.data?.detail || 'Error evaluating questionnaire');
    }
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.suppliers.create({
        name: newSupName,
        code: newSupCode.toUpperCase(),
        country: 'India',
        category: newSupCategory,
        annual_spend_usd: newSupSpend,
        annual_emissions_tco2e: newSupEmissions,
        carbon_intensity: Number(((newSupEmissions * 1000) / newSupSpend).toFixed(2)),
        data_quality_score: 85.0,
        risk_score: 40.0,
        engagement_status: 'Submitted',
        sbti_committed: true,
        target_status: '1.5°C Target Committed',
        contact_email: `contact@${newSupCode.toLowerCase()}.com`,
        latest_submission_date: '2024-11-01',
      });
      showToast('success', 'Supplier Registered', `Successfully added ${newSupName}`);
      setIsAddSupplierOpen(false);
      fetchSuppliers();
    } catch (err: any) {
      showToast('error', 'Failed to add supplier', err.response?.data?.detail || 'Error creating supplier');
    }
  };

  const columns: Column<Supplier>[] = [
    {
      key: 'name',
      header: 'Supplier & Code',
      sortable: true,
      render: (s) => (
        <div>
          <p className="font-bold text-slate-900 text-xs">{s.name}</p>
          <p className="font-mono text-[10px] text-slate-400">{s.code} • {s.country}</p>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      sortable: true,
      render: (s) => <span className="text-xs text-slate-700 font-medium">{s.category}</span>,
    },
    {
      key: 'annual_spend_usd',
      header: 'Annual Spend',
      sortable: true,
      render: (s) => (
        <span className="font-mono text-xs font-bold text-slate-900">
          ${(s.annual_spend_usd / 1000000).toFixed(1)}M
        </span>
      ),
    },
    {
      key: 'annual_emissions_tco2e',
      header: 'Emissions',
      sortable: true,
      render: (s) => (
        <span className="font-mono text-xs font-bold text-slate-900">
          {s.annual_emissions_tco2e.toLocaleString()} <span className="text-slate-400 font-normal">tCO2e</span>
        </span>
      ),
    },
    {
      key: 'risk_score',
      header: 'Carbon Risk',
      sortable: true,
      render: (s) => (
        <Badge
          variant={s.risk_score > 50 ? 'red' : s.risk_score > 30 ? 'amber' : 'emerald'}
          size="sm"
        >
          {s.risk_score}/100 Risk
        </Badge>
      ),
    },
    {
      key: 'engagement_status',
      header: 'ESG Status',
      sortable: true,
      render: (s) => (
        <Badge
          variant={
            s.engagement_status === 'Verified'
              ? 'emerald'
              : s.engagement_status === 'Needs Improvement'
              ? 'red'
              : 'blue'
          }
          size="sm"
          dot
        >
          {s.engagement_status}
        </Badge>
      ),
    },
    {
      key: 'sbti_committed',
      header: 'SBTi Target',
      render: (s) => (
        <span className={`text-[11px] font-semibold ${s.sbti_committed ? 'text-emerald-600' : 'text-slate-400'}`}>
          {s.sbti_committed ? '✓ Validated SBTi' : 'No Target'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (s) => (
        <button
          onClick={() => handleOpenQuestionnaire(s)}
          className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 text-xs font-semibold text-slate-700 transition inline-flex items-center gap-1.5"
        >
          <FileQuestion className="w-3.5 h-3.5" />
          <span>ESG Audit</span>
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Supplier Decarbonization & Scope 3 Intelligence"
        subtitle="Tier-1 value chain carbon risk scoring, spend vs emissions matrix, and automated ESG decarbonization questionnaires."
        badge={
          <Badge variant="emerald" dot>
            Scope 3 Category 1
          </Badge>
        }
        actions={
          <button
            onClick={() => setIsAddSupplierOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Onboard Supplier</span>
          </button>
        }
      />

      {/* Spend vs Emissions Scatter Chart */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-subtle">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">Scope 3 Spend vs Carbon Emissions Matrix</h3>
            <p className="text-xs text-slate-500">Top-right quadrant indicates high-spend, high-carbon priority targets for decarbonization</p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="text-slate-600 font-medium">High Carbon Risk</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-slate-600 font-medium">Verified Low Carbon</span>
            </div>
          </div>
        </div>

        <div className="h-72 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                type="number"
                dataKey="spend_usd"
                name="Annual Spend"
                unit="$"
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickFormatter={(v) => `$${(v / 1000000).toFixed(0)}M`}
              />
              <YAxis
                type="number"
                dataKey="emissions_tco2e"
                name="Emissions"
                unit=" t"
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <ZAxis type="number" dataKey="risk_score" range={[60, 300]} name="Risk Score" />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                formatter={(value: any, name: any) => [
                  name === 'Annual Spend'
                    ? `$${Number(value).toLocaleString()}`
                    : `${Number(value).toLocaleString()} tCO2e`,
                  name,
                ]}
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff', fontSize: '12px' }}
              />
              <Scatter name="Suppliers" data={scatterData}>
                {scatterData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.risk_score > 45 ? '#f43f5e' : entry.risk_score > 30 ? '#f59e0b' : '#10b981'}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 p-3 bg-white rounded-2xl border border-slate-200 shadow-subtle">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2">Engagement Status:</span>
        {['All', 'Verified', 'Submitted', 'Needs Improvement'].map((st) => (
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

      {/* Suppliers Table */}
      <DataTable
        data={suppliers}
        columns={columns}
        searchKey={(s) => `${s.name} ${s.code} ${s.category} ${s.country}`}
        searchPlaceholder="Search supplier by name, code, category..."
        pageSize={10}
      />

      {/* Supplier ESG Questionnaire Modal */}
      <Modal
        isOpen={isQuestionnaireModalOpen}
        onClose={() => setIsQuestionnaireModalOpen(false)}
        title={`Supplier Decarbonization Audit — ${selectedSupplierForQ?.name}`}
        subtitle="Automated scoring algorithm evaluating GHG accounting, renewable energy %, and SBTi targets."
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmitQuestionnaire} className="space-y-4 text-xs">
          <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200 text-emerald-900 flex items-center justify-between">
            <div>
              <span className="font-bold text-xs">Targeted Vendor:</span>
              <p className="text-sm font-black text-emerald-950">{selectedSupplierForQ?.name} ({selectedSupplierForQ?.code})</p>
            </div>
            <Badge variant="emerald" size="sm">
              Scope 3 Partner
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Scope 1 (tCO2e)</label>
              <input
                type="number"
                step="any"
                required
                value={qScope1}
                onChange={(e) => setQScope1(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Scope 2 (tCO2e)</label>
              <input
                type="number"
                step="any"
                required
                value={qScope2}
                onChange={(e) => setQScope2(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Scope 3 (tCO2e)</label>
              <input
                type="number"
                step="any"
                required
                value={qScope3}
                onChange={(e) => setQScope3(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Renewable Electricity Share (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                required
                value={qRenewable}
                onChange={(e) => setQRenewable(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">SBTi Target Status</label>
              <select
                value={qSbtiStatus}
                onChange={(e) => setQSbtiStatus(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
              >
                <option value="Approved 1.5°C Target">Approved 1.5°C Target</option>
                <option value="Committed (Near-Term)">Committed (Near-Term)</option>
                <option value="Internal Target Only">Internal Target Only</option>
                <option value="Not Committed">Not Committed</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Third-Party Verification</label>
              <select
                value={qVerification}
                onChange={(e) => setQVerification(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
              >
                <option value="Third-Party Verified (ISO 14064)">Third-Party Verified (ISO 14064)</option>
                <option value="Second-Party Audited">Second-Party Audited</option>
                <option value="Self-Reported">Self-Reported</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Product Carbon Footprints (PCF)</label>
              <select
                value={qPcfAvailable ? 'yes' : 'no'}
                onChange={(e) => setQPcfAvailable(e.target.value === 'yes')}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
              >
                <option value="yes">Yes - Available per SKU</option>
                <option value="no">No - Only Corporate Level</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Environmental Certifications</label>
            <input
              type="text"
              value={qCertifications}
              onChange={(e) => setQCertifications(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
              placeholder="e.g. ISO 14001, ISO 50001, EcoVadis Gold"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsQuestionnaireModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm"
            >
              Calculate Score & Verify
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Supplier Modal */}
      <Modal
        isOpen={isAddSupplierOpen}
        onClose={() => setIsAddSupplierOpen(false)}
        title="Onboard Tier-1 Vendor"
        subtitle="Add a supplier to Scope 3 value chain tracking"
      >
        <form onSubmit={handleCreateSupplier} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Supplier Business Name</label>
            <input
              type="text"
              required
              value={newSupName}
              onChange={(e) => setNewSupName(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
              placeholder="e.g. Precision Micro-Motors Ltd"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Supplier Code</label>
              <input
                type="text"
                required
                value={newSupCode}
                onChange={(e) => setNewSupCode(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono uppercase"
                placeholder="SUP-PMM"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Category</label>
              <input
                type="text"
                required
                value={newSupCategory}
                onChange={(e) => setNewSupCategory(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Annual Spend ($ USD)</label>
              <input
                type="number"
                required
                value={newSupSpend}
                onChange={(e) => setNewSupSpend(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Annual Emissions (tCO2e)</label>
              <input
                type="number"
                required
                value={newSupEmissions}
                onChange={(e) => setNewSupEmissions(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddSupplierOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm"
            >
              Register Supplier
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
