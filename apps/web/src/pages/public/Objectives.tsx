import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { Objective } from '@uhv/shared-types';
import { usePageTitle } from '../../hooks/usePageTitle';
import { ShieldCheck, Target, CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Objectives: React.FC = () => {
  usePageTitle('Objectives');

  const { data: objectives, isLoading } = useQuery<Objective[]>({
    queryKey: ['public-objectives-full'],
    queryFn: async () => {
      const res = await apiClient.get('/objectives');
      return res.data;
    },
  });

  return (
    <div className="py-12 bg-institutional-warm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Header */}
        <div className="text-left border-b border-slate-200 pb-8 space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-uhv-gold">
            Institutional Purpose
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-institutional-900 tracking-tight">
            Institutional Objectives
          </h1>
          <p className="text-base text-slate-600 max-w-2xl">
            Established under the All India Council for Technical Education (AICTE) mandate for UHV
            Cell development at TKMCE.
          </p>
        </div>

        {/* Database-Driven Cards */}
        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-white rounded-xl border border-slate-200 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {objectives?.map((obj, idx) => (
              <div
                key={obj.id}
                className="bg-white p-8 rounded-xl border border-slate-200 shadow-card hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 text-left"
              >
                <div className="space-y-2 max-w-3xl">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-institutional-850 text-white flex items-center justify-center text-xs font-bold shrink-0">
                      0{idx + 1}
                    </span>
                    <h2 className="text-xl font-bold text-institutional-900">{obj.title}</h2>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed pl-11">{obj.description}</p>
                </div>

                <div className="pl-11 md:pl-0 shrink-0">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" /> AICTE Directive
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer Navigation Link */}
        <div className="pt-6 flex justify-between items-center text-xs text-slate-500 border-t border-slate-200">
          <span>Source: AICTE Reference Document G911</span>
          <Link
            to="/activities"
            className="inline-flex items-center gap-1 font-semibold text-institutional-850 hover:text-institutional-900"
          >
            <span>Proceed to Activities</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

      </div>
    </div>
  );
};
