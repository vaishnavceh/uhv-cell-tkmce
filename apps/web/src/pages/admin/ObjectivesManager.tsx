import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { Objective } from '@uhv/shared-types';
import { usePageTitle } from '../../hooks/usePageTitle';
import { Plus, Edit2, Trash2, CheckCircle2, XCircle, Search, Target } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Badge } from '../../components/ui/Badge';
import { Table, Thead, Tbody, Tr, Th, Td } from '../../components/ui/Table';

export const ObjectivesManager: React.FC = () => {
  usePageTitle('Manage Institutional Objectives');
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Objective | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    order: 0,
    published: true,
  });

  const { data: objectives, isLoading } = useQuery<Objective[]>({
    queryKey: ['admin-objectives'],
    queryFn: async () => {
      const res = await apiClient.get('/objectives/admin/all');
      return res.data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingItem) {
        await apiClient.patch(`/objectives/${editingItem.id}`, formData);
      } else {
        await apiClient.post('/objectives', formData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-objectives'] });
      setIsModalOpen(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/objectives/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-objectives'] });
      setDeleteId(null);
    },
  });

  const resetForm = () => {
    setEditingItem(null);
    setFormData({
      title: '',
      description: '',
      order: (objectives?.length || 0) + 1,
      published: true,
    });
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: Objective) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      description: item.description,
      order: item.order,
      published: item.published,
    });
    setIsModalOpen(true);
  };

  const filtered = (objectives || []).filter(
    (o) =>
      o.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-emerald-900/10 shadow-subtle">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-800" />
            <h1 className="text-xl font-bold text-institutional-950">Institutional Objectives</h1>
          </div>
          <p className="text-xs text-slate-500">
            Define, structure, and order the core constitutional objectives aligned with AICTE Mandate G911.
          </p>
        </div>

        <Button onClick={handleOpenCreate} size="sm" className="bg-institutional-850 hover:bg-institutional-950 text-white">
          <Plus className="w-4 h-4 mr-1.5" /> Add Objective
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search objectives..."
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
              <Th className="w-16 text-center">Order</Th>
              <Th>Objective Title & Description</Th>
              <Th className="w-28 text-center">Status</Th>
              <Th className="w-28 text-right">Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {isLoading ? (
              <Tr>
                <Td colSpan={4} className="text-center py-8 text-xs text-slate-400">
                  Loading institutional objectives...
                </Td>
              </Tr>
            ) : filtered.length === 0 ? (
              <Tr>
                <Td colSpan={4} className="text-center py-8 text-xs text-slate-400">
                  No objectives matching the criteria.
                </Td>
              </Tr>
            ) : (
              filtered.map((item) => (
                <Tr key={item.id}>
                  <Td className="text-center font-bold text-slate-600">{item.order}</Td>
                  <Td>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-institutional-950">{item.title}</p>
                      <p className="text-xs text-slate-500 line-clamp-2">{item.description}</p>
                    </div>
                  </Td>
                  <Td className="text-center">
                    <Badge variant={item.published ? 'success' : 'default'} className="text-[10px]">
                      {item.published ? 'Published' : 'Draft'}
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
        title={editingItem ? 'Edit Institutional Objective' : 'New Institutional Objective'}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate();
          }}
          className="space-y-4"
        >
          <Input
            label="Objective Title *"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g. Universal Coexistence & Harmony with Nature"
            required
          />

          <Textarea
            label="Comprehensive Description *"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            placeholder="Describe the institutional purpose and expected pedagogical outcomes..."
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Sort Sequence Order"
              type="number"
              value={formData.order.toString()}
              onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value, 10) || 0 })}
            />

            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 cursor-pointer pb-2 text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={formData.published}
                  onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span>Published on Public Portal</span>
              </label>
            </div>
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
              {saveMutation.isPending ? 'Saving...' : editingItem ? 'Update Objective' : 'Create Objective'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Delete Objective"
        message="Are you sure you want to delete this institutional objective? This action is irreversible."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};
