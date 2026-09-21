import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { Workshop } from '@uhv/shared-types';
import { usePageTitle } from '../../hooks/usePageTitle';
import { Plus, Edit2, Trash2, GraduationCap, Search } from 'lucide-react';
import { formatDate } from '../../utils/cn';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Badge } from '../../components/ui/Badge';
import { Table, Thead, Tbody, Tr, Th, Td } from '../../components/ui/Table';

export const WorkshopsManager: React.FC = () => {
  usePageTitle('Manage Workshops Archive');
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Workshop | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    venue: '',
    organizer: 'UHV Cell, TKMCE',
    category: 'Faculty Development Programme',
    facultyParticipants: 0,
    studentParticipants: 0,
    published: true,
  });

  const { data, isLoading } = useQuery<{ data: Workshop[]; meta: any }>({
    queryKey: ['admin-workshops'],
    queryFn: async () => {
      const res = await apiClient.get('/workshops/admin/all');
      return res.data;
    },
  });

  const workshops = data?.data || [];

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...formData,
        date: new Date(formData.date).toISOString(),
        facultyParticipants: Number(formData.facultyParticipants),
        studentParticipants: Number(formData.studentParticipants),
      };
      if (editingItem) {
        await apiClient.patch(`/workshops/${editingItem.id}`, payload);
      } else {
        await apiClient.post('/workshops', payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-workshops'] });
      setIsModalOpen(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/workshops/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-workshops'] });
      setDeleteId(null);
    },
  });

  const resetForm = () => {
    setEditingItem(null);
    setFormData({
      title: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      venue: 'TKMCE Campus',
      organizer: 'UHV Cell, TKMCE',
      category: 'Faculty Development Programme',
      facultyParticipants: 0,
      studentParticipants: 0,
      published: true,
    });
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: Workshop) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      description: item.description,
      date: item.date ? new Date(item.date).toISOString().split('T')[0] : '',
      venue: item.venue,
      organizer: item.organizer,
      category: item.category,
      facultyParticipants: item.facultyParticipants,
      studentParticipants: item.studentParticipants,
      published: item.published,
    });
    setIsModalOpen(true);
  };

  const filtered = workshops.filter(
    (w) =>
      w.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.venue.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-emerald-900/10 shadow-subtle">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-emerald-800" />
            <h1 className="text-xl font-bold text-institutional-950">Workshop & FDP Archive</h1>
          </div>
          <p className="text-xs text-slate-500">
            Maintain records of completed FDPs, student workshops, and verified institutional metrics.
          </p>
        </div>

        <Button onClick={handleOpenCreate} size="sm" className="bg-institutional-850 hover:bg-institutional-950 text-white">
          <Plus className="w-4 h-4 mr-1.5" /> Log Workshop
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search workshops..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="text-xs"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Total: <span className="font-bold text-slate-800">{filtered.length}</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-subtle">
        <Table>
          <Thead>
            <Tr>
              <Th>Workshop / FDP Details</Th>
              <Th className="w-36">Category</Th>
              <Th className="w-32">Date & Venue</Th>
              <Th className="w-32 text-center">Participants</Th>
              <Th className="w-20 text-center">Status</Th>
              <Th className="w-24 text-right">Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {isLoading ? (
              <Tr>
                <Td colSpan={6} className="text-center py-8 text-xs text-slate-400">
                  Loading workshop archives...
                </Td>
              </Tr>
            ) : filtered.length === 0 ? (
              <Tr>
                <Td colSpan={6} className="text-center py-8 text-xs text-slate-400">
                  No workshops recorded.
                </Td>
              </Tr>
            ) : (
              filtered.map((item) => (
                <Tr key={item.id}>
                  <Td>
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-institutional-950">{item.title}</p>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{item.description}</p>
                      <span className="text-[10px] text-slate-400">Org: {item.organizer}</span>
                    </div>
                  </Td>
                  <Td>
                    <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                      {item.category}
                    </span>
                  </Td>
                  <Td>
                    <div className="text-xs text-slate-600">
                      <p className="font-bold">{formatDate(item.date)}</p>
                      <p className="text-[10px] text-slate-400 truncate max-w-[120px]">{item.venue}</p>
                    </div>
                  </Td>
                  <Td className="text-center text-xs">
                    <span className="font-bold text-emerald-800">{item.facultyParticipants}</span> Fac •{' '}
                    <span className="font-bold text-blue-800">{item.studentParticipants}</span> Stu
                  </Td>
                  <Td className="text-center">
                    <Badge variant={item.published ? 'success' : 'default'} className="text-[10px]">
                      {item.published ? 'Live' : 'Draft'}
                    </Badge>
                  </Td>
                  <Td className="text-right space-x-1">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-1.5 rounded text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteId(item.id)}
                      className="p-1.5 rounded text-slate-500 hover:text-red-600 hover:bg-red-50 transition"
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

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Workshop Archive' : 'Log New Workshop / FDP'}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate();
          }}
          className="space-y-4"
        >
          <Input
            label="Workshop Title *"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g. 5-Day UHV-II Faculty Development Program"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full text-xs rounded-lg border border-slate-300 p-2 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              >
                <option value="Faculty Development Programme">Faculty Development Programme</option>
                <option value="Student Workshop">Student Workshop</option>
                <option value="Awareness Programme">Awareness Programme</option>
                <option value="UHV Meeting">UHV Meeting</option>
                <option value="UHV Workshop">UHV Workshop</option>
              </select>
            </div>

            <Input
              label="Conducting Date *"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Venue *"
              value={formData.venue}
              onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
              placeholder="e.g. Seminar Hall 1, TKMCE"
              required
            />
            <Input
              label="Organizer / Host Unit"
              value={formData.organizer}
              onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Faculty Attendees Count"
              type="number"
              value={formData.facultyParticipants.toString()}
              onChange={(e) => setFormData({ ...formData, facultyParticipants: parseInt(e.target.value, 10) || 0 })}
            />
            <Input
              label="Student Attendees Count"
              type="number"
              value={formData.studentParticipants.toString()}
              onChange={(e) => setFormData({ ...formData, studentParticipants: parseInt(e.target.value, 10) || 0 })}
            />
          </div>

          <Textarea
            label="Summary & Outcomes *"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            placeholder="Record salient highlights, resource persons, key discussion points..."
            required
          />

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={formData.published}
                onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
              />
              <span>Published in Public Archive</span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={saveMutation.isPending}
              className="bg-institutional-850 hover:bg-institutional-950 text-white"
            >
              {saveMutation.isPending ? 'Saving...' : editingItem ? 'Update Workshop' : 'Save Archive'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Delete Workshop"
        message="Are you sure you want to delete this workshop record from the archive?"
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};
