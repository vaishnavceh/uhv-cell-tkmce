import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Compass,
  Target,
  Sparkles,
  Calendar,
  GraduationCap,
  Users,
  FileText,
  Image as ImageIcon,
  Bell,
  Mail,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';

interface WebSection {
  id: string;
  title: string;
  shortDesc: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  tag: string;
  highlight: string;
}

export const WebSectionsHub: React.FC = () => {
  const sections: WebSection[] = [
    {
      id: 'about',
      title: 'About UHV Cell',
      shortDesc: 'AICTE mandate G911 directives, collegiate charter, and institutional philosophy of value-based education.',
      path: '/about',
      icon: Compass,
      tag: 'Mandate',
      highlight: 'AICTE G911',
    },
    {
      id: 'objectives',
      title: 'Institutional Objectives',
      shortDesc: 'Key goals for infrastructure, educational vision articulation, and value impact measurements.',
      path: '/objectives',
      icon: Target,
      tag: 'Governance',
      highlight: 'Core Goals',
    },
    {
      id: 'activities',
      title: 'Core Activities',
      shortDesc: 'Curricular UHV-I & UHV-II teaching, weekly self-exploration meetings, and institutional coordination.',
      path: '/activities',
      icon: Sparkles,
      tag: 'Operations',
      highlight: '7 Curricula',
    },
    {
      id: 'events',
      title: 'Events & Induction',
      shortDesc: 'Student Induction Programmes, faculty symposiums, orientation webinars, and registration portals.',
      path: '/events',
      icon: Calendar,
      tag: 'Calendar',
      highlight: 'Live Programs',
    },
    {
      id: 'workshops',
      title: 'Workshops & FDPs',
      shortDesc: 'Advanced Faculty Development Programmes, workshop archives, and participant certifications.',
      path: '/workshops',
      icon: GraduationCap,
      tag: 'Training',
      highlight: 'FDP Repository',
    },
    {
      id: 'team',
      title: 'Cell Directory & Team',
      shortDesc: 'UHV Cell Coordinator, departmental faculty representatives, and student ambassadors.',
      path: '/team',
      icon: Users,
      tag: 'Committee',
      highlight: 'Directory',
    },
    {
      id: 'resources',
      title: 'Digital Library & Docs',
      shortDesc: 'Official AICTE G911 reference manuals, textbook syllabi, slide decks, and downloadable guidelines.',
      path: '/resources',
      icon: FileText,
      tag: 'Downloads',
      highlight: 'Verified PDFs',
    },
    {
      id: 'gallery',
      title: 'Visual Media Gallery',
      shortDesc: 'Curated photo albums documenting student circle interactions, FDP ceremonies, and campus seminars.',
      path: '/gallery',
      icon: ImageIcon,
      tag: 'Media',
      highlight: 'Campus Photos',
    },
    {
      id: 'announcements',
      title: 'Announcements & News',
      shortDesc: 'Official circulars, nomination notices for upcoming AICTE FDPs, and schedule releases.',
      path: '/announcements',
      icon: Bell,
      tag: 'Notices',
      highlight: 'Latest Bulletin',
    },
    {
      id: 'contact',
      title: 'Secretariat & Contact',
      shortDesc: 'Official campus correspondence, inquiry submission form, office location, and coordination contacts.',
      path: '/contact',
      icon: Mail,
      tag: 'Inquiry',
      highlight: 'Direct Inquiry',
    },
  ];

  return (
    <section id="sections-hub" className="py-20 bg-white border-b border-emerald-900/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-6 text-left">
          <div className="space-y-3 max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Modular Portal Architecture
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-institutional-950 tracking-tight">
              Institutional Web Sections
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              Navigate directly to dedicated institutional sections. Each section provides an
              independent, comprehensive portal with searchable records, official documentation, and
              interactive services.
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50/80 px-4 py-2 rounded-lg border border-emerald-200/80">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>10 Independent Modular Sections</span>
          </div>
        </div>

        {/* 10 Clean Modular Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sections.map((sec) => {
            const Icon = sec.icon;
            return (
              <Link
                key={sec.id}
                to={sec.path}
                className="group relative p-7 rounded-xl border border-slate-200/90 bg-white hover:border-emerald-600 hover:shadow-card hover:bg-gradient-to-b hover:from-white hover:to-emerald-50/20 transition-all duration-250 flex flex-col justify-between text-left"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-800 group-hover:bg-institutional-850 group-hover:text-white transition-colors duration-200 flex items-center justify-center shadow-subtle border border-emerald-100">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 group-hover:bg-emerald-100 group-hover:text-emerald-900 transition-colors">
                      {sec.tag}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-institutional-950 group-hover:text-emerald-850 transition-colors mb-2">
                    {sec.title}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                    {sec.shortDesc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-800 group-hover:text-emerald-900">
                  <span className="text-[11px] text-slate-400 group-hover:text-emerald-700 font-medium">
                    {sec.highlight}
                  </span>
                  <span className="inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    <span>Enter Section</span>
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

      </div>
    </section>
  );
};
