import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { TeamMember } from '@uhv/shared-types';
import { usePageTitle } from '../../hooks/usePageTitle';
import { Users, Mail, Phone, ShieldCheck, UserCheck, Sparkles } from 'lucide-react';

export const Team: React.FC = () => {
  usePageTitle('Cell Committee & Directory');

  const { data: teamMembers, isLoading } = useQuery<TeamMember[]>({
    queryKey: ['public-team'],
    queryFn: async () => {
      const res = await apiClient.get('/team');
      return res.data;
    },
  });

  return (
    <div className="py-12 bg-institutional-warm min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Header */}
        <div className="text-left border-b border-emerald-900/10 pb-8 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/70 border border-emerald-300 text-emerald-900 text-xs font-bold tracking-wide uppercase">
            Collegiate Committee
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-institutional-950 tracking-tight">
            UHV Cell Committee &amp; Directory
          </h1>
          <p className="text-base text-slate-600 max-w-3xl">
            Constitution of the Universal Human Values Cell at TKM College of Engineering as mandated
            by AICTE G911 reference directives.
          </p>
        </div>

        {/* AICTE Committee Constitution Notice */}
        <div className="p-6 rounded-xl bg-white border border-emerald-900/10 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-6 text-left">
          <div className="space-y-1 max-w-2xl">
            <h3 className="text-sm font-bold text-institutional-950 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Institutional Constitution Guidelines
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              As per AICTE mandate, the committee encompasses: College Chairperson (Principal/Director),
              Dean-level Convener, Certified UHV Coordinators, Departmental Faculty Representatives, and
              Student Induction Ambassadors.
            </p>
          </div>
          <div className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3.5 py-2 rounded-lg border border-emerald-200 shrink-0">
            Official TKMCE UHV Body
          </div>
        </div>

        {/* Team Cards Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-white rounded-xl border border-slate-200 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {teamMembers?.map((m) => {
              const isPlaceholder = m.bio?.includes('to be updated') || m.name.includes('To be updated');

              return (
                <div
                  key={m.id}
                  className="bg-white rounded-xl border border-emerald-900/10 shadow-card hover:border-emerald-600 hover:shadow-elevation transition-all p-6 flex flex-col justify-between text-left"
                >
                  <div>
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-100 flex items-center justify-center overflow-hidden shrink-0 shadow-subtle">
                        {m.photo && m.photo !== '/assets/placeholder-avatar.svg' ? (
                          <img src={m.photo} alt={m.name} className="w-full h-full object-cover" />
                        ) : (
                          <Users className="w-8 h-8 text-emerald-700/60" />
                        )}
                      </div>

                      <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {m.role}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-institutional-950 mb-0.5">
                      {m.name}
                    </h3>
                    <p className="text-xs font-bold text-emerald-700 mb-1">
                      {m.designation}
                    </p>
                    <p className="text-xs text-slate-500 mb-4">
                      {m.department}
                    </p>

                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                      {m.bio || 'Profile details maintained by UHV Cell Secretariat.'}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-500">
                    {m.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <a href={`mailto:${m.email}`} className="hover:text-emerald-850 truncate">
                          {m.email}
                        </a>
                      </div>
                    )}
                    {isPlaceholder && (
                      <div className="pt-2">
                        <span className="inline-block text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-medium">
                          Profile information to be updated
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};
