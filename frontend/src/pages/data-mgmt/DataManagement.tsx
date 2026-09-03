import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  Download,
  FileCheck,
  AlertCircle,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  ArrowRight,
  RefreshCw,
  Info
} from 'lucide-react';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { PageHeader } from '../../components/common/PageHeader';
import { Badge } from '../../components/common/Badge';

export const DataManagement: React.FC = () => {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<any | null>(null);
  const [committing, setCommitting] = useState(false);
  const [importDone, setImportDone] = useState(false);

  const handleDownloadSample = () => {
    window.open(api.dataManagement.downloadSampleCsvUrl(), '_blank');
    showToast('success', 'Template Downloaded', 'DecarbX_Activity_Data_Template.csv saved');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setImportDone(false);
      await validateFile(file);
    }
  };

  const validateFile = async (file: File) => {
    setValidating(true);
    try {
      const res = await api.dataManagement.validateCsv(file);
      setValidationResult(res.data);
      if (res.data.success) {
        showToast(
          'info',
          'CSV Validated',
          `Parsed ${res.data.total_rows} rows: ${res.data.valid_count} valid, ${res.data.invalid_count} rejected`
        );
      } else {
        showToast('error', 'Validation Error', res.data.error || 'Failed to parse CSV schema');
      }
    } catch (err: any) {
      showToast('error', 'Upload Error', err.response?.data?.detail || 'Failed to process file');
      setValidationResult(null);
    } finally {
      setValidating(false);
    }
  };

  const handleCommitImport = async () => {
    if (!validationResult || validationResult.valid_rows.length === 0) return;
    setCommitting(true);
    try {
      const res = await api.dataManagement.commitImport(validationResult.valid_rows);
      showToast('success', 'Import Succeeded', res.data.message);
      setImportDone(true);
      setValidationResult(null);
      setSelectedFile(null);
    } catch (err: any) {
      showToast('error', 'Import Failed', err.response?.data?.detail || 'Unable to commit records');
    } finally {
      setCommitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Enterprise Data Management & Bulk Ingestion"
        subtitle="Batch ingestion pipeline for utility meter data, ERP activity logs, and logistics invoices with schema validation."
        badge={
          <Badge variant="emerald" dot>
            CSV Validation Engine
          </Badge>
        }
        actions={
          <button
            onClick={handleDownloadSample}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Download CSV Template</span>
          </button>
        }
      />

      {/* Upload Zone */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-subtle text-center">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
        />

        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-10 cursor-pointer transition bg-slate-50/50 hover:bg-emerald-50/30 flex flex-col items-center justify-center group"
        >
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 group-hover:scale-110 flex items-center justify-center transition shadow-xs">
            <UploadCloud className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mt-4">
            Upload Activity Data CSV Spreadsheet
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            Drag and drop or click to browse. Supports Scope 1 combustion, Scope 2 electricity, and Scope 3 freight.
          </p>

          <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-emerald-600">
            <span>Standard columns: facility_code, year, month, scope, category, activity_amount, emission_factor</span>
          </div>
        </div>

        {validating && (
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
            <span>Parsing rows and verifying facility codes...</span>
          </div>
        )}
      </div>

      {/* Success Notification Banner */}
      {importDone && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="text-xs">
            <p className="font-bold text-emerald-950">Bulk Ingestion Successfully Committed</p>
            <p className="text-emerald-800">
              New activity rows are now recorded into the live enterprise carbon ledger and reflected across all dashboards.
            </p>
          </div>
        </div>
      )}

      {/* Validation Preview Section */}
      {validationResult && (
        <div className="space-y-6">
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-subtle">
              <span className="text-xs font-bold text-slate-500 uppercase">Total Rows Parsed</span>
              <p className="text-2xl font-extrabold text-slate-900 font-mono mt-1">
                {validationResult.total_rows}
              </p>
            </div>
            <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 shadow-subtle">
              <span className="text-xs font-bold text-emerald-800 uppercase">Valid Ready to Ingest</span>
              <p className="text-2xl font-extrabold text-emerald-700 font-mono mt-1">
                {validationResult.valid_count} rows
              </p>
            </div>
            <div className="bg-rose-50/70 p-4 rounded-2xl border border-rose-200 shadow-subtle">
              <span className="text-xs font-bold text-rose-800 uppercase">Rejected Rows</span>
              <p className="text-2xl font-extrabold text-rose-700 font-mono mt-1">
                {validationResult.invalid_count} errors
              </p>
            </div>
          </div>

          {/* Valid rows preview table */}
          {validationResult.valid_count > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-subtle">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Validated Records ({validationResult.valid_count})</span>
                  </h3>
                  <p className="text-xs text-slate-500">Ready to commit into enterprise emissions database</p>
                </div>
                <button
                  onClick={handleCommitImport}
                  disabled={committing}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition disabled:opacity-50"
                >
                  {committing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
                  <span>Commit {validationResult.valid_count} Records</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                      <th className="py-2.5 px-3">Row</th>
                      <th className="py-2.5 px-3">Facility</th>
                      <th className="py-2.5 px-3">Scope</th>
                      <th className="py-2.5 px-3">Activity</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3">Factor</th>
                      <th className="py-2.5 px-3">Emissions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {validationResult.valid_rows.slice(0, 8).map((r: any) => (
                      <tr key={r.row_index} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-3 font-mono text-slate-400">#{r.row_index}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">{r.facility_code}</td>
                        <td className="py-2.5 px-3">{r.scope}</td>
                        <td className="py-2.5 px-3">{r.activity_type}</td>
                        <td className="py-2.5 px-3 font-mono">{r.activity_amount} {r.activity_unit}</td>
                        <td className="py-2.5 px-3 font-mono">{r.emission_factor_value} {r.emission_factor_unit}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-emerald-700">
                          {r.calculated_emissions} tCO2e
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Invalid rows preview table */}
          {validationResult.invalid_count > 0 && (
            <div className="bg-white rounded-2xl border border-rose-200 p-6 shadow-subtle">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-rose-900 flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-rose-600" />
                  <span>Rejected Records Requiring Correction ({validationResult.invalid_count})</span>
                </h3>
                <p className="text-xs text-rose-700">These rows failed schema validation and will not be imported</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-rose-200 bg-rose-50/60 text-rose-900 font-semibold uppercase tracking-wider text-[10px]">
                      <th className="py-2.5 px-3">Row</th>
                      <th className="py-2.5 px-3">Facility</th>
                      <th className="py-2.5 px-3">Activity</th>
                      <th className="py-2.5 px-3">Validation Errors</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rose-100 font-medium">
                    {validationResult.invalid_rows.map((r: any) => (
                      <tr key={r.row_index} className="bg-rose-50/20">
                        <td className="py-2.5 px-3 font-mono text-slate-500">#{r.row_index}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-800">{r.facility_code || 'MISSING'}</td>
                        <td className="py-2.5 px-3">{r.activity_type || 'Unspecified'}</td>
                        <td className="py-2.5 px-3 text-rose-600 font-semibold">
                          {r.errors.join(' • ')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
