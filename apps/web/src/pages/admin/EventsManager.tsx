import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { EventItem, EventStatus } from '@uhv/shared-types';
import { usePageTitle } from '../../hooks/usePageTitle';
import { Plus, Edit2, Trash2, Calendar, Search, ExternalLink } from 'lucide-react';
import { formatDate } from '../../utils/cn';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Badge } from '../../components/ui/Badge';
import { Table, Thead, Tbody, Tr, Th, Td } from '../../components/ui/Table';
import { ImageUpload } from '../../components/ui/ImageUpload';

export const EventsManager: React.FC = () => {
  usePageTitle('Manage Events');
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EventItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    shortDescription: '',
    eventDate: '',
    startTime: '',
    endTime: '',
    venue: '',
    category: 'WORKSHOP',
    coverImage: '',
    registrationUrl: '',
    status: EventStatus.UPCOMING,
    featured: false,
    published: true,
  });

  const { data, isLoading } = useQuery<{ data: EventItem[]; meta: any }>({
    queryKey: ['admin-events'],
    queryFn: async () => {
      const res = await apiClient.get('/events/admin/all');
      return res.data;
    },
  });

  const events = data?.data || [];

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...formData,
        eventDate: new Date(formData.eventDate).toISOString(),
      };
      if (editingItem) {
        await apiClient.patch(`/events/${editingItem.id}`, payload);
      } else {
        await apiClient.post('/events', payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      setIsModalOpen(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/events/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      setDeleteId(null);
    },
  });

  const resetForm = () => {
    setEditingItem(null);
    setFormData({
      title: '',
      slug: '',
      description: '',
      shortDescription: '',
      eventDate: new Date().toISOString().split('T')[0],
      startTime: '09:30',
      endTime: '16:30',
      venue: 'TKMCE Campus',
      category: 'WORKSHOP',
      coverImage: '',
      registrationUrl: '',
      status: EventStatus.UPCOMING,
      featured: false,
      published: true,
    });
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: EventItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      slug: item.slug,
      description: item.description,
      shortDescription: item.shortDescription || '',
      eventDate: item.eventDate ? new Date(item.eventDate).toISOString().split('T')[0] : '',
      startTime: item.startTime || '',
      endTime: item.endTime || '',
      venue: item.venue,
      category: item.category,
      coverImage: item.coverImage || '',
      registrationUrl: item.registrationUrl || '',
      status: item.status,
      featured: item.featured,
      published: item.published,
    });
    setIsModalOpen(true);
  };

  const filtered = events.filter(
    (e) =>
      e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.venue.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-emerald-900/10 shadow-subtle">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-800" />
            <h1 className="text-xl font-bold text-institutional-950">Events & Programs</h1>
          </div>
          <p className="text-xs text-slate-500">
            Publish institutional workshops, conferences, seminars, and orientation sessions.
          </p>
        </div>

        <Button onClick={handleOpenCreate} size="sm" className="bg-institutional-850 hover:bg-institutional-950 text-white">
          <Plus className="w-4 h-4 mr-1.5" /> Schedule Event
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search events, venues..."
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
              <Th>Event Information</Th>
              <Th className="w-36">Schedule</Th>
              <Th className="w-32">Venue</Th>
              <Th className="w-24 text-center">Status</Th>
              <Th className="w-24 text-center">Visibility</Th>
              <Th className="w-28 text-right">Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {isLoading ? (
              <Tr>
                <Td colSpan={6} className="text-center py-8 text-xs text-slate-400">
                  Loading institutional events...
                </Td>
              </Tr>
            ) : filtered.length === 0 ? (
              <Tr>
                <Td colSpan={6} className="text-center py-8 text-xs text-slate-400">
                  No events found.
                </Td>
              </Tr>
            ) : (
              filtered.map((item) => (
                <Tr key={item.id}>
                  <Td>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-institutional-950">{item.title}</p>
                        {item.featured && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-100 text-amber-800 font-bold uppercase">
                            Featured
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{item.shortDescription || item.description}</p>
                    </div>
                  </Td>
                  <Td>
                    <div className="text-xs text-slate-700">
                      <p className="font-bold">{formatDate(item.eventDate)}</p>
                      {item.startTime && <p className="text-[10px] text-slate-500">{item.startTime} - {item.endTime || 'End'}</p>}
                    </div>
                  </Td>
                  <Td>
                    <span className="text-xs text-slate-600 font-medium truncate block max-w-[130px]">
                      {item.venue}
                    </span>
                  </Td>
                  <Td className="text-center">
                    <Badge
                      variant={
                        item.status === EventStatus.UPCOMING
                          ? 'success'
                          : item.status === EventStatus.ONGOING
                          ? 'warning'
                          : 'default'
                      }
                      className="text-[10px]"
                    >
                      {item.status}
                    </Badge>
                  </Td>
                  <Td className="text-center">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.published ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {item.published ? 'Live' : 'Draft'}
                    </span>
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
        title={editingItem ? 'Edit Scheduled Event' : 'Schedule New Event'}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate();
          }}
          className="space-y-4"
        >
          <Input
            label="Event Title *"
            value={formData.title}
            onChange={(e) => {
              const val = e.target.value;
              setFormData({
                ...formData,
                title: val,
                slug: editingItem ? formData.slug : val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
              });
            }}
            placeholder="e.g. AICTE 5-Day Online UHV Refresher FDP"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="URL Slug *"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              required
            />
            <Input
              label="Category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="FDP / WORKSHOP / SEMINAR"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Event Date *"
              type="date"
              value={formData.eventDate}
              onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
              required
            />
            <Input
              label="Start Time"
              type="time"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
            />
            <Input
              label="End Time"
              type="time"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
            />
          </div>

          <Input
            label="Venue / Platform *"
            value={formData.venue}
            onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
            placeholder="e.g. TKMCE Central Auditorium / Google Meet"
            required
          />

          <Input
            label="Short Summary"
            value={formData.shortDescription}
            onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
            placeholder="Brief 1-sentence teaser for cards"
          />

          <ImageUpload
            label="Event Cover / Banner Image (Optional)"
            value={formData.coverImage}
            onChange={(url) => setFormData({ ...formData, coverImage: url })}
            folder="events"
            aspectRatio="video"
            helperText="Upload event promotional poster or header image"
          />

          <Textarea
            label="Comprehensive Description *"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            placeholder="Full schedule details, speaker profiles, expected prerequisites..."
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Registration Link (Optional)"
              value={formData.registrationUrl}
              onChange={(e) => setFormData({ ...formData, registrationUrl: e.target.value })}
              placeholder="https://forms.gle/..."
            />
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as EventStatus })}
                className="w-full text-xs rounded-lg border border-slate-300 p-2 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              >
                <option value={EventStatus.UPCOMING}>UPCOMING</option>
                <option value={EventStatus.ONGOING}>ONGOING</option>
                <option value={EventStatus.COMPLETED}>COMPLETED</option>
                <option value={EventStatus.CANCELLED}>CANCELLED</option>
                <option value={EventStatus.DRAFT}>DRAFT</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={formData.published}
                onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
              />
              <span>Published Live</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={formData.featured}
                onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                className="rounded text-amber-500 focus:ring-amber-500 w-4 h-4"
              />
              <span>Pin as Featured</span>
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
              {saveMutation.isPending ? 'Saving...' : editingItem ? 'Update Event' : 'Schedule Event'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Delete Event"
        message="Are you sure you want to permanently delete this event? This action is recorded in audit trail."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};
