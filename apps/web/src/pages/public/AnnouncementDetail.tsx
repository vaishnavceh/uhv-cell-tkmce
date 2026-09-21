import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { Announcement } from '@uhv/shared-types';
import { usePageTitle } from '../../hooks/usePageTitle';
import { ArrowLeft, Calendar, FileText, Share2, Bell, Download, Users, CheckCircle2 } from 'lucide-react';
import { formatDate } from '../../utils/cn';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export const AnnouncementDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, error } = useQuery<Announcement>({
    queryKey: ['announcement-detail', id],
    queryFn: async () => {
      const res = await apiClient.get(`/announcements/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  usePageTitle(data?.title || 'Notice Details');

  if (isLoading) {
    return (
      <div className="py-16 max-w-4xl mx-auto px-4">
        <div className="h-64 bg-white rounded-xl animate-pulse border border-slate-200" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Notice or circular not found</h2>
        <p className="text-xs text-slate-500">The requested circular may have been archived or removed.</p>
        <Link to="/announcements">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Circulars
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="py-12 bg-institutional-warm min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Navigation Breadcrumb */}
        <Link
          to="/announcements"
          className="inline-flex items-center gap-2 text-xs font-bold text-emerald-800 hover:text-emerald-950 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to All Notices
        </Link>

        {/* Notice Card */}
        <article className="bg-white rounded-2xl p-8 sm:p-12 border border-emerald-900/10 shadow-subtle space-y-8">
          <div className="border-b border-emerald-900/10 pb-6 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-800 font-bold bg-emerald-50 px-3 py-1 rounded-md border border-emerald-200">
                <Calendar className="w-4 h-4" />
                {data.publishedAt ? formatDate(data.publishedAt) : formatDate(data.createdAt)}
              </span>
              {data.featured && (
                <Badge variant="warning" className="text-xs font-bold">
                  High Priority Notice
                </Badge>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-institutional-950 leading-tight">
              {data.title}
            </h1>

            {data.excerpt && (
              <p className="text-sm font-medium text-slate-600 italic bg-slate-50 p-3 rounded-lg border-l-4 border-emerald-600">
                {data.excerpt}
              </p>
            )}
          </div>

          {/* Body Content */}
          <div className="prose prose-emerald max-w-none text-slate-700 text-sm leading-relaxed whitespace-pre-line space-y-4">
            {data.content}
          </div>

          {/* If announcement relates to ExeCom, render document links and roster card */}
          {(data.title.toLowerCase().includes('execom') || data.slug.toLowerCase().includes('execom')) && (
            <div className="mt-8 p-6 rounded-xl bg-emerald-50/80 border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Official Selection Documents Available</span>
                </div>
                <h4 className="text-sm font-bold text-institutional-950">
                  Student Executive Committee (ExeCom 2026–27)
                </h4>
                <p className="text-xs text-slate-600">
                  Explore complete member profiles with portraits or download the official signed selection results.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <Link
                  to="/team"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-institutional-850 hover:bg-institutional-900 text-white shadow-sm transition"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>View ExeCom Team</span>
                </Link>
                <a
                  href="/assets/docs/UHV_ExeCom_Selection_Results_2026-27.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-sm transition"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Download Signed PDF</span>
                </a>
              </div>
            </div>
          )}

          {/* Official Signoff Box */}
          <div className="mt-10 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-500 bg-slate-50/80 p-4 rounded-xl">
            <div className="space-y-1">
              <p className="font-bold text-institutional-900">Universal Human Values (UHV) Cell</p>
              <p>TKM College of Engineering, Karicode, Kollam - 691005</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Link copied to clipboard');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-semibold text-slate-700 hover:bg-slate-100 transition shadow-xs"
              >
                <Share2 className="w-3.5 h-3.5" /> Share
              </button>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
};
