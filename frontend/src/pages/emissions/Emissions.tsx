import React, { useState, useEffect } from 'react';
import {
  Plus,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Trash2,
  Edit2,
  FileSpreadsheet,
  Download,
  AlertCircle,
  Calculator,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  EmissionRecord,
  EmissionFactor,
  Facility,
  DataLineage
} from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable, Column } from '../../components/common/DataTable';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Drawer } from '../../components/common/Drawer';

export const Emissions: React.FC = () => {
  const { user, selectedYear, selectedFacility } = useAuth();
  const { showToast } = useToast();

  const [records, setRecords] = useState<EmissionRecord[]>([]);
  const [factors, setFactors] = useState<EmissionFactor[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [scopeFilter, setScopeFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Add / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<EmissionRecord | null>(null);

  // Lineage Drawer state
  const [lineageDrawerOpen, setLineageDrawerOpen] = useState(false);
  const [activeLineage, setActiveLineage] = useState<DataLineage | null>(null);
  const [lineageLoading, setLineageLoading] = useState(false);

  // Form State
  const [formFacilityId, setFormFacilityId] = useState<number>(1);
  const [formDepartment, setFormDepartment] = useState('Operations');
  const [formYear, setFormYear] = useState(2024);
  const [formMonth, setFormMonth] = useState(11);
  const [formScope, setFormScope] = useState('Scope 1');
  const [formCategory, setFormCategory] = useState('Stationary Combustion');
  const [formActivityType, setFormActivityType] = useState('Natural Gas');
  const [formAmount, setFormAmount] = useState<number>(10000);
  const [formUnit, setFormUnit] = useState('m3');
  const [formFactorValue, setFormFactorValue] = useState<number>(2.0214);
  const [formFactorUnit, setFormFactorUnit] = useState('kgCO2e/m3');
  const [formNotes, setFormNotes] = useState('');

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await api.emissions.getAll({
        year: selectedYear,
        facility_id: selectedFacility || undefined,
        scope: scopeFilter !== 'All' ? scopeFilter : undefined,
        status: statusFilter !== 'All' ? statusFilter : undefined,
      });
      setRecords(res.data);
    } catch (err) {
      console.error(err);
      showToast('error', 'Failed to load emission ledger records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [selectedYear, selectedFacility, scopeFilter, statusFilter]);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [facRes, facList] = await Promise.all([
          api.factors.getAll(),
          api.facilities.getAll(),
        ]);
        setFactors(facRes.data);
        setFacilities(facList.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchMetadata();
  }, []);

  const handleOpenAddModal = () => {
    setEditingRecord(null);
    setFormFacilityId(facilities[0]?.id || 1);
    setFormDepartment('Operations');
    setFormYear(selectedYear);
    setFormMonth(11);
    setFormScope('Scope 1');
    setFormCategory('Stationary Combustion');
    setFormActivityType('Natural Gas');
    setFormAmount(12500);
    setFormUnit('m3');
    setFormFactorValue(2.0214);
    setFormFactorUnit('kgCO2e/m3');
    setFormNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (rec: EmissionRecord) => {
    setEditingRecord(rec);
    setFormFacilityId(rec.facility_id);
    setFormDepartment(rec.department);
    setFormYear(rec.reporting_year);
    setFormMonth(rec.reporting_month);
    setFormScope(rec.scope);
    setFormCategory(rec.category);
    setFormActivityType(rec.activity_type);
    setFormAmount(rec.activity_amount);
    setFormUnit(rec.activity_unit);
    setFormFactorValue(rec.emission_factor_value);
    setFormFactorUnit(rec.emission_factor_unit);
    setFormNotes(rec.notes || '');
    setIsModalOpen(true);
  };

  const handleFactorSelect = (factorName: string) => {
    const ef = factors.find((f) => f.factor_name === factorName);
    if (ef) {
      setFormScope(ef.scope);
      setFormCategory(ef.category);
      setFormActivityType(ef.activity_type);
      setFormFactorValue(ef.factor_value);
      setFormFactorUnit(ef.unit);
      // derive standard unit
      const parts = ef.unit.split('/');
      if (parts.length > 1) setFormUnit(parts[1]);
    }
  };

  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const calcEmissions = Number(((formAmount * formFactorValue) / 1000.0).toFixed(4));
      const payload: any = {
        facility_id: formFacilityId,
        department: formDepartment,
        reporting_year: formYear,
        reporting_month: formMonth,
        scope: formScope,
        category: formCategory,
        activity_type: formActivityType,
        activity_amount: formAmount,
        activity_unit: formUnit,
        emission_factor_value: formFactorValue,
        emission_factor_unit: formFactorUnit,
        calculated_emissions: calcEmissions,
        notes: formNotes,
      };

      if (editingRecord) {
        await api.emissions.update(editingRecord.id, payload);
        showToast('success', 'Record Updated', `Successfully updated record #${editingRecord.id}`);
      } else {
        await api.emissions.create(payload);
        showToast('success', 'Record Created', `Successfully logged ${calcEmissions} tCO2e`);
      }

      setIsModalOpen(false);
      fetchRecords();
    } catch (err: any) {
      showToast('error', 'Operation Failed', err.response?.data?.detail || 'Unable to save record');
    }
  };

  const handleDeleteRecord = async (id: number) => {
    if (window.confirm(`Are you sure you want to permanently delete emission record #${id}?`)) {
      try {
        await api.emissions.delete(id);
        showToast('info', 'Record Deleted', `Record #${id} removed from ledger`);
        fetchRecords();
      } catch (err: any) {
        showToast('error', 'Delete Failed', err.response?.data?.detail || 'Insufficient permissions');
      }
    }
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      await api.emissions.updateStatus(id, newStatus);
      showToast('success', 'Workflow State Updated', `Record #${id} marked as ${newStatus}`);
      fetchRecords();
    } catch (err: any) {
      showToast('error', 'Status Update Failed', err.response?.data?.detail || 'Unable to transition status');
    }
  };

  const handleViewLineage = async (rec: EmissionRecord) => {
    setLineageLoading(true);
    setLineageDrawerOpen(true);
    try {
      const res = await api.emissions.getLineage(rec.id);
      setActiveLineage(res.data);
    } catch (err) {
      console.error(err);
      showToast('error', 'Failed to retrieve audit lineage');
    } finally {
      setLineageLoading(false);
    }
  };

  const canApprove = user?.role === 'Admin' || user?.role === 'Sustainability Manager' || user?.role === 'Auditor';

  const columns: Column<EmissionRecord>[] = [
    {
      key: 'id',
      header: 'Record ID',
      sortable: true,
      className: 'w-20 font-mono text-xs',
      render: (r) => <span className="font-bold text-slate-900">#{r.id}</span>,
    },
    {
      key: 'facility_name',
      header: 'Facility',
      sortable: true,
      render: (r) => (
        <div>
          <p className="font-semibold text-slate-900 text-xs">{r.facility_name || `Facility #${r.facility_id}`}</p>
          <p className="text-[11px] text-slate-400">{r.department}</p>
        </div>
      ),
    },
    {
      key: 'scope',
      header: 'Scope',
      sortable: true,
      render: (r) => (
        <Badge
          variant={r.scope === 'Scope 1' ? 'amber' : r.scope === 'Scope 2' ? 'cyan' : 'blue'}
          size="sm"
        >
          {r.scope}
        </Badge>
      ),
    },
    {
      key: 'activity_type',
      header: 'Activity & Category',
      sortable: true,
      render: (r) => (
        <div>
          <p className="font-medium text-slate-900 text-xs">{r.activity_type}</p>
          <p className="text-[10px] text-slate-400">{r.category}</p>
        </div>
      ),
    },
    {
      key: 'activity_amount',
      header: 'Activity Data',
      sortable: true,
      render: (r) => (
        <span className="font-mono text-xs text-slate-700">
          {r.activity_amount.toLocaleString()} <span className="text-slate-400">{r.activity_unit}</span>
        </span>
      ),
    },
    {
      key: 'calculated_emissions',
      header: 'Calculated tCO2e',
      sortable: true,
      className: 'font-bold text-slate-900 font-mono text-xs',
      render: (r) => (
        <span className="inline-flex items-center gap-1 text-slate-900">
          {r.calculated_emissions.toLocaleString()} <span className="text-slate-400 font-normal">t</span>
        </span>
      ),
    },
    {
      key: 'reporting_month',
      header: 'Period',
      sortable: true,
      render: (r) => <span className="text-xs text-slate-600 font-medium">M{r.reporting_month} {r.reporting_year}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (r) => (
        <Badge
          variant={
            r.status === 'Approved'
              ? 'emerald'
              : r.status === 'Rejected'
              ? 'red'
              : r.status === 'Submitted'
              ? 'blue'
              : 'slate'
          }
          size="sm"
          dot
        >
          {r.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Audit & Actions',
      className: 'text-right',
      render: (r) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => handleViewLineage(r)}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 text-slate-500 transition"
            title="Inspect Data Lineage Formula"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleOpenEditModal(r)}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-500 transition"
            title="Edit Record"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          {canApprove && r.status !== 'Approved' && (
            <button
              onClick={() => handleStatusChange(r.id, 'Approved')}
              className="p-1.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition"
              title="Approve Record"
            >
              <CheckCircle className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => handleDeleteRecord(r.id)}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-400 transition"
            title="Delete Record"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <PageHeader
        title="Enterprise Carbon Accounting Ledger"
        subtitle="Audit-grade ledger tracking activity data, emission factor multiplication, uncertainty, and assurance statuses."
        badge={
          <Badge variant="emerald" dot>
            ISO 14064-1 Compliant
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Log Activity Record</span>
            </button>
          </div>
        }
      />

      {/* Scope and Filter Pills */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-subtle">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">Scope:</span>
          {['All', 'Scope 1', 'Scope 2', 'Scope 3'].map((sc) => (
            <button
              key={sc}
              onClick={() => setScopeFilter(sc)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
                scopeFilter === sc
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {sc}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">Status:</span>
          {['All', 'Approved', 'Submitted', 'Draft'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
                statusFilter === st
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        data={records}
        columns={columns}
        searchKey={(r) => `${r.activity_type} ${r.category} ${r.facility_name} ${r.scope}`}
        searchPlaceholder="Search by activity, category, facility..."
        pageSize={12}
        onRowClick={(r) => handleViewLineage(r)}
      />

      {/* Create / Edit Record Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRecord ? `Edit Emission Record #${editingRecord.id}` : 'Log Carbon Activity Record'}
        subtitle="Automatic conversion: Activity Amount × Emission Factor ÷ 1,000 = tCO2e"
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveRecord} className="space-y-4 text-xs">
          {/* Preset Factor Selector */}
          <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200/80 mb-3">
            <label className="block font-bold text-emerald-900 mb-1">
              Select Pre-Configured Emission Factor (Optional quick-fill)
            </label>
            <select
              onChange={(e) => handleFactorSelect(e.target.value)}
              className="w-full p-2 bg-white border border-emerald-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="">-- Choose from standard library --</option>
              {factors.map((f) => (
                <option key={f.id} value={f.factor_name}>
                  {f.scope}: {f.factor_name} ({f.factor_value} {f.unit})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Facility</label>
              <select
                value={formFacilityId}
                onChange={(e) => setFormFacilityId(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
              >
                {facilities.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Department</label>
              <input
                type="text"
                value={formDepartment}
                onChange={(e) => setFormDepartment(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
                placeholder="e.g. Operations, Logistics, HVAC"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Reporting Period</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={formYear}
                  onChange={(e) => setFormYear(Number(e.target.value))}
                  className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
                  placeholder="Year (e.g. 2024)"
                />
                <select
                  value={formMonth}
                  onChange={(e) => setFormMonth(Number(e.target.value))}
                  className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>
                      Month {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">GHG Scope</label>
              <select
                value={formScope}
                onChange={(e) => setFormScope(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
              >
                <option value="Scope 1">Scope 1 (Direct Combustion & Fleet)</option>
                <option value="Scope 2">Scope 2 (Purchased Electricity)</option>
                <option value="Scope 3">Scope 3 (Value Chain & Upstream)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Category</label>
              <input
                type="text"
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
                placeholder="e.g. Electricity, Natural Gas, Freight"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Activity Type</label>
              <input
                type="text"
                value={formActivityType}
                onChange={(e) => setFormActivityType(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
                placeholder="e.g. Grid Electricity, Fleet Diesel"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Activity Amount & Unit</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  step="any"
                  value={formAmount}
                  onChange={(e) => setFormAmount(Number(e.target.value))}
                  className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
                  placeholder="Amount"
                  required
                />
                <input
                  type="text"
                  value={formUnit}
                  onChange={(e) => setFormUnit(e.target.value)}
                  className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
                  placeholder="Unit (e.g. kWh, m3)"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Emission Factor Value & Unit</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  step="any"
                  value={formFactorValue}
                  onChange={(e) => setFormFactorValue(Number(e.target.value))}
                  className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
                  placeholder="Factor value"
                  required
                />
                <input
                  type="text"
                  value={formFactorUnit}
                  onChange={(e) => setFormFactorUnit(e.target.value)}
                  className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
                  placeholder="kgCO2e/unit"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Audit Notes & Reference</label>
            <textarea
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              rows={2}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
              placeholder="Utility invoice #, meter ID, or supplier manifest reference..."
            />
          </div>

          {/* Live Calculation Preview Banner */}
          <div className="p-3.5 rounded-xl bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold text-xs">Calculated Result:</span>
            </div>
            <span className="text-base font-extrabold text-emerald-400 font-mono">
              {((formAmount * formFactorValue) / 1000.0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}{' '}
              tCO2e
            </span>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
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
              {editingRecord ? 'Save Changes' : 'Commit Record to Ledger'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Data Lineage Drawer */}
      <Drawer
        isOpen={lineageDrawerOpen}
        onClose={() => setLineageDrawerOpen(false)}
        title="Audit-Grade Emission Data Lineage"
        subtitle={`Immutable lineage trace for Record #${activeLineage?.record_id}`}
        width="lg"
      >
        {lineageLoading || !activeLineage ? (
          <div className="py-20 text-center text-slate-400 text-xs">Loading lineage details...</div>
        ) : (
          <div className="space-y-6 text-xs text-slate-700">
            {/* Step by step lineage chain */}
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Step 1: Activity Data</span>
                <p className="text-base font-extrabold text-slate-900 mt-1">{activeLineage.activity_data}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Physical consumption telemetry extracted from utility bills & submeters.</p>
              </div>

              <div className="flex justify-center text-slate-400 font-bold">
                <span className="p-1 rounded-full bg-slate-100">×</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Step 2: Emission Factor</span>
                <p className="text-base font-extrabold text-slate-900 mt-1">
                  {activeLineage.emission_factor_value} {activeLineage.emission_factor_unit}
                </p>
                <div className="mt-2 space-y-1 text-[11px] text-slate-500">
                  <p><span className="font-semibold text-slate-700">Factor:</span> {activeLineage.emission_factor_name}</p>
                  <p><span className="font-semibold text-slate-700">Source:</span> {activeLineage.emission_factor_source}</p>
                  <p><span className="font-semibold text-slate-700">Version:</span> {activeLineage.emission_factor_version}</p>
                </div>
              </div>

              <div className="flex justify-center text-slate-400 font-bold">
                <span className="p-1 rounded-full bg-slate-100">=</span>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950">
                <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">Step 3: Calculated Greenhouse Gas Footprint</span>
                <p className="text-2xl font-black text-emerald-800 mt-1 font-mono">
                  {activeLineage.calculated_emissions_tco2e.toLocaleString()} tCO2e
                </p>
                <p className="text-[11px] text-emerald-700 mt-1 font-mono">{activeLineage.formula}</p>
              </div>
            </div>

            {/* Audit Quality & Verification Metadata */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider mb-2">Assurance & Metadata</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 text-[11px]">Uncertainty Factor:</span>
                  <p className="font-semibold text-slate-800">±{activeLineage.uncertainty_percentage}%</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">Data Quality Index:</span>
                  <p className="font-semibold text-slate-800">{activeLineage.data_quality_score}/100 (Tier-1)</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">Logged By:</span>
                  <p className="font-semibold text-slate-800 truncate">{activeLineage.recorded_by}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">Timestamp:</span>
                  <p className="font-semibold text-slate-800">{activeLineage.created_at}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">Assurance State:</span>
                  <div className="mt-0.5">
                    <Badge variant={activeLineage.verified_by_status === 'Approved' ? 'emerald' : 'blue'} size="sm">
                      {activeLineage.verified_by_status}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};
