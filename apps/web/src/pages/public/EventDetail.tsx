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

  const isRegistrationOpen = 
    event.enableInternalReg && 
    !event.isRegistrationClosed && 
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
          <div className="pt-6 border-t border-slate-100 flex flex-col gap-4">
            <span className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600 print:hidden" />
              <span className="print:hidden">Official TKMCE UHV Cell Programme</span>
            </span>

            {event.enableInternalReg ? (
              isRegistrationOpen ? (
                <EventRegistrationForm event={event} />
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
  const [formData, setFormData] = React.useState({
    fullName: '',
    email: '',
    phone: '',
    institution: '',
    designation: '',
    uploadReference: '',
  });

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [successData, setSuccessData] = React.useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await apiClient.post(`/events/${event.id}/register`, formData);
      setSuccessData(res.data);
    } catch (error) {
      alert('Failed to submit registration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (successData) {
    return (
      <div className="mt-4 p-6 border-2 border-emerald-500 rounded-xl bg-emerald-50/50">
        <div className="text-center space-y-2 mb-8 print:hidden">
          <ShieldCheck className="w-12 h-12 text-emerald-600 mx-auto" />
          <h3 className="text-lg font-bold text-emerald-900">Registration Successful!</h3>
          <p className="text-sm text-emerald-700">Your registration has been submitted. Please save this ticket.</p>
          <Button onClick={handlePrint} className="bg-emerald-700 hover:bg-emerald-800 text-white mt-2">
            Print / Save Ticket
          </Button>
        </div>

        {/* Printable Ticket Area */}
        <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200">
          <div className="border-b-2 border-dashed border-slate-300 pb-6 mb-6">
            <h2 className="text-2xl font-black text-institutional-950 uppercase tracking-tight text-center">
              Event Ticket
            </h2>
            <p className="text-center text-xs font-bold text-slate-500 uppercase mt-1">UHV Cell, TKMCE</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Event</p>
              <p className="font-bold text-lg text-slate-800">{event.title}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Date & Time</p>
                <p className="font-bold text-sm text-slate-700">{formatDate(event.eventDate)} ({event.startTime || 'TBA'})</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Venue</p>
                <p className="font-bold text-sm text-slate-700">{event.venue}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Participant</p>
                <p className="font-bold text-sm text-slate-700">{successData.fullName}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Registration ID</p>
                <p className="font-mono font-bold text-sm text-slate-700">{successData.id.split('-')[0].toUpperCase()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 p-6 bg-slate-50 rounded-xl border border-slate-200 print:hidden">
      <h3 className="text-lg font-bold text-slate-800 mb-4">Register for this Event</h3>
      
      {event.registrationNotes && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-900">
          <span className="font-bold block mb-1">Instructions:</span>
          <div className="whitespace-pre-wrap">{event.registrationNotes}</div>
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
            <label className="text-xs font-bold text-slate-700">Full Name *</label>
            <input
              type="text"
              required
              className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Email Address *</label>
            <input
              type="email"
              required
              className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Phone Number *</label>
            <input
              type="tel"
              required
              className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Institution / Organization</label>
            <input
              type="text"
              className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              value={formData.institution}
              onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Designation / Role</label>
            <input
              type="text"
              className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              value={formData.designation}
              onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
              placeholder="e.g. Assistant Professor, Student"
            />
          </div>
          {event.registrationUploadLink && (
            <div className="space-y-1.5">
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
            {isSubmitting ? 'Submitting...' : 'Submit Registration'}
          </Button>
        </div>
      </form>
    </div>
  );
};
