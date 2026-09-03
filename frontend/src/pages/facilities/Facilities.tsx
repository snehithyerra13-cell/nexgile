import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  MapPin,
  Users,
  Maximize2,
  Zap,
  TrendingDown,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { Facility } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';

export const Facilities: React.FC = () => {
  const { showToast } = useToast();

  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [city, setCity] = useState('');
  const [type, setType] = useState('Manufacturing Plant');
  const [floorArea, setFloorArea] = useState<number>(25000);
  const [employees, setEmployees] = useState<number>(300);
  const [grid, setGrid] = useState('Southern Regional Grid');

  const fetchFacilities = async () => {
    setLoading(true);
    try {
      const res = await api.facilities.getAll();
      setFacilities(res.data);
    } catch (err) {
      console.error(err);
      showToast('error', 'Failed to load facilities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacilities();
  }, []);

  const handleCreateFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.facilities.create({
        name,
        code: code.toUpperCase(),
        country: 'India',
        city,
        facility_type: type,
        floor_area_sqm: floorArea,
        employee_count: employees,
        grid_region: grid,
        is_active: true,
      });
      showToast('success', 'Facility Created', `Successfully added ${name} (${code})`);
      setIsModalOpen(false);
      fetchFacilities();
    } catch (err: any) {
      showToast('error', 'Failed to create facility', err.response?.data?.detail || 'Error saving facility');
    }
  };

  const totalArea = facilities.reduce((sum, f) => sum + f.floor_area_sqm, 0);
  const totalEmployees = facilities.reduce((sum, f) => sum + f.employee_count, 0);
  const totalEmissions = facilities.reduce((sum, f) => sum + (f.total_emissions_tco2e || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Facilities & Organizational Hierarchy"
        subtitle="Operational sites, cleanrooms, regional logistics hubs, and physical carbon intensity footprints."
        badge={
          <Badge variant="emerald" dot>
            {facilities.length} Active Facilities
          </Badge>
        }
        actions={
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Facility</span>
          </button>
        }
      />

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Built Floor Area"
          value={`${totalArea.toLocaleString()} m²`}
          subtitle="Cumulative operational footprint"
          icon={Maximize2}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          title="Total Corporate Workforce"
          value={`${totalEmployees.toLocaleString()} Staff`}
          subtitle="Across manufacturing & labs"
          icon={Users}
          iconBg="bg-teal-50"
          iconColor="text-teal-600"
        />
        <StatCard
          title="Average Carbon Intensity"
          value={`${(totalEmissions > 0 ? (totalEmissions * 1000) / totalArea : 158.4).toFixed(1)} kg/m²`}
          subtitle="Annual emissions per square meter"
          icon={TrendingDown}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
      </div>

      {/* Facilities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {facilities.map((fac) => (
          <div
            key={fac.id}
            className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-subtle hover:shadow-card hover:border-slate-300 transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {fac.code}
                  </span>
                  <Badge variant="emerald" size="sm" dot>
                    Active
                  </Badge>
                </div>
              </div>

              <h3 className="text-sm font-bold text-slate-900 tracking-tight leading-snug">{fac.name}</h3>
              <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{fac.city}, {fac.country}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">{fac.facility_type}</p>

              {/* Facility Metrics Matrix */}
              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 text-[11px]">Floor Area:</span>
                  <p className="font-bold text-slate-800">{fac.floor_area_sqm.toLocaleString()} m²</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">Workforce:</span>
                  <p className="font-bold text-slate-800">{fac.employee_count} employees</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">Total Emissions:</span>
                  <p className="font-bold text-slate-900 font-mono">
                    {fac.total_emissions_tco2e ? fac.total_emissions_tco2e.toLocaleString() : '—'} t
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">Area Intensity:</span>
                  <p className="font-bold text-emerald-700 font-mono">
                    {fac.carbon_intensity_sqm || '—'} kg/m²
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
              <span className="truncate">{fac.grid_region}</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            </div>
          </div>
        ))}
      </div>

      {/* Add Facility Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Corporate Facility"
        subtitle="Register a new site, warehouse, manufacturing hub or lab into the corporate boundary"
      >
        <form onSubmit={handleCreateFacility} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Facility Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
              placeholder="e.g. Gurugram Technology Campus"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Facility Code</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white font-mono uppercase"
                placeholder="FAC-GGN"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">City</label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
                placeholder="Gurugram"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Facility Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
              >
                <option value="Manufacturing Plant">Manufacturing Plant</option>
                <option value="Electronic Assembly">Electronic Assembly</option>
                <option value="Distribution Hub">Distribution Hub</option>
                <option value="Logistics Warehouse">Logistics Warehouse</option>
                <option value="Research & Innovation Lab">Research & Innovation Lab</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Grid Region</label>
              <input
                type="text"
                value={grid}
                onChange={(e) => setGrid(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
                placeholder="Northern Regional Grid (NR-CEA)"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Floor Area (m²)</label>
              <input
                type="number"
                required
                value={floorArea}
                onChange={(e) => setFloorArea(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Employee Count</label>
              <input
                type="number"
                required
                value={employees}
                onChange={(e) => setEmployees(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
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
              Save Facility
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
