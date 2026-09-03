import React, { useState, useEffect } from 'react';
import {
  FolderLock,
  Plus,
  FileCheck,
  Paperclip,
  CheckCircle2,
  Clock,
  AlertTriangle,
  UploadCloud,
  FileText
} from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Evidence } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable, Column } from '../../components/common/DataTable';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';

export const EvidencePage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState('Utility Bill');
  const [recordType, setRecordType] = useState('EmissionRecord');
  const [recordId, setRecordId] = useState('1');
  const [notes, setNotes] = useState('');

  const fetchEvidence = async () => {
    setLoading(true);
    try {
      const res = await api.evidence.getAll();
      setEvidenceList(res.data);
    } catch (err) {
      console.error(err);
      showToast('error', 'Failed to load evidence repository');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvidence();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.evidence.create({
        file_name: fileName,
        file_type: fileType,
        related_record_type: recordType,
        related_record_id: recordId,
        notes,
      });
      showToast('success', 'Document Attached', `${fileName} logged in evidence repository`);
      setIsModalOpen(false);
      fetchEvidence();
    } catch (err) {
      showToast('error', 'Upload failed');
    }
  };

  const handleVerify = async (id: number, status: string) => {
    try {
      await api.evidence.verify(id, status);
      showToast('success', 'Status Updated', `Document #${id} marked as ${status}`);
      fetchEvidence();
    } catch (err) {
      showToast('error', 'Verification update failed');
    }
  };

  const isAuditorOrAdmin = user?.role === 'Admin' || user?.role === 'Auditor' || user?.role === 'Sustainability Manager';

  const columns: Column<Evidence>[] = [
    {
      key: 'file_name',
      header: 'Document File Name',
      sortable: true,
      render: (e) => (
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
            <Paperclip className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <p className="font-bold text-slate-900 text-xs">{e.file_name}</p>
            <p className="text-[11px] text-slate-400 font-mono">{e.file_size_kb} KB • {e.file_type}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'related_record_type',
      header: 'Related Resource',
      sortable: true,
      render: (e) => (
        <span className="font-mono text-xs text-slate-700">
          {e.related_record_type} #{e.related_record_id || '—'}
        </span>
      ),
    },
    {
      key: 'uploaded_by',
      header: 'Uploaded By',
      sortable: true,
      render: (e) => <span className="text-xs text-slate-800 font-semibold">{e.uploaded_by}</span>,
    },
    {
      key: 'upload_date',
      header: 'Date Uploaded',
      sortable: true,
      render: (e) => (
        <span className="text-xs text-slate-500 font-mono">
          {new Date(e.upload_date).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'verification_status',
      header: 'Assurance Status',
      sortable: true,
      render: (e) => (
        <Badge
          variant={e.verification_status === 'Verified' ? 'emerald' : e.verification_status === 'Flagged' ? 'red' : 'blue'}
          size="sm"
          dot
        >
          {e.verification_status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Auditor Action',
      className: 'text-right',
      render: (e) => (
        <div className="flex items-center justify-end gap-1.5">
          {isAuditorOrAdmin && e.verification_status !== 'Verified' && (
            <button
              onClick={() => handleVerify(e.id, 'Verified')}
              className="px-2.5 py-1 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold transition"
            >
              Verify
            </button>
          )}
          {isAuditorOrAdmin && e.verification_status !== 'Flagged' && (
            <button
              onClick={() => handleVerify(e.id, 'Flagged')}
              className="px-2.5 py-1 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 text-xs font-semibold transition"
            >
              Flag
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Evidence Management & Document Repository"
        subtitle="Verification artifacts, utility invoices, renewable energy certificates (RECs), and ISO 14064 third-party audit statements."
        badge={
          <Badge variant="emerald" dot>
            Assurance Vault
          </Badge>
        }
        actions={
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Attach Evidence File</span>
          </button>
        }
      />

      {/* Evidence Table */}
      <DataTable
        data={evidenceList}
        columns={columns}
        searchKey={(e) => `${e.file_name} ${e.related_record_type} ${e.uploaded_by} ${e.file_type}`}
        searchPlaceholder="Search evidence by file name, author, type..."
        pageSize={10}
      />

      {/* Upload Evidence Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Attach Evidence Metadata"
        subtitle="Register utility bill or verification certificate against an emission record"
      >
        <form onSubmit={handleUpload} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Document File Name</label>
            <input
              type="text"
              required
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
              placeholder="e.g. BESCOM_Electricity_Bill_November_2024.pdf"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Evidence Type</label>
              <select
                value={fileType}
                onChange={(e) => setFileType(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
              >
                <option value="Utility Bill">Utility Bill (Electricity/Gas)</option>
                <option value="Assurance Certificate">Assurance Statement (ISO 14064)</option>
                <option value="Meter Reading">Digital Submeter Log</option>
                <option value="Fuel Manifest">Fuel Delivery Manifest</option>
                <option value="REC Certificate">Renewable Energy Certificate (REC)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Related Record ID</label>
              <input
                type="text"
                required
                value={recordId}
                onChange={(e) => setRecordId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white font-mono"
                placeholder="1"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Auditor Reference & Description</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
              placeholder="Meter serial number, invoice account #, or verification notes..."
            />
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
              Register Document
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
