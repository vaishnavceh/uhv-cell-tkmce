import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { EventItem, RegistrationFieldDefinition } from '@uhv/shared-types';
import { usePageTitle } from '../../hooks/usePageTitle';
import { Calendar, Clock, MapPin, ArrowLeft, ExternalLink, ShieldCheck, Share2, Hourglass, Download, Building2, Users, Phone, Mail, Bell, Copy, Check, QrCode, CreditCard, Lock } from 'lucide-react';
import { toPng } from 'html-to-image';
import { QRCodeSVG } from 'qrcode.react';
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
    event.status === 'UPCOMING' &&
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
        <article className="bg-white rounded-2xl border border-emerald-900/10 shadow-card overflow-hidden text-left">
          {/* Top Hero Banner */}
          {event.coverImage ? (
            <div className="w-full relative aspect-[21/9] sm:aspect-[16/7] max-h-[420px] bg-slate-900 overflow-hidden">
              <img
                src={event.coverImage}
                alt={event.title}
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
            </div>
          ) : (
            <div className="w-full h-28 sm:h-36 bg-gradient-to-r from-emerald-900 via-teal-900 to-institutional-950 relative overflow-hidden flex items-center px-8">
              <div className="flex items-center gap-3 text-white/30">
                <Calendar className="w-10 h-10" />
                <span className="text-lg font-bold tracking-wider uppercase text-white/40 font-mono">
                  UHV Cell Event Calendar
                </span>
              </div>
            </div>
          )}

          <div className="p-8 sm:p-10 space-y-8">
            <div className="space-y-4 border-b border-slate-100 pb-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                {event.category}
              </span>
              <div className="flex items-center gap-2">
                {event.isPaid ? (
                  <span className="text-xs font-black px-2.5 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-900">
                    ₹{event.ticketPrice} per attendee
                  </span>
                ) : (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                    🎟️ Free Entry
                  </span>
                )}
                {event.status !== 'UPCOMING' ? (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-200 border border-slate-300 text-slate-700 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-slate-500" />
                    Registration Locked
                  </span>
                ) : event.registrationNotOpened ? (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900">
                    Registration Opening Soon
                  </span>
                ) : event.enableInternalReg && isRegistrationOpen ? (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-600 text-white shadow-sm">
                    ● Registration Open
                  </span>
                ) : null}
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  event.status === 'UPCOMING' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                }`}>
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

            {/* Official Co-branding Banner with Logos (Supports Split Collaborators) */}
            {((event.splitCollaborators && event.splitCollaborators.length > 0) || event.collaborators) && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 via-slate-50 to-emerald-50/70 border border-blue-200/80 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between gap-2 border-b border-blue-200/60 pb-2">
                  <span className="text-[10px] uppercase font-extrabold tracking-wider text-blue-800">
                    Official Event Partner(s) &amp; Co-Host(s)
                  </span>
                  <div className="flex items-center gap-2 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                    <img src="/assets/uhv_logo_green.png" alt="UHV Emblem" className="w-5 h-5 object-contain" />
                    <span className="text-[10px] font-bold text-slate-700">UHV Cell TKMCE</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {event.splitCollaborators && event.splitCollaborators.length > 0 ? (
                    event.splitCollaborators.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center gap-2.5 bg-white px-3 py-1.5 rounded-lg border border-blue-200 shadow-2xs"
                      >
                        {c.logoUrl ? (
                          <img
                            src={c.logoUrl}
                            alt={c.name}
                            className="w-8 h-8 object-contain rounded p-0.5 border border-slate-100 shrink-0 bg-white"
                            onError={(e) => (e.currentTarget.style.display = 'none')}
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-lg bg-blue-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                            <Building2 className="w-4 h-4" />
                          </div>
                        )}
                        <span className="text-xs sm:text-sm font-black text-slate-900">
                          {c.name}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center gap-3">
                      {event.collaboratorLogo ? (
                        <img
                          src={event.collaboratorLogo}
                          alt="Collaborator Logo"
                          className="w-10 h-10 object-contain rounded-lg bg-white p-1 border border-blue-200 shadow-sm shrink-0"
                          onError={(e) => (e.currentTarget.style.display = 'none')}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-blue-700 text-white flex items-center justify-center shrink-0 shadow-sm">
                          <Building2 className="w-5 h-5" />
                        </div>
                      )}
                      <span className="text-sm sm:text-base font-black text-slate-900">
                        {event.collaborators}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Coordinator Contact For Enquiries (Supports Multiple Coordinators) */}
            {((event.coordinators && event.coordinators.length > 0) || event.coordinatorName) && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 shadow-2xs">
                <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2">
                  <div className="w-6 h-6 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[10px] uppercase font-extrabold text-blue-700 tracking-wider">
                    For Enquiries Contact Coordinator{(event.coordinators && event.coordinators.length > 1) ? 's' : ''}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {event.coordinators && event.coordinators.length > 0 ? (
                    event.coordinators.map((coord) => (
                      <div
                        key={coord.id}
                        className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between gap-2 shadow-2xs"
                      >
                        <div className="min-w-0">
                          <span className="font-bold text-slate-900 text-xs sm:text-sm block truncate">
                            {coord.name}
                          </span>
                          <span className="text-[10px] font-medium text-emerald-700 block">
                            {coord.role || 'Event Coordinator'}
                          </span>
                          <span className="text-xs font-mono text-slate-500 block">
                            {coord.phone}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <a
                            href={`tel:${coord.phone}`}
                            className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition flex items-center gap-1"
                            title="Call Coordinator"
                          >
                            <Phone className="w-3.5 h-3.5" /> Call
                          </a>
                          <a
                            href={`https://wa.me/${coord.phone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition"
                            title="Chat on WhatsApp"
                          >
                            WhatsApp
                          </a>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between gap-2 shadow-2xs col-span-2">
                      <div>
                        <span className="font-bold text-slate-900 text-sm block">
                          {event.coordinatorName}
                        </span>
                        {event.coordinatorPhone && (
                          <span className="text-xs font-mono text-slate-600 block">
                            {event.coordinatorPhone}
                          </span>
                        )}
                      </div>
                      {event.coordinatorPhone && (
                        <div className="flex items-center gap-2 shrink-0">
                          <a
                            href={`tel:${event.coordinatorPhone}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-2xs transition"
                          >
                            <Phone className="w-3.5 h-3.5" /> Call
                          </a>
                          <a
                            href={`https://wa.me/${event.coordinatorPhone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs transition"
                          >
                            WhatsApp
                          </a>
                        </div>
                      )}
                    </div>
                  )}
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

            {event.status !== 'UPCOMING' ? (
              <div className="p-6 sm:p-8 rounded-2xl bg-slate-100 border border-slate-300 text-slate-800 text-center space-y-4 shadow-2xs print:hidden">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-slate-200 text-slate-700 mx-auto shadow-inner border border-slate-300">
                  <Lock className="w-7 h-7" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-lg font-black text-slate-900 tracking-tight">
                    Event Registration Locked
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
                    Registrations are strictly permitted for <strong className="text-slate-900">UPCOMING</strong> events only.
                    This event is currently marked as{' '}
                    <span className="font-extrabold uppercase px-2 py-0.5 rounded bg-slate-200 text-slate-900 text-xs border border-slate-300">
                      {event.status}
                    </span>.
                  </p>
                </div>
                <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                  <Link to="/events">
                    <Button variant="outline" size="sm" className="text-xs font-bold border-slate-300 text-slate-800 hover:bg-slate-200">
                      Browse Upcoming Events →
                    </Button>
                  </Link>
                  <Link to="/contact">
                    <Button variant="ghost" size="sm" className="text-xs font-bold text-slate-600 hover:text-slate-900">
                      Contact Organizers
                    </Button>
                  </Link>
                </div>
              </div>
            ) : event.registrationNotOpened ? (
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
  const [paymentReference, setPaymentReference] = React.useState('');
  const [copiedUpi, setCopiedUpi] = React.useState(false);
  const [copiedAcc, setCopiedAcc] = React.useState(false);
  const [copiedIfsc, setCopiedIfsc] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [activePassIndex, setActivePassIndex] = React.useState<number | 'all'>('all');
  const [successData, setSuccessData] = React.useState<any>(null);
  const [isDownloadingPng, setIsDownloadingPng] = React.useState(false);
  const [qrDataUrl, setQrDataUrl] = React.useState<string>('');
  const [uhvLogoBase64, setUhvLogoBase64] = React.useState<string>('');
  const [tkmLogoBase64, setTkmLogoBase64] = React.useState<string>('');
  const [collaboratorLogoBase64, setCollaboratorLogoBase64] = React.useState<string>('');
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

  // Convert logos to base64 for canvas & PNG export compatibility
  React.useEffect(() => {
    fetch('/assets/uhv_logo_white.png')
      .then((r) => r.blob())
      .then((b) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') setUhvLogoBase64(reader.result);
        };
        reader.readAsDataURL(b);
      })
      .catch(() => {});

    fetch('/assets/tkm-logo.png')
      .then((r) => r.blob())
      .then((b) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') setTkmLogoBase64(reader.result);
        };
        reader.readAsDataURL(b);
      })
      .catch(() => {});

    if (event.collaboratorLogo) {
      fetch(event.collaboratorLogo)
        .then((r) => r.blob())
        .then((b) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            if (typeof reader.result === 'string') setCollaboratorLogoBase64(reader.result);
          };
          reader.readAsDataURL(b);
        })
        .catch(() => {});
    }
  }, [event.collaboratorLogo]);

  // Pre-fetch QR Code to Data URL for instant, CORS-free PNG snapshot generation
  React.useEffect(() => {
    let isMounted = true;
    if (successData) {
      let qrPayload = `UHVPASS::${successData.id}`;
      if (activePassIndex !== 'all') {
        qrPayload = `UHVPASS::${successData.id}::${activePassIndex}`;
      }
      const url = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrPayload)}`;
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
  }, [successData, activePassIndex, event.title]);

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

    const requestedSeats = ticketType === 'GROUP' ? groupSize : 1;

    if (event.remainingCapacity !== null && event.remainingCapacity !== undefined) {
      if (requestedSeats > event.remainingCapacity) {
        alert(`Only ${event.remainingCapacity} seat${event.remainingCapacity === 1 ? '' : 's'} remaining. Cannot book ${requestedSeats} tickets.`);
        return;
      }
    }

    const calculatedTotal = event.isPaid ? ((Number(event.ticketPrice) || 0) * requestedSeats) : 0;

    if (event.isPaid) {
      if (!paymentReference.trim() && !formData.uploadReference.trim()) {
        alert('Please enter your UPI Reference ID / UTR Number or Transaction ID after making the payment.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const finalPaymentRef = paymentReference.trim() || formData.uploadReference.trim() || undefined;
      const payload = {
        ...formData,
        paymentReference: finalPaymentRef,
        uploadReference: finalPaymentRef || formData.uploadReference || undefined,
        ticketType,
        groupSize: requestedSeats,
        groupName: ticketType === 'GROUP' ? groupName.trim() : undefined,
        groupMembers: ticketType === 'GROUP' ? groupMembers.map((m) => m.trim()) : [],
        customData,
        totalAmount: calculatedTotal,
        paymentStatus: event.isPaid ? 'PENDING' : 'FREE',
      };
      const res = await apiClient.post(`/events/${event.id}/register`, payload);
      setSuccessData(res.data);

      // Trigger web browser push notification if enabled
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('🎟️ Registration Confirmed!', {
          body: `Your entry pass for ${event.title} is ready. Ticket #${(res.data.id || '').slice(0, 8).toUpperCase()}`,
          icon: '/assets/uhv_emblem_navy.png',
        });
      }
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
      const totalGroup = Math.max(1, Number(successData.groupSize) || 1);
      const isGroup = successData.ticketType === 'GROUP' || totalGroup > 1;
      const suffix = isGroup && activePassIndex !== 'all' ? `-member-${activePassIndex === 0 ? 'lead' : activePassIndex + 1}` : '';
      const link = document.createElement('a');
      link.download = `${cleanSlug}-pass${suffix}-${regCode.toLowerCase()}.png`;
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
    const totalGroup = Math.max(1, Number(successData.groupSize) || 1);
    const isGroup = successData.ticketType === 'GROUP' || totalGroup > 1;
    const membersList: string[] = Array.isArray(successData.groupMembers) ? successData.groupMembers : [];
    
    let currentAttendeeName = successData.fullName;
    let currentAttendeeRole = isGroup ? 'Team Lead' : 'Attendee';
    let admitText = isGroup ? `ADMIT ${totalGroup}` : 'ADMIT ONE';
    let passBadgeText = isGroup ? `Group Pass (${totalGroup})` : 'Entry Pass';

    if (isGroup && activePassIndex !== 'all') {
      if (activePassIndex === 0) {
        currentAttendeeName = successData.fullName;
        currentAttendeeRole = 'Team Lead';
        admitText = `ADMIT ONE (1/${totalGroup})`;
        passBadgeText = `Lead Pass (1 of ${totalGroup})`;
      } else {
        const memberIdx = activePassIndex - 1;
        currentAttendeeName = membersList[memberIdx] || `Partner #${activePassIndex + 1}`;
        currentAttendeeRole = `Team Member (Lead: ${successData.fullName})`;
        admitText = `ADMIT ONE (${activePassIndex + 1}/${totalGroup})`;
        passBadgeText = `Member Pass (${activePassIndex + 1} of ${totalGroup})`;
      }
    }

    const fallbackQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
      `UHVPASS::${successData.id}${activePassIndex !== 'all' ? `::${activePassIndex}` : ''}`
    )}`;

    const totalFeeText = event.isPaid
      ? `₹${successData.totalAmount || (event.ticketPrice || 0) * (successData.groupSize || 1)}`
      : 'FREE PASS';

    const collabsText = (event.splitCollaborators && event.splitCollaborators.length > 0)
      ? `In Collaboration With: ${event.splitCollaborators.map((c) => c.name).join(', ')}\n`
      : (event.collaborators ? `In Collaboration With: ${event.collaborators}\n` : '');

    const coordsText = (event.coordinators && event.coordinators.length > 0)
      ? `FOR ENQUIRIES CONTACT COORDINATORS:\n` + event.coordinators.map((c) => `• ${c.name} (${c.phone})${c.role ? ` - ${c.role}` : ''}`).join('\n') + '\n'
      : (event.coordinatorName ? `FOR ENQUIRIES CONTACT COORDINATOR:\n${event.coordinatorName} (${event.coordinatorPhone || ''})\n` : '');

    const gmailSubject = `🎟️ Entry Pass Confirmation: ${event.title}`;
    const gmailBody = `UNIVERSAL HUMAN VALUES CELL - TKM COLLEGE OF ENGINEERING
