import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { ContactMessage, ContactStatus } from '@uhv/shared-types';
import { usePageTitle } from '../../hooks/usePageTitle';
import { Mail, MailOpen, Trash2, CheckCircle2, Clock, Search, MessageSquare, Reply } from 'lucide-react';
import { formatDate } from '../../utils/cn';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Badge } from '../../components/ui/Badge';
import { Table, Thead, Tbody, Tr, Th, Td } from '../../components/ui/Table';

export const MessagesInbox: React.FC = () => {
  usePageTitle('Inbound Communications Inbox');
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [activeMessage, setActiveMessage] = useState<ContactMessage | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [responseNotes, setResponseNotes] = useState('');
  const [newStatus, setNewStatus] = useState<ContactStatus>(ContactStatus.READ);

  const { data, isLoading } = useQuery<{ data: ContactMessage[]; meta: any }>({
    queryKey: ['admin-contact-messages'],
    queryFn: async () => {
      const res = await apiClient.get('/contact/admin/all?limit=100');
      return res.data;
    },
  });

  const messages = data?.data || [];

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: ContactStatus; notes?: string }) => {
      await apiClient.patch(`/contact/admin/${id}/status`, {
        status,
        responseNotes: notes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-contact-messages'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
      if (activeMessage) {
        setActiveMessage({
          ...activeMessage,
          status: newStatus,
          responseNotes: responseNotes || activeMessage.responseNotes,
        });
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/contact/admin/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-contact-messages'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
      setDeleteId(null);
      if (activeMessage?.id === deleteId) setActiveMessage(null);
    },
  });

  const handleOpenMessage = (msg: ContactMessage) => {
    setActiveMessage(msg);
    setResponseNotes(msg.responseNotes || '');
    setNewStatus(msg.status === ContactStatus.NEW ? ContactStatus.READ : msg.status);

    if (msg.status === ContactStatus.NEW) {
      updateStatusMutation.mutate({
        id: msg.id,
        status: ContactStatus.READ,
      });
    }
  };

  const filtered = messages.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.message.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = selectedStatus === 'ALL' || m.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const statusOptions = ['ALL', ContactStatus.NEW, ContactStatus.READ, ContactStatus.RESPONDED, ContactStatus.ARCHIVED];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-emerald-900/10 shadow-subtle">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-emerald-800" />
            <h1 className="text-xl font-bold text-institutional-950">Inbound Communications Inbox</h1>
          </div>
          <p className="text-xs text-slate-500">
            Review inquiries submitted through the institutional portal from faculty, students, and external bodies.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search inquiries by sender, email, subject..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {statusOptions.map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                selectedStatus === st
                  ? 'bg-institutional-850 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Messages Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-subtle">
        <Table>
          <Thead>
            <Tr>
              <Th className="w-12 text-center"></Th>
              <Th>Sender & Subject</Th>
              <Th className="w-48">Date Received</Th>
              <Th className="w-28 text-center">Status</Th>
              <Th className="w-24 text-right">Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {isLoading ? (
              <Tr>
                <Td colSpan={5} className="text-center py-8 text-xs text-slate-400">
                  Loading inquiries...
                </Td>
              </Tr>
            ) : filtered.length === 0 ? (
              <Tr>
                <Td colSpan={5} className="text-center py-8 text-xs text-slate-400">
                  No inquiries match the current filter.
                </Td>
              </Tr>
            ) : (
              filtered.map((msg) => (
                <Tr
                  key={msg.id}
                  className={`cursor-pointer hover:bg-slate-50 transition ${
                    msg.status === ContactStatus.NEW ? 'bg-emerald-50/40 font-semibold' : ''
                  }`}
                  onClick={() => handleOpenMessage(msg)}
                >
                  <Td className="text-center">
                    {msg.status === ContactStatus.NEW ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
                    ) : (
                      <MailOpen className="w-4 h-4 text-slate-400 mx-auto" />
                    )}
                  </Td>
                  <Td>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-institutional-950">{msg.name}</span>
                        <span className="text-[11px] text-slate-500 font-normal">({msg.email})</span>
                      </div>
                      <p className="text-xs text-slate-700 font-medium truncate max-w-xl">{msg.subject}</p>
                    </div>
                  </Td>
                  <Td>
                    <span className="text-xs text-slate-500">{formatDate(msg.createdAt)}</span>
                  </Td>
                  <Td className="text-center">
                    <Badge
                      variant={
                        msg.status === ContactStatus.NEW
                          ? 'warning'
                          : msg.status === ContactStatus.RESPONDED
                          ? 'success'
                          : 'default'
                      }
                      className="text-[10px]"
                    >
                      {msg.status}
                    </Badge>
                  </Td>
                  <Td className="text-right" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setDeleteId(msg.id)}
                      className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </div>

      {/* Message Reader Modal */}
      <Modal
        isOpen={!!activeMessage}
        onClose={() => setActiveMessage(null)}
        title="Institutional Inquiry Details"
      >
        {activeMessage && (
          <div className="space-y-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-slate-900 text-sm">{activeMessage.name}</p>
                  <a
                    href={`mailto:${activeMessage.email}`}
                    className="text-emerald-700 hover:underline font-semibold"
                  >
                    {activeMessage.email}
                  </a>
                </div>
                <Badge
                  variant={
                    activeMessage.status === ContactStatus.NEW
                      ? 'warning'
                      : activeMessage.status === ContactStatus.RESPONDED
                      ? 'success'
                      : 'default'
                  }
                >
                  {activeMessage.status}
                </Badge>
              </div>

              <div className="pt-2 border-t border-slate-200 text-slate-500 flex justify-between">
                <span>Subject: <strong className="text-slate-800">{activeMessage.subject}</strong></span>
                <span>{formatDate(activeMessage.createdAt)}</span>
              </div>
            </div>

            {/* Message Body */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed whitespace-pre-line">
              {activeMessage.message}
            </div>

            {/* Response / Resolution Workflow */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700">Internal Coordinator Resolution Notes</label>
              <Textarea
                rows={3}
                placeholder="Log internal action taken, date replied, or officer assigned..."
                value={responseNotes}
                onChange={(e) => setResponseNotes(e.target.value)}
              />

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-slate-600">Update Status:</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as ContactStatus)}
                    className="text-xs border border-slate-300 rounded-lg p-1.5 focus:ring-2 focus:ring-emerald-600"
                  >
                    <option value={ContactStatus.READ}>READ</option>
                    <option value={ContactStatus.RESPONDED}>RESPONDED</option>
                    <option value={ContactStatus.ARCHIVED}>ARCHIVED</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`mailto:${activeMessage.email}?subject=Re: ${encodeURIComponent(activeMessage.subject)}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    <Reply className="w-3.5 h-3.5" /> Direct Email
                  </a>
                  <Button
                    size="sm"
                    onClick={() => {
                      updateStatusMutation.mutate({
                        id: activeMessage.id,
                        status: newStatus,
                        notes: responseNotes,
                      });
                    }}
                    disabled={updateStatusMutation.isPending}
                    className="bg-institutional-850 hover:bg-institutional-950 text-white"
                  >
                    Save Status
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Delete Message"
        message="Are you sure you want to permanently delete this contact inquiry?"
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};
