import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { Activity } from '@uhv/shared-types';
import { usePageTitle } from '../../hooks/usePageTitle';
import {
  GraduationCap,
  Calendar,
  Users,
  Sparkles,
  BookOpen,
  CheckSquare,
  Network,
  LucideIcon,
  Filter,
  CheckCircle2,
} from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';

const ICON_MAP: Record<string, LucideIcon> = {
  GraduationCap,
  Calendar,
  Users,
  Sparkles,
  BookOpen,
  CheckSquare,
  Network,
};

export const Activities: React.FC = () => {
  usePageTitle('Activities');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeActivity, setActiveActivity] = useState<Activity | null>(null);

  const { data: activities, isLoading } = useQuery<Activity[]>({
    queryKey: ['public-activities-full'],
    queryFn: async () => {
      const res = await apiClient.get('/activities');
      return res.data;
    },
  });

  const categories = ['All', ...new Set(activities?.map((a) => a.category) || [])];

  const filtered = activities?.filter((a) => {
    if (selectedCategory === 'All') return true;
    return a.category === selectedCategory;
  });

  return (
    <div className="py-12 bg-institutional-warm min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Header */}
        <div className="text-left border-b border-emerald-900/10 pb-8 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/70 border border-emerald-300 text-emerald-900 text-xs font-bold tracking-wide uppercase">
            Operational Scope
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-institutional-950 tracking-tight">
            Institutional Activities
          </h1>
          <p className="text-base text-slate-600 max-w-3xl">
            AICTE G911 designated operational portfolio: UHV curricular teaching, weekly faculty &amp;
            student self-exploration circles, and regional nodal coordination.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 text-xs font-bold text-slate-500 mr-2">
            <Filter className="w-3.5 h-3.5" />
            <span>Category:</span>
          </div>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                selectedCategory === cat
                  ? 'bg-institutional-850 text-white shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-emerald-50 border border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Activities Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-48 bg-white rounded-xl border border-slate-200 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered?.map((act, idx) => {
              const Icon = ICON_MAP[act.icon] || BookOpen;
              return (
                <div
                  key={act.id}
                  className="bg-white p-7 rounded-xl border border-emerald-900/10 shadow-card hover:border-emerald-600 hover:shadow-elevation transition-all flex flex-col justify-between text-left"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-100 shadow-subtle">
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {act.category}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-institutional-950 mb-2">
                      {act.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-4">
                      {act.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400">
                      Activity #{idx + 1}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setActiveActivity(act)}
                      className="text-xs font-bold text-emerald-800 hover:text-emerald-950"
                    >
                      View Charter Details
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal Detail View */}
        {activeActivity && (
          <Modal
            isOpen={!!activeActivity}
            onClose={() => setActiveActivity(null)}
            title={activeActivity.title}
            maxWidth="md"
          >
            <div className="space-y-4 text-left">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-emerald-50 text-emerald-800">
                  {activeActivity.category}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  AICTE Reference G911
                </span>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                  Mandate Specification
                </h4>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {activeActivity.description}
                </p>
              </div>

              <div className="p-4 rounded-lg bg-emerald-50/70 border border-emerald-200/80 space-y-1.5 text-xs text-emerald-900">
                <div className="flex items-center gap-2 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Institutional Implementation at TKMCE</span>
                </div>
                <p className="text-emerald-800 leading-relaxed pl-6">
                  Conducted regularly under supervision of designated UHV coordinators and faculty
                  mentors.
                </p>
              </div>

              <div className="pt-4 flex justify-end">
                <Button variant="primary" onClick={() => setActiveActivity(null)}>
                  Close Details
                </Button>
              </div>
            </div>
          </Modal>
        )}

      </div>
    </div>
  );
};
