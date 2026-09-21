import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { Activity } from '@uhv/shared-types';
import { usePageTitle } from '../../hooks/usePageTitle';
import { Plus, Edit2, Trash2, Sparkles, Search } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Badge } from '../../components/ui/Badge';
import { Table, Thead, Tbody, Tr, Th, Td } from '../../components/ui/Table';

export const ActivitiesManager: React.FC = () => {
  usePageTitle('Manage Institutional Activities');
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Activity | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    icon: 'Sparkles',
    category: 'STUDENT_INDUCTION',
    order: 0,
    published: true,
  });

  const { data: activities, isLoading } = useQuery<Activity[]>({
    queryKey: ['admin-activities'],
    queryFn: async () => {
      const res = await apiClient.get('/activities/admin/all');
      return res.data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingItem) {
        await apiClient.patch(`/activities/${editingItem.id}`, formData);
      } else {
        await apiClient.post('/activities', formData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-activities'] });
      setIsModalOpen(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/activities/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-activities'] });
      setDeleteId(null);
    },
  });

  const resetForm = () => {
    setEditingItem(null);
    setFormData({
      title: '',
      slug: '',
      description: '',
      icon: 'Sparkles',
      category: 'STUDENT_INDUCTION',
      order: (activities?.length || 0) + 1,
      published: true,
    });
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: Activity) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      slug: item.slug,
      description: item.description,
      icon: item.icon || 'Sparkles',
      category: item.category || 'STUDENT_INDUCTION',
      order: item.order,
      published: item.published,
    });
    setIsModalOpen(true);
  };

  const filtered = (activities || []).filter(
    (a) =>
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-emerald-900/10 shadow-subtle">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-800" />
            <h1 className="text-xl font-bold text-institutional-950">Cell Activities & Modules</h1>
          </div>
          <p className="text-xs text-slate-500">
            Maintain Student Induction Programs (SIP), Faculty Development Modules, and community engagements.
          </p>
        </div>

        <Button onClick={handleOpenCreate} size="sm" className="bg-institutional-850 hover:bg-institutional-950 text-white">
          <Plus className="w-4 h-4 mr-1.5" /> Add Activity
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search activities..."
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
              <Th>Activity Details</Th>
              <Th className="w-40">Category</Th>
              <Th className="w-24 text-center">Status</Th>
              <Th className="w-28 text-right">Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {isLoading ? (
              <Tr>
                <Td colSpan={5} className="text-center py-8 text-xs text-slate-400">
                  Loading institutional activities...
                </Td>
              </Tr>
            ) : filtered.length === 0 ? (
              <Tr>
                <Td colSpan={5} className="text-center py-8 text-xs text-slate-400">
                  No activities found.
                </Td>
              </Tr>
            ) : (
              filtered.map((item) => (
                <Tr key={item.id}>
                  <Td className="text-center font-bold text-slate-600">{item.order}</Td>
                  <Td>
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-institutional-950">{item.title}</p>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{item.description}</p>
                      <span className="text-[10px] text-slate-400 font-mono">slug: {item.slug}</span>
                    </div>
                  </Td>
                  <Td>
                    <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                      {item.category}
                    </span>
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
        title={editingItem ? 'Edit Activity Module' : 'New Activity Module'}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate();
          }}
          className="space-y-4"
        >
          <Input
            label="Activity Title *"
            value={formData.title}
            onChange={(e) => {
              const val = e.target.value;
              setFormData({
                ...formData,
                title: val,
                slug: editingItem ? formData.slug : val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
              });
            }}
            placeholder="e.g. Universal Human Values Student Induction Program"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="URL Slug *"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              placeholder="e.g. uhv-student-induction"
              required
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full text-xs rounded-lg border border-slate-300 p-2 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              >
                <option value="STUDENT_INDUCTION">Student Induction (SIP)</option>
                <option value="FACULTY_ORIENTATION">Faculty Orientation (FDP)</option>
                <option value="WORKSHOP_SERIES">Workshop Series</option>
                <option value="COMMUNITY_DIALOGUE">Community Dialogue</option>
                <option value="CURRICULAR_COURSE">Curricular Course</option>
              </select>
            </div>
          </div>

          <Textarea
            label="Activity Description *"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            placeholder="Detailed overview of syllabus, interactive exercises, peer reflections..."
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
              {saveMutation.isPending ? 'Saving...' : editingItem ? 'Update Activity' : 'Create Activity'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Delete Activity"
        message="Are you sure you want to delete this activity record? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};
