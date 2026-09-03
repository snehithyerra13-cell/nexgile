import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Award,
  Activity,
  Check,
  Clock,
  FileSpreadsheet
} from 'lucide-react';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { DataQualityMetric, DataQualityIssue } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';

export const DataQuality: React.FC = () => {
  const { showToast } = useToast();

  const [metrics, setMetrics] = useState<DataQualityMetric | null>(null);
  const [issues, setIssues] = useState<DataQualityIssue[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [mRes, iRes] = await Promise.all([
        api.dataQuality.getMetrics(),
        api.dataQuality.getIssues(),
      ]);
      setMetrics(mRes.data);
      setIssues(iRes.data);
    } catch (err) {
      console.error(err);
      showToast('error', 'Failed to load data quality telemetry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleResolve = async (id: number) => {
    try {
      await api.dataQuality.resolveIssue(id);
      showToast('success', 'Issue Resolved', 'Data quality anomaly marked as resolved');
      fetchData();
    } catch (err) {
      showToast('error', 'Failed to resolve issue');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Data Quality & Assurance Telemetry"
        subtitle="Continuous data hygiene monitoring across activity completeness, meter validity, and supplier assurance."
        badge={
          <Badge variant="emerald" dot>
            Quality Index: {metrics?.overall_score || 92}/100
          </Badge>
        }
      />

      {/* Main KPI Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Overall Quality Score"
          value={`${metrics?.overall_score || 92}/100`}
          subtitle="Blended 5-dimension index"
          change="Grade A (Assurable)"
          trend="up"
          isPositiveChangeGood={true}
          icon={Award}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard
          title="Completeness Index"
          value={`${metrics?.completeness || 94.5}%`}
          subtitle="Active meter & bill coverage"
          change="Zero missing months"
          trend="up"
          isPositiveChangeGood={true}
          icon={CheckCircle2}
          iconBg="bg-teal-50"
          iconColor="text-teal-600"
        />
        <StatCard
          title="Validity & Verification"
          value={`${metrics?.validity || 96.2}%`}
          subtitle="Schema & unit compliance"
          change="Standard factors"
          trend="up"
          isPositiveChangeGood={true}
          icon={ShieldCheck}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          title="Estimated Records"
          value={`${metrics?.estimated_records_pct || 12.5}%`}
          subtitle="Derived via secondary proxy"
          change="Goal: <10%"
          trend="down"
          icon={Activity}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
      </div>

      {/* 5 Dimensions Breakdown Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-subtle">
        <h3 className="text-base font-bold text-slate-900 mb-1">GHG Data Assurance Dimensions</h3>
        <p className="text-xs text-slate-500 mb-6">Benchmarked against ISO 14064-3 and GHG Protocol quality guidelines</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: 'Completeness', score: metrics?.completeness || 94.5, desc: 'Coverage of all active facility scopes' },
            { label: 'Validity', score: metrics?.validity || 96.2, desc: 'Accredited factors and verified units' },
            { label: 'Consistency', score: metrics?.consistency || 91.8, desc: 'Temporal alignment across reporting periods' },
            { label: 'Timeliness', score: metrics?.timeliness || 89.0, desc: 'Reporting latency under 30 days' },
            { label: 'Verified Share', score: metrics?.verified_records_pct || 87.5, desc: 'Primary meter & invoice backed' },
          ].map((dim, idx) => (
            <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900">{dim.label}</span>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{dim.desc}</p>
              </div>
              <div className="mt-4 pt-2 border-t border-slate-200">
                <span className="text-xl font-black text-emerald-700 font-mono">{dim.score}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Data Quality Issues & Anomaly Tracker */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-subtle">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Data Quality Warnings & Remediation Queue</span>
            </h3>
            <p className="text-xs text-slate-500">Unverified logs, estimated meter readings, and factor mapping warnings</p>
          </div>
          <Badge variant="amber" size="sm">
            {issues.filter((i) => i.status === 'Open').length} Open Issues
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Issue Type</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Entity Type</th>
                <th className="py-3 px-4">Description & Audit Diagnostics</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {issues.map((issue) => (
                <tr key={issue.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{issue.issue_type}</td>
                  <td className="py-3.5 px-4">
                    <Badge variant={issue.severity === 'High' ? 'red' : 'amber'} size="sm">
                      {issue.severity}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">{issue.entity_type}</td>
                  <td className="py-3.5 px-4 text-slate-700 max-w-md">{issue.description}</td>
                  <td className="py-3.5 px-4">
                    <Badge variant={issue.status === 'Resolved' ? 'emerald' : 'blue'} size="sm" dot>
                      {issue.status}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {issue.status !== 'Resolved' ? (
                      <button
                        onClick={() => handleResolve(issue.id)}
                        className="px-2.5 py-1 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold transition"
                      >
                        Resolve
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-medium">Closed</span>
                    )}
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
