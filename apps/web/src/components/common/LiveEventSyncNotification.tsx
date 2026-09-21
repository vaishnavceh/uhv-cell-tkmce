import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { EventItem } from '@uhv/shared-types';
import { formatDate } from '../../utils/cn';
import {
  Bell,
  ArrowRight,
  X,
  Calendar,
  Clock,
  MapPin,
  Users,
  ChevronDown,
  ChevronUp,
  Sparkles,
  CheckCircle,
  Radio,
} from 'lucide-react';

export const LiveEventSyncNotification: React.FC = () => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [pushPermission, setPushPermission] = useState<string>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'denied'
  );

  // Real-time polling for upcoming events every 8 seconds
  const { data: eventsData, dataUpdatedAt } = useQuery<{ data: EventItem[] }>({
    queryKey: ['live-upcoming-events-stream'],
    queryFn: async () => {
      const res = await apiClient.get('/events?status=UPCOMING&limit=5');
      return res.data;
    },
    refetchInterval: 8000, // 8-second real-time sync
    refetchIntervalInBackground: true,
  });

  const upcomingEvents = eventsData?.data || [];
  const latestEvent = upcomingEvents[0];

  // Request browser push notification permission
  const handleEnableNotifications = () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      Notification.requestPermission().then((perm) => {
        setPushPermission(perm);
        if (perm === 'granted') {
          try {
            new Notification('🔔 UHV Cell Notifications Activated!', {
              body: 'You will receive real-time push alerts whenever registrations open or new events are posted.',
              icon: '/assets/uhv_logo_green.png',
            });
          } catch (e) {
            console.warn('Browser notification error:', e);
          }
        }
      });
    }
  };

  // Monitor real-time event updates and trigger push notification when a new event appears
  useEffect(() => {
    if (!latestEvent || typeof window === 'undefined' || !('Notification' in window)) return;

    const lastNotifiedId = localStorage.getItem('uhv_last_event_notified');

    if (lastNotifiedId !== latestEvent.id && Notification.permission === 'granted') {
      try {
        new Notification(`⚡ New Event: ${latestEvent.title}`, {
          body: `📅 ${formatDate(latestEvent.eventDate)} at ${latestEvent.venue} • Registrations are open!`,
          icon: '/assets/uhv_logo_green.png',
        });
      } catch (e) {
        console.warn('Push notification delivery error:', e);
      }
      localStorage.setItem('uhv_last_event_notified', latestEvent.id);
    }
  }, [latestEvent?.id]);

  if (!latestEvent) {
    return null;
  }

  // Floating pill when dismissed
  if (isDismissed) {
    return (
      <div className="fixed bottom-6 left-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <button
          onClick={() => setIsDismissed(false)}
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-slate-950/95 hover:bg-slate-900 text-white text-xs font-semibold shadow-elevation border border-emerald-500/40 backdrop-blur-md transition-all hover:scale-105 group"
          title="Open Live Event Stream"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <Radio className="w-3.5 h-3.5 text-emerald-400 group-hover:rotate-12 transition-transform" />
          <span className="max-w-[200px] truncate text-emerald-100 font-bold">
            Live Event: {latestEvent.title}
          </span>
          {latestEvent.remainingCapacity !== null && latestEvent.remainingCapacity !== undefined && (
            <span className="bg-emerald-800 text-emerald-200 text-[10px] px-1.5 py-0.5 rounded font-black">
              {latestEvent.remainingCapacity} seats left
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <aside
      aria-label="Real-Time Event Live Feed"
      className="relative z-20 bg-gradient-to-r from-emerald-950 via-institutional-950 to-teal-950 text-white border-b border-emerald-500/30 shadow-elevation transition-all duration-300"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 relative">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* Left section: Pulse badge & Event summary */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Live Indicator Dot */}
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 shrink-0">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300">
                Live Event Feed
              </span>
            </div>

            {/* Event Title & Logistics */}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-white truncate">
                  {latestEvent.title}
                </span>
                <span className="hidden md:inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-900/60 border border-emerald-400/20 text-emerald-200 shrink-0">
                  {latestEvent.category}
                </span>
              </div>
              {!isCollapsed && (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-emerald-200/80 mt-0.5">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-emerald-400 shrink-0" />
                    {formatDate(latestEvent.eventDate)}
                  </span>
                  {latestEvent.startTime && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-emerald-400 shrink-0" />
                      {latestEvent.startTime}
                    </span>
                  )}
                  <span className="flex items-center gap-1 truncate max-w-[160px] sm:max-w-none">
                    <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span className="truncate">{latestEvent.venue}</span>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right section: Seats left, Action buttons, Push alerts, and Controls */}
          <div className="flex flex-wrap items-center justify-between lg:justify-end gap-2.5 pt-2 lg:pt-0 border-t border-emerald-800/40 lg:border-t-0">
            
            {/* Remaining Seats Counter */}
            {latestEvent.enableInternalReg && !latestEvent.registrationNotOpened && latestEvent.registrationCapacity && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 text-xs">
                <Users className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                {latestEvent.remainingCapacity !== null && latestEvent.remainingCapacity !== undefined ? (
                  latestEvent.remainingCapacity > 0 ? (
                    <span className="text-[11px] font-semibold text-emerald-100">
                      <strong className={`font-black ${latestEvent.remainingCapacity <= 10 ? 'text-amber-300 animate-pulse' : 'text-emerald-300'}`}>
                        {latestEvent.remainingCapacity}
                      </strong>{' '}
                      seats left
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-red-300">Sold Out</span>
                  )
                ) : (
                  <span className="text-[11px] font-semibold text-emerald-200">
                    {latestEvent.registrationCapacity} capacity
                  </span>
                )}
              </div>
            )}

            {/* Price badge */}
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-800/80 text-emerald-100 border border-emerald-600/30">
              {latestEvent.isPaid ? `₹${latestEvent.ticketPrice}` : 'Free Entry'}
            </span>

            {/* Register or View Event CTA */}
            {latestEvent.registrationNotOpened ? (
              <Link
                to={`/events/${latestEvent.slug}/not-opened`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 text-xs font-bold transition"
              >
                <span>Opening Soon</span>
              </Link>
            ) : latestEvent.enableInternalReg ? (
              <Link
                to={`/events/${latestEvent.slug}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-institutional-950 text-xs font-black shadow-sm transition active:scale-95"
              >
                <span>Register Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <Link
                to={`/events/${latestEvent.slug}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-institutional-950 text-xs font-black shadow-sm transition active:scale-95"
              >
                <span>View Event</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}

            {/* Push Notifications Enable / Status Button */}
            {typeof window !== 'undefined' && 'Notification' in window && (
              pushPermission !== 'granted' ? (
                <button
                  onClick={handleEnableNotifications}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-emerald-400/30 text-emerald-200 hover:text-white text-xs font-semibold transition"
                  title="Receive push notifications when event registrations open"
                >
                  <Bell className="w-3.5 h-3.5 text-amber-300" />
                  <span className="hidden sm:inline">Push Alerts</span>
                </button>
              ) : (
                <span
                  className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-900/50 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold"
                  title="Push notifications active"
                >
                  <CheckCircle className="w-3 h-3 text-emerald-400" />
                  <span className="hidden md:inline">Alerts On</span>
                </span>
              )
            )}

            {/* Collapse toggle */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 rounded text-emerald-300 hover:text-white hover:bg-white/10 transition"
              title={isCollapsed ? 'Expand details' : 'Collapse details'}
            >
              {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>

            {/* Dismiss button */}
            <button
              onClick={() => setIsDismissed(true)}
              className="p-1 rounded text-emerald-300 hover:text-white hover:bg-white/10 transition"
              title="Dismiss live feed banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
