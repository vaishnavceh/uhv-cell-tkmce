import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { Objective } from '@uhv/shared-types';
import { ShieldCheck, Eye, TrendingUp, Sparkles } from 'lucide-react';

const DEFAULT_OBJECTIVES: Objective[] = [
  {
    id: 'default-1',
    title: 'Strengthen UHV Infrastructure',
    description: 'To ensure proper infrastructure and structure for UHV Cell as per guidelines of AICTE.',
    order: 1,
    published: true,
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'default-2',
    title: 'Define Educational Vision',
    description: 'To articulate, refine & share vision and educational goals, particularly those that are related to Universal Human Values.',
    order: 2,
    published: true,
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'default-3',
    title: 'Measure Impact',
    description: 'To define indicators or measures related to Universal Human Values goals & activities.',
    order: 3,
    published: true,
    createdAt: '',
    updatedAt: '',
  },
];

export const ObjectivesSection: React.FC = () => {
  const { data: objectives, isLoading } = useQuery<Objective[]>({
    queryKey: ['public-objectives'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/objectives');
        return res.data;
      } catch {
        return DEFAULT_OBJECTIVES;
      }
    },
  });

  const displayList = objectives && objectives.length > 0 ? objectives : DEFAULT_OBJECTIVES;

  const icons = [ShieldCheck, Eye, TrendingUp, Sparkles];

  return (
    <section className="py-20 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-institutional-700">
            Institutional Mandate
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-institutional-900 tracking-tight">
            Key Objectives of UHV Cell
          </h2>
          <p className="text-base text-slate-600 leading-relaxed">
            Formulated in alignment with the AICTE reference guidelines G911 to govern value-based
            education and structural implementation at TKMCE.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-8">
          {displayList.map((obj, idx) => {
            const IconComponent = icons[idx % icons.length];
            return (
              <div
                key={obj.id}
                className="relative bg-white rounded-xl p-8 border border-slate-200 shadow-card hover:shadow-elevation hover:border-slate-300 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 rounded-lg bg-institutional-850 text-white flex items-center justify-center shadow-sm">
                      <IconComponent className="w-6 h-6 text-uhv-goldLight" />
                    </div>
                    <span className="text-3xl font-black text-slate-200">0{idx + 1}</span>
                  </div>

                  <h3 className="text-lg font-bold text-institutional-900 tracking-tight mb-3">
                    {obj.title}
                  </h3>

                  <p className="text-sm text-slate-600 leading-relaxed">{obj.description}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-medium text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>AICTE Directive Compliant</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
