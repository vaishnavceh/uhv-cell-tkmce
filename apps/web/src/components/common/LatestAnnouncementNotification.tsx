import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { Announcement } from '@uhv/shared-types';
import { formatDate } from '../../utils/cn';
import {
  Bell,
  ArrowRight,
  X,
  FileText,
  Download,
  Users,
  ExternalLink,
  ChevronRight,
  Megaphone,
} from 'lucide-react';

export const LatestAnnouncementNotification: React.FC = () => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Fetch the latest published announcement
  const { data: latestData, isLoading } = useQuery<{ data: Announcement[] }>({
    queryKey: ['latest-announcement-notification'],
    queryFn: async () => {
      const res = await apiClient.get('/announcements?limit=1');
      return res.data;
    },
  });

  const announcement = latestData?.data?.[0];

  // Check sessionStorage on mount / when announcement changes
  useEffect(() => {
    if (announcement?.id) {
      const dismissed = sessionStorage.getItem(`uhv_dismiss_notice_${announcement.id}`);
      if (dismissed === 'true') {
        setIsDismissed(true);
      }
    }
  }, [announcement?.id]);

  const handleDismiss = () => {
    if (announcement?.id) {
      sessionStorage.setItem(`uhv_dismiss_notice_${announcement.id}`, 'true');
    }
    setIsDismissed(true);
  };

  const handleReopen = () => {
    if (announcement?.id) {
      sessionStorage.removeItem(`uhv_dismiss_notice_${announcement.id}`);
    }
    setIsDismissed(false);
    setIsMinimized(false);
  };

  if (isLoading || !announcement) {
    return null;
  }

  const isExeComNotice =
    announcement.title.toLowerCase().includes('execom') ||
    announcement.slug.toLowerCase().includes('execom') ||
    announcement.content.toLowerCase().includes('execom');

  // If dismissed, render a subtle floating pill in the bottom right corner so users can re-open it anytime
  if (isDismissed) {
    return (
      <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <button
          onClick={handleReopen}
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-institutional-950/95 hover:bg-institutional-900 text-white text-xs font-semibold shadow-elevation border border-emerald-500/30 backdrop-blur-md transition-all hover:scale-105 group"
          title="View Latest Announcement"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
          </span>
          <Bell className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-12 transition-transform" />
          <span className="max-w-[200px] truncate text-emerald-100">
            {announcement.title}
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />
        </button>
      </div>
    );
  }

  return (
    <aside
      aria-label="Latest Institutional Notification"
      className="relative z-30 bg-gradient-to-r from-institutional-950 via-emerald-950 to-institutional-950 text-white border-b-2 border-emerald-500/40 shadow-elevation transition-all duration-300"
    >
      {/* Subtle background glow effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-600/10 via-transparent to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-3.5 relative">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
          
          {/* Left Side: Broadcast Badge, Date, Title & Summary */}
          <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
            
            {/* Pulsing Bell Icon Badge */}
            <div className="relative shrink-0 mt-0.5 sm:mt-0">
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-80"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400"></span>
              </span>
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-emerald-800/60 border border-emerald-500/40 flex items-center justify-center text-amber-300 shadow-inner">
                <Megaphone className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-amber-300" />
              </div>
            </div>

            {/* Notification Text Content */}
            <div className="min-w-0 space-y-0.5 text-left">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Latest Notice
                </span>
                <span className="text-[11px] text-emerald-300 font-medium">
                  {formatDate(announcement.publishedAt || announcement.createdAt)}
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <Link
                  to={`/announcements/${announcement.slug || announcement.id}`}
                  className="font-bold text-sm sm:text-base text-white hover:text-emerald-300 transition-colors line-clamp-1"
                >
                  {announcement.title}
                </Link>
              </div>

              {announcement.excerpt && (
                <p className="text-xs text-emerald-200/90 line-clamp-1 hidden md:block">
                  {announcement.excerpt}
                </p>
              )}
            </div>
          </div>

          {/* Right Side: Quick Action Buttons & Dismiss */}
          <div className="flex items-center flex-wrap gap-2 shrink-0 self-end lg:self-center pl-11 lg:pl-0">
            
            {/* If ExeCom Notice, show link to ExeCom Team Roster */}
            {isExeComNotice && (
              <Link
                to="/team"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 shadow-sm transition"
              >
                <Users className="w-3.5 h-3.5 text-emerald-300" />
                <span className="hidden sm:inline">ExeCom</span> Roster
              </Link>
            )}

            {/* If ExeCom Notice, provide direct PDF circular shortcut */}
            {isExeComNotice && (
              <a
                href="/assets/docs/UHV_ExeCom_Selection_Results_2026-27.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/40 shadow-sm transition"
              >
                <Download className="w-3.5 h-3.5 text-amber-300" />
                <span className="hidden sm:inline">Download</span> PDF
              </a>
            )}

            {/* Main CTA: Read Full Circular */}
            <Link
              to={`/announcements/${announcement.slug || announcement.id}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-institutional-950 shadow-sm transition hover:scale-[1.02]"
            >
              <span>View Circular</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            {/* Dismiss Button */}
            <button
              onClick={handleDismiss}
              aria-label="Dismiss announcement notification"
              className="p-1.5 rounded-lg text-emerald-300/80 hover:text-white hover:bg-white/10 transition ml-1"
              title="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </aside>
  );
};
