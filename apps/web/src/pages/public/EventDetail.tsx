import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { EventItem, RegistrationFieldDefinition } from '@uhv/shared-types';
import { usePageTitle } from '../../hooks/usePageTitle';
import { Calendar, Clock, MapPin, ArrowLeft, ExternalLink, ShieldCheck, Share2, Hourglass, Download, Building2, Users } from 'lucide-react';
import { toPng } from 'html-to-image';
import { formatDate } from '../../utils/cn';
import { Button } from '../../components/ui/Button';

export const EventDetail: React.FC = () => {
  const { slug, id } = useParams<{ slug?: string; id?: string }>();
  const eventIdentifier = slug || id;
  usePageTitle('Event Details');

  const { data: event, isLoading, isError } = useQuery<EventItem>({
    queryKey: ['public-event-detail', eventIdentifier],
    queryFn: async () => {
      const res = await apiClient.get(`/events/slug/${eventIdentifier}`);
      return res.data;
    },
    enabled: !!eventIdentifier,
  });

  if (isLoading) {
    return (
      <div className="py-20 max-w-4xl mx-auto px-4 text-center">
        <div className="h-64 bg-white rounded-xl border border-slate-200 animate-pulse" />
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="py-20 max-w-lg mx-auto px-4 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Event Not Found</h2>
        <p className="text-xs text-slate-500">The requested event schedule could not be located.</p>
        <Link to="/events">
          <Button variant="primary">Return to Events Calendar</Button>
        </Link>
      </div>
    );
  }

  const isRegistrationOpen = 
    event.enableInternalReg && 
    !event.isRegistrationClosed && 
    !event.registrationNotOpened &&
    (!event.registrationEndDate || new Date() <= new Date(event.registrationEndDate));

  return (
    <div className="py-12 bg-institutional-warm min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Back Link */}
        <div className="text-left">
          <Link
            to="/events"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Events Hub</span>
          </Link>
        </div>

        {/* Main Event Article */}
        <article className="bg-white rounded-xl border border-emerald-900/10 shadow-card p-8 sm:p-10 space-y-8 text-left">
          
          <div className="space-y-4 border-b border-slate-100 pb-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                {event.category}
              </span>
              <div className="flex items-center gap-2">
                {event.registrationNotOpened ? (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900">
                    Registration Opening Soon
                  </span>
                ) : event.enableInternalReg && isRegistrationOpen ? (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-600 text-white shadow-sm">
                    ● Registration Open
                  </span>
                ) : null}
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                  Status: {event.status}
                </span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-institutional-950 leading-tight">
              {event.title}
            </h1>

            {event.shortDescription && (
              <p className="text-base text-slate-600 italic leading-relaxed">
                {event.shortDescription}
              </p>
            )}

            {event.collaborators && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 via-slate-50 to-emerald-50/70 border border-blue-200/80 flex items-center gap-3.5 shadow-2xs">
                <div className="w-10 h-10 rounded-xl bg-blue-700 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-extrabold tracking-wider text-blue-700 block">
                    Official Event Partner &amp; Co-Host
                  </span>
                  <span className="text-sm sm:text-base font-black text-slate-900 truncate block">
                    {event.collaborators}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Logistics Box */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 rounded-lg bg-emerald-50/50 border border-emerald-100 text-xs text-institutional-900">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-emerald-700 shrink-0" />
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Date</span>
                <span className="font-bold">{formatDate(event.eventDate)}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-emerald-700 shrink-0" />
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Schedule</span>
                <span className="font-bold">{event.startTime || 'TBA'} - {event.endTime || 'TBA'}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-emerald-700 shrink-0" />
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Venue</span>
                <span className="font-bold truncate">{event.venue}</span>
              </div>
            </div>
          </div>

          {/* Description Body */}
          <div className="space-y-4 text-sm text-slate-700 leading-relaxed pt-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-institutional-950">
              Overview &amp; Programme Details
            </h3>
            <div className="whitespace-pre-line">{event.description}</div>
          </div>

          {/* Registration Section */}
          <div className="pt-6 border-t border-slate-100 flex flex-col gap-4">
            <span className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600 print:hidden" />
              <span className="print:hidden">Official TKMCE UHV Cell Programme</span>
            </span>

            {event.registrationNotOpened ? (
              <div className="p-6 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-center space-y-3 print:hidden">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-amber-100 text-amber-700 mx-auto">
                  <Hourglass className="w-5 h-5 animate-pulse" />
                </div>
                <h4 className="text-base font-black text-amber-900">Registration Has Not Been Opened Yet</h4>
                <p className="text-xs text-amber-800 max-w-md mx-auto leading-relaxed">
                  The registration link for this event has not been created yet or registration has not officially started. Please check back soon!
                </p>
                <div className="pt-1">
                  <Link to={`/events/${event.slug}/not-opened`}>
                    <Button variant="outline" size="sm" className="text-xs font-bold border-amber-300 text-amber-900 hover:bg-amber-100">
                      View Registration Notice Page →
                    </Button>
                  </Link>
                </div>
              </div>
            ) : event.enableInternalReg ? (
              isRegistrationOpen ? (
                <div className="space-y-4">
                  {/* Capacity & Remaining Registrations Banner in Event Center */}
                  {event.registrationCapacity && (
                    <div className="p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl text-xs flex flex-wrap items-center justify-between gap-3 print:hidden">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
                          <Users className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-extrabold text-emerald-700 tracking-wider block">
                            Registration Capacity &amp; Seats Left
                          </span>
                          <span className="font-bold text-emerald-950 text-sm">
                            {event.remainingCapacity !== null && event.remainingCapacity !== undefined ? (
                              event.remainingCapacity > 0 ? (
                                <>
                                  <strong className="text-base text-emerald-950 font-black">{event.remainingCapacity}</strong> of {event.registrationCapacity} seats remaining
                                </>
                              ) : (
                                <span className="text-red-700 font-bold">Sold Out / Maximum Capacity Reached</span>
                              )
                            ) : (
                              `${event.registrationCapacity} total seats available`
                            )}
                          </span>
                        </div>
                      </div>
                      {event.remainingCapacity !== null && event.remainingCapacity !== undefined && event.remainingCapacity <= 10 && event.remainingCapacity > 0 && (
                        <span className="px-2.5 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 font-extrabold text-[11px] animate-pulse">
                          🔥 Only {event.remainingCapacity} seats left
                        </span>
                      )}
                    </div>
                  )}

                  {event.registrationEndDate && (
                    <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center justify-between print:hidden">
                      <span className="font-semibold">⏰ Registration Deadline:</span>
                      <span className="font-bold">{formatDate(event.registrationEndDate)}</span>
                    </div>
                  )}
                  <EventRegistrationForm event={event} />
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 text-red-800 p-6 rounded-lg text-center font-bold print:hidden">
                  Registrations for this event are currently closed.
                </div>
              )
            ) : event.registrationUrl ? (
              <a
                href={event.registrationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-institutional-850 hover:bg-institutional-900 text-white text-xs font-bold shadow-card transition w-max print:hidden"
              >
                <span>Register on Official Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ) : (
              <span className="text-xs text-slate-400 font-semibold bg-slate-100 px-3 py-1.5 rounded w-max print:hidden">
                Registration handled on-campus
              </span>
            )}
          </div>
        </article>
      </div>
    </div>
  );
};

// --- Registration Form Component ---

const EventRegistrationForm: React.FC<{ event: EventItem }> = ({ event }) => {
  const customFields: RegistrationFieldDefinition[] = (event.registrationFields as RegistrationFieldDefinition[]) || [];

  const [formData, setFormData] = React.useState({
    fullName: '',
    email: '',
    phone: '',
    institution: '',
    designation: '',
    uploadReference: '',
  });

  const [customData, setCustomData] = React.useState<Record<string, any>>({});
  const [ticketType, setTicketType] = React.useState<'INDIVIDUAL' | 'GROUP'>('INDIVIDUAL');
  const [groupName, setGroupName] = React.useState('');
  const [groupSize, setGroupSize] = React.useState(2);
  const [groupMembers, setGroupMembers] = React.useState<string[]>(['']);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [successData, setSuccessData] = React.useState<any>(null);
  const [isDownloadingPng, setIsDownloadingPng] = React.useState(false);
  const [qrDataUrl, setQrDataUrl] = React.useState<string>('');
  const ticketRef = React.useRef<HTMLDivElement>(null);

  const handleGroupSizeChange = (newSize: number) => {
    setGroupSize(newSize);
    const additionalCount = Math.max(1, newSize - 1);
    setGroupMembers((prev) => {
      const next = [...prev];
      while (next.length < additionalCount) next.push('');
      return next.slice(0, additionalCount);
    });
  };

  // Pre-fetch QR Code to Data URL for instant, CORS-free PNG snapshot generation
  React.useEffect(() => {
    let isMounted = true;
    if (successData) {
      const regCode = `UHV-${(successData.id || 'TICKET').slice(0, 8).toUpperCase()}`;
      const isGroup = successData.ticketType === 'GROUP' || (successData.groupSize && successData.groupSize > 1);
      const membersText = isGroup && Array.isArray(successData.groupMembers) && successData.groupMembers.length > 0
        ? `\nMEMBERS: ${successData.fullName} (Lead), ${successData.groupMembers.join(', ')}`
        : '';
      const url = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
        `TKMCE UHV EVENT: ${event.title}\nPASS: ${regCode}\nTYPE: ${isGroup ? `GROUP PASS (${successData.groupSize} ATTENDEES)` : 'INDIVIDUAL PASS'}\nNAME: ${successData.fullName}${isGroup && successData.groupName ? `\nTEAM: ${successData.groupName}` : ''}${membersText}`
      )}`;
      fetch(url)
        .then((res) => res.blob())
        .then((blob) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            if (isMounted && typeof reader.result === 'string') {
              setQrDataUrl(reader.result);
            }
          };
          reader.readAsDataURL(blob);
        })
        .catch((err) => {
          console.warn('Could not pre-convert QR code to base64:', err);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [successData, event.title]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (ticketType === 'GROUP') {
      if (!groupName.trim()) {
        alert('Please enter a Group / Team Name.');
        return;
      }
      for (let i = 0; i < groupMembers.length; i++) {
        if (!groupMembers[i].trim()) {
          alert(`Please enter the full name for Member #${i + 2}.`);
          return;
        }
      }
    }

    if (event.remainingCapacity !== null && event.remainingCapacity !== undefined) {
      const requested = ticketType === 'GROUP' ? groupSize : 1;
      if (requested > event.remainingCapacity) {
        alert(`Only ${event.remainingCapacity} seat${event.remainingCapacity === 1 ? '' : 's'} remaining. Cannot book ${requested} tickets.`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        ticketType,
        groupSize: ticketType === 'GROUP' ? groupSize : 1,
        groupName: ticketType === 'GROUP' ? groupName.trim() : undefined,
        groupMembers: ticketType === 'GROUP' ? groupMembers.map((m) => m.trim()) : [],
        customData,
      };
      const res = await apiClient.post(`/events/${event.id}/register`, payload);
      setSuccessData(res.data);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to submit registration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPng = async () => {
    if (!ticketRef.current) return;
    setIsDownloadingPng(true);
    try {
      const dataUrl = await toPng(ticketRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: '#090d16',
      });
      const regCode = `UHV-${(successData.id || 'TICKET').slice(0, 8).toUpperCase()}`;
      const cleanSlug = (event.slug || 'uhv-event').replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase();
      const link = document.createElement('a');
      link.download = `${cleanSlug}-pass-${regCode.toLowerCase()}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to generate PNG pass:', error);
      alert('Could not render PNG directly. Please use "Print Pass / Save PDF" to print or save your ticket.');
    } finally {
      setIsDownloadingPng(false);
    }
  };

  if (successData) {
    const regCode = `UHV-${(successData.id || 'TICKET').slice(0, 8).toUpperCase()}`;
    const isGroup = successData.ticketType === 'GROUP' || (successData.groupSize && successData.groupSize > 1);
    const membersList: string[] = Array.isArray(successData.groupMembers) ? successData.groupMembers : [];
    const fallbackQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
      `TKMCE UHV EVENT: ${event.title}\nPASS: ${regCode}\nNAME: ${successData.fullName}`
    )}`;

    return (
      <div className="mt-6 space-y-6">
        <style>{`
          @media print {
            body * {
              visibility: hidden !important;
            }
            #uhv-event-ticket, #uhv-event-ticket * {
              visibility: visible !important;
            }
            #uhv-event-ticket {
              position: fixed !important;
              left: 50% !important;
              top: 50% !important;
              transform: translate(-50%, -50%) !important;
              width: 900px !important;
              max-width: 95vw !important;
              margin: 0 !important;
              box-shadow: none !important;
              border: 1px solid #1e293b !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        `}</style>

        <div className="text-center space-y-2 print:hidden">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-black text-slate-900">
            {isGroup ? 'Group Registration Confirmed!' : 'Registration Confirmed!'}
          </h3>
          <p className="text-xs text-slate-500">
            {isGroup
              ? `Your official group pass for ${successData.groupSize || 2} attendees has been issued. Download your ticket as PNG or print below.`
              : 'Your entry pass has been issued. Download your ticket as a PNG image or print below.'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button
              onClick={handleDownloadPng}
              disabled={isDownloadingPng}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md flex items-center gap-2 px-5 py-2.5"
            >
              <Download className="w-4 h-4" />
              {isDownloadingPng ? 'Generating PNG Pass...' : '📥 Download Pass (PNG)'}
            </Button>
            <Button
              onClick={handlePrint}
              variant="outline"
              className="border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs shadow-xs"
            >
              🖨️ Print Pass / Save PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setSuccessData(null);
                setFormData({
                  fullName: '',
                  email: '',
                  phone: '',
                  institution: '',
                  designation: '',
                  uploadReference: '',
                });
                setCustomData({});
                setTicketType('INDIVIDUAL');
                setGroupName('');
                setGroupSize(2);
                setGroupMembers(['']);
              }}
              className="text-xs"
            >
              Register Another Person / Group
            </Button>
          </div>
        </div>

        {/* --- CONCERT-STYLE TICKET STUB (Reference Design) --- */}
        <div className="overflow-x-auto pb-4 pt-2">
          <div
            id="uhv-event-ticket"
            ref={ticketRef}
            className="relative w-full max-w-4xl min-w-[680px] mx-auto rounded-2xl overflow-hidden shadow-2xl border border-slate-800 bg-[#090d16] text-white flex flex-row select-none"
          >
            {/* Main Left Ticket Section */}
            <div className="flex-1 p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-[#0c1322] via-[#090d16] to-[#05070c]">
              {/* Background Texture / Abstract Vinyl Graphic */}
              <div className="absolute -left-12 -bottom-12 w-48 h-48 rounded-full border border-slate-700/20 pointer-events-none" />
              <div className="absolute -left-6 -bottom-6 w-36 h-36 rounded-full border border-slate-700/20 pointer-events-none" />
              <div className="absolute -left-0 -bottom-0 w-24 h-24 rounded-full border border-slate-700/20 pointer-events-none" />

              <div>
                {/* Header Badge */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] font-black text-black shrink-0">
                      UHV
                    </div>
                    <span className="text-[10px] uppercase font-extrabold tracking-widest text-emerald-400">
                      TKM College of Engineering • AICTE Cell
                    </span>
                  </div>
                  <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 shrink-0">
                    {isGroup ? `Official Group Pass (${successData.groupSize} Attendees)` : 'Official Entry Pass'}
                  </span>
                </div>

                {/* Event Collaborators Banner on Ticket */}
                {event.collaborators && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800/90 border border-slate-700/80 text-[10px] font-semibold text-slate-200 mb-3 w-max">
                    <span className="text-emerald-400 font-bold uppercase tracking-wider">In Collaboration With:</span>
                    <span className="text-white font-extrabold">{event.collaborators}</span>
                  </div>
                )}

                {/* Event Title in Bold Concert Headline */}
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tight text-white leading-none mb-4 drop-shadow-sm">
                  {event.title}
                </h1>

                {/* Event Metadata Capsules */}
                <div className="flex flex-wrap items-center gap-2 mb-6">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/90 border border-slate-700 text-xs font-semibold text-slate-200">
                    <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                    {formatDate(event.eventDate)}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/90 border border-slate-700 text-xs font-semibold text-slate-200">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    {event.startTime || 'TBA'} - {event.endTime || 'End'}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/90 border border-slate-700 text-xs font-semibold text-slate-200 truncate max-w-[240px]">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    {event.venue}
                  </span>
                </div>
              </div>

              {/* Attendee Details & Custom Fields */}
              <div className="pt-4 border-t border-slate-800/80">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-left">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">
                      {isGroup ? 'Team Lead' : 'Attendee'}
                    </span>
                    <span className="text-xs font-extrabold text-white truncate block">{successData.fullName}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Contact</span>
                    <span className="text-xs text-slate-300 truncate block">{successData.email}</span>
                  </div>
                  {isGroup && successData.groupName && (
                    <div>
                      <span className="text-[9px] uppercase font-bold text-blue-400 block tracking-wider">Team / Group</span>
                      <span className="text-xs font-black text-blue-200 truncate block">{successData.groupName}</span>
                    </div>
                  )}
                  {/* Dynamically render custom field answers on ticket */}
                  {customFields.map((f) => {
                    const val = customData[f.id] || customData[f.label];
                    if (!val) return null;
                    return (
                      <div key={f.id}>
                        <span className="text-[9px] uppercase font-bold text-emerald-400 block tracking-wider">{f.label}</span>
                        <span className="text-xs font-bold text-slate-100 truncate block">{val}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Group Members List on Ticket Pass */}
                {isGroup && membersList.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 text-left">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider mb-1">
                      Group Attendees ({successData.groupSize || (membersList.length + 1)} Total: Lead + {membersList.length} Members):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-700/50 text-emerald-300 font-bold">
                        1. {successData.fullName} (Lead)
                      </span>
                      {membersList.map((member, idx) => (
                        <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700 text-slate-200 font-medium">
                          {idx + 2}. {member}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Perforated Tear Line Divider with Notch Cutouts */}
            <div className="relative flex flex-col items-center justify-between">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-slate-100 border border-slate-300" />
              <div className="h-full border-r-2 border-dashed border-slate-600/70 my-0" />
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-slate-100 border border-slate-300" />
            </div>

            {/* Right Stub Section */}
            <div className="w-56 p-6 bg-[#0f172a] flex flex-col items-center justify-between gap-4 border-l border-slate-800 text-center relative shrink-0">
              {/* Stub Header */}
              <div className="text-center w-full">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 block">
                  {isGroup ? `ADMIT ${successData.groupSize || 2}` : 'ADMIT ONE'}
                </span>
                <span className="font-mono text-xs font-bold text-slate-300 block tracking-wider mt-0.5">
                  {regCode}
                </span>
                {isGroup && (
                  <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-950/90 text-emerald-300 border border-emerald-500/30 inline-block mt-0.5">
                    Group Pass ({successData.groupSize || 2} Pax)
                  </span>
                )}
                {event.collaborators && (
                  <span className="text-[8px] font-bold text-slate-400 block uppercase truncate max-w-[150px] mx-auto mt-0.5">
                    {event.collaborators}
                  </span>
                )}
              </div>

              {/* QR Code */}
              <div className="bg-white p-2 rounded-xl shadow-lg border border-slate-300">
                <img
                  src={qrDataUrl || fallbackQrUrl}
                  crossOrigin="anonymous"
                  alt="Ticket QR Code"
                  className="w-24 h-24 sm:w-28 sm:h-28 object-contain"
                />
              </div>

              {/* Barcode Graphic */}
              <div className="w-full space-y-1">
                {/* Simulated Barcode Lines */}
                <div className="h-9 w-full flex items-center justify-center gap-[2.5px] bg-white p-1 rounded">
                  {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 2, 4, 1, 2, 3, 1, 4, 2, 1, 3, 2, 1, 4, 2].map((w, i) => (
                    <div key={i} className="h-full bg-black" style={{ width: `${w * 1.5}px` }} />
                  ))}
                </div>
                <span className="text-[9px] font-mono text-slate-400 tracking-widest block uppercase">
                  {regCode}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 p-6 bg-slate-50 rounded-xl border border-slate-200 print:hidden">
      <h3 className="text-lg font-bold text-slate-800 mb-1">Register for this Event</h3>
      <p className="text-xs text-slate-500 mb-4">Complete the form below to receive your official entry ticket.</p>
      
      {event.registrationNotes && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-900">
          <span className="font-bold block mb-1">Instructions:</span>
          <div className="whitespace-pre-wrap">{event.registrationNotes}</div>
        </div>
      )}

      {/* Ticket Category Selection: Individual vs Group */}
      <div className="mb-5 p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
        <label className="text-xs font-bold text-slate-800 block mb-2">Select Ticket Category</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setTicketType('INDIVIDUAL')}
            className={`p-3 rounded-lg border text-left transition flex items-center gap-3 ${
              ticketType === 'INDIVIDUAL'
                ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20'
                : 'border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
              ticketType === 'INDIVIDUAL' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              👤
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block">Individual Pass</span>
              <span className="text-[11px] text-slate-500 block">Single admission (1 Person)</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setTicketType('GROUP')}
            className={`p-3 rounded-lg border text-left transition flex items-center gap-3 ${
              ticketType === 'GROUP'
                ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20'
                : 'border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
              ticketType === 'GROUP' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              👥
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block">Group / Team Pass</span>
              <span className="text-[11px] text-slate-500 block">Multiple attendees (2+ People)</span>
            </div>
          </button>
        </div>
      </div>

      {/* Group & Team Details Section */}
      {ticketType === 'GROUP' && (
        <div className="mb-5 p-4 rounded-xl bg-blue-50/80 border border-blue-200 space-y-4">
          <div className="flex items-center justify-between gap-2 border-b border-blue-200/70 pb-2.5">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-700" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-950">Group &amp; Team Details</h4>
            </div>
            <span className="text-[11px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
              Group Admission
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800">Group / Team Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. CSE Batch 2026 / Team Phoenix"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-300 p-2.5 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800">Total Group Size (Attendees) *</label>
              <select
                value={groupSize}
                onChange={(e) => handleGroupSizeChange(Number(e.target.value))}
                className="w-full text-sm rounded-lg border border-slate-300 p-2.5 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              >
                {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                  const isOverCapacity = event.remainingCapacity !== null && event.remainingCapacity !== undefined && num > event.remainingCapacity;
                  return (
                    <option key={num} value={num} disabled={isOverCapacity}>
                      {num} Attendees {isOverCapacity ? '(Exceeds remaining seats)' : ''}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className="space-y-2.5 pt-2 border-t border-blue-200/60">
            <span className="text-xs font-bold text-slate-800 block">
              Group Attendee Names:
            </span>
            <p className="text-[11px] text-slate-600">
              Note: Attendee #1 is the Team Lead entered in the contact fields below. Please provide the names of all additional team members:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {groupMembers.map((member, idx) => (
                <div key={idx} className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">
                    Member #{idx + 2} Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={`Full Name of Member #${idx + 2}`}
                    value={member}
                    onChange={(e) => {
                      const updated = [...groupMembers];
                      updated[idx] = e.target.value;
                      setGroupMembers(updated);
                    }}
                    className="w-full text-sm rounded-lg border border-slate-300 p-2.5 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {event.registrationUploadLink && (
        <div className="mb-6 p-5 bg-white border border-emerald-200 rounded-lg shadow-sm">
          <h4 className="text-sm font-bold text-emerald-900 mb-2">Step 1: Upload Required Documents</h4>
          <p className="text-xs text-slate-600 mb-4">
            Please click the button below to upload your payment receipt or required documents to our secure folder. 
            Once uploaded, copy the filename or link, and paste it in the form below.
          </p>
          <a
            href={event.registrationUploadLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded shadow transition"
          >
            Open Upload Folder <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {event.registrationUploadLink && (
          <div className="border-t border-slate-200 pt-4 mb-2">
            <h4 className="text-sm font-bold text-slate-800 mb-3">Step 2: Complete Registration Form</h4>
          </div>
        )}
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              {ticketType === 'GROUP' ? 'Team Lead Full Name *' : 'Full Name *'}
            </label>
            <input
              type="text"
              required
              className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              {ticketType === 'GROUP' ? 'Team Lead Email Address *' : 'Email Address *'}
            </label>
            <input
              type="email"
              required
              className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              {ticketType === 'GROUP' ? 'Team Lead Phone Number *' : 'Phone Number *'}
            </label>
            <input
              type="tel"
              required
              className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          {/* DYNAMIC CUSTOM FIELDS CONFIGURED BY ADMIN (e.g. Student Class, Roll No, Branch) */}
          {customFields.map((field) => (
            <div key={field.id} className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                {field.label} {field.required ? '*' : ''}
              </label>
              <input
                type={field.type || 'text'}
                required={field.required}
                placeholder={field.placeholder || `Enter ${field.label}`}
                className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                value={customData[field.id] || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setCustomData((prev) => ({
                    ...prev,
                    [field.id]: val,
                    [field.label]: val,
                  }));
                }}
              />
            </div>
          ))}

          {event.registrationUploadLink && (
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700">Uploaded File Name / Transaction ID *</label>
              <input
                type="text"
                required
                className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                value={formData.uploadReference}
                onChange={(e) => setFormData({ ...formData, uploadReference: e.target.value })}
                placeholder="What did you name your uploaded file?"
              />
            </div>
          )}
        </div>
        
        <div className="pt-2">
          <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto bg-institutional-850 hover:bg-institutional-950 text-white px-8">
            {isSubmitting ? 'Submitting...' : 'Complete Registration & Get Ticket'}
          </Button>
        </div>
      </form>
    </div>
  );
};
