import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { EventItem } from '@uhv/shared-types';
import { usePageTitle } from '../../hooks/usePageTitle';
import { Calendar, Clock, MapPin, ArrowLeft, ExternalLink, ShieldCheck, Share2 } from 'lucide-react';
import { formatDate } from '../../utils/cn';
import { Button } from '../../components/ui/Button';

export const EventDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  usePageTitle('Event Details');

  const { data: event, isLoading, isError } = useQuery<EventItem>({
    queryKey: ['public-event-detail', slug],
    queryFn: async () => {
      const res = await apiClient.get(`/events/slug/${slug}`);
      return res.data;
    },
    enabled: !!slug,
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
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                Status: {event.status}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-institutional-950 leading-tight">
              {event.title}
            </h1>

            {event.shortDescription && (
              <p className="text-base text-slate-600 italic leading-relaxed">
                {event.shortDescription}
              </p>
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
          <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
            <span className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Official TKMCE UHV Cell Programme
            </span>

            {event.registrationUrl ? (
              <a
                href={event.registrationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-institutional-850 hover:bg-institutional-900 text-white text-xs font-bold shadow-card transition"
              >
                <span>Register on Official Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ) : (
              <span className="text-xs text-slate-400 font-semibold bg-slate-100 px-3 py-1.5 rounded">
                Registration handled on-campus
              </span>
            )}
          </div>

        </article>

      </div>
    </div>
  );
};
