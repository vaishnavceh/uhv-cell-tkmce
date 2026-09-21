import React, { useState } from 'react';
import { Hero } from '../../sections/Hero';
import { LatestAnnouncementNotification } from '../../components/common/LatestAnnouncementNotification';
import { WebSectionsHub } from '../../sections/WebSectionsHub';
import { AICTEDocuments } from '../../sections/AICTEDocuments';
import { Philosophy } from '../../sections/Philosophy';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { EventItem, Announcement, ResourceItem, Activity } from '@uhv/shared-types';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  ArrowRight,
  Bell,
  Sparkles,
  FileText,
  Download,
  BookOpen,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { formatDate, formatFileSize } from '../../utils/cn';
import { usePageTitle } from '../../hooks/usePageTitle';

export const Home: React.FC = () => {
  usePageTitle('Home');
  const [activeTab, setActiveTab] = useState<'events' | 'announcements' | 'resources' | 'activities'>('events');

  // Fetch featured events
  const { data: featuredEvents } = useQuery<EventItem[]>({
    queryKey: ['featured-events'],
    queryFn: async () => {
      const res = await apiClient.get('/events/featured');
      return res.data;
    },
  });

  // Fetch featured announcements
  const { data: featuredAnnouncements } = useQuery<Announcement[]>({
    queryKey: ['featured-announcements'],
    queryFn: async () => {
      const res = await apiClient.get('/announcements/featured');
      return res.data;
    },
  });

  // Fetch top resources
  const { data: resourcesData } = useQuery<{ data: ResourceItem[] }>({
    queryKey: ['home-resources'],
    queryFn: async () => {
      const res = await apiClient.get('/resources?limit=4');
      return res.data;
    },
  });

  // Fetch activities
  const { data: activities } = useQuery<Activity[]>({
    queryKey: ['home-activities'],
    queryFn: async () => {
      const res = await apiClient.get('/activities');
      return res.data;
    },
  });

  return (
    <div className="bg-institutional-warm">
      {/* Dynamic Institutional Notice Notification Banner */}
      <LatestAnnouncementNotification />

      {/* 1. Hero Section with Background-Removed Green Logo & Orbit Geometry */}
      <Hero />

      {/* 2. Web Sections Hub: 10 Dedicated Sections Architecture */}
      <WebSectionsHub />

      {/* 3. Interactive Section Explorer (Browse Live Content in Tabs Without Endless Scrolling) */}
      <section className="py-20 bg-slate-50/70 border-b border-emerald-900/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 text-left">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/60 px-3 py-1 rounded-full border border-emerald-200">
                Live Data Stream
              </span>
              <h2 className="text-3xl font-extrabold text-institutional-950 tracking-tight mt-2">
                Section Live Preview
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Explore real-time records and institutional initiatives by section category.
              </p>
            </div>

            {/* Tab buttons */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-emerald-100/50 rounded-lg border border-emerald-200">
              <button
                onClick={() => setActiveTab('events')}
                className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all ${
                  activeTab === 'events'
                    ? 'bg-institutional-850 text-white shadow-sm'
                    : 'text-institutional-800 hover:text-institutional-950 hover:bg-white/60'
                }`}
              >
                Events ({featuredEvents?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('announcements')}
                className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all ${
                  activeTab === 'announcements'
                    ? 'bg-institutional-850 text-white shadow-sm'
                    : 'text-institutional-800 hover:text-institutional-950 hover:bg-white/60'
                }`}
              >
                Notices ({featuredAnnouncements?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('resources')}
                className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all ${
                  activeTab === 'resources'
                    ? 'bg-institutional-850 text-white shadow-sm'
                    : 'text-institutional-800 hover:text-institutional-950 hover:bg-white/60'
                }`}
              >
                Resources
              </button>
              <button
                onClick={() => setActiveTab('activities')}
                className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all ${
                  activeTab === 'activities'
                    ? 'bg-institutional-850 text-white shadow-sm'
                    : 'text-institutional-800 hover:text-institutional-950 hover:bg-white/60'
                }`}
              >
                Activities
              </button>
            </div>
          </div>

          {/* Tab 1: Events */}
          {activeTab === 'events' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-200">
              {featuredEvents?.slice(0, 3).map((ev) => (
                <div
                  key={ev.id}
                  className="bg-white rounded-xl border border-emerald-900/10 shadow-card hover:shadow-elevation hover:border-emerald-600 transition-all p-6 flex flex-col justify-between text-left"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {ev.category}
                      </span>
                      <span className="text-xs text-emerald-700 font-bold px-2 py-0.5 rounded-full bg-emerald-100">
                        {ev.status}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-institutional-950 mb-2 line-clamp-2">
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

                  <div className="mt-6 pt-4 border-t border-slate-100">
                    <Link
                      to={`/events/${ev.slug}`}
                      className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center justify-between group"
                    >
                      <span>View Event Section</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab 2: Announcements */}
          {activeTab === 'announcements' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-200">
              {featuredAnnouncements?.slice(0, 3).map((ann) => (
                <div
                  key={ann.id}
                  className="p-6 rounded-xl border border-emerald-900/10 bg-white hover:border-emerald-600 hover:shadow-card transition-all flex flex-col justify-between text-left"
                >
                  <div>
                    <div className="flex items-center gap-2 text-xs text-emerald-800 font-semibold mb-3">
                      <Bell className="w-3.5 h-3.5 text-uhv-gold" />
                      <span>{formatDate(ann.publishedAt || ann.createdAt)}</span>
                    </div>
                    <h3 className="text-base font-bold text-institutional-950 mb-2 line-clamp-2">
                      {ann.title}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {ann.excerpt || ann.content}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100">
                    <Link
                      to={`/announcements/${ann.slug}`}
                      className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center justify-between group"
                    >
                      <span>Read Full Notice</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab 3: Resources */}
          {activeTab === 'resources' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in duration-200">
              {resourcesData?.data?.slice(0, 4).map((res) => (
                <div
                  key={res.id}
                  className="p-5 rounded-xl border border-emerald-900/10 bg-white hover:border-emerald-600 hover:shadow-card transition-all flex flex-col justify-between text-left"
                >
                  <div>
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center mb-3">
                      <FileText className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      {res.category}
                    </span>
                    <h3 className="text-sm font-bold text-institutional-950 mt-2 mb-1 line-clamp-2">
                      {res.title}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {formatFileSize(res.fileSize)} &bull; {res.downloadCount} downloads
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <a
                      href={res.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center justify-between"
                    >
                      <span>View File</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab 4: Activities */}
          {activeTab === 'activities' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in duration-200">
              {activities?.slice(0, 4).map((act) => (
                <div
                  key={act.id}
                  className="p-5 rounded-xl border border-emerald-900/10 bg-white hover:border-emerald-600 hover:shadow-card transition-all flex flex-col justify-between text-left"
                >
                  <div>
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center mb-3">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      {act.category}
                    </span>
                    <h3 className="text-sm font-bold text-institutional-950 mt-2 mb-1">
                      {act.title}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {act.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <Link
                      to="/activities"
                      className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center justify-between group"
                    >
                      <span>Explore Activities</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Bottom Callout link to view full section */}
          <div className="mt-8 text-center">
            <Link
              to={
                activeTab === 'events'
                  ? '/events'
                  : activeTab === 'announcements'
                  ? '/announcements'
                  : activeTab === 'resources'
                  ? '/resources'
                  : '/activities'
              }
              className="inline-flex items-center gap-2 text-xs font-bold text-emerald-900 hover:text-emerald-700 underline underline-offset-4"
            >
              <span>Visit full {activeTab} section portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

        </div>
      </section>

      {/* 4. AICTE Mandate & Reference Documents */}
      <AICTEDocuments />

      {/* 5. Philosophy & Coexistence */}
      <Philosophy />

      {/* 6. Call to Action */}
      <section className="py-16 bg-institutional-950 text-white text-center">
        <div className="max-w-5xl mx-auto px-4 space-y-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-900/60 border border-emerald-700 shadow-inner">
            <Sparkles className="w-7 h-7 text-emerald-300" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Universal Human Values Cell &bull; TKMCE
          </h2>
          <p className="text-sm text-emerald-200/90 max-w-2xl mx-auto leading-relaxed">
            Cultivating ethical competence, self-exploration, and mutual fulfillment across students,
            faculty, and campus life.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <Link
              to="/contact"
              className="px-6 py-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-institutional-950 text-xs font-bold shadow-md transition"
            >
              Contact Secretariat
            </Link>
            <Link
              to="/resources"
              className="px-6 py-3 rounded-lg border border-emerald-700 text-white text-xs font-bold hover:bg-emerald-900 transition"
            >
              Access Resource Library
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
