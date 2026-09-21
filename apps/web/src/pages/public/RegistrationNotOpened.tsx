import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { EventItem } from '@uhv/shared-types';
import { usePageTitle } from '../../hooks/usePageTitle';
import { Calendar, Clock, MapPin, ArrowLeft, Hourglass, ShieldCheck, Mail, ArrowRight } from 'lucide-react';
import { formatDate } from '../../utils/cn';
import { Button } from '../../components/ui/Button';

export const RegistrationNotOpened: React.FC = () => {
  const { slug, id } = useParams<{ slug?: string; id?: string }>();
  const eventIdentifier = slug || id;
  usePageTitle('Registration Not Opened Yet');

  const { data: event, isLoading } = useQuery<EventItem>({
    queryKey: ['public-event-detail', eventIdentifier],
    queryFn: async () => {
      const res = await apiClient.get(`/events/slug/${eventIdentifier}`);
      return res.data;
    },
    enabled: !!eventIdentifier,
  });

  return (
    <div className="py-16 bg-institutional-warm min-h-screen flex items-center justify-center">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 w-full space-y-6 text-center">
        
        {/* Back navigation */}
        <div className="text-left">
          <Link
            to={event?.slug ? `/events/${event.slug}` : '/events'}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to {event ? event.title : 'Events Hub'}</span>
          </Link>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl border border-amber-200/80 shadow-card p-8 sm:p-12 space-y-6 text-center relative overflow-hidden">
          {/* Top Amber Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-emerald-500 to-amber-500" />

          {/* Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 shadow-inner">
            <Hourglass className="w-10 h-10 animate-pulse" />
          </div>

          {/* Titles */}
          <div className="space-y-2">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-amber-800 px-3 py-1 rounded-full bg-amber-100/70 border border-amber-300 inline-block">
              Registration Opening Soon
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-institutional-950 tracking-tight">
              Registration Has Not Been Opened Yet
            </h1>
            <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
              The registration link or form for this event has not been created yet or registration has not officially started. Please check back soon!
            </p>
          </div>

          {/* Event Snapshot if available */}
          {event && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left space-y-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Scheduled Event</span>
              <h3 className="text-base font-bold text-slate-800">{event.title}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{formatDate(event.eventDate)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{event.startTime || 'TBA'}</span>
                </div>
                <div className="flex items-center gap-1.5 truncate">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">{event.venue}</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Links */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            {event?.slug ? (
              <Link to={`/events/${event.slug}`} className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto bg-institutional-850 hover:bg-institutional-950 text-white text-xs font-bold px-6">
                  Back to Event Details
                </Button>
              </Link>
            ) : null}
            <Link to="/events" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto text-xs font-bold px-6">
                Explore All Events
              </Button>
            </Link>
            <Link to="/contact" className="w-full sm:w-auto">
              <Button variant="ghost" className="w-full sm:w-auto text-xs text-slate-600 font-bold px-4">
                <Mail className="w-3.5 h-3.5 mr-1.5" /> Contact UHV Cell
              </Button>
            </Link>
          </div>

          {/* Footer Note */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-400 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>AICTE Mandated Universal Human Values Cell • TKMCE</span>
          </div>
        </div>
      </div>
    </div>
  );
};
