import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { EventItem, EventStatus, RegistrationFieldDefinition } from '@uhv/shared-types';
import { usePageTitle } from '../../hooks/usePageTitle';
import { Plus, Edit2, Trash2, Calendar, Search, ExternalLink, Users, Download, CheckCircle, XCircle } from 'lucide-react';
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
  const [viewingRegistrationsFor, setViewingRegistrationsFor] = useState<string | null>(null);

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
    enableInternalReg: false,
    registrationUploadLink: '',
    registrationNotes: '',
    registrationEndDate: '',
    registrationCapacity: '',
    isRegistrationClosed: false,
    registrationNotOpened: false,
    registrationFields: [] as RegistrationFieldDefinition[],
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
      const payload: any = {
        ...formData,
        eventDate: new Date(formData.eventDate).toISOString(),
        registrationCapacity: formData.registrationCapacity ? Number(formData.registrationCapacity) : null,
        registrationEndDate: formData.registrationEndDate ? new Date(formData.registrationEndDate).toISOString() : null,
        registrationNotOpened: formData.registrationNotOpened,
        registrationFields: formData.registrationFields,
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
    onError: () => {
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
      enableInternalReg: false,
      registrationUploadLink: '',
      registrationNotes: '',
      registrationEndDate: '',
      registrationCapacity: '',
      isRegistrationClosed: false,
      registrationNotOpened: false,
      registrationFields: [],
      status: EventStatus.UPCOMING,
      featured: false,
      published: true,
    });
  };

  const handleAddField = () => {
    setFormData((prev) => ({
      ...prev,
      registrationFields: [
        ...prev.registrationFields,
        {
          id: 'field_' + Date.now(),
          label: '',
          type: 'text',
          required: true,
          placeholder: '',
        },
      ],
    }));
  };

  const handleRemoveField = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      registrationFields: prev.registrationFields.filter((f) => f.id !== id),
    }));
  };

  const handleUpdateField = (id: string, key: keyof RegistrationFieldDefinition, value: any) => {
    setFormData((prev) => ({
      ...prev,
      registrationFields: prev.registrationFields.map((f) =>
        f.id === id ? { ...f, [key]: value } : f
      ),
    }));
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: EventItem) => {
    setEditingItem(item);
    
    // Format dates safely for local inputs
    let safeRegDate = '';
    if (item.registrationEndDate) {
      try {
        safeRegDate = new Date(item.registrationEndDate).toISOString().slice(0, 16);
      } catch (e) {
        safeRegDate = '';
      }
    }

    let safeEventDate = '';
    if (item.eventDate) {
      try {
        safeEventDate = new Date(item.eventDate).toISOString().split('T')[0];
      } catch (e) {
        safeEventDate = '';
      }
    }

    setFormData({
      title: item.title,
      slug: item.slug,
      description: item.description,
      shortDescription: item.shortDescription || '',
      eventDate: safeEventDate,
      startTime: item.startTime || '',
      endTime: item.endTime || '',
      venue: item.venue,
      category: item.category,
      coverImage: item.coverImage || '',
      registrationUrl: item.registrationUrl || '',
      enableInternalReg: item.enableInternalReg || false,
      registrationUploadLink: item.registrationUploadLink || '',
      registrationNotes: item.registrationNotes || '',
      registrationEndDate: safeRegDate,
      registrationCapacity: item.registrationCapacity ? String(item.registrationCapacity) : '',
      isRegistrationClosed: item.isRegistrationClosed || false,
      registrationNotOpened: item.registrationNotOpened || false,
      registrationFields: (item.registrationFields as RegistrationFieldDefinition[]) || [],
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
                  <Td className="text-right space-x-1 whitespace-nowrap">
                    {item.enableInternalReg && (
                      <button
                        onClick={() => setViewingRegistrationsFor(item.id)}
                        className="p-1.5 rounded text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                        title="View Registrations"
                      >
                        <Users className="w-4 h-4" />
                      </button>
                    )}
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

      {/* Registrations Viewer Modal */}
      <Modal
        isOpen={!!viewingRegistrationsFor}
        onClose={() => setViewingRegistrationsFor(null)}
        title="Event Registrations &amp; Attendee Data"
        maxWidth="4xl"
      >
        <EventRegistrationsViewer
          eventId={viewingRegistrationsFor}
          event={events.find((e) => e.id === viewingRegistrationsFor)}
        />
      </Modal>

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

          {/* Registration Link Not Created / Not Opened Yet Toggle */}
          <div className="p-3.5 bg-amber-50/90 border border-amber-200 rounded-lg">
            <label className="flex items-start gap-2.5 cursor-pointer text-xs font-semibold text-amber-950">
              <input
                type="checkbox"
                checked={formData.registrationNotOpened}
                onChange={(e) => setFormData({ ...formData, registrationNotOpened: e.target.checked })}
                className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4 mt-0.5"
              />
              <div>
                <span className="font-bold text-amber-900 block">Registration link not created / Registration not opened yet</span>
                <span className="text-[11px] text-amber-700 font-normal block mt-0.5">
                  When checked, attendees will see a dedicated "Registration Has Not Been Opened Yet" page and notice for both internal forms and external links. When unchecked, it directly opens the registration link or internal form.
                </span>
              </div>
            </label>
          </div>

          {/* REGISTRATION SETTINGS BLOCK */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Internal Registration Settings</h4>
            
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={formData.enableInternalReg}
                onChange={(e) => setFormData({ ...formData, enableInternalReg: e.target.checked })}
                className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
              />
              <span>Enable Internal Registration Form</span>
            </label>

            {formData.enableInternalReg && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Registration Deadline (Optional)"
                    type="datetime-local"
                    value={formData.registrationEndDate}
                    onChange={(e) => setFormData({ ...formData, registrationEndDate: e.target.value })}
                  />
                  <Input
                    label="Max Capacity (Optional)"
                    type="number"
                    min="1"
                    value={formData.registrationCapacity}
                    onChange={(e) => setFormData({ ...formData, registrationCapacity: e.target.value })}
                    placeholder="e.g. 50"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Registration Status</label>
                  <select
                    value={formData.isRegistrationClosed ? 'CLOSED' : 'OPEN'}
                    onChange={(e) => setFormData({ ...formData, isRegistrationClosed: e.target.value === 'CLOSED' })}
                    className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  >
                    <option value="OPEN">🟢 Open for Registration (Accepts attendees until deadline)</option>
                    <option value="CLOSED">🔴 Closed Manually (Stops registrations immediately)</option>
                  </select>
                </div>

                <Input
                  label="External Upload Link (e.g. Google Drive Folder)"
                  value={formData.registrationUploadLink}
                  onChange={(e) => setFormData({ ...formData, registrationUploadLink: e.target.value })}
                  placeholder="https://drive.google.com/drive/folders/..."
                  helperText="If provided, users will be asked to upload their documents here before submitting."
                />
                <Textarea
                  label="Registration Instructions (Optional)"
                  value={formData.registrationNotes}
                  onChange={(e) => setFormData({ ...formData, registrationNotes: e.target.value })}
                  rows={2}
                  placeholder="E.g., Registration fee is ₹500. Please upload the transaction receipt."
                />

                {/* Dynamic Custom Fields Section */}
                <div className="border-t border-slate-200 pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Custom Fields &amp; Columns</h5>
                      <p className="text-[11px] text-slate-500">Add custom fields for this event (e.g. Student Class, Roll No, Branch).</p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleAddField}
                      className="text-xs text-emerald-800 border-emerald-300 hover:bg-emerald-50"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add Custom Field
                    </Button>
                  </div>

                  {formData.registrationFields.length === 0 ? (
                    <div className="p-3 bg-slate-100 rounded-lg text-center text-xs text-slate-500 italic">
                      No custom fields added yet. The form will ask for standard info (Full Name, Email, Phone).
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {formData.registrationFields.map((field, idx) => (
                        <div key={field.id} className="flex items-center gap-2 p-2.5 bg-white border border-slate-200 rounded-lg shadow-2xs">
                          <span className="text-xs font-bold text-slate-400 w-5">#{idx + 1}</span>
                          <input
                            type="text"
                            placeholder="Field Label (e.g. Student Class, Roll No)"
                            value={field.label}
                            onChange={(e) => handleUpdateField(field.id, 'label', e.target.value)}
                            className="flex-1 text-xs rounded border border-slate-300 p-2 focus:ring-1 focus:ring-emerald-600 focus:outline-none font-medium"
                            required
                          />
                          <select
                            value={field.type}
                            onChange={(e) => handleUpdateField(field.id, 'type', e.target.value as any)}
                            className="text-xs rounded border border-slate-300 p-2 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                          >
                            <option value="text">Text</option>
                            <option value="number">Number</option>
                            <option value="tel">Phone</option>
                            <option value="email">Email</option>
                          </select>
                          <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer select-none px-1">
                            <input
                              type="checkbox"
                              checked={field.required}
                              onChange={(e) => handleUpdateField(field.id, 'required', e.target.checked)}
                              className="rounded text-emerald-600 w-3.5 h-3.5"
                            />
                            <span>Req</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => handleRemoveField(field.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                            title="Remove Field"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
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

// --- Registrations Viewer Sub-Component ---

const EventRegistrationsViewer: React.FC<{ eventId: string | null; event?: EventItem }> = ({ eventId, event }) => {
  const queryClient = useQueryClient();
  const customFields: RegistrationFieldDefinition[] = (event?.registrationFields as RegistrationFieldDefinition[]) || [];

  const { data: registrations, isLoading } = useQuery<any[]>({
    queryKey: ['admin-event-registrations', eventId],
    queryFn: async () => {
      const res = await apiClient.get(`/events/${eventId}/registrations`);
      return res.data;
    },
    enabled: !!eventId,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await apiClient.patch(`/events/registrations/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-event-registrations', eventId] });
    },
  });

  const handleExportCSV = () => {
    if (!registrations || registrations.length === 0) {
      alert('No registrations available to export.');
      return;
    }

    const headers = [
      'Registration ID',
      'Full Name',
      'Email',
      'Phone',
      'Designation / Role',
      ...customFields.map((f) => f.label || f.id),
      'Upload Reference',
      'Status',
      'Registered At',
    ];

    const rows = registrations.map((reg) => [
      reg.id,
      `"${(reg.fullName || '').replace(/"/g, '""')}"`,
      `"${(reg.email || '').replace(/"/g, '""')}"`,
      `"${(reg.phone || '').replace(/"/g, '""')}"`,
      `"${(reg.designation || '').replace(/"/g, '""')}"`,
      ...customFields.map((f) => {
        const val = reg.customData?.[f.id] || reg.customData?.[f.label] || '';
        return `"${String(val).replace(/"/g, '""')}"`;
      }),
      `"${(reg.uploadReference || '').replace(/"/g, '""')}"`,
      reg.status || 'APPROVED',
      reg.createdAt ? new Date(reg.createdAt).toLocaleString() : '',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const sanitizedTitle = (event?.title || 'event').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    link.setAttribute('download', `${sanitizedTitle}-registrations-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!eventId) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Registered Participants {event?.title ? `— ${event.title}` : ''}</h3>
          <p className="text-xs text-slate-500">Attendee data with automatic approvals and dynamic field columns.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            size="sm"
            onClick={handleExportCSV}
            disabled={!registrations || registrations.length === 0}
            className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs flex items-center gap-1.5 shadow-sm"
          >
            <Download className="w-4 h-4" /> Export CSV
          </Button>
          <div className="text-xs font-bold text-slate-700 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
            Total: {registrations?.length || 0}
          </div>
        </div>
      </div>

      <div className="border border-slate-200 rounded-lg overflow-x-auto">
        <Table>
          <Thead>
            <Tr>
              <Th>Participant Name</Th>
              <Th>Contact Details</Th>
              {customFields.map((f) => (
                <Th key={f.id}>{f.label || 'Custom Field'}</Th>
              ))}
              <Th>Upload Ref</Th>
              <Th>Status</Th>
              <Th className="text-right">Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {isLoading ? (
              <Tr>
                <Td colSpan={5 + customFields.length} className="text-center py-6 text-xs text-slate-500">Loading registrations...</Td>
              </Tr>
            ) : !registrations || registrations.length === 0 ? (
              <Tr>
                <Td colSpan={5 + customFields.length} className="text-center py-6 text-xs text-slate-500">No registrations yet.</Td>
              </Tr>
            ) : (
              registrations.map((reg) => (
                <Tr key={reg.id}>
                  <Td>
                    <div className="text-xs font-bold text-slate-800">{reg.fullName}</div>
                    {reg.designation && <div className="text-[10px] text-slate-500">{reg.designation}</div>}
                  </Td>
                  <Td>
                    <div className="text-xs text-slate-700">{reg.email}</div>
                    <div className="text-xs text-slate-700">{reg.phone}</div>
                  </Td>
                  {customFields.map((f) => (
                    <Td key={f.id} className="text-xs text-slate-800 font-medium">
                      {reg.customData?.[f.id] || reg.customData?.[f.label] || '-'}
                    </Td>
                  ))}
                  <Td className="text-xs font-mono text-slate-600 max-w-[100px] truncate" title={reg.uploadReference}>
                    {reg.uploadReference || '-'}
                  </Td>
                  <Td>
                    <Badge
                      variant={
                        reg.status === 'APPROVED' ? 'success' : reg.status === 'REJECTED' ? 'danger' : 'warning'
                      }
                      className="text-[10px]"
                    >
                      {reg.status}
                    </Badge>
                  </Td>
                  <Td className="text-right space-x-2 whitespace-nowrap">
                    {reg.status !== 'APPROVED' && (
                      <button
                        onClick={() => updateStatusMutation.mutate({ id: reg.id, status: 'APPROVED' })}
                        className="text-emerald-600 hover:bg-emerald-50 p-1 rounded"
                        title="Approve"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                    {reg.status !== 'REJECTED' && (
                      <button
                        onClick={() => updateStatusMutation.mutate({ id: reg.id, status: 'REJECTED' })}
                        className="text-red-600 hover:bg-red-50 p-1 rounded"
                        title="Reject"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </div>
    </div>
  );
};
