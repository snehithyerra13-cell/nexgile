import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Printer,
  Calendar,
  Layers,
  Building,
  CheckCircle2,
  RefreshCw,
  FileSpreadsheet,
  FileCode
} from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { PageHeader } from '../../components/common/PageHeader';
import { Badge } from '../../components/common/Badge';

export const Reports: React.FC = () => {
  const { selectedYear } = useAuth();
  const { showToast } = useToast();

  const [reportType, setReportType] = useState('corporate_ghg_inventory');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const reportTypes = [
    { id: 'corporate_ghg_inventory', name: 'Corporate GHG Inventory (Full Scope)', desc: 'Executive greenhouse gas emissions balance sheet' },
    { id: 'scope1', name: 'Scope 1 Direct Combustion Report', desc: 'Boiler fuels, backup diesel, and fleet telemetry' },
    { id: 'scope2', name: 'Scope 2 Purchased Electricity Ledger', desc: 'Grid location-based regional power usage' },
    { id: 'scope3', name: 'Scope 3 Value Chain & Supply Chain', desc: 'Purchased goods, logistics freight, and travel' },
    { id: 'product_pcf', name: 'Product Carbon Footprint (PCF) Audit', desc: 'Cradle-to-grave ISO 14067 product disclosures' },
    { id: 'supplier_sustainability', name: 'Supplier Decarbonization Scorecards', desc: 'Tier-1 vendor audit scores and SBTi status' },
    { id: 'reduction_progress', name: 'Decarbonization Roadmap & MACC', desc: 'Project capital expenditure and abatement yields' },
    { id: 'compliance_readiness', name: 'CSRD / CBAM / TCFD Compliance Readiness', desc: 'Statutory framework completion status' },
  ];

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await api.reports.preview(reportType, selectedYear);
      setReportData(res.data);
    } catch (err) {
      console.error(err);
      showToast('error', 'Failed to generate report preview');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType, selectedYear]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJson = () => {
    window.open(api.reports.exportJsonUrl(reportType, selectedYear), '_blank');
    showToast('success', 'Exporting JSON', 'Report generated successfully');
  };

  const handleDownloadCsv = () => {
    window.open(api.reports.exportCsvUrl(reportType, selectedYear), '_blank');
    showToast('success', 'Exporting CSV', 'Spreadsheet generated successfully');
  };

  const lineItems = reportData?.line_items || [];
  const lineHeaders = lineItems.length > 0 ? Object.keys(lineItems[0]) : [];

  return (
    <div className="space-y-6 pb-12">
      <div className="print:hidden">
        <PageHeader
          title="Sustainability & ESG Compliance Reports"
          subtitle="Generate audit-ready corporate inventories, ISO 14064 carbon disclosures, and export to CSV or JSON."
          badge={
            <Badge variant="emerald" dot>
              Statutory Reporting Engine
            </Badge>
          }
          actions={
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadCsv}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={handleDownloadJson}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs"
              >
                <FileCode className="w-3.5 h-3.5 text-blue-600" />
                <span>Export JSON</span>
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Document</span>
              </button>
            </div>
          }
        />

        {/* Report Selector Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {reportTypes.map((t) => {
            const isSelected = reportType === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setReportType(t.id)}
                className={`p-3.5 rounded-2xl border text-left transition ${
                  isSelected
                    ? 'bg-emerald-50/50 border-emerald-500 shadow-sm'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <p className={`text-xs font-bold ${isSelected ? 'text-emerald-900' : 'text-slate-900'}`}>{t.name}</p>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{t.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Printable Report Preview Document */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-card max-w-5xl mx-auto print:border-none print:shadow-none print:p-0">
        {/* Corporate Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-xs">
                NX
              </div>
              <span className="font-extrabold text-sm text-slate-900 tracking-tight">
                Nexgile Technologies Global Corp
              </span>
            </div>
            <h1 className="text-xl font-black text-slate-900 mt-2">{reportData?.title || 'Corporate Report'}</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Standards: {reportData?.standards_followed || 'GHG Protocol Corporate Standard (ISO 14064)'}
            </p>
          </div>

          <div className="text-right text-xs text-slate-500 space-y-1">
            <p><strong>Generated:</strong> {reportData?.generated_at || 'Live Telemetry'}</p>
            <p><strong>Reporting Period:</strong> FY{selectedYear}</p>
            <Badge variant="emerald" size="sm" dot>
              Audit Approved
            </Badge>
          </div>
        </div>

        {/* Executive Summary Metrics if present */}
        {reportData?.summary && (
          <div className="my-6 p-4 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold">Total Emissions</span>
              <p className="text-xl font-black text-slate-900 font-mono mt-0.5">
                {reportData.summary.total_emissions_tco2e?.toLocaleString()} tCO2e
              </p>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold">Scope 1 (Direct)</span>
              <p className="text-lg font-bold text-amber-700 font-mono mt-0.5">
                {reportData.summary.scope1_tco2e?.toLocaleString()} tCO2e
              </p>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold">Scope 2 (Power)</span>
              <p className="text-lg font-bold text-teal-700 font-mono mt-0.5">
                {reportData.summary.scope2_location_based_tco2e?.toLocaleString()} tCO2e
              </p>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold">Scope 3 (Chain)</span>
              <p className="text-lg font-bold text-blue-700 font-mono mt-0.5">
                {reportData.summary.scope3_value_chain_tco2e?.toLocaleString()} tCO2e
              </p>
            </div>
          </div>
        )}

        {/* Line Items Table */}
        <div className="mt-6">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            Itemized Activity Telemetry & Disclosure Ledger ({lineItems.length} Records)
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                  {lineHeaders.map((h) => (
                    <th key={h} className="py-2.5 px-3 capitalize">
                      {h.replace(/_/g, ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {loading ? (
                  <tr>
                    <td colSpan={lineHeaders.length || 1} className="py-10 text-center text-slate-400">
                      Generating structured report ledger...
                    </td>
                  </tr>
                ) : lineItems.length === 0 ? (
                  <tr>
                    <td colSpan={lineHeaders.length || 1} className="py-8 text-center text-slate-400">
                      No records found for selected period.
                    </td>
                  </tr>
                ) : (
                  lineItems.map((row: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/70">
                      {lineHeaders.map((h) => (
                        <td key={h} className="py-2.5 px-3 text-slate-800">
                          {typeof row[h] === 'number' ? row[h].toLocaleString() : String(row[h])}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sign-off Assurance Block */}
        <div className="mt-12 pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-xs text-slate-500">
          <div>
            <p className="font-bold text-slate-800">Prepared By:</p>
            <p className="mt-1">Corporate Carbon Accounting & Sustainability Office</p>
            <p className="text-[11px] text-slate-400 mt-4">Verified digital stamp: SHA256-NXG-2024-CERT</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-slate-800">Authorized Officer:</p>
            <p className="mt-1">Chief Sustainability & Compliance Officer</p>
            <p className="text-[11px] text-emerald-600 font-semibold mt-4">✓ Approved for Statutory ESG Release</p>
          </div>
        </div>
      </div>
    </div>
  );
};
