import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { EventItem, EventStatus } from '@uhv/shared-types';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useDebounce } from '../../hooks/useDebounce';
import { Calendar, Clock, MapPin, Search, ArrowRight, ExternalLink } from 'lucide-react';
import { formatDate } from '../../utils/cn';
import { Link } from 'react-router-dom';
import { Input } from '../../components/ui/Input';

export const Events: React.FC = () => {
  usePageTitle('Events & Induction');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const debouncedSearch = useDebounce(searchTerm, 350);

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
    <div className="py-12 bg-institutional-warm min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Header */}
        <div className="text-left border-b border-emerald-900/10 pb-8 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/70 border border-emerald-300 text-emerald-900 text-xs font-bold tracking-wide uppercase">
            Campus Calendar
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-institutional-950 tracking-tight">
            Events &amp; Induction Programmes
          </h1>
          <p className="text-base text-slate-600 max-w-3xl">
            Explore upcoming AICTE-approved Faculty Development Programmes, Student Induction
            exploration sessions (SIP), and institutional human values symposiums.
          </p>
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
                className="bg-white rounded-xl border border-emerald-900/10 shadow-card hover:border-emerald-600 hover:shadow-elevation transition-all flex flex-col justify-between text-left p-6"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {ev.category}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {ev.enableInternalReg && !ev.isRegistrationClosed && (!ev.registrationEndDate || new Date() <= new Date(ev.registrationEndDate)) && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-xs">
                          Registration Open
                        </span>
                      )}
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          ev.status === EventStatus.UPCOMING
                            ? 'bg-emerald-100 text-emerald-800'
                            : ev.status === EventStatus.ONGOING
                            ? 'bg-amber-100 text-amber-900'
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
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    to={`/events/${ev.slug}`}
                    className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 group"
                  >
                    <span>View Details</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>

                  {ev.enableInternalReg ? (
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
