import React, { useState, useEffect } from 'react';
import {
  History,
  Filter,
  Search,
  User,
  ShieldCheck,
  Clock,
  ArrowRight
} from 'lucide-react';
import { api } from '../../api/client';
import { AuditLog } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable, Column } from '../../components/common/DataTable';
import { Badge } from '../../components/common/Badge';

export const AuditTrail: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [actionFilter, setActionFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.audit.getLogs({
        action: actionFilter !== 'All' ? actionFilter : undefined,
        limit: 150,
      });
      setLogs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'CREATE': return 'emerald';
      case 'APPROVE': return 'blue';
      case 'UPDATE': return 'amber';
      case 'DELETE': return 'red';
      case 'IMPORT': return 'purple';
      default: return 'slate';
    }
  };

  const columns: Column<AuditLog>[] = [
    {
      key: 'timestamp',
      header: 'Timestamp (UTC)',
      sortable: true,
      className: 'font-mono text-[11px] text-slate-500 w-40',
      render: (l) => (
        <span>{new Date(l.timestamp).toLocaleString()}</span>
      ),
    },
    {
      key: 'user_email',
      header: 'Operator Account',
      sortable: true,
      render: (l) => (
        <span className="font-semibold text-slate-900 text-xs flex items-center gap-1.5">
          <User className="w-3 h-3 text-slate-400" />
          <span>{l.user_email}</span>
        </span>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      sortable: true,
      render: (l) => (
        <Badge variant={getActionBadgeColor(l.action) as any} size="sm">
          {l.action}
        </Badge>
      ),
    },
    {
      key: 'resource',
      header: 'Entity Resource',
      sortable: true,
      render: (l) => (
        <span className="font-mono text-xs text-slate-700">
          {l.resource} {l.resource_id ? `(#${l.resource_id})` : ''}
        </span>
      ),
    },
    {
      key: 'new_value',
      header: 'Event Details & Value Delta',
      render: (l) => (
        <div className="text-xs">
          {l.old_value && (
            <p className="text-slate-400 line-through text-[11px] truncate max-w-sm">{l.old_value}</p>
          )}
          <p className="font-medium text-slate-800 truncate max-w-md">{l.new_value || 'Executed'}</p>
        </div>
      ),
    },
    {
      key: 'ip_address',
      header: 'IP Origin',
      className: 'font-mono text-[11px] text-slate-400 text-right',
      render: (l) => <span>{l.ip_address}</span>,
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Statutory Audit Trail & Cryptographic Log"
        subtitle="Immutable event journal recording user logins, calculation updates, and assurance approvals."
        badge={
          <Badge variant="emerald" dot>
            Tamper-Evident Ledger
          </Badge>
        }
      />

      {/* Action Filter Pills */}
      <div className="flex items-center gap-2 p-3 bg-white rounded-2xl border border-slate-200 shadow-subtle">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2">Action Filter:</span>
        {['All', 'CREATE', 'UPDATE', 'APPROVE', 'DELETE', 'IMPORT', 'LOGIN'].map((act) => (
          <button
            key={act}
            onClick={() => setActionFilter(act)}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
              actionFilter === act
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {act}
          </button>
        ))}
      </div>

      {/* Audit Logs Table */}
      <DataTable
        data={logs}
        columns={columns}
        searchKey={(l) => `${l.user_email} ${l.action} ${l.resource} ${l.new_value}`}
        searchPlaceholder="Search audit journal by user, action, resource..."
        pageSize={12}
      />
    </div>
  );
};
