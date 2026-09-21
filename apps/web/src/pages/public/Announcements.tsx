import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { Announcement } from '@uhv/shared-types';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useDebounce } from '../../hooks/useDebounce';
import { Bell, Calendar, ChevronRight } from 'lucide-react';
import { formatDate } from '../../utils/cn';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';

export const Announcements: React.FC = () => {
  usePageTitle('Notices & Circulars');
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 350);

  const { data, isLoading } = useQuery<{ data: Announcement[]; meta: any }>({
    queryKey: ['public-announcements', debouncedSearch],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('limit', '50');
      if (debouncedSearch) params.append('search', debouncedSearch);

      const res = await apiClient.get(`/announcements?${params.toString()}`);
      return res.data;
    },
  });

  const announcements = data?.data || [];

  return (
    <div className="py-12 bg-institutional-warm min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header */}
        <div className="text-left border-b border-emerald-900/10 pb-8 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/70 border border-emerald-300 text-emerald-900 text-xs font-bold tracking-wide uppercase">
            Official Communications
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-institutional-950 tracking-tight">
            Institutional Notices & Circulars
          </h1>
          <p className="text-base text-slate-600 max-w-3xl">
            Official announcements, mandate directives, upcoming program notices, and meeting minutes
            issued by the Universal Human Values Cell, TKMCE.
          </p>
        </div>

        {/* Search Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-emerald-900/10 shadow-subtle">
          <div className="w-full sm:w-96">
            <Input
              placeholder="Search circulars, directives, notices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-50 text-xs"
            />
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Showing <span className="font-bold text-slate-800">{announcements.length}</span> notices
          </div>
        </div>

        {/* Content Listing */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-32 bg-white rounded-xl animate-pulse border border-slate-200" />
            ))}
          </div>
        ) : announcements.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-emerald-900/20 max-w-xl mx-auto space-y-3">
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-800">
              <Bell className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-institutional-950">No announcements found</h3>
            <p className="text-xs text-slate-500">
              No circulars match your query. Check back later for official notifications.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {announcements.map((item) => (
              <article
                key={item.id}
                className="bg-white rounded-xl p-6 border border-emerald-900/10 shadow-subtle hover:border-emerald-700/40 hover:shadow-md transition group flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs text-emerald-800 font-bold bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                      <Calendar className="w-3.5 h-3.5" />
                      {item.publishedAt ? formatDate(item.publishedAt) : formatDate(item.createdAt)}
                    </span>
                    {item.featured && (
                      <Badge variant="warning" className="text-[10px] uppercase font-bold">
                        Important Notice
                      </Badge>
                    )}
                  </div>

                  <h2 className="text-lg font-bold text-institutional-950 group-hover:text-institutional-700 transition">
                    <Link to={`/announcements/${item.id}`}>{item.title}</Link>
                  </h2>

                  {item.excerpt && (
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {item.excerpt}
                    </p>
                  )}
                </div>

                <div className="shrink-0 flex items-center">
                  <Link
                    to={`/announcements/${item.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-50 hover:bg-institutional-850 hover:text-white text-institutional-850 text-xs font-bold rounded-lg transition"
                  >
                    Read Full Circular <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
