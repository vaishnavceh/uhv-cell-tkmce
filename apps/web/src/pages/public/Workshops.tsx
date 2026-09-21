import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { Workshop } from '@uhv/shared-types';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useDebounce } from '../../hooks/useDebounce';
import { GraduationCap, Users, Calendar, MapPin, Search, CheckCircle2 } from 'lucide-react';
import { formatDate } from '../../utils/cn';
import { Input } from '../../components/ui/Input';

export const Workshops: React.FC = () => {
  usePageTitle('Workshops & FDPs');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const debouncedSearch = useDebounce(searchTerm, 350);

  const { data, isLoading } = useQuery<{ data: Workshop[]; meta: any }>({
    queryKey: ['public-workshops', debouncedSearch, selectedCategory],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('limit', '50');
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (selectedCategory !== 'ALL') params.append('category', selectedCategory);

      const res = await apiClient.get(`/workshops?${params.toString()}`);
      return res.data;
    },
  });

  const workshops = data?.data || [];

  const categories = [
    'ALL',
    'UHV Workshop',
    'Faculty Development Programme',
    'Student Workshop',
    'Awareness Programme',
    'UHV Meeting',
  ];

  return (
    <div className="py-12 bg-institutional-warm min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Header */}
        <div className="text-left border-b border-emerald-900/10 pb-8 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/70 border border-emerald-300 text-emerald-900 text-xs font-bold tracking-wide uppercase">
            Training &amp; Pedagogy Repository
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-institutional-950 tracking-tight">
            Workshops &amp; Faculty Development Programmes
          </h1>
          <p className="text-base text-slate-600 max-w-3xl">
            Documentation of specialized FDPs, student value workshops, awareness seminars, and
            curriculum implementation retreats conducted by TKMCE UHV Cell.
          </p>
        </div>

        {/* Search & Category Filter Toolbar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-emerald-900/10 shadow-subtle">
          <div className="w-full md:w-80">
            <Input
              placeholder="Search workshops, organizer, venue..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-50 text-xs"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-institutional-850 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-emerald-50'
                }`}
              >
                {cat === 'ALL' ? 'All Categories' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Workshops Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="h-56 bg-white rounded-xl border border-slate-200 animate-pulse" />
            ))}
          </div>
        ) : workshops.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200 p-8">
            <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700">No workshops found</h3>
            <p className="text-xs text-slate-500 mt-1">Try adjusting your filters or search term.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {workshops.map((ws) => (
              <div
                key={ws.id}
                className="bg-white p-7 rounded-xl border border-emerald-900/10 shadow-card hover:border-emerald-600 hover:shadow-elevation transition-all flex flex-col justify-between text-left"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {ws.category}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">
                      {formatDate(ws.date)}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-institutional-950 mb-2 leading-snug">
                    {ws.title}
                  </h3>

                  <p className="text-xs text-slate-600 mb-5 line-clamp-3 leading-relaxed">
                    {ws.description}
                  </p>

                  <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-emerald-50/50 border border-emerald-100 text-xs text-institutional-900 mb-4">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">
                        Faculty Trained
                      </span>
                      <span className="font-extrabold text-sm text-emerald-800">
                        {ws.facultyParticipants} Faculty
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">
                        Students Engaged
                      </span>
                      <span className="font-extrabold text-sm text-emerald-800">
                        {ws.studentParticipants} Students
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">{ws.venue}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">{ws.organizer}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> AICTE Aligned
                  </span>
                  <span className="font-bold text-emerald-800">
                    Institutional Record
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};
