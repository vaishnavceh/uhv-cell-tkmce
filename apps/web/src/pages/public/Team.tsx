import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { TeamMember } from '@uhv/shared-types';
import { usePageTitle } from '../../hooks/usePageTitle';
import {
  Users,
  Mail,
  Phone,
  ShieldCheck,
  Award,
  FileText,
  Download,
  ExternalLink,
  Sparkles,
  CameraOff,
  UserCheck,
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export const Team: React.FC = () => {
  usePageTitle('Cell Committee & ExeCom 2026–27');
  const [activeFilter, setActiveFilter] = useState('ALL');

  const { data: teamMembers, isLoading } = useQuery<TeamMember[]>({
    queryKey: ['public-team'],
    queryFn: async () => {
      const res = await apiClient.get('/team');
      return res.data;
    },
  });

  const filterOptions = [
    { label: 'All Members', value: 'ALL' },
    { label: 'Student Ambassadors', value: 'Student Ambassador' },
    { label: 'Core Functional Leads', value: 'Core Functional Lead' },
    { label: 'Program Execution', value: 'Program Execution Team' },
    { label: 'Faculty Advisory', value: 'FACULTY' },
  ];

  const filteredMembers = (teamMembers || []).filter((m) => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'FACULTY') {
      return m.role === 'UHV Cell Coordinator' || m.role === 'Faculty Member';
    }
    return m.role === activeFilter;
  });

  return (
    <div className="py-12 bg-institutional-warm min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Header */}
        <div className="text-left border-b border-emerald-900/10 pb-8 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/70 border border-emerald-300 text-emerald-900 text-xs font-bold tracking-wide uppercase">
            Collegiate Governance &amp; Student Council
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-institutional-950 tracking-tight">
            UHV Cell Committee &amp; Student ExeCom
          </h1>
          <p className="text-base text-slate-600 max-w-3xl">
            Constitution of the Universal Human Values Cell at TKM College of Engineering, comprising
            institutional faculty leadership and the newly inducted <strong>Student Executive Committee (ExeCom 2026–27)</strong>.
          </p>
        </div>

        {/* Official ExeCom Allotment Announcement Banner */}
        <div className="rounded-2xl bg-gradient-to-r from-institutional-950 via-institutional-900 to-institutional-850 text-white p-6 sm:p-8 shadow-xl border border-emerald-800 relative overflow-hidden text-left">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Official Gazette Notification
                </span>
                <span className="text-xs text-slate-400">• Academic Period 2026–27</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Student Executive Committee (ExeCom 2026–27) Constituted
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Following a comprehensive evaluation of applications, formal interviews, and capability assessments,
                the Universal Human Values (UHV) Cell is pleased to present the officially allotted student executive leadership
                across Student Ambassadors, Core Functional Leads, and the Program Execution division.
              </p>
            </div>

            <div className="shrink-0 flex flex-wrap items-center gap-3">
              <a
                href="/assets/docs/UHV_ExeCom_Selection_Results_2026-27.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs bg-emerald-700 hover:bg-emerald-600 text-white shadow-md transition"
              >
                <FileText className="w-4 h-4" />
                <span>View Official Allotment Order (PDF)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <a
                href="/assets/docs/UHV_ExeCom_Selection_Results_2026-27.pdf"
                download="UHV_ExeCom_Selection_Results_2026-27.pdf"
                className="inline-flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-xs bg-white/10 hover:bg-white/20 text-white border border-white/20 transition"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </a>
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-3.5 rounded-xl border border-emerald-900/10 shadow-subtle">
          <div className="flex flex-wrap items-center gap-1.5">
            {filterOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setActiveFilter(opt.value)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  activeFilter === opt.value
                    ? 'bg-institutional-850 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-emerald-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="text-xs text-slate-500 font-medium px-2">
            Showing <strong className="text-institutional-950">{filteredMembers.length}</strong> committee members
          </div>
        </div>

        {/* Members Cards Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-80 bg-white rounded-2xl border border-slate-200 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredMembers.map((m) => {
              const hasPhoto = m.photo && m.photo.trim() !== '' && m.photo !== '/assets/placeholder-avatar.svg';
              const isFaculty = m.role === 'UHV Cell Coordinator' || m.role === 'Faculty Member';

              return (
                <article
                  key={m.id}
                  className="bg-white rounded-2xl border border-emerald-900/10 shadow-subtle hover:border-emerald-600/50 hover:shadow-elevation transition-all flex flex-col justify-between overflow-hidden text-left group"
                >
                  {/* Photo / Avatar Section */}
                  <div className="p-6 pb-2 flex flex-col items-center text-center">
                    <div className="relative mb-4">
                      {hasPhoto ? (
                        <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border-2 border-emerald-500/30 shadow-md group-hover:scale-105 transition duration-300 bg-slate-50">
                          <img
                            src={m.photo!}
                            alt={m.name}
                            className="w-full h-full object-cover object-top"
                          />
                        </div>
                      ) : (
                        <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-gradient-to-br from-emerald-50 via-slate-50 to-emerald-100/60 border-2 border-dashed border-emerald-300/70 flex flex-col items-center justify-center p-3 text-center">
                          <Users className="w-8 h-8 text-emerald-700/50 mb-1" />
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                            Image not uploaded
                          </span>
                        </div>
                      )}

                      {/* Division Badge Floating */}
                      <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide bg-institutional-850 text-white shadow-xs whitespace-nowrap">
                        {m.role === 'Student Ambassador'
                          ? 'Ambassador'
                          : m.role === 'Core Functional Lead'
                          ? 'Core Lead'
                          : m.role === 'Program Execution Team'
                          ? 'Execution'
                          : 'Faculty'}
                      </span>
                    </div>

                    <div className="space-y-1 mt-2 w-full">
                      <h3 className="text-base font-extrabold text-institutional-950 group-hover:text-institutional-700 transition">
                        {m.name}
                      </h3>
                      <p className="text-xs font-bold text-emerald-800">
                        {m.designation}
                      </p>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {m.department}
                      </p>
                    </div>
                  </div>

                  {/* Body / Bio */}
                  <div className="px-6 py-3 flex-1">
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                      {m.bio || 'Appointed member of the Universal Human Values Executive Committee.'}
                    </p>
                  </div>

                  {/* Footer / Email */}
                  <div className="px-6 pb-5 pt-2 border-t border-slate-100 mt-2 flex items-center justify-between text-xs text-slate-500">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-900/60">
                      {isFaculty ? 'Faculty Tier' : 'ExeCom 2026–27'}
                    </span>
                    {m.email ? (
                      <a
                        href={`mailto:${m.email}`}
                        className="text-emerald-800 hover:text-emerald-950 flex items-center gap-1 font-semibold text-[11px]"
                      >
                        <Mail className="w-3.5 h-3.5" /> Email
                      </a>
                    ) : (
                      <span className="text-[10px] text-slate-400">TKMCE Campus</span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Note to Applicants Section (From Official Circular) */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-emerald-900/10 shadow-subtle text-left space-y-2">
          <h4 className="text-sm font-bold text-institutional-950 flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-600" />
            Institutional Note to All Student Applicants
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Hearty congratulations to the selected members. To all candidates who took part in this recruitment drive,
            the UHV Cell extends our heartfelt gratitude for your passion and spirit. Candidates who were not allotted
            primary slots will continue to be valued volunteers and will be actively invited to collaborate in upcoming UHV workshops,
            Student Induction Programs (SIP), and community outreach initiatives.
          </p>
        </div>

      </div>
    </div>
  );
};
