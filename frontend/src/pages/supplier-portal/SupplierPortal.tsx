import React, { useState, useEffect } from 'react';
import {
  Truck,
  Send,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Zap,
  Target,
  FileText,
  Clock
} from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Supplier } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';

export const SupplierPortal: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);

  // Submission Form State
  const [s1, setS1] = useState<number>(1450);
  const [s2, setS2] = useState<number>(2100);
  const [s3, setS3] = useState<number>(3800);
  const [renewable, setRenewable] = useState<number>(40);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchSupplierProfile = async () => {
      setLoading(true);
      try {
        const res = await api.suppliers.getAll();
        if (res.data.length > 0) {
          // Default to Apex Precision Alloys or first
          setSupplier(res.data[0]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSupplierProfile();
  }, []);

  const handleSubmitEmissions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplier) return;
    setSubmitting(true);
    try {
      await api.suppliers.submitEmissions({
        supplier_id: supplier.id,
        reporting_year: 2024,
        scope1_tco2e: s1,
        scope2_tco2e: s2,
        scope3_tco2e: s3,
        renewable_pct: renewable,
        verification_status: 'Self-Reported',
        notes,
      });
      showToast('success', 'Emissions Submitted', 'Your corporate GHG submission was recorded');
    } catch (err: any) {
      showToast('error', 'Submission Failed', err.response?.data?.detail || 'Unable to record data');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Tier-1 Supplier Decarbonization Portal"
        subtitle={`Welcome, ${user?.full_name}. Submit annual GHG emissions telemetry and ESG questionnaires directly to Nexgile enterprise procurement.`}
        badge={
          <Badge variant="emerald" dot>
            Vendor Engagement Active
          </Badge>
        }
      />

      {/* Supplier Profile Overview */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-lg">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">{supplier?.name || 'Apex Precision Alloys Ltd'}</h2>
            <p className="text-xs text-slate-500">
              Vendor Code: <span className="font-mono font-bold text-slate-700">{supplier?.code || 'SUP-APEX'}</span> • Category: {supplier?.category || 'Raw Materials'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="emerald" size="md" dot>
            Status: {supplier?.engagement_status || 'Verified'}
          </Badge>
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-xl bg-slate-100 text-slate-700">
            ESG Score: {supplier?.data_quality_score || 94}/100
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Reported Footprint"
          value={`${supplier ? supplier.annual_emissions_tco2e.toLocaleString() : '18,450'} tCO2e`}
          subtitle="Scope 1 + Scope 2 total"
          icon={Target}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
        <StatCard
          title="Carbon Intensity"
          value={`${supplier?.carbon_intensity || 1.3} t/$1k`}
          subtitle="Emissions per unit spend"
          icon={Zap}
          iconBg="bg-teal-50"
          iconColor="text-teal-600"
        />
        <StatCard
          title="SBTi Commitment"
          value={supplier?.sbti_committed ? 'Approved 1.5°C' : 'In Progress'}
          subtitle={supplier?.target_status || 'Net Zero 2040 Target'}
          icon={CheckCircle2}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
      </div>

      {/* Direct Telemetry Submission Form */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-subtle max-w-3xl">
        <h3 className="text-base font-bold text-slate-900 mb-1">
          Annual Scope 1, 2, 3 GHG Telemetry Submission (FY2024)
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          Input your certified company greenhouse gas inventory to maintain Tier-1 Preferred Supplier status.
        </p>

        <form onSubmit={handleSubmitEmissions} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Scope 1 Direct (tCO2e)</label>
              <input
                type="number"
                step="any"
                required
                value={s1}
                onChange={(e) => setS1(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:bg-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Scope 2 Electricity (tCO2e)</label>
              <input
                type="number"
                step="any"
                required
                value={s2}
                onChange={(e) => setS2(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:bg-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Scope 3 Value Chain (tCO2e)</label>
              <input
                type="number"
                step="any"
                required
                value={s3}
                onChange={(e) => setS3(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Renewable Electricity Share (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                required
                value={renewable}
                onChange={(e) => setRenewable(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:bg-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Third-Party Auditor / Verifier</label>
              <input
                type="text"
                defaultValue="TUV Rheinland (ISO 14064-3)"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Submission Notes & Verification URL</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
              placeholder="Provide public CDP response URL or assurance certificate reference..."
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Telemetry to Procurement</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
