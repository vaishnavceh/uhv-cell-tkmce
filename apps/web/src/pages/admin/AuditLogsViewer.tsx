import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { AuditLogItem } from '@uhv/shared-types';
import { usePageTitle } from '../../hooks/usePageTitle';
import { History, Shield, Search, Terminal, ChevronRight, User } from 'lucide-react';
import { formatDate } from '../../utils/cn';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Table, Thead, Tbody, Tr, Th, Td } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';

export const AuditLogsViewer: React.FC = () => {
  usePageTitle('Security Audit Trail');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const { data, isLoading } = useQuery<{ data: AuditLogItem[]; meta: any }>({
    queryKey: ['admin-audit-logs'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/audit-logs?limit=100');
      return res.data;
    },
  });

  const logs = data?.data || [];

  const filtered = logs.filter((l) => {
    const term = searchTerm.toLowerCase();
    const actionMatch = l.action.toLowerCase().includes(term);
    const entityMatch = l.entity.toLowerCase().includes(term);
    const userMatch = l.user?.email.toLowerCase().includes(term) || l.user?.firstName.toLowerCase().includes(term);
    return actionMatch || entityMatch || !!userMatch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-emerald-900/10 shadow-subtle space-y-1">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-emerald-800" />
          <h1 className="text-xl font-bold text-institutional-950">Security Audit & Compliance Trail</h1>
        </div>
        <p className="text-xs text-slate-500">
          Cryptographically referenced chronological audit record of all administrative operations, logins, mutations, and document alterations.
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Filter by action, entity, user..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="text-xs"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Total Logs: <span className="font-bold text-slate-800">{filtered.length}</span>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-subtle">
        <Table>
          <Thead>
            <Tr>
              <Th className="w-48">Timestamp</Th>
              <Th>Action & Target</Th>
              <Th className="w-48">Actor</Th>
              <Th className="w-32">IP Address</Th>
              <Th className="w-20 text-right">Details</Th>
            </Tr>
          </Thead>
          <Tbody>
            {isLoading ? (
              <Tr>
                <Td colSpan={5} className="text-center py-8 text-xs text-slate-400">
                  Retrieving audit logs...
                </Td>
              </Tr>
            ) : filtered.length === 0 ? (
              <Tr>
                <Td colSpan={5} className="text-center py-8 text-xs text-slate-400">
                  No matching log entries.
                </Td>
              </Tr>
            ) : (
              filtered.map((log) => (
                <Tr key={log.id} className="hover:bg-slate-50 transition">
                  <Td>
                    <span className="text-xs font-mono text-slate-600">{formatDate(log.createdAt)}</span>
                  </Td>
                  <Td>
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-slate-900 font-mono">{log.action}</span>
                      <p className="text-[11px] text-slate-500">
                        Target Entity: <span className="font-semibold text-emerald-800">{log.entity}</span>{' '}
                        {log.entityId && <span className="text-slate-400">({log.entityId.slice(0, 8)}...)</span>}
                      </p>
                    </div>
                  </Td>
                  <Td>
                    {log.user ? (
                      <div className="text-xs">
                        <p className="font-semibold text-slate-800">{log.user.firstName} {log.user.lastName}</p>
                        <p className="text-[10px] text-slate-400 truncate">{log.user.email}</p>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">System Event</span>
                    )}
                  </Td>
                  <Td>
                    <span className="text-xs font-mono text-slate-500">{log.ipAddress || 'Internal'}</span>
                  </Td>
                  <Td className="text-right">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="p-1 text-slate-400 hover:text-emerald-800"
                      title="Inspect JSON Payload"
                    >
                      <Terminal className="w-4 h-4" />
                    </button>
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </div>

      {/* Metadata JSON Modal */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Audit Payload Inspection"
      >
        {selectedLog && (
          <div className="space-y-4">
            <div className="text-xs space-y-1">
              <p><strong>Action:</strong> {selectedLog.action}</p>
              <p><strong>Target Entity:</strong> {selectedLog.entity} ({selectedLog.entityId})</p>
              <p><strong>Actor:</strong> {selectedLog.user?.email || 'System'}</p>
              <p><strong>Time:</strong> {selectedLog.createdAt}</p>
            </div>

            <div>
              <p className="text-xs font-bold text-slate-700 mb-1">State / Payload Metadata:</p>
              <pre className="p-4 bg-slate-900 text-emerald-400 rounded-xl text-xs font-mono overflow-x-auto max-h-60">
                {JSON.stringify(selectedLog.metadata || {}, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
