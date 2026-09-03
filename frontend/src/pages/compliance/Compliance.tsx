import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  FileCheck,
  AlertCircle,
  ExternalLink,
  Calendar,
  UserCheck,
  FileText,
  Paperclip
} from 'lucide-react';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { ComplianceFramework, ComplianceRequirement } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { Badge } from '../../components/common/Badge';

export const Compliance: React.FC = () => {
  const { showToast } = useToast();

  const [frameworks, setFrameworks] = useState<ComplianceFramework[]>([]);
  const [selectedFramework, setSelectedFramework] = useState<ComplianceFramework | null>(null);
  const [requirements, setRequirements] = useState<ComplianceRequirement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFrameworks = async () => {
    setLoading(true);
    try {
      const res = await api.compliance.getFrameworks();
      setFrameworks(res.data);
      if (res.data.length > 0 && !selectedFramework) {
        setSelectedFramework(res.data[0]);
        setRequirements(res.data[0].requirements || []);
      } else if (selectedFramework) {
        const found = res.data.find((f) => f.id === selectedFramework.id);
        if (found) {
          setSelectedFramework(found);
          setRequirements(found.requirements || []);
        }
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Failed to load compliance frameworks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFrameworks();
  }, []);

  const handleSelectFramework = (f: ComplianceFramework) => {
    setSelectedFramework(f);
    setRequirements(f.requirements || []);
  };

  const handleToggleStatus = async (req: ComplianceRequirement, newStatus: string) => {
    try {
      await api.compliance.updateRequirement(req.id, {
        status: newStatus,
        completion_pct: newStatus === 'Completed' ? 100.0 : newStatus === 'In Progress' ? 60.0 : 0.0,
      });
      showToast('success', 'Disclosure Updated', `${req.disclosure_code} marked as ${newStatus}`);
      fetchFrameworks();
    } catch (err) {
      showToast('error', 'Update Failed');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Regulatory Compliance & Assurance Readiness"
        subtitle="Track readiness across European CSRD / ESRS, CBAM border tariffs, TCFD, and CDP disclosure obligations."
        badge={
          <Badge variant="emerald" dot>
            7 Global Frameworks
          </Badge>
        }
      />

      {/* Demonstration Legal Disclaimer */}
      <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs flex items-center gap-2.5">
        <AlertCircle className="w-4 h-4 text-slate-500 shrink-0" />
        <span>
          <strong>Assurance Notice:</strong> DecarbX tracks disclosure completion workflows for demonstration purposes.
          Final statutory assurance requires accredited independent Third-Party verification (e.g. ISO 14064-3 / ISAE 3000).
        </span>
      </div>

      {/* Frameworks Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {frameworks.map((f) => {
          const isSelected = selectedFramework?.id === f.id;
          return (
            <div
              key={f.id}
              onClick={() => handleSelectFramework(f)}
              className={`p-5 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
                isSelected
                  ? 'bg-emerald-50/40 border-emerald-500 shadow-card'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-subtle'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-slate-900 text-white">
                    {f.code}
                  </span>
                  <Badge
                    variant={
                      f.status === 'Compliant'
                        ? 'emerald'
                        : f.status === 'In Progress'
                        ? 'blue'
                        : f.status === 'At Risk'
                        ? 'red'
                        : 'slate'
                    }
                    size="sm"
                    dot
                  >
                    {f.status}
                  </Badge>
                </div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight leading-snug">{f.name}</h3>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{f.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-500 font-medium">Readiness:</span>
                  <span className="font-bold text-slate-900 font-mono">{f.completion_pct}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full transition-all"
                    style={{ width: `${f.completion_pct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 font-medium">
                  <span>Due: {f.due_date}</span>
                  <span>{f.completed_requirements}/{f.total_requirements} Done</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Disclosure Requirements Table */}
      {selectedFramework && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-subtle">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                  {selectedFramework.code}
                </span>
                <h2 className="text-base font-bold text-slate-900">{selectedFramework.name} — Disclosure Checklist</h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Responsible Lead: <strong className="text-slate-800">{selectedFramework.owner}</strong> • Statutory Filing Due: <strong className="text-slate-800">{selectedFramework.due_date}</strong>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Completion: {selectedFramework.completion_pct}%</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Disclosure Code</th>
                  <th className="py-3 px-4">Requirement Title</th>
                  <th className="py-3 px-4">Domain</th>
                  <th className="py-3 px-4">Owner</th>
                  <th className="py-3 px-4">Evidence</th>
                  <th className="py-3 px-4">Progress</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Quick Toggle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {requirements.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{req.disclosure_code}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-800 max-w-xs">{req.disclosure_name}</td>
                    <td className="py-3.5 px-4 text-slate-500">{req.category}</td>
                    <td className="py-3.5 px-4 text-slate-600">{req.owner}</td>
                    <td className="py-3.5 px-4">
                      {req.evidence_available ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                          <Paperclip className="w-3 h-3 text-emerald-600" />
                          Attached
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">None</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                      {req.completion_pct}%
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          req.status === 'Completed'
                            ? 'emerald'
                            : req.status === 'In Progress'
                            ? 'blue'
                            : req.status === 'Ready for Review'
                            ? 'purple'
                            : 'slate'
                        }
                        size="sm"
                        dot
                      >
                        {req.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {req.status !== 'Completed' ? (
                          <button
                            onClick={() => handleToggleStatus(req, 'Completed')}
                            className="px-2.5 py-1 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold transition"
                          >
                            Mark Completed
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleStatus(req, 'In Progress')}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 text-[11px] font-medium transition"
                          >
                            Re-open
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