${collabsText}EVENT REGISTRATION CONFIRMATION

Event: ${event.title}
Date: ${formatDate(event.eventDate)}
Time: ${event.startTime || 'TBA'} - ${event.endTime || ''}
Venue: ${event.venue}

PASS DETAILS:
Ticket ID: ${regCode}
Ticket Type: ${isGroup ? `Group Pass (${successData.groupSize || 2} Attendees)` : 'Individual Pass'}
${isGroup && successData.groupName ? `Team / Group Name: ${successData.groupName}\n` : ''}Lead Attendee: ${successData.fullName}
Email: ${successData.email}
Phone: ${successData.phone}
${isGroup && membersList.length > 0 ? `Group Members: ${membersList.join(', ')}\n` : ''}Registration Fee: ${totalFeeText}

${coordsText}Please present this confirmation email or your digital ticket pass at the venue entrance.
Universal Human Values Cell • TKM College of Engineering, Kollam`;

    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(successData.email)}&su=${encodeURIComponent(gmailSubject)}&body=${encodeURIComponent(gmailBody)}`;

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
                setPaymentReference('');
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

        {/* --- Multi-Partner Pass Selector (When Group Ticket) --- */}
        {isGroup && (
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 pb-1 print:hidden">
            <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-emerald-600" /> Select Pass:
            </span>
            <button
              type="button"
              onClick={() => setActivePassIndex('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activePassIndex === 'all'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
              }`}
            >
              👥 Full Team Pass ({totalGroup})
            </button>
            <button
              type="button"
              onClick={() => setActivePassIndex(0)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activePassIndex === 0
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
              }`}
            >
              1. {successData.fullName} (Lead)
            </button>
            {membersList.map((m: string, idx: number) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActivePassIndex(idx + 1)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  activePassIndex === idx + 1
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
                }`}
              >
                {idx + 2}. {m}
              </button>
            ))}
          </div>
        )}

        {/* --- CONCERT-STYLE TICKET STUB (Reference Design with Co-Branded Logos) --- */}
        <div className="overflow-x-auto pb-4 pt-2">
          <div
            id="uhv-event-ticket"
            ref={ticketRef}
            className="relative w-full max-w-5xl min-w-[700px] mx-auto rounded-2xl overflow-hidden shadow-2xl border border-slate-800 bg-[#090d16] text-white flex flex-row select-none"
          >
            {/* Main Left Ticket Section */}
            <div className="flex-1 p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-[#0c1322] via-[#090d16] to-[#05070c]">
              {/* Background Texture Graphic */}
              <div className="absolute -left-12 -bottom-12 w-48 h-48 rounded-full border border-slate-700/20 pointer-events-none" />
              <div className="absolute -left-6 -bottom-6 w-36 h-36 rounded-full border border-slate-700/20 pointer-events-none" />
              <div className="absolute -left-0 -bottom-0 w-24 h-24 rounded-full border border-slate-700/20 pointer-events-none" />

              {/* Event Cover Image Backdrop Watermark (clean subtle opacity) */}
              {event.coverImage && (
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-[0.06] pointer-events-none mix-blend-luminosity filter blur-[1px]"
                  style={{ backgroundImage: `url(${event.coverImage})` }}
                />
              )}

              <div>
                {/* Extended Co-Branded Header Bar */}
                <div className="space-y-3.5 mb-5 pb-4 border-b border-slate-800/80">
                  <div className="flex items-center justify-between gap-4">
                    {/* Primary Institutional Branding */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shadow-md border border-slate-200/20 shrink-0">
                          <img
                            src={tkmLogoBase64 || '/assets/tkm-logo.png'}
                            alt="TKMCE Seal"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700/80 p-1 flex items-center justify-center shadow-md shrink-0">
                          <img
                            src={uhvLogoBase64 || '/assets/uhv_logo_white.png'}
                            alt="UHV Cell Logo"
                            className="w-full h-full object-contain drop-shadow-md"
                          />
                        </div>
                      </div>
                      <div className="border-l border-slate-700/80 pl-3">
                        <span className="text-xs sm:text-sm uppercase font-black tracking-widest text-emerald-400 block leading-tight">
                          UNIVERSAL HUMAN VALUES CELL
                        </span>
                        <span className="text-[10px] uppercase font-bold text-slate-300 block tracking-wide mt-0.5">
                          TKM College of Engineering, Kollam (Autonomous)
                        </span>
                      </div>
                    </div>

                    {/* Entry Pass Type Capsule */}
                    <div className="shrink-0">
                      <span className="text-[10px] font-extrabold uppercase px-3 py-1.5 rounded-lg bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 tracking-wider shadow-sm">
                        {passBadgeText}
                      </span>
                    </div>
                  </div>

                  {/* Extended Collaborator Section (if present) */}
                  {((event.splitCollaborators && event.splitCollaborators.length > 0) || event.collaborators) && (
                    <div className="flex flex-wrap items-center gap-2.5 pt-1">
                      <span className="text-[9px] uppercase font-extrabold tracking-wider text-slate-400 mr-1 flex items-center gap-1 shrink-0">
                        🤝 In Collaboration With:
                      </span>
                      {event.splitCollaborators && event.splitCollaborators.length > 0 ? (
                        event.splitCollaborators.map((c) => (
                          <div
                            key={c.id}
                            className="inline-flex items-center gap-2.5 bg-slate-900/95 hover:bg-slate-800/95 px-3 py-1.5 rounded-xl border border-slate-700 shadow-sm transition"
                          >
                            {c.logoUrl ? (
                              <div className="h-7 max-w-[90px] bg-white rounded-md p-1 flex items-center justify-center shrink-0 shadow-2xs">
                                <img
                                  src={c.logoUrl}
                                  alt={c.name}
                                  className="h-full w-auto max-w-[80px] object-contain"
                                  crossOrigin="anonymous"
                                  onError={(e) => {
                                    (e.currentTarget.parentElement as HTMLElement).style.display = 'none';
                                  }}
                                />
                              </div>
                            ) : (
                              <Building2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                            )}
                            <span className="text-xs font-bold text-slate-200">
                              {c.name}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="inline-flex items-center gap-2.5 bg-slate-900/95 px-3 py-1.5 rounded-xl border border-slate-700 shadow-sm">
                          {event.collaboratorLogo ? (
                            <div className="h-7 max-w-[90px] bg-white rounded-md p-1 flex items-center justify-center shrink-0 shadow-2xs">
                              <img
                                src={collaboratorLogoBase64 || event.collaboratorLogo}
                                alt="Collaborator Logo"
                                className="h-full w-auto max-w-[80px] object-contain"
                                crossOrigin="anonymous"
                                onError={(e) => {
                                  (e.currentTarget.parentElement as HTMLElement).style.display = 'none';
                                }}
                              />
                            </div>
                          ) : (
                            <Building2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          )}
                          <span className="text-xs font-bold text-slate-200">
                            {event.collaborators}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

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
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-xs font-bold text-emerald-300">
                    Fee: {totalFeeText}
                  </span>
                </div>
              </div>

              {/* Attendee Details & Custom Fields */}
              <div className="pt-4 border-t border-slate-800/80">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-left">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">
                      {currentAttendeeRole}
                    </span>
                    <span className="text-xs font-extrabold text-white truncate block">{currentAttendeeName}</span>
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
                  {(successData.paymentReference || successData.uploadReference) && (
                    <div>
                      <span className="text-[9px] uppercase font-bold text-emerald-400 block tracking-wider">Payment Ref / UTR</span>
                      <span className="text-xs font-mono font-bold text-emerald-200 truncate block">
                        {successData.paymentReference || successData.uploadReference}
                      </span>
                    </div>
                  )}
                  {/* Dynamically render custom field answers on ticket */}
                  {customFields.map((f) => {
                    const raw = customData[f.id] ?? customData[f.label];
                    if (raw === undefined || raw === null || raw === '') return null;
                    const val = typeof raw === 'boolean' ? (raw ? 'Yes' : 'No') : String(raw);
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
            <div className="w-56 p-6 bg-[#0f172a] flex flex-col items-center justify-between gap-3 border-l border-slate-800 text-center relative shrink-0">
              {/* Stub Header */}
              <div className="text-center w-full">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 block">
                  {admitText}
                </span>
                <span className="font-mono text-xs font-bold text-slate-300 block tracking-wider mt-0.5">
                  {regCode}
                </span>
                <div className="my-1.5 py-1 px-2 rounded bg-slate-900 border border-slate-800 text-[10px] font-bold text-emerald-300">
                  {totalFeeText}
                </div>
                {(successData.paymentReference || successData.uploadReference) && (
                  <span className="text-[8px] font-mono font-semibold text-emerald-400/90 block truncate max-w-[155px] mx-auto mb-1">
                    Ref: {successData.paymentReference || successData.uploadReference}
                  </span>
                )}
                {((event.coordinators && event.coordinators.length > 0) || event.coordinatorName) && (
                  <span className="text-[8px] font-medium text-slate-400 block truncate max-w-[155px] mx-auto mt-0.5">
                    Enquiries: {event.coordinators?.[0]?.name || event.coordinatorName}{' '}
                    {event.coordinators?.[0]?.phone || event.coordinatorPhone ? `(${event.coordinators?.[0]?.phone || event.coordinatorPhone})` : ''}
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
                <div className="h-8 w-full flex items-center justify-center gap-[2.5px] bg-white p-1 rounded">
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

  const requestedAttendees = ticketType === 'GROUP' ? groupSize : 1;
  const currentTotalFee = event.isPaid ? (Number(event.ticketPrice) || 0) * requestedAttendees : 0;

  return (
    <div className="mt-4 p-6 bg-slate-50 rounded-xl border border-slate-200 print:hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Register for this Event</h3>
          <p className="text-xs text-slate-500">Complete the form below to receive your official verified entry ticket.</p>
        </div>
        <div className="text-right">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Fee Schedule</span>
          <span className="text-sm font-black text-emerald-800">
            {event.isPaid ? `₹${event.ticketPrice} / Attendee` : 'Free Admission'}
          </span>
        </div>
      </div>
      
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
          <div className="space-y-1.5 sm:col-span-2">
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

          {/* DYNAMIC CUSTOM FIELDS CONFIGURED BY ADMIN (Checkbox, Select, Text, Number) */}
          {customFields.map((field) => {
            if (field.type === 'checkbox') {
              return (
                <div key={field.id} className="sm:col-span-2">
                  <label className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer shadow-2xs transition">
                    <input
                      type="checkbox"
                      required={field.required}
                      checked={!!customData[field.id]}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setCustomData((prev) => ({
                          ...prev,
                          [field.id]: checked,
                          [field.label]: checked,
                        }));
                      }}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">
                        {field.label} {field.required ? '*' : ''}
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        Check to indicate Yes (e.g. food / accommodation needed)
                      </span>
                    </div>
                  </label>
                </div>
              );
            }

            if (field.type === 'select') {
              const options = Array.isArray(field.options)
                ? field.options
                : (field.options ? String(field.options).split(',') : []);
              return (
                <div key={field.id} className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    {field.label} {field.required ? '*' : ''}
                  </label>
                  <select
                    required={field.required}
                    value={customData[field.id] || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustomData((prev) => ({
                        ...prev,
                        [field.id]: val,
                        [field.label]: val,
                      }));
                    }}
                    className="w-full text-sm rounded-lg border border-slate-300 p-2.5 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  >
                    <option value="">Select an option...</option>
                    {options.map((opt) => {
                      const trimmed = opt.trim();
                      return <option key={trimmed} value={trimmed}>{trimmed}</option>;
                    })}
                  </select>
                </div>
              );
            }

            return (
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
            );
          })}

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

          {/* Paid Event Payment & Transfer Details Card */}
          {event.isPaid && (
            <div className="sm:col-span-2 p-5 rounded-2xl bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 text-white border border-emerald-500/40 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-emerald-400" />
                    <h4 className="text-sm font-bold uppercase tracking-wider text-white">
                      Payment &amp; Transfer Details
                    </h4>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Pay via Google Pay, UPI QR, or Direct Bank Transfer to confirm your registration.
                  </p>
                </div>
                <div className="bg-emerald-900/80 px-3.5 py-1.5 rounded-xl border border-emerald-500/40 text-right shrink-0">
                  <span className="text-[10px] text-emerald-300 uppercase font-extrabold block">
                    Total Amount Due
                  </span>
                  <span className="text-base font-black text-emerald-200">
                    ₹{currentTotalFee} {ticketType === 'GROUP' ? `(${groupSize} Attendees)` : ''}
                  </span>
                </div>
              </div>

              {/* UPI & Google Pay Methods */}
              {(event.upiQrCode || event.upiId) && (
                <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Google Pay / PhonePe / Any UPI App
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-5">
                    {/* Dynamic QR Code with pre-filled amount — generated from UPI ID */}
                    {event.upiId ? (
                      <div className="bg-white p-3 rounded-xl shadow-md border border-slate-200 shrink-0 text-center">
                        <QRCodeSVG
                          value={`upi://pay?pa=${encodeURIComponent(event.upiId)}&pn=${encodeURIComponent(event.title)}&am=${currentTotalFee}&cu=INR&tn=${encodeURIComponent(`Registration for ${event.title}`)}`}
                          size={152}
                          bgColor="#ffffff"
                          fgColor="#000000"
                          level="M"
                          includeMargin={false}
                        />
                        <span className="text-[10px] font-bold text-emerald-700 block mt-1.5">
                          Scan to Pay ₹{currentTotalFee}
                        </span>
                        <span className="text-[8px] text-slate-400 block">
                          Amount auto-filled on scan
                        </span>
                      </div>
                    ) : event.upiQrCode ? (
                      <div className="bg-white p-2.5 rounded-xl shadow-md border border-slate-200 shrink-0 text-center">
                        <img
                          src={event.upiQrCode}
                          alt="UPI QR Code"
                          className="w-32 h-32 sm:w-36 sm:h-36 object-contain rounded"
                          onError={(e) => ((e.currentTarget.parentElement as HTMLElement).style.display = 'none')}
                        />
                        <span className="text-[9px] font-bold text-slate-600 block mt-1">
                          Scan to Pay ₹{currentTotalFee}
                        </span>
                      </div>
                    ) : null}

                    <div className="space-y-3 flex-1 w-full">
                      {event.upiId && (
                        <div className="space-y-1">
                          <span className="text-[11px] text-slate-400 font-semibold block">Official UPI ID / VPA:</span>
                          <div className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                            <span className="font-mono text-sm font-bold text-emerald-300 truncate select-all flex-1">
                              {event.upiId}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(event.upiId || '');
                                setCopiedUpi(true);
                                setTimeout(() => setCopiedUpi(false), 2000);
                              }}
                              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1 transition"
                            >
                              {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              {copiedUpi ? 'Copied' : 'Copy'}
                            </button>
                          </div>
                        </div>
                      )}

                      {event.upiId && (
                        <a
                          href={`upi://pay?pa=${encodeURIComponent(event.upiId)}&pn=${encodeURIComponent(event.title)}&am=${currentTotalFee}&cu=INR`}
                          className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm"
                        >
                          📱 Pay via Any UPI Mobile App
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Bank Account Transfer Details */}
              {event.bankDetails && ((event.bankDetails as any).accountNumber || (event.bankDetails as any).bankName) && (
                <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2.5">
                  <span className="text-xs font-bold text-white uppercase tracking-wider block">
                    Direct Bank Transfer (NEFT / RTGS / IMPS)
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    {(event.bankDetails as any).accountHolder && (
                      <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Account Holder Name</span>
                        <span className="font-bold text-slate-100 block">{(event.bankDetails as any).accountHolder}</span>
                      </div>
                    )}
                    {(event.bankDetails as any).accountNumber && (
                      <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">Account Number</span>
                          <span className="font-mono font-bold text-emerald-300 block">{(event.bankDetails as any).accountNumber}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText((event.bankDetails as any).accountNumber || '');
                            setCopiedAcc(true);
                            setTimeout(() => setCopiedAcc(false), 2000);
                          }}
                          className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
                          title="Copy Account Number"
                        >
                          {copiedAcc ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    )}
                    {(event.bankDetails as any).ifscCode && (
                      <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">IFSC Code</span>
                          <span className="font-mono font-bold text-emerald-300 block">{(event.bankDetails as any).ifscCode}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText((event.bankDetails as any).ifscCode || '');
                            setCopiedIfsc(true);
                            setTimeout(() => setCopiedIfsc(false), 2000);
                          }}
                          className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
                          title="Copy IFSC Code"
                        >
                          {copiedIfsc ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    )}
                    {(event.bankDetails as any).bankName && (
                      <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Bank &amp; Branch</span>
                        <span className="font-bold text-slate-100 block">
                          {(event.bankDetails as any).bankName}
                          {(event.bankDetails as any).branch ? ` • ${(event.bankDetails as any).branch}` : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Payment Instructions if present */}
              {event.paymentInstructions && (
                <div className="p-3 bg-emerald-950/70 border border-emerald-500/40 rounded-xl text-xs text-emerald-200 space-y-1">
                  <span className="font-bold uppercase tracking-wider text-emerald-300 text-[10px] block">
                    Payment Guidelines:
                  </span>
                  <p className="whitespace-pre-wrap">{event.paymentInstructions}</p>
                </div>
              )}

              {/* Payment Reference ID / UTR Input */}
              <div className="p-3.5 bg-slate-950 rounded-xl border border-emerald-500/40 space-y-1.5">
                <label className="text-xs font-bold text-white block">
                  UPI Reference ID / UTR / Transaction Number *
                </label>
                <input
                  type="text"
                  required={event.isPaid}
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="e.g. 423871928374 or IMPS reference number"
                  className="w-full text-sm font-mono rounded-lg border border-slate-700 bg-slate-900 p-2.5 text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-400">
                  Enter the 12-digit transaction ID / UTR from your UPI or banking app after making the payment.
                </p>
              </div>
            </div>
          )}

          {/* Dynamic Registration Fee Calculation Banner */}
          <div className="p-4 rounded-xl bg-emerald-50/90 border border-emerald-200 flex items-center justify-between gap-3 sm:col-span-2">
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider block">
                Total Payment Due
              </span>
              <span className="text-xs text-slate-600">
                {event.isPaid
                  ? ticketType === 'GROUP'
                    ? `₹${event.ticketPrice} × ${groupSize} Attendees`
                    : `₹${event.ticketPrice} for 1 Attendee`
                  : 'Free Event — No registration fee required.'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-lg font-black text-emerald-950">
                {event.isPaid ? `₹${currentTotalFee}` : 'FREE'}
              </span>
            </div>
          </div>
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
