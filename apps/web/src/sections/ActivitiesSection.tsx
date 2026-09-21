import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { Activity } from '@uhv/shared-types';
import {
  GraduationCap,
  Calendar,
  Users,
  Sparkles,
  BookOpen,
  CheckSquare,
  Network,
  LucideIcon,
  ArrowUpRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const ICON_MAP: Record<string, LucideIcon> = {
  GraduationCap,
  Calendar,
  Users,
  Sparkles,
  BookOpen,
  CheckSquare,
  Network,
};

export const ActivitiesSection: React.FC = () => {
  const { data: activities } = useQuery<Activity[]>({
    queryKey: ['public-activities'],
    queryFn: async () => {
      const res = await apiClient.get('/activities');
      return res.data;
    },
  });

  return (
    <section className="py-20 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-6">
          <div className="space-y-3 max-w-2xl text-left">
            <span className="text-xs font-semibold uppercase tracking-wider text-uhv-gold">
              Scope of Work
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-institutional-900 tracking-tight">
              Institutional Activities
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              Operational activities designated under AICTE G911 mandate, overseeing student
              induction, faculty enrichment, academic review, and inter-institutional coordination.
            </p>
          </div>
          <Link
            to="/activities"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-institutional-850 hover:text-institutional-900 group"
          >
            <span>View All Detailed Activities</span>
            <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {activities?.slice(0, 8).map((act, idx) => {
            const IconComponent = ICON_MAP[act.icon] || BookOpen;
            return (
              <div
                key={act.id}
                className="group relative p-6 rounded-lg border border-slate-200 bg-white hover:border-slate-400 hover:shadow-card transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-md bg-slate-100 text-institutional-850 flex items-center justify-center mb-4 group-hover:bg-institutional-850 group-hover:text-white transition-colors">
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-semibold text-uhv-gold uppercase tracking-wider block mb-1">
                    {act.category}
                  </span>
                  <h3 className="text-base font-bold text-institutional-900 tracking-tight mb-2">
                    {act.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                    {act.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Activity #{idx + 1}</span>
                  <span className="text-slate-500 font-medium">TKMCE UHV</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
