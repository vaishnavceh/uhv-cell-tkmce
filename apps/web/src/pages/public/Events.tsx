import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { EventItem, EventStatus } from '@uhv/shared-types';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useDebounce } from '../../hooks/useDebounce';
import { Calendar, Clock, MapPin, Search, ArrowRight, ExternalLink, Users, Building2, Phone, Bell } from 'lucide-react';
import { formatDate } from '../../utils/cn';
import { Link } from 'react-router-dom';
import { Input } from '../../components/ui/Input';

export const Events: React.FC = () => {
  usePageTitle('Events & Induction');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [notifPermission, setNotifPermission] = useState<string>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'denied'
  );
  const debouncedSearch = useDebounce(searchTerm, 350);

  const requestNotification = () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      Notification.requestPermission().then((perm) => {
        setNotifPermission(perm);
        if (perm === 'granted') {
          new Notification('🔔 Notifications Enabled!', {
            body: 'You will receive live push notifications when event registrations open.',
            icon: '/assets/uhv_emblem_navy.png',
          });
        }
      });
    }
  };

  const { data, isLoading } = useQuery<{ data: EventItem[]; meta: any }>({
    queryKey: ['public-events', debouncedSearch, selectedStatus],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('limit', '50');
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (selectedStatus !== 'ALL') params.append('status', selectedStatus);

      const res = await apiClient.get(`/events?${params.toString()}`);
      return res.data;
    },
  });

  const events = data?.data || [];

  return (
    <div className="bg-slate-50 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header */}
        <div className="border-b border-emerald-900/10 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-institutional-950 tracking-tight">
              Events, Workshops &amp; Inductions
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
              Participate in upcoming FDPs, workshops, seminars, and Student Induction Programs (SIP) organized by the UHV Cell.
            </p>
          </div>

          {/* Web Push Notification Button */}
          {typeof window !== 'undefined' && 'Notification' in window && notifPermission !== 'granted' && (
            <button
              onClick={requestNotification}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-sm transition"
            >
              <Bell className="w-4 h-4" /> Enable Registration Alerts
            </button>
          )}
        </div>

        {/* Filter & Search Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-emerald-900/10 shadow-subtle">
          <div className="w-full sm:w-80">
            <Input
              placeholder="Search event title, venue..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-50 text-xs"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
            {['ALL', EventStatus.UPCOMING, EventStatus.ONGOING, EventStatus.COMPLETED].map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all ${
                  selectedStatus === status
                    ? 'bg-institutional-850 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-emerald-50'
                }`}
              >
                {status === 'ALL' ? 'All Events' : status}
              </button>
            ))}
          </div>
        </div>

        {/* Events Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-white rounded-xl border border-slate-200 animate-pulse" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200 p-8">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700">No events found</h3>
            <p className="text-xs text-slate-500 mt-1">Try adjusting your search or status filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((ev) => (
              <div
                key={ev.id}
                className="bg-white rounded-xl border border-slate-200/80 shadow-subtle overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow group"
              >
                {/* Event Cover Banner */}
                {ev.coverImage ? (
                  <div className="w-full h-44 overflow-hidden relative bg-slate-100">
                    <img
                      src={ev.coverImage}
                      alt={ev.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                  </div>
                ) : null}

                <div className="p-5">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                      {ev.category}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {ev.isPaid ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                          ₹{ev.ticketPrice} / pass
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                          Free Entry
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                          ev.status === EventStatus.UPCOMING
                            ? 'bg-blue-50 text-blue-800'
                            : ev.status === EventStatus.ONGOING
                            ? 'bg-emerald-50 text-emerald-800 animate-pulse'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {ev.status}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-institutional-950 mb-2 leading-snug">
                    {ev.title}
                  </h3>

                  {/* Prominent Collaborator Details with Logo */}
                  {ev.collaborators && (
                    <div className="mb-3 px-3 py-2 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50/70 border border-blue-200/80 flex items-center gap-2.5">
                      {ev.collaboratorLogo ? (
                        <img
                          src={ev.collaboratorLogo}
                          alt="Collaborator Logo"
                          className="w-7 h-7 object-contain rounded bg-white p-0.5 border border-blue-200 shadow-2xs shrink-0"
                          onError={(e) => (e.currentTarget.style.display = 'none')}
                        />
                      ) : (
                        <Building2 className="w-4 h-4 text-blue-700 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <span className="text-[9px] uppercase font-extrabold tracking-wider text-blue-700 block">
                          Official Collaborator / Co-Host
                        </span>
                        <span className="text-xs font-black text-blue-950 truncate block">
                          {ev.collaborators}
                        </span>
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-slate-600 mb-4 line-clamp-3 leading-relaxed">
                    {ev.shortDescription || ev.description}
                  </p>

                  <div className="space-y-1.5 text-xs text-slate-500 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{formatDate(ev.eventDate)}</span>
                    </div>
                    {ev.startTime && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{ev.startTime}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="truncate">{ev.venue}</span>
                    </div>

                    {/* Fixed Coordinator Enquiries info */}
                    {ev.coordinatorName && (
                      <div className="flex items-center gap-1.5 text-[11px] text-blue-900 bg-blue-50/70 px-2 py-1 rounded border border-blue-100 mt-2">
                        <Phone className="w-3 h-3 text-blue-700 shrink-0" />
                        <span className="truncate">
                          Enquiries: <strong>{ev.coordinatorName}</strong>
                          {ev.coordinatorPhone && (
                            <a
                              href={`tel:${ev.coordinatorPhone}`}
                              className="ml-1 text-blue-700 font-bold hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              ({ev.coordinatorPhone})
                            </a>
                          )}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Remaining Registrations Indicator in Event Center */}
                  {ev.enableInternalReg && !ev.registrationNotOpened && !ev.isRegistrationClosed && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      {ev.registrationCapacity ? (
                        ev.remainingCapacity !== null && ev.remainingCapacity !== undefined ? (
                          ev.remainingCapacity > 0 ? (
                            <div className="p-2 rounded-lg bg-emerald-50/90 border border-emerald-200 flex items-center justify-between text-xs">
                              <span className="font-semibold text-emerald-950 flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                                Remaining Seats:
                              </span>
                              <span className={`font-black px-2 py-0.5 rounded text-[11px] ${
                                ev.remainingCapacity <= 5 ? 'bg-amber-200 text-amber-900 animate-pulse' : 'bg-emerald-200 text-emerald-900'
                              }`}>
                                {ev.remainingCapacity} left / {ev.registrationCapacity}
                              </span>
                            </div>
                          ) : (
                            <div className="p-2 rounded-lg bg-red-50 border border-red-200 flex items-center justify-between text-xs text-red-800 font-bold">
                              <span className="flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5 shrink-0" /> Registration:
                              </span>
                              <span className="bg-red-200 px-2 py-0.5 rounded text-[11px] font-black">
                                Sold Out (Full)
                              </span>
                            </div>
                          )
                        ) : null
                      ) : (
                        <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs text-slate-700">
                          <span className="font-semibold flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Open Seats:
                          </span>
                          <span className="font-bold text-emerald-700 text-[11px]">
                            Unlimited Capacity
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    to={`/events/${ev.slug}`}
                    className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 group"
                  >
                    <span>View Details</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>

                  {ev.registrationNotOpened ? (
                    <Link
                      to={`/events/${ev.slug}/not-opened`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-3 py-1.5 rounded shadow-2xs"
                    >
                      <span>Registration Not Opened</span>
                    </Link>
                  ) : ev.enableInternalReg ? (
                    <Link
                      to={`/events/${ev.slug}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 px-3 py-1.5 rounded shadow-sm"
                    >
                      <span>Register Now</span>
                    </Link>
                  ) : ev.registrationUrl ? (
                    <a
                      href={ev.registrationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-white bg-institutional-850 hover:bg-institutional-900 px-3 py-1.5 rounded shadow-sm"
                    >
                      <span>Register</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};
