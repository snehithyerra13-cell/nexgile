import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  AlertCircle,
  ExternalLink,
  Globe,
  Database
} from 'lucide-react';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { EmissionFactor } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable, Column } from '../../components/common/DataTable';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';

export const Factors: React.FC = () => {
  const { showToast } = useToast();

  const [factors, setFactors] = useState<EmissionFactor[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [scopeFilter, setScopeFilter] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form
  const [formName, setFormName] = useState('');
  const [formActivityType, setFormActivityType] = useState('');
  const [formCategory, setFormCategory] = useState('Electricity');
  const [formScope, setFormScope] = useState('Scope 2');
  const [formGeography, setFormGeography] = useState('India');
  const [formUnit, setFormUnit] = useState('kgCO2e/kWh');
  const [formValue, setFormValue] = useState<number>(0.72);
  const [formSource, setFormSource] = useState('CEA / DEFRA');

  const fetchFactors = async () => {
    setLoading(true);
    try {
      const res = await api.factors.getAll({
        scope: scopeFilter !== 'All' ? scopeFilter : undefined,
      });
      setFactors(res.data);
    } catch (err) {
      console.error(err);
      showToast('error', 'Failed to load emission factors library');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFactors();
  }, [scopeFilter]);

  const handleCreateFactor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.factors.create({
        factor_name: formName,
        activity_type: formActivityType,
        category: formCategory,
        scope: formScope,
        geography: formGeography,
        unit: formUnit,
        factor_value: formValue,
        source: formSource,
        year: 2024,
        version: 'v1.0',
        valid_from: '2024-01-01',
        valid_until: '2025-12-31',
        is_demo: true,
      });
      showToast('success', 'Factor Created', `Custom factor '${formName}' added to library.`);
      setIsAddModalOpen(false);
      fetchFactors();
    } catch (err: any) {
      showToast('error', 'Failed to create factor', err.response?.data?.detail || 'Error saving factor');
    }
  };

  const columns: Column<EmissionFactor>[] = [
    {
      key: 'factor_name',
      header: 'Factor Name',
      sortable: true,
      render: (f) => (
        <div>
          <p className="font-bold text-slate-900 text-xs">{f.factor_name}</p>
          <p className="text-[11px] text-slate-500">{f.activity_type}</p>
        </div>
      ),
    },
    {
      key: 'scope',
      header: 'Scope',
      sortable: true,
      render: (f) => (
        <Badge
          variant={f.scope === 'Scope 1' ? 'amber' : f.scope === 'Scope 2' ? 'cyan' : 'blue'}
          size="sm"
        >
          {f.scope}
        </Badge>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      sortable: true,
      render: (f) => <span className="text-xs text-slate-700 font-medium">{f.category}</span>,
    },
    {
      key: 'factor_value',
      header: 'Factor Value & Unit',
      sortable: true,
      render: (f) => (
        <span className="font-mono text-xs font-bold text-slate-900">
          {f.factor_value} <span className="text-slate-400 font-normal">{f.unit}</span>
        </span>
      ),
    },
    {
      key: 'geography',
      header: 'Geography',
      sortable: true,
      render: (f) => (
        <span className="inline-flex items-center gap-1 text-xs text-slate-600">
          <Globe className="w-3 h-3 text-slate-400" />
          <span>{f.geography}</span>
        </span>
      ),
    },
    {
      key: 'source',
      header: 'Authority / Source',
      sortable: true,
      render: (f) => (
        <div>
          <p className="text-xs font-semibold text-slate-800">{f.source}</p>
          <p className="text-[10px] text-slate-400">{f.version} ({f.year})</p>
        </div>
      ),
    },
    {
      key: 'is_demo',
      header: 'Type',
      render: () => (
        <Badge variant="slate" size="sm">
          Demo Reference
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Emission Factor Reference Library"
        subtitle="Curated, standardized GHG conversion factors mapped across GHG Protocol, DEFRA, US EPA, and regional power grids."
        badge={
          <Badge variant="emerald" dot>
            Library v2024.2
          </Badge>
        }
        actions={
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Custom Factor</span>
          </button>
        }
      />

      {/* Demonstration Data Disclaimer Banner */}
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3 shadow-xs">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed">
          <p className="font-bold text-amber-950">DEMONSTRATION DATA DISCLAIMER</p>
          <p className="mt-0.5 text-amber-800">
            Emission factors included in this demonstration are illustrative values modeled after official
            scientific authorities (CEA India, UK DEFRA, IPCC AR5, IEA). They are provided for testing,
            validation, and architecture demonstrations, and should not be used for certified regulatory compliance.
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 p-3 bg-white rounded-2xl border border-slate-200 shadow-subtle">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2">Scope Filter:</span>
        {['All', 'Scope 1', 'Scope 2', 'Scope 3'].map((sc) => (
          <button
            key={sc}
            onClick={() => setScopeFilter(sc)}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
              scopeFilter === sc
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {sc}
          </button>
        ))}
      </div>

      {/* Factors Table */}
      <DataTable
        data={factors}
        columns={columns}
        searchKey={(f) => `${f.factor_name} ${f.activity_type} ${f.category} ${f.source} ${f.geography}`}
        searchPlaceholder="Search factor by name, fuel type, source..."
        pageSize={10}
      />

      {/* Add Factor Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Custom Emission Factor"
        subtitle="Register custom supplier-specific or lab-measured conversion coefficient"
      >
        <form onSubmit={handleCreateFactor} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Factor Name</label>
            <input
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
              placeholder="e.g. On-Site Biomass Boiler Briquettes"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Activity Type</label>
              <input
                type="text"
                required
                value={formActivityType}
                onChange={(e) => setFormActivityType(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
                placeholder="e.g. Biomass Briquettes"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Category</label>
              <input
                type="text"
                required
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
                placeholder="e.g. Stationary Combustion"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Scope</label>
              <select
                value={formScope}
                onChange={(e) => setFormScope(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
              >
                <option value="Scope 1">Scope 1</option>
                <option value="Scope 2">Scope 2</option>
                <option value="Scope 3">Scope 3</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Geography</label>
              <input
                type="text"
                value={formGeography}
                onChange={(e) => setFormGeography(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
                placeholder="e.g. India, US, Global"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Factor Value</label>
              <input
                type="number"
                step="any"
                required
                value={formValue}
                onChange={(e) => setFormValue(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Unit</label>
              <input
                type="text"
                required
                value={formUnit}
                onChange={(e) => setFormUnit(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
                placeholder="e.g. kgCO2e/kg"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Citation / Source</label>
            <input
              type="text"
              value={formSource}
              onChange={(e) => setFormSource(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
              placeholder="e.g. Laboratory Calorimetric Test 2024"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm"
            >
              Save Emission Factor
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
