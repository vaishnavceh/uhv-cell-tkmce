import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { EventItem, EventStatus, RegistrationFieldDefinition, EventCoordinator, SplitCollaborator } from '@uhv/shared-types';
import { usePageTitle } from '../../hooks/usePageTitle';
import { Plus, Edit2, Trash2, Calendar, Search, ExternalLink, Users, Download, CheckCircle, XCircle, Phone, Building2 } from 'lucide-react';
import { formatDate } from '../../utils/cn';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Badge } from '../../components/ui/Badge';
import { Table, Thead, Tbody, Tr, Th, Td } from '../../components/ui/Table';
import { ImageUpload } from '../../components/ui/ImageUpload';
import { useToast } from '../../components/ui/Toast';

export const EventsManager: React.FC = () => {
  usePageTitle('Manage Events');
  const queryClient = useQueryClient();
  const { success, error, info } = useToast();

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
    collaborators: '',
    collaboratorLogo: '',
    splitCollaborators: [] as SplitCollaborator[],
    isPaid: false,
    ticketPrice: '',
    upiId: '',
    upiQrCode: '',
    bankName: '',
    bankAccountHolder: '',
    bankAccountNumber: '',
    bankIfscCode: '',
    bankBranch: '',
    paymentInstructions: '',
    coordinatorName: '',
    coordinatorPhone: '',
    coordinators: [] as EventCoordinator[],
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
      const activeCollabs = (formData.splitCollaborators || []).filter((c) => c.name && c.name.trim());
      const collabsString = activeCollabs.map((c) => c.name.trim()).join(', ');
      const firstLogo = activeCollabs.find((c) => c.logoUrl?.trim())?.logoUrl || null;

      const activeCoords = (formData.coordinators || []).filter((c) => c.name && c.name.trim());
      const firstCoord = activeCoords[0];

      if (!formData.title?.trim()) {
        throw new Error('Event Title is required.');
      }
      if (!formData.venue?.trim()) {
        throw new Error('Venue is required.');
      }
      if (!formData.description?.trim()) {
        throw new Error('Description is required.');
      }
      if (!formData.eventDate) {
        throw new Error('Event Date is required.');
      }

      const d = new Date(formData.eventDate);
      if (isNaN(d.getTime())) {
        throw new Error('Invalid Event Date format.');
      }
      const parsedEventDate = d.toISOString();

      let parsedRegEndDate: string | null = null;
      if (formData.registrationEndDate && formData.registrationEndDate.trim() !== '') {
        try {
          const rd = new Date(formData.registrationEndDate);
          if (!isNaN(rd.getTime())) {
            parsedRegEndDate = rd.toISOString();
          }
        } catch {
          parsedRegEndDate = null;
        }
      }

      // Explicit whitelist payload conforming strictly to backend DTO
      const payload: any = {
        title: formData.title.trim(),
        slug: formData.slug?.trim() || undefined,
        description: formData.description.trim(),
        shortDescription: formData.shortDescription?.trim() || null,
        eventDate: parsedEventDate,
        startTime: formData.startTime?.trim() || null,
        endTime: formData.endTime?.trim() || null,
        venue: formData.venue.trim(),
        category: formData.category?.trim() || 'WORKSHOP',
        coverImage: formData.coverImage?.trim() || null,
        collaborators: collabsString || formData.collaborators?.trim() || null,
        collaboratorLogo: firstLogo || formData.collaboratorLogo?.trim() || null,
        splitCollaborators: activeCollabs,
        coordinatorName: firstCoord?.name?.trim() || formData.coordinatorName?.trim() || null,
        coordinatorPhone: firstCoord?.phone?.trim() || formData.coordinatorPhone?.trim() || null,
        coordinators: activeCoords,
        isPaid: Boolean(formData.isPaid),
        ticketPrice: formData.ticketPrice && !isNaN(Number(formData.ticketPrice)) ? Number(formData.ticketPrice) : 0,
        upiId: formData.upiId?.trim() || null,
        upiQrCode: formData.upiQrCode?.trim() || null,
        bankDetails: {
          bankName: formData.bankName?.trim() || '',
          accountHolder: formData.bankAccountHolder?.trim() || '',
          accountNumber: formData.bankAccountNumber?.trim() || '',
          ifscCode: formData.bankIfscCode?.trim() || '',
          branch: formData.bankBranch?.trim() || '',
        },
        paymentInstructions: formData.paymentInstructions?.trim() || null,
        registrationUrl: formData.registrationUrl?.trim() || null,
        enableInternalReg: Boolean(formData.enableInternalReg),
        registrationUploadLink: formData.registrationUploadLink?.trim() || null,
        registrationNotes: formData.registrationNotes?.trim() || null,
        registrationEndDate: parsedRegEndDate,
        registrationCapacity: formData.registrationCapacity && !isNaN(Number(formData.registrationCapacity)) ? Number(formData.registrationCapacity) : null,
        isRegistrationClosed: Boolean(formData.isRegistrationClosed),
        registrationNotOpened: Boolean(formData.registrationNotOpened),
        registrationFields: formData.registrationFields || [],
        status: formData.status || EventStatus.UPCOMING,
        featured: Boolean(formData.featured),
        published: Boolean(formData.published),
      };

      if (editingItem) {
        return await apiClient.patch(`/events/${editingItem.id}`, payload);
      } else {
        return await apiClient.post('/events', payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
      setIsModalOpen(false);
      const wasEditing = !!editingItem;
      resetForm();
      success(wasEditing ? 'Event updated successfully.' : 'Event scheduled successfully.');
    },
    onError: (err: any) => {
      const respMsg = err?.response?.data?.message || err?.message || 'Failed to save event.';
      const formatted = Array.isArray(respMsg) ? respMsg.join(', ') : respMsg;
      error(formatted);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/events/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
      setDeleteId(null);
      success('Event deleted successfully.');
    },
    onError: (err: any) => {
      setDeleteId(null);
      const respMsg = err?.response?.data?.message || err?.message || 'Failed to delete event.';
      error(Array.isArray(respMsg) ? respMsg.join(', ') : respMsg);
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
      collaborators: '',
      collaboratorLogo: '',
      splitCollaborators: [],
      isPaid: false,
      ticketPrice: '',
      upiId: '',
      upiQrCode: '',
      bankName: '',
      bankAccountHolder: '',
      bankAccountNumber: '',
      bankIfscCode: '',
      bankBranch: '',
      paymentInstructions: '',
      coordinatorName: '',
      coordinatorPhone: '',
      coordinators: [],
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

  const handleAddCollaborator = () => {
    setFormData((prev) => ({
      ...prev,
      splitCollaborators: [
        ...prev.splitCollaborators,
        { id: 'collab_' + Date.now(), name: '', logoUrl: '' },
      ],
    }));
  };

  const handleUpdateCollaborator = (id: string, key: keyof SplitCollaborator, value: string) => {
    setFormData((prev) => ({
      ...prev,
      splitCollaborators: prev.splitCollaborators.map((c) =>
        c.id === id ? { ...c, [key]: value } : c
      ),
    }));
  };

  const handleRemoveCollaborator = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      splitCollaborators: prev.splitCollaborators.filter((c) => c.id !== id),
    }));
  };

  const handleAddCoordinator = () => {
    setFormData((prev) => ({
      ...prev,
      coordinators: [
        ...prev.coordinators,
        { id: 'coord_' + Date.now(), name: '', phone: '', role: 'Event Coordinator' },
      ],
    }));
  };

  const handleUpdateCoordinator = (id: string, key: keyof EventCoordinator, value: string) => {
    setFormData((prev) => ({
      ...prev,
      coordinators: prev.coordinators.map((c) =>
        c.id === id ? { ...c, [key]: value } : c
      ),
    }));
  };

  const handleRemoveCoordinator = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      coordinators: prev.coordinators.filter((c) => c.id !== id),
    }));
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
          required: false,
          placeholder: '',
          options: [],
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

    // Parse Split Collaborators
    let loadedCollaborators: SplitCollaborator[] = [];
    if (Array.isArray(item.splitCollaborators) && item.splitCollaborators.length > 0) {
      loadedCollaborators = item.splitCollaborators;
    } else if (item.collaborators) {
      loadedCollaborators = item.collaborators
        .split(',')
        .map((s, idx) => ({
          id: 'collab_' + idx,
          name: s.trim(),
          logoUrl: idx === 0 ? (item.collaboratorLogo || '') : '',
        }))
        .filter((c) => c.name);
    }

    // Parse Multiple Coordinators
    let loadedCoordinators: EventCoordinator[] = [];
    if (Array.isArray(item.coordinators) && item.coordinators.length > 0) {
      loadedCoordinators = item.coordinators;
    } else if (item.coordinatorName) {
      loadedCoordinators = [
        {
          id: 'coord_0',
          name: item.coordinatorName,
          phone: item.coordinatorPhone || '',
          role: 'Event Coordinator',
        },
      ];
    }

    // Parse Bank Details safely
    let parsedBankDetails: any = item.bankDetails || {};
    if (typeof parsedBankDetails === 'string') {
      try {
        parsedBankDetails = JSON.parse(parsedBankDetails);
      } catch {
        parsedBankDetails = {};
      }
    }

    // Parse Custom Registration Fields safely
    let parsedRegFields: RegistrationFieldDefinition[] = [];
    if (Array.isArray(item.registrationFields)) {
      parsedRegFields = item.registrationFields;
    } else if (typeof item.registrationFields === 'string') {
      try {
        const parsed = JSON.parse(item.registrationFields);
        if (Array.isArray(parsed)) parsedRegFields = parsed;
      } catch {
        parsedRegFields = [];
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
      collaborators: item.collaborators || '',
      collaboratorLogo: item.collaboratorLogo || '',
      splitCollaborators: loadedCollaborators,
      isPaid: item.isPaid || false,
      ticketPrice: item.ticketPrice !== null && item.ticketPrice !== undefined ? String(item.ticketPrice) : '',
      upiId: item.upiId || '',
      upiQrCode: item.upiQrCode || '',
      bankName: parsedBankDetails?.bankName || '',
      bankAccountHolder: parsedBankDetails?.accountHolder || '',
      bankAccountNumber: parsedBankDetails?.accountNumber || '',
      bankIfscCode: parsedBankDetails?.ifscCode || '',
      bankBranch: parsedBankDetails?.branch || '',
      paymentInstructions: item.paymentInstructions || '',
      coordinatorName: item.coordinatorName || '',
      coordinatorPhone: item.coordinatorPhone || '',
      coordinators: loadedCoordinators,
      registrationUrl: item.registrationUrl || '',
      enableInternalReg: item.enableInternalReg || false,
      registrationUploadLink: item.registrationUploadLink || '',
      registrationNotes: item.registrationNotes || '',
      registrationEndDate: safeRegDate,
      registrationCapacity: item.registrationCapacity !== null && item.registrationCapacity !== undefined ? String(item.registrationCapacity) : '',
      isRegistrationClosed: item.isRegistrationClosed || false,
      registrationNotOpened: item.registrationNotOpened || false,
      registrationFields: parsedRegFields,
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
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs font-bold text-institutional-950">{item.title}</p>
                        {item.featured && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-100 text-amber-800 font-bold uppercase">
                            Featured
                          </span>
                        )}
                        {item.collaborators && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                            🤝 {item.collaborators}
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

      {/* Create / Edit Modal - 16:9 Widescreen */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Scheduled Event' : 'Schedule New Event'}
        maxWidth="16:9"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate();
          }}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 xl:gap-8">
            {/* LEFT COLUMN: Event Essentials & Inquiries */}
            <div className="space-y-4">
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

              {/* Collaborators & Logos Section (URL only - does not overload storage) */}
              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-blue-950 uppercase tracking-wider">
                      Official Collaborators / Co-Hosts (Optional)
                    </h5>
                    <p className="text-[11px] text-blue-800/80">
                      Add each partner organization and their logo URL (URL upload only, zero storage usage).
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddCollaborator}
                    className="text-[11px] h-7 px-2.5 bg-white border-blue-300 text-blue-900 hover:bg-blue-100"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Partner
                  </Button>
                </div>

                {formData.splitCollaborators.length === 0 ? (
                  <div className="p-3 bg-white/80 rounded-lg border border-dashed border-blue-200 text-center">
                    <span className="text-xs text-blue-700">No individual collaborators added yet.</span>
                    <button
                      type="button"
                      onClick={handleAddCollaborator}
                      className="ml-2 text-xs font-bold text-blue-900 underline hover:text-blue-950"
                    >
                      + Add One
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {formData.splitCollaborators.map((collab, idx) => (
                      <div
                        key={collab.id}
                        className="p-3 bg-white rounded-lg border border-blue-200 space-y-2 relative shadow-2xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">
                            Partner #{idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveCollaborator(collab.id)}
                            className="text-slate-400 hover:text-red-600 transition p-1"
                            title="Remove Partner"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <Input
                            label="Organization Name *"
                            value={collab.name}
                            onChange={(e) => handleUpdateCollaborator(collab.id, 'name', e.target.value)}
                            placeholder="e.g. Government of Kerala / AICTE"
                            required
                          />
                          <Input
                            label="Logo Image URL (URL only) *"
                            value={collab.logoUrl || ''}
                            onChange={(e) => handleUpdateCollaborator(collab.id, 'logoUrl', e.target.value)}
                            placeholder="https://... or /assets/logo.png"
                            helperText="URL only — does not use server disk storage."
                          />
                        </div>
                        {collab.logoUrl && (
                          <div className="flex items-center gap-2 pt-1">
                            <span className="text-[10px] text-slate-500 font-semibold">Logo Preview:</span>
                            <img
                              src={collab.logoUrl}
                              alt={collab.name}
                              className="h-7 max-w-[100px] object-contain rounded bg-slate-50 p-1 border border-slate-200"
                              onError={(e) => (e.currentTarget.style.display = 'none')}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Event Coordinators for Enquiries (Supports Multiple Coordinators) */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Event Coordinators (For Enquiries)
                    </h5>
                    <p className="text-[11px] text-slate-500">
                      Add faculty, student, or committee coordinators with direct call &amp; WhatsApp contacts.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddCoordinator}
                    className="text-[11px] h-7 px-2.5 bg-white border-slate-300 text-slate-800 hover:bg-slate-100"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Coordinator
                  </Button>
                </div>

                {formData.coordinators.length === 0 ? (
                  <div className="p-3 bg-white rounded-lg border border-dashed border-slate-300 text-center">
                    <span className="text-xs text-slate-500">No coordinator added yet.</span>
                    <button
                      type="button"
                      onClick={handleAddCoordinator}
                      className="ml-2 text-xs font-bold text-slate-700 underline hover:text-slate-900"
                    >
                      + Add Coordinator
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {formData.coordinators.map((coord, idx) => (
                      <div
                        key={coord.id}
                        className="p-3 bg-white rounded-lg border border-slate-200 space-y-2 relative shadow-2xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                            Coordinator #{idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveCoordinator(coord.id)}
                            className="text-slate-400 hover:text-red-600 transition p-1"
                            title="Remove Coordinator"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          <Input
                            label="Full Name *"
                            value={coord.name}
                            onChange={(e) => handleUpdateCoordinator(coord.id, 'name', e.target.value)}
                            placeholder="e.g. Dr. Sarah Jenkins"
                            required
                          />
                          <Input
                            label="Phone / WhatsApp *"
                            value={coord.phone}
                            onChange={(e) => handleUpdateCoordinator(coord.id, 'phone', e.target.value)}
                            placeholder="e.g. +91 98765 43210"
                            required
                          />
                          <Input
                            label="Role / Designation"
                            value={coord.role || ''}
                            onChange={(e) => handleUpdateCoordinator(coord.id, 'role', e.target.value)}
                            placeholder="e.g. Faculty / Student Lead"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Event Pricing & Fee Section */}
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3.5">
                <h5 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                  Event Pricing &amp; Payment Options
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Admission Type</label>
                    <select
                      value={formData.isPaid ? 'PAID' : 'FREE'}
                      onChange={(e) => setFormData({ ...formData, isPaid: e.target.value === 'PAID' })}
                      className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-white font-medium"
                    >
                      <option value="FREE">🎟️ Free Entry (₹0)</option>
                      <option value="PAID">💳 Paid Ticket / Registration Fee</option>
                    </select>
                  </div>
                  {formData.isPaid && (
                    <Input
                      label="Fee per Attendee / Ticket (₹) *"
                      type="number"
                      min="0"
                      step="1"
                      value={formData.ticketPrice}
                      onChange={(e) => setFormData({ ...formData, ticketPrice: e.target.value })}
                      placeholder="e.g. 250"
                      helperText="Scales automatically with number of attendees for group passes."
                      required
                    />
                  )}
                </div>

                {formData.isPaid && (
                  <div className="space-y-3 pt-2 border-t border-emerald-200/80">
                    <div className="space-y-0.5">
                      <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wide block">
                        📱 Google Pay / UPI Settings
                      </span>
                      <p className="text-[10px] text-slate-500">
                        Provide UPI ID and/or QR code image URL for instant UPI mobile payments.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        label="UPI ID / VPA (Google Pay / PhonePe)"
                        value={formData.upiId}
                        onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                        placeholder="e.g. uhvcell@okaxis or tkmce@sbi"
                        helperText="Allows attendees to pay or copy directly."
                      />
                      <Input
                        label="Google Pay / UPI QR Code URL (URL only)"
                        value={formData.upiQrCode}
                        onChange={(e) => setFormData({ ...formData, upiQrCode: e.target.value })}
                        placeholder="https://... or /assets/upi_qr.png"
                        helperText="URL only — does not use server disk storage."
                      />
                    </div>

                    {formData.upiQrCode && (
                      <div className="flex items-center gap-3 p-2 bg-white rounded-lg border border-emerald-200">
                        <span className="text-[10px] text-slate-500 font-semibold">QR Code Preview:</span>
                        <img
                          src={formData.upiQrCode}
                          alt="UPI QR Code"
                          className="w-16 h-16 object-contain rounded border border-slate-200 bg-white p-1"
                          onError={(e) => (e.currentTarget.style.display = 'none')}
                        />
                      </div>
                    )}

                    <div className="space-y-0.5 pt-1">
                      <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wide block">
                        🏦 Bank Account Transfer Details (Optional)
                      </span>
                      <p className="text-[10px] text-slate-500">
                        For institutional NEFT / RTGS / IMPS direct transfers.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <Input
                        label="Bank Name"
                        value={formData.bankName}
                        onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                        placeholder="e.g. State Bank of India"
                      />
                      <Input
                        label="Account Holder Name"
                        value={formData.bankAccountHolder}
                        onChange={(e) => setFormData({ ...formData, bankAccountHolder: e.target.value })}
                        placeholder="e.g. UHV Cell, TKMCE"
                      />
                      <Input
                        label="Account Number"
                        value={formData.bankAccountNumber}
                        onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                        placeholder="e.g. 123456789012"
                      />
                      <Input
                        label="IFSC Code"
                        value={formData.bankIfscCode}
                        onChange={(e) => setFormData({ ...formData, bankIfscCode: e.target.value })}
                        placeholder="e.g. SBIN0001234"
                      />
                      <div className="sm:col-span-2">
                        <Input
                          label="Branch / Campus Location"
                          value={formData.bankBranch}
                          onChange={(e) => setFormData({ ...formData, bankBranch: e.target.value })}
                          placeholder="e.g. TKM College Campus Branch, Karicode"
                        />
                      </div>
                    </div>

                    <Textarea
                      label="Payment Instructions / Note"
                      value={formData.paymentInstructions}
                      onChange={(e) => setFormData({ ...formData, paymentInstructions: e.target.value })}
                      placeholder="e.g. Scan the QR code or pay via UPI/NEFT, then enter your 12-digit UPI Reference / UTR Number to complete registration."
                      rows={2}
                    />
                  </div>
                )}
              </div>

              <Input
                label="Short Summary"
                value={formData.shortDescription}
                onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                placeholder="Brief 1-sentence teaser for cards"
              />

              <Textarea
                label="Comprehensive Description *"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder="Full schedule details, speaker profiles, expected prerequisites..."
                required
              />
            </div>

            {/* RIGHT COLUMN: Cover Image, Registration & Custom Fields */}
            <div className="space-y-4">
              <ImageUpload
                label="Event Cover / Banner Image (Optional)"
                value={formData.coverImage}
                onChange={(url) => setFormData({ ...formData, coverImage: url })}
                folder="events"
                aspectRatio="video"
                helperText="Upload event promotional poster or header image"
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="External Registration Link (Optional)"
                  value={formData.registrationUrl}
                  onChange={(e) => setFormData({ ...formData, registrationUrl: e.target.value })}
                  placeholder="https://forms.gle/..."
                />
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as EventStatus })}
                    className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  >
                    <option value={EventStatus.UPCOMING}>UPCOMING</option>
                    <option value={EventStatus.ONGOING}>ONGOING</option>
                    <option value={EventStatus.COMPLETED}>COMPLETED</option>
                    <option value={EventStatus.CANCELLED}>CANCELLED</option>
                    <option value={EventStatus.DRAFT}>DRAFT</option>
                  </select>
                </div>
              </div>

              {/* Registration Link Not Opened Yet Toggle */}
              <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-xl">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs font-semibold text-amber-950">
                  <input
                    type="checkbox"
                    checked={formData.registrationNotOpened}
                    onChange={(e) => setFormData({ ...formData, registrationNotOpened: e.target.checked })}
                    className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4 mt-0.5"
                  />
                  <div>
                    <span className="font-bold text-amber-900 block">Registration link not created / Not opened yet</span>
                    <span className="text-[11px] text-amber-700 font-normal block mt-0.5">
                      Displays a dedicated "Registration Has Not Been Opened Yet" page and notification to users.
                    </span>
                  </div>
                </label>
              </div>

              {/* INTERNAL REGISTRATION SETTINGS BLOCK */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Internal Registration Settings</h4>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-emerald-800">
                    <input
                      type="checkbox"
                      checked={formData.enableInternalReg}
                      onChange={(e) => setFormData({ ...formData, enableInternalReg: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span>Enable Internal Form</span>
                  </label>
                </div>

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
                      placeholder="E.g., Please carry student ID card to the venue."
                    />

                    {/* Dynamic Custom Fields Section */}
                    <div className="border-t border-slate-200 pt-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Custom Fields &amp; Columns</h5>
                          <p className="text-[11px] text-slate-500">Add Checkbox (Food needed?), Dropdowns, or Text inputs.</p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={handleAddField}
                          className="text-xs text-emerald-800 border-emerald-300 hover:bg-emerald-50"
                        >
                          <Plus className="w-3.5 h-3.5 mr-1" /> Add Field
                        </Button>
                      </div>

                      {formData.registrationFields.length === 0 ? (
                        <div className="p-3 bg-white rounded-lg border border-dashed border-slate-300 text-center text-xs text-slate-500 italic">
                          No custom fields added yet. The form will ask for standard attendee &amp; group information.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {formData.registrationFields.map((field, idx) => (
                            <div key={field.id} className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-400 w-5">#{idx + 1}</span>
                                <input
                                  type="text"
                                  placeholder="Field Label (e.g. Food / Lunch Required?, Department)"
                                  value={field.label}
                                  onChange={(e) => handleUpdateField(field.id, 'label', e.target.value)}
                                  className="flex-1 text-xs rounded-lg border border-slate-300 p-2 focus:ring-1 focus:ring-emerald-600 focus:outline-none font-medium"
                                  required
                                />
                                <select
                                  value={field.type}
                                  onChange={(e) => handleUpdateField(field.id, 'type', e.target.value as any)}
                                  className="text-xs rounded-lg border border-slate-300 p-2 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                                >
                                  <option value="text">Text Input</option>
                                  <option value="checkbox">Checkbox (Yes/No, e.g. Food needed?)</option>
                                  <option value="select">Dropdown / Select</option>
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

                              {/* If Select type, allow entering options */}
                              {field.type === 'select' && (
                                <div className="pl-7">
                                  <input
                                    type="text"
                                    placeholder="Enter comma-separated options (e.g. Vegetarian, Non-Vegetarian, Jain)"
                                    value={Array.isArray(field.options) ? field.options.join(', ') : (field.options || '')}
                                    onChange={(e) => {
                                      const opts = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                                      handleUpdateField(field.id, 'options', opts);
                                    }}
                                    className="w-full text-[11px] rounded border border-slate-300 p-1.5 bg-slate-50 focus:bg-white focus:outline-none"
                                  />
                                </div>
                              )}
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
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              isLoading={saveMutation.isPending}
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
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

// --- Registrations Viewer Sub-Component ---

const EventRegistrationsViewer: React.FC<{ eventId: string | null; event?: EventItem }> = ({ eventId, event }) => {
  const queryClient = useQueryClient();
  const { success, error, info } = useToast();
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-event-registrations', eventId] });
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
      success(`Registration status marked as ${variables.status}.`);
    },
    onError: (err: any) => {
      const respMsg = err?.response?.data?.message || err?.message || 'Failed to update registration status.';
      error(Array.isArray(respMsg) ? respMsg.join(', ') : respMsg);
    },
  });

  const verifyPaymentMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await apiClient.patch(`/events/registrations/${id}/verify-payment`, { status });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-event-registrations', eventId] });
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
      success(variables.status === 'VERIFIED' ? 'Payment cross-checked & verified!' : 'Payment marked as pending verification.');
    },
    onError: (err: any) => {
      const respMsg = err?.response?.data?.message || err?.message || 'Failed to update payment status.';
      error(Array.isArray(respMsg) ? respMsg.join(', ') : respMsg);
    },
  });

  const handleExportCSV = () => {
    if (!registrations || registrations.length === 0) {
      info('No registrations available to export.');
      return;
    }

    const headers = [
      'Registration ID',
      'Ticket Number / Ref',
      'Ticket Type',
      'Group Size',
      'Team / Group Name',
      'Lead Full Name',
      'Email',
      'Phone',
      'Group Members',
      'Designation / Role',
      'Institution',
      'Admission Type',
      'Ticket Fee (₹)',
      'Total Amount (₹)',
      ...customFields.map((f) => f.label || f.id),
      'Payment Ref / UTR / Upload Ref',
      'Payment Status',
      'Payment Verified',
      'Status',
      'Checked In',
      'Checked In At',
      'Registered At',
    ];

    const escapeCSV = (val: any) => {
      if (val === null || val === undefined) return '""';
      if (typeof val === 'boolean') return val ? '"Yes"' : '"No"';
      return `"${String(val).replace(/"/g, '""')}"`;
    };

    const rows = registrations.map((reg) => [
      escapeCSV(reg.id),
      escapeCSV(reg.id ? reg.id.slice(0, 8).toUpperCase() : ''),
      escapeCSV(reg.ticketType || (reg.groupSize > 1 ? 'GROUP' : 'INDIVIDUAL')),
      escapeCSV(reg.groupSize || 1),
      escapeCSV(reg.groupName || ''),
      escapeCSV(reg.fullName || ''),
      escapeCSV(reg.email || ''),
      escapeCSV(reg.phone || ''),
      escapeCSV(Array.isArray(reg.groupMembers) ? reg.groupMembers.join('; ') : ''),
      escapeCSV(reg.designation || ''),
      escapeCSV(reg.institution || ''),
      escapeCSV(event?.isPaid ? 'PAID' : 'FREE'),
      escapeCSV(event?.isPaid ? (event.ticketPrice || 0) : 0),
      escapeCSV(reg.totalAmount !== undefined ? reg.totalAmount : (event?.isPaid ? (event.ticketPrice || 0) * (reg.groupSize || 1) : 0)),
      ...customFields.map((f) => {
        const raw = reg.customData?.[f.id] ?? reg.customData?.[f.label];
        if (f.type === 'checkbox' || typeof raw === 'boolean') {
          return raw ? '"Yes"' : '"No"';
        }
        return escapeCSV(raw ?? '');
      }),
      escapeCSV(reg.paymentReference || reg.uploadReference || ''),
      escapeCSV(
        !event?.isPaid
          ? 'FREE'
          : reg.paymentStatus === 'VERIFIED'
          ? 'PAID (VERIFIED BY ADMIN)'
          : 'NOT VERIFIED (PENDING CROSS-CHECK)'
      ),
      escapeCSV(
        !event?.isPaid
          ? 'N/A (FREE)'
          : reg.paymentStatus === 'VERIFIED'
          ? 'Yes (Verified)'
          : 'No (Pending Verification)'
      ),
      escapeCSV(reg.status || 'APPROVED'),
      escapeCSV(reg.checkedIn ? 'Yes' : 'No'),
      escapeCSV(reg.checkedInAt ? new Date(reg.checkedInAt).toLocaleString() : ''),
      escapeCSV(reg.createdAt ? new Date(reg.createdAt).toLocaleString() : ''),
    ]);

    const csvString = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const sanitizedTitle = (event?.title || 'event').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    link.download = `${sanitizedTitle}-registrations-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!eventId) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Registered Participants {event?.title ? `— ${event.title}` : ''}</h3>
          <p className="text-xs text-slate-500">Attendee data with automatic approvals, group passes, fees, and dynamic fields.</p>
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
              <Th>Participant / Group</Th>
              <Th>Contact Details</Th>
              <Th>Admission &amp; Fee</Th>
              {customFields.map((f) => (
                <Th key={f.id}>{f.label || 'Custom Field'}</Th>
              ))}
              <Th>Payment Ref / Proof</Th>
              <Th>Status</Th>
              <Th className="text-right">Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {isLoading ? (
              <Tr>
                <Td colSpan={6 + customFields.length} className="text-center py-6 text-xs text-slate-500">Loading registrations...</Td>
              </Tr>
            ) : !registrations || registrations.length === 0 ? (
              <Tr>
                <Td colSpan={6 + customFields.length} className="text-center py-6 text-xs text-slate-500">No registrations yet.</Td>
              </Tr>
            ) : (
              registrations.map((reg) => (
                <Tr key={reg.id}>
                  <Td>
                    <div className="text-xs font-bold text-slate-800">{reg.fullName}</div>
                    {reg.designation && <div className="text-[10px] text-slate-500">{reg.designation}</div>}
                    {reg.groupSize && reg.groupSize > 1 ? (
                      <div className="mt-1">
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-800">
                          👥 Group of {reg.groupSize} {reg.groupName ? `• ${reg.groupName}` : ''}
                        </span>
                        {Array.isArray(reg.groupMembers) && reg.groupMembers.length > 0 && (
                          <div className="text-[10px] text-slate-500 mt-0.5 max-w-xs truncate" title={reg.groupMembers.join(', ')}>
                            + {reg.groupMembers.join(', ')}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[9px] text-slate-400 font-medium mt-0.5 block">
                        👤 Individual
                      </span>
                    )}
                  </Td>
                  <Td>
                    <div className="text-xs text-slate-700">{reg.email}</div>
                    <div className="text-xs text-slate-700">{reg.phone}</div>
                  </Td>
                  <Td>
                    {event?.isPaid ? (
                      <div className="space-y-1">
                        <span className="text-xs font-black text-emerald-800 block">
                          ₹{reg.totalAmount !== undefined ? reg.totalAmount : (event.ticketPrice || 0) * (reg.groupSize || 1)}
                        </span>
                        <div>
                          {reg.paymentStatus === 'VERIFIED' ? (
                            <button
                              type="button"
                              onClick={() => verifyPaymentMutation.mutate({ id: reg.id, status: 'PENDING' })}
                              title="Click to revert to Unverified / Pending"
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300 transition"
                            >
                              ✅ Verified / Paid
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => verifyPaymentMutation.mutate({ id: reg.id, status: 'VERIFIED' })}
                              title="Cross-check against bank account/UPI and click to verify"
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 transition shadow-sm"
                            >
                              🔍 Cross-Check &amp; Verify
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        🎟️ FREE
                      </span>
                    )}
                  </Td>
                  {customFields.map((f) => {
                    const rawVal = reg.customData?.[f.id] ?? reg.customData?.[f.label];
                    const isBool = f.type === 'checkbox' || typeof rawVal === 'boolean';
                    return (
                      <Td key={f.id} className="text-xs text-slate-800 font-medium">
                        {isBool ? (
                          rawVal ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              ✅ Yes
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium text-slate-500 bg-slate-100">
                              No
                            </span>
                          )
                        ) : (
                          rawVal || '-'
                        )}
                      </Td>
                    );
                  })}
                  <Td className="text-xs font-mono text-slate-700 max-w-[130px] truncate" title={reg.paymentReference || reg.uploadReference}>
                    {reg.paymentReference || reg.uploadReference ? (
                      <span className="bg-slate-100 text-slate-800 font-semibold px-1.5 py-0.5 rounded border border-slate-200">
                        {reg.paymentReference || reg.uploadReference}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
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
                    {reg.checkedIn && (
                      <span className="block mt-1 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        ✅ Checked In
                      </span>
                    )}
                    {reg.paymentStatus === 'VERIFIED' && (
                      <span className="block mt-0.5 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                        💳 Payment Verified
                      </span>
                    )}
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
