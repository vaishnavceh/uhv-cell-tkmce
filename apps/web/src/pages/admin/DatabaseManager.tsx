import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useToast } from '../../components/ui/Toast';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import {
  Database,
  ShieldAlert,
  Trash2,
  Edit,
  RefreshCw,
  Download,
  AlertTriangle,
  Search,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  HardDrive,
  FileSpreadsheet,
  Terminal,
  Eraser,
  KeyRound,
  MailCheck,
  UserX,
  History,
  Info,
} from 'lucide-react';
import { formatDate } from '../../utils/cn';

interface TableMeta {
  key: string;
  modelName: string;
  label: string;
  tableName: string;
  description: string;
  count: number;
  isSystem?: boolean;
}

interface OverviewData {
  databaseHealth: {
    status: string;
    provider: string;
    latencyMs: number;
    timestamp: string;
  };
  totalRecords: number;
  tables: TableMeta[];
}

export const DatabaseManager: React.FC = () => {
  usePageTitle('Database Maintenance & Cleaning');
  const queryClient = useQueryClient();
  const { success, error, info } = useToast();

  const [activeTab, setActiveTab] = useState<'cleaner' | 'explorer' | 'diagnostics'>('cleaner');
  const [selectedTable, setSelectedTable] = useState<string>('events');
  const [page, setPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Row Editing State
  const [editingRecord, setEditingRecord] = useState<any | null>(null);
  const [editFormData, setEditFormData] = useState<Record<string, any>>({});
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Row Deletion State
  const [deletingRecordId, setDeletingRecordId] = useState<string | null>(null);
  const [isDeleteRowModalOpen, setIsDeleteRowModalOpen] = useState(false);

  // Table Truncate State
  const [truncateTableKey, setTruncateTableKey] = useState<string>('audit_logs');
  const [truncateConfirmText, setTruncateConfirmText] = useState<string>('');
  const [isTruncateModalOpen, setIsTruncateModalOpen] = useState(false);

  // Audit Logs Cleanup Options
  const [auditLogDays, setAuditLogDays] = useState<number>(30);
  const [auditLogWipeAll, setAuditLogWipeAll] = useState<boolean>(false);

  // 1. Fetch Database Overview
  const {
    data: overview,
    isLoading: isOverviewLoading,
    refetch: refetchOverview,
    isFetching: isOverviewFetching,
  } = useQuery<OverviewData>({
    queryKey: ['admin-database-overview'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/database/overview');
      return res.data;
    },
  });

  // 2. Fetch Selected Table Rows
  const {
    data: tableContent,
    isLoading: isTableLoading,
    refetch: refetchTableData,
  } = useQuery({
    queryKey: ['admin-database-table-rows', selectedTable, page, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '20');
      if (searchTerm) params.append('search', searchTerm);

      const res = await apiClient.get(`/admin/database/tables/${selectedTable}?${params.toString()}`);
      return res.data;
    },
    enabled: activeTab === 'explorer',
  });

  // --- Mutations ---

  // Direct Row Update
  const updateRecordMutation = useMutation({
    mutationFn: async ({ tableKey, id, data }: { tableKey: string; id: string; data: any }) => {
      const res = await apiClient.put(`/admin/database/tables/${tableKey}/${id}`, data);
      return res.data;
    },
    onSuccess: (res) => {
      success(res.message || 'Record updated directly in database.');
      setIsEditModalOpen(false);
      setEditingRecord(null);
      queryClient.invalidateQueries({ queryKey: ['admin-database-table-rows'] });
      queryClient.invalidateQueries({ queryKey: ['admin-database-overview'] });
    },
    onError: (err: any) => {
      error(err?.response?.data?.message || 'Failed to update record.');
    },
  });

  // Direct Row Delete
  const deleteRecordMutation = useMutation({
    mutationFn: async ({ tableKey, id }: { tableKey: string; id: string }) => {
      const res = await apiClient.delete(`/admin/database/tables/${tableKey}/${id}`);
      return res.data;
    },
    onSuccess: (res) => {
      success(res.message || 'Record deleted from database.');
      setIsDeleteRowModalOpen(false);
      setDeletingRecordId(null);
      queryClient.invalidateQueries({ queryKey: ['admin-database-table-rows'] });
      queryClient.invalidateQueries({ queryKey: ['admin-database-overview'] });
    },
    onError: (err: any) => {
      error(err?.response?.data?.message || 'Failed to delete record.');
    },
  });

  // Clean Expired Tokens
  const cleanTokensMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/admin/database/clean/expired-tokens', {});
      return res.data;
    },
    onSuccess: (res) => {
      success(res.message);
      refetchOverview();
    },
    onError: (err: any) => {
      error(err?.response?.data?.message || 'Token cleaning failed.');
    },
  });

  // Clean Audit Logs
  const cleanAuditLogsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/admin/database/clean/audit-logs', {
        keepDays: auditLogDays,
        wipeAll: auditLogWipeAll,
      });
      return res.data;
    },
    onSuccess: (res) => {
      success(res.message);
      refetchOverview();
      if (selectedTable === 'audit_logs') refetchTableData();
    },
    onError: (err: any) => {
      error(err?.response?.data?.message || 'Audit log purge failed.');
    },
  });

  // Clean Archived Messages
  const cleanMessagesMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/admin/database/clean/archived-messages', {});
      return res.data;
    },
    onSuccess: (res) => {
      success(res.message);
      refetchOverview();
      if (selectedTable === 'messages') refetchTableData();
    },
    onError: (err: any) => {
      error(err?.response?.data?.message || 'Message cleaning failed.');
    },
  });

  // Clean Rejected Registrations
  const cleanRejectedRegsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/admin/database/clean/rejected-registrations', {});
      return res.data;
    },
    onSuccess: (res) => {
      success(res.message);
      refetchOverview();
      if (selectedTable === 'registrations') refetchTableData();
    },
    onError: (err: any) => {
      error(err?.response?.data?.message || 'Failed to clean rejected registrations.');
    },
  });

  // Clean Test Registrations
  const cleanTestRegsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/admin/database/clean/test-registrations', {});
      return res.data;
    },
    onSuccess: (res) => {
      success(res.message);
      refetchOverview();
      if (selectedTable === 'registrations') refetchTableData();
    },
    onError: (err: any) => {
      error(err?.response?.data?.message || 'Failed to clean test registrations.');
    },
  });

  // Truncate / Empty Selected Table
  const truncateTableMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/admin/database/clean/truncate-table', {
        tableKey: truncateTableKey,
        confirmationPhrase: truncateConfirmText,
      });
      return res.data;
    },
    onSuccess: (res) => {
      success(res.message);
      setIsTruncateModalOpen(false);
      setTruncateConfirmText('');
      refetchOverview();
      if (selectedTable === truncateTableKey) refetchTableData();
    },
    onError: (err: any) => {
      error(err?.response?.data?.message || 'Table reset failed.');
    },
  });

  // Download Table JSON Backup
  const handleExportTable = async (tableKey: string) => {
    try {
      info(`Exporting complete backup of table '${tableKey}'...`);
      const res = await apiClient.get(`/admin/database/export/${tableKey}`);
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(res.data, null, 2)
      )}`;
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonString);
      downloadAnchor.setAttribute(
        'download',
        `uhv_db_${tableKey}_backup_${new Date().toISOString().slice(0, 10)}.json`
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      success(`Backup for '${tableKey}' downloaded successfully.`);
    } catch (err: any) {
      error(err?.response?.data?.message || 'Failed to export table backup.');
    }
  };

  // Open Edit Modal with initial row data
  const handleOpenEdit = (record: any) => {
    setEditingRecord(record);
    setEditFormData({ ...record });
    setIsEditModalOpen(true);
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Super Admin Access & Health Banner */}
      <div className="bg-gradient-to-r from-red-950 via-slate-900 to-institutional-950 text-white p-6 rounded-2xl shadow-md border border-red-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="p-2 rounded-lg bg-red-600/30 border border-red-500/40 text-red-400">
              <Database className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              Database Maintenance &amp; Cleaning
            </h1>
            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-red-600 text-white shadow-sm tracking-wider">
              <ShieldAlert className="w-3 h-3" /> Super Admin Only
            </span>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Explicit direct access to PostgreSQL database models, individual row modification, system cleaning routines, table truncations, and offline JSON backups.
          </p>
        </div>

        {/* Database Health Pill */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
          <div className="p-3 rounded-xl bg-white/10 border border-white/15 text-xs space-y-1">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="font-bold text-emerald-300">
                {overview?.databaseHealth?.status || 'CONNECTED'}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                ({overview?.databaseHealth?.latencyMs || 0}ms)
              </span>
            </div>
            <div className="text-[11px] text-slate-300 font-mono">
              Total Records: <strong>{overview?.totalRecords?.toLocaleString() || '...'}</strong>
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => refetchOverview()}
            disabled={isOverviewFetching}
            className="text-xs text-white border-white/20 hover:bg-white/10"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isOverviewFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('cleaner')}
          className={`pb-3 px-4 text-xs font-extrabold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'cleaner'
              ? 'border-red-600 text-red-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Eraser className="w-4 h-4" />
          <span>System Cleaning Operations</span>
        </button>

        <button
          onClick={() => setActiveTab('explorer')}
          className={`pb-3 px-4 text-xs font-extrabold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'explorer'
              ? 'border-red-600 text-red-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Table Explorer &amp; Direct Editor</span>
        </button>

        <button
          onClick={() => setActiveTab('diagnostics')}
          className={`pb-3 px-4 text-xs font-extrabold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'diagnostics'
              ? 'border-red-600 text-red-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <HardDrive className="w-4 h-4" />
          <span>Database Schema &amp; Storage Stats</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: SYSTEM CLEANING OPERATIONS (Core User Requirement) */}
      {/* ========================================================= */}
      {activeTab === 'cleaner' && (
        <div className="space-y-6">
          
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-3 shadow-2xs">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold block text-sm">Caution: Explicit Database Modification</strong>
              <span>
                Cleaning operations immediately execute direct database deletion queries. All actions are irreversible and permanently logged in the system Audit Trail. Download a table backup before performing any bulk purge.
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            
            {/* Cleaning Tool 1: Expired Tokens */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-subtle flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  Expired &amp; Revoked Auth Tokens
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Removes expired or invalidated refresh tokens from the <code className="font-mono text-[11px] bg-slate-100 px-1 py-0.5 rounded">refresh_tokens</code> table to optimize authentication lookups.
                </p>
              </div>

              <Button
                size="sm"
                variant="outline"
                disabled={cleanTokensMutation.isPending}
                onClick={() => cleanTokensMutation.mutate()}
                className="w-full text-xs font-bold border-indigo-200 hover:bg-indigo-50 text-indigo-800"
              >
                <Eraser className="w-3.5 h-3.5 mr-1.5" />
                {cleanTokensMutation.isPending ? 'Cleaning...' : 'Clean Expired Tokens'}
              </Button>
            </div>

            {/* Cleaning Tool 2: Audit Logs Purge */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-subtle flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                  <History className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  Historical Audit Logs Purge
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Purges older administrative audit records from <code className="font-mono text-[11px] bg-slate-100 px-1 py-0.5 rounded">audit_logs</code> while keeping recent activities intact.
                </p>

                <div className="pt-2 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-semibold">Keep Last:</span>
                    <select
                      value={auditLogDays}
                      disabled={auditLogWipeAll}
                      onChange={(e) => setAuditLogDays(Number(e.target.value))}
                      className="text-xs p-1 border border-slate-300 rounded bg-white font-bold text-slate-700"
                    >
                      <option value={7}>7 Days</option>
                      <option value={14}>14 Days</option>
                      <option value={30}>30 Days</option>
                      <option value={90}>90 Days</option>
                    </select>
                  </div>

                  <label className="flex items-center gap-2 text-xs text-red-700 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={auditLogWipeAll}
                      onChange={(e) => setAuditLogWipeAll(e.target.checked)}
                      className="rounded text-red-600"
                    />
                    <span>Wipe entire audit log table</span>
                  </label>
                </div>
              </div>

              <Button
                size="sm"
                variant="outline"
                disabled={cleanAuditLogsMutation.isPending}
                onClick={() => cleanAuditLogsMutation.mutate()}
                className="w-full text-xs font-bold border-amber-300 hover:bg-amber-50 text-amber-800"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                {cleanAuditLogsMutation.isPending ? 'Purging...' : 'Purge Audit Logs'}
              </Button>
            </div>

            {/* Cleaning Tool 3: Archived Inquiries */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-subtle flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                  <MailCheck className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  Resolved &amp; Archived Inquiries
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Deletes contact queries from <code className="font-mono text-[11px] bg-slate-100 px-1 py-0.5 rounded">contact_messages</code> that have already been responded to or archived.
                </p>
              </div>

              <Button
                size="sm"
                variant="outline"
                disabled={cleanMessagesMutation.isPending}
                onClick={() => cleanMessagesMutation.mutate()}
                className="w-full text-xs font-bold border-blue-200 hover:bg-blue-50 text-blue-800"
              >
                <Eraser className="w-3.5 h-3.5 mr-1.5" />
                {cleanMessagesMutation.isPending ? 'Cleaning...' : 'Clean Archived Inquiries'}
              </Button>
            </div>

            {/* Cleaning Tool 4: Rejected Registrations */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-subtle flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
                  <UserX className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  Rejected Event Registrations
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Cleans registrations marked as <code className="font-mono text-[11px] bg-slate-100 px-1 py-0.5 rounded">REJECTED</code> from the registration database.
                </p>
              </div>

              <Button
                size="sm"
                variant="outline"
                disabled={cleanRejectedRegsMutation.isPending}
                onClick={() => cleanRejectedRegsMutation.mutate()}
                className="w-full text-xs font-bold border-rose-200 hover:bg-rose-50 text-rose-800"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                {cleanRejectedRegsMutation.isPending ? 'Purging...' : 'Purge Rejected Passes'}
              </Button>
            </div>

            {/* Cleaning Tool 5: Dummy & Test Registrations */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-subtle flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  Test &amp; Dummy Registrations
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Removes test submissions matching <code className="font-mono text-[11px] bg-slate-100 px-1 py-0.5 rounded">test@...</code>, dummy emails, or <code className="font-mono text-[11px] bg-slate-100 px-1 py-0.5 rounded">0000000000</code> phone entries.
                </p>
              </div>

              <Button
                size="sm"
                variant="outline"
                disabled={cleanTestRegsMutation.isPending}
                onClick={() => cleanTestRegsMutation.mutate()}
                className="w-full text-xs font-bold border-purple-200 hover:bg-purple-50 text-purple-800"
              >
                <Eraser className="w-3.5 h-3.5 mr-1.5" />
                {cleanTestRegsMutation.isPending ? 'Purging...' : 'Clean Test Registrations'}
              </Button>
            </div>

            {/* Cleaning Tool 6: Danger Zone - Truncate / Empty Table */}
            <div className="bg-white p-5 rounded-2xl border-2 border-red-300 shadow-subtle flex flex-col justify-between space-y-4 relative overflow-hidden">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-red-100 text-red-800 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-red-950">
                    Reset &amp; Truncate Table
                  </h3>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-red-100 text-red-800">
                    Danger
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Completely wipes all records from a selected table. System tables (users and roles) are protected. Requires a typed confirmation phrase.
                </p>
              </div>

              <Button
                size="sm"
                variant="danger"
                onClick={() => setIsTruncateModalOpen(true)}
                className="w-full text-xs font-black bg-red-700 hover:bg-red-800 text-white"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                Open Table Reset Tool...
              </Button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* TAB 2: TABLE EXPLORER & DIRECT ROW EDITOR                  */}
      {/* ========================================================== */}
      {activeTab === 'explorer' && (
        <div className="space-y-6">
          
          {/* Table Selector Pills */}
          <div className="flex flex-wrap items-center gap-2 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 px-2">
              Select Table:
            </span>
            {overview?.tables?.map((tbl) => (
              <button
                key={tbl.key}
                onClick={() => {
                  setSelectedTable(tbl.key);
                  setPage(1);
                  setSearchTerm('');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  selectedTable === tbl.key
                    ? 'bg-institutional-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>{tbl.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    selectedTable === tbl.key ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {tbl.count}
                </span>
              </button>
            ))}
          </div>

          {/* Table Content Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-6 space-y-4">
            
            {/* Header & Actions Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <span>{tableContent?.table?.label || selectedTable}</span>
                  <span className="text-xs font-mono text-slate-400">
                    ({tableContent?.table?.tableName || selectedTable})
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {tableContent?.table?.description}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-48 sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search records..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setPage(1);
                    }}
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-institutional-900"
                  />
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleExportTable(selectedTable)}
                  className="text-xs font-bold border-slate-300 hover:bg-slate-50"
                  title="Export raw JSON backup of this table"
                >
                  <Download className="w-3.5 h-3.5 mr-1" />
                  Export JSON
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => refetchTableData()}
                  className="text-xs text-slate-600"
                  title="Refresh rows"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {/* Data Table */}
            {isTableLoading ? (
              <div className="h-64 bg-slate-50 rounded-xl animate-pulse flex items-center justify-center text-xs text-slate-400">
                Loading database rows...
              </div>
            ) : !tableContent?.data || tableContent.data.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-xs space-y-2">
                <Database className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-bold text-slate-600">No records found in this table.</p>
                {searchTerm && <p className="text-[11px]">Try clearing your search query.</p>}
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider font-extrabold sticky top-0">
                    <tr>
                      <th className="p-3">Actions</th>
                      {tableContent.columns?.slice(0, 7).map((col: string) => (
                        <th key={col} className="p-3 whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {tableContent.data.map((row: any) => (
                      <tr key={row.id} className="hover:bg-slate-50/80 transition">
                        
                        {/* Action buttons */}
                        <td className="p-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(row)}
                              className="p-1 rounded bg-slate-100 hover:bg-institutional-900 hover:text-white text-slate-700 transition"
                              title="Directly edit this database row"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setDeletingRecordId(row.id);
                                setIsDeleteRowModalOpen(true);
                              }}
                              className="p-1 rounded bg-red-50 hover:bg-red-700 hover:text-white text-red-700 transition"
                              title="Delete this row from database"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                        {/* Columns values preview */}
                        {tableContent.columns?.slice(0, 7).map((col: string) => {
                          const val = row[col];
                          let displayVal = val;
                          if (val === null || val === undefined) {
                            displayVal = <span className="text-slate-300 italic">null</span>;
                          } else if (typeof val === 'boolean') {
                            displayVal = (
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  val ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {val ? 'TRUE' : 'FALSE'}
                              </span>
                            );
                          } else if (typeof val === 'object') {
                            displayVal = (
                              <span className="text-slate-500 text-[10px] truncate max-w-[150px] inline-block" title={JSON.stringify(val)}>
                                {JSON.stringify(val).slice(0, 24)}...
                              </span>
                            );
                          } else if (typeof val === 'string' && val.length > 32) {
                            displayVal = <span title={val}>{val.slice(0, 32)}...</span>;
                          }
                          return (
                            <td key={col} className="p-3 whitespace-nowrap text-slate-700 text-[11px]">
                              {displayVal}
                            </td>
                          );
                        })}

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Toolbar */}
            {tableContent?.meta && (
              <div className="flex items-center justify-between pt-4 text-xs text-slate-500">
                <span>
                  Showing {tableContent.data?.length || 0} of{' '}
                  <strong className="text-slate-800">{tableContent.meta.total}</strong> records
                </span>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="p-1 px-2 text-xs"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </Button>
                  <span className="font-bold text-slate-800 text-xs">
                    Page {page} of {tableContent.meta.totalPages || 1}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page >= (tableContent.meta.totalPages || 1)}
                    onClick={() => setPage((p) => p + 1)}
                    className="p-1 px-2 text-xs"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            )}

          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: DIAGNOSTICS & STORAGE ARCHITECTURE                 */}
      {/* ========================================================= */}
      {activeTab === 'diagnostics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Database Engine</span>
              <h3 className="text-lg font-black text-slate-900">PostgreSQL (Relational)</h3>
              <p className="text-xs text-slate-500">Managed via Prisma ORM v5 with connection pooling.</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total System Tables</span>
              <h3 className="text-lg font-black text-slate-900">{overview?.tables?.length || 15} Tables</h3>
              <p className="text-xs text-slate-500">Includes institutional content, sessions, and logs.</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Aggregate Records</span>
              <h3 className="text-lg font-black text-slate-900">{overview?.totalRecords?.toLocaleString() || 0} Rows</h3>
              <p className="text-xs text-slate-500">Across all registered system models.</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Model Registry &amp; Mapping Directory</h3>
              <span className="text-xs text-slate-400 font-mono">schema.prisma</span>
            </div>
            <div className="divide-y divide-slate-100">
              {overview?.tables?.map((tbl) => (
                <div key={tbl.key} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <strong className="font-bold text-slate-900 text-sm">{tbl.label}</strong>
                      <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px] font-mono text-slate-600">
                        {tbl.tableName}
                      </code>
                      {tbl.isSystem && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                          System Table
                        </span>
                      )}
                    </div>
                    <p className="text-slate-500">{tbl.description}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono font-bold text-slate-700 bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
                      {tbl.count.toLocaleString()} rows
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleExportTable(tbl.key)}
                      className="text-xs text-slate-600"
                    >
                      <Download className="w-3.5 h-3.5 mr-1" /> Backup
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: DIRECT ROW EDIT MODAL                               */}
      {/* ========================================================= */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Direct Edit: ${selectedTable} (Row ID: ${editingRecord?.id})`}
        maxWidth="2xl"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-xs">
            Directly modifying this row will persist changes immediately in PostgreSQL. Read-only metadata (<code className="font-mono">id</code>, <code className="font-mono">createdAt</code>) cannot be altered.
          </div>

          <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-2">
            {editingRecord &&
              Object.entries(editingRecord).map(([key, value]) => {
                const isImmutable = key === 'id' || key === 'createdAt' || key === 'updatedAt';
                const isJson = typeof value === 'object' && value !== null;
                const isBool = typeof value === 'boolean';

                return (
                  <div key={key} className="space-y-1">
                    <label className="font-mono font-bold text-slate-700 flex items-center justify-between">
                      <span>{key}</span>
                      {isImmutable && <span className="text-[10px] text-slate-400 uppercase font-sans">Read-Only</span>}
                    </label>

                    {isImmutable ? (
                      <input
                        disabled
                        value={String(value || '')}
                        className="w-full p-2 rounded-lg border border-slate-200 bg-slate-100 text-slate-500 font-mono text-xs cursor-not-allowed"
                      />
                    ) : isBool ? (
                      <select
                        value={editFormData[key] ? 'true' : 'false'}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, [key]: e.target.value === 'true' })
                        }
                        className="w-full p-2 rounded-lg border border-slate-300 text-xs font-mono font-bold bg-white"
                      >
                        <option value="true">TRUE</option>
                        <option value="false">FALSE</option>
                      </select>
                    ) : isJson ? (
                      <textarea
                        rows={3}
                        value={
                          typeof editFormData[key] === 'string'
                            ? editFormData[key]
                            : JSON.stringify(editFormData[key] || {}, null, 2)
                        }
                        onChange={(e) => {
                          try {
                            const parsed = JSON.parse(e.target.value);
                            setEditFormData({ ...editFormData, [key]: parsed });
                          } catch {
                            setEditFormData({ ...editFormData, [key]: e.target.value });
                          }
                        }}
                        className="w-full p-2 rounded-lg border border-slate-300 font-mono text-xs bg-slate-50"
                      />
                    ) : (
                      <input
                        type="text"
                        value={editFormData[key] !== null && editFormData[key] !== undefined ? editFormData[key] : ''}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, [key]: e.target.value })
                        }
                        className="w-full p-2 rounded-lg border border-slate-300 text-xs font-mono bg-white"
                      />
                    )}
                  </div>
                );
              })}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={updateRecordMutation.isPending}
              onClick={() => {
                updateRecordMutation.mutate({
                  tableKey: selectedTable,
                  id: editingRecord.id,
                  data: editFormData,
                });
              }}
              className="bg-institutional-850 hover:bg-institutional-950 font-bold"
            >
              {updateRecordMutation.isPending ? 'Saving to Database...' : 'Save Changes to Database'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL: DELETE INDIVIDUAL ROW MODAL                         */}
      {/* ========================================================= */}
      <Modal
        isOpen={isDeleteRowModalOpen}
        onClose={() => setIsDeleteRowModalOpen(false)}
        title="Confirm Row Deletion"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            Are you sure you want to delete record <strong className="font-mono text-red-700">{deletingRecordId}</strong> from table <strong className="font-bold">{selectedTable}</strong>?
          </p>
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-[11px]">
            This deletion is permanent and cannot be undone.
          </div>
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="ghost" size="sm" onClick={() => setIsDeleteRowModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={deleteRecordMutation.isPending}
              onClick={() => {
                if (deletingRecordId) {
                  deleteRecordMutation.mutate({ tableKey: selectedTable, id: deletingRecordId });
                }
              }}
              className="bg-red-700 hover:bg-red-800 font-bold"
            >
              {deleteRecordMutation.isPending ? 'Deleting...' : 'Delete Row Permanently'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL: TABLE TRUNCATE / RESET MODAL (DANGER ZONE)         */}
      {/* ========================================================= */}
      <Modal
        isOpen={isTruncateModalOpen}
        onClose={() => {
          setIsTruncateModalOpen(false);
          setTruncateConfirmText('');
        }}
        title="DANGER: Reset & Truncate Table"
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3.5 bg-red-50 border-2 border-red-300 rounded-xl text-red-950 space-y-1">
            <div className="flex items-center gap-2 font-black text-sm">
              <ShieldAlert className="w-4 h-4 text-red-700" />
              <span>Permanent Table Wipe Warning</span>
            </div>
            <p className="text-[11px] text-red-800 leading-relaxed">
              This will irreversibly delete <strong>ALL RECORDS</strong> from the selected table. System tables (<code className="font-mono">users</code>, <code className="font-mono">roles</code>) cannot be reset.
            </p>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700">Target Table to Reset:</label>
            <select
              value={truncateTableKey}
              onChange={(e) => setTruncateTableKey(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-300 text-xs font-bold"
            >
              {overview?.tables
                ?.filter((t) => !t.isSystem)
                .map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.label} ({t.tableName}) — {t.count} records
                  </option>
                ))}
            </select>
          </div>

          <div className="space-y-1 pt-2">
            <label className="font-bold text-red-800 block">
              Type <code className="bg-red-100 text-red-900 px-1.5 py-0.5 rounded font-mono font-black select-all">CONFIRM_DELETE_{truncateTableKey.toUpperCase()}</code> to proceed:
            </label>
            <input
              type="text"
              placeholder={`CONFIRM_DELETE_${truncateTableKey.toUpperCase()}`}
              value={truncateConfirmText}
              onChange={(e) => setTruncateConfirmText(e.target.value)}
              className="w-full p-2 rounded-lg border border-red-300 font-mono text-xs focus:ring-1 focus:ring-red-600 bg-white"
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleExportTable(truncateTableKey)}
              className="text-xs"
            >
              <Download className="w-3.5 h-3.5 mr-1" />
              Download Backup First
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsTruncateModalOpen(false);
                  setTruncateConfirmText('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                disabled={
                  truncateConfirmText !== `CONFIRM_DELETE_${truncateTableKey.toUpperCase()}` ||
                  truncateTableMutation.isPending
                }
                onClick={() => truncateTableMutation.mutate()}
                className="bg-red-700 hover:bg-red-800 font-black disabled:opacity-50"
              >
                {truncateTableMutation.isPending ? 'Wiping Table...' : 'Empty Entire Table'}
              </Button>
            </div>
          </div>
        </div>
      </Modal>

    </div>
  );
};
