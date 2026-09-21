import React from 'react';
import { usePageTitle } from '../../hooks/usePageTitle';
import { ShieldCheck, HeartHandshake, Compass, ExternalLink, Award, Sparkles } from 'lucide-react';
import { AICTEDocuments } from '../../sections/AICTEDocuments';
import { Philosophy } from '../../sections/Philosophy';

export const About: React.FC = () => {
  usePageTitle('About UHV Cell');

  const supportingCards = [
    {
      title: 'Ethical Education',
      desc: 'Developing intrinsic value clarity, ethical competence in technical decisions, and personal integrity beyond punitive enforcement.',
      icon: ShieldCheck,
    },
    {
      title: 'Holistic Development',
      desc: 'Fostering harmonious growth across physical health, intellectual clarity, emotional balance, and societal responsibility.',
      icon: HeartHandshake,
    },
    {
      title: 'Human-Centred Learning',
      desc: 'Grounding scientific knowledge in human welfare, environmental sustainability, and universal natural acceptance.',
      icon: Compass,
    },
  ];

  return (
    <div className="py-12 bg-institutional-warm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Page Heading Banner */}
        <div className="text-left border-b border-emerald-900/10 pb-8 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/70 border border-emerald-300 text-emerald-900 text-xs font-bold tracking-wide uppercase">
            Institutional Charter
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-institutional-950 tracking-tight">
            About UHV Cell
          </h1>
          <p className="text-base text-slate-600 max-w-3xl">
            TKM College of Engineering, Kollam &bull; AICTE Mandated Universal Human Values Cell
          </p>
        </div>

        {/* Primary Mandate Editorial Statement */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-8 bg-white p-8 sm:p-10 rounded-xl border border-emerald-900/10 shadow-card space-y-6 text-left">
            <h2 className="text-xl sm:text-2xl font-bold text-institutional-950 leading-snug">
              Establishment under Council Mandate
            </h2>

            <p className="text-base text-slate-700 leading-relaxed">
              In accordance with the directives from the All India Council for Technical Education
              (AICTE), every AICTE-affiliated institution is mandated to establish a Universal Human
              Values (UHV) Cell at the college level.
            </p>

            <p className="text-base text-slate-700 leading-relaxed">
              This initiative aims to promote ethical and value-based education, fostering holistic
              development of students.
            </p>

            <p className="text-base text-slate-700 leading-relaxed">
              The UHV Cell will function in alignment with the guidelines outlined in the AICTE
              reference document G911: UHV Cell, Nodal, and Resource Centres.
            </p>

            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs font-bold">
              <a
                href="https://fdp-si.aicte-india.org/download/G911%20UHV%20Cell,%20Nodal%20and%20Resource%20Centres.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-emerald-800 hover:text-emerald-950 bg-emerald-50 px-3.5 py-2 rounded-md border border-emerald-200"
              >
                <span>Read AICTE G911 Guidelines</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <a
                href="https://tkmce.ac.in/uploads/UHV%20Cell%20(1).pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-emerald-800 hover:text-emerald-950 bg-emerald-50 px-3.5 py-2 rounded-md border border-emerald-200"
              >
                <span>TKMCE Collegiate Order</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="bg-institutional-950 text-white p-6 rounded-xl shadow-card border border-emerald-900 text-left">
              <div className="flex items-center gap-3 mb-4">
                <img src="/assets/tkm-logo.png" alt="TKMCE" className="h-10 w-auto brightness-0 invert" />
                <div>
                  <h3 className="text-sm font-bold text-white">TKMCE Heritage</h3>
                  <p className="text-xs text-emerald-300">Pioneering Technical Institution</p>
                </div>
              </div>
              <p className="text-xs text-emerald-200/90 leading-relaxed">
                Founded in 1958 by Thangal Kunju Musaliar, TKM College of Engineering remains committed
                not only to technological mastery, but to instilling profound human values, mutual
                respect, and coexistence in modern engineering practice.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-emerald-900/10 shadow-card text-left">
              <div className="flex items-center gap-2 mb-3">
                <Award className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-institutional-950">AICTE Nodal Status</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                TKMCE participates as a recognized hub coordinating FDPs, peer mentorship circles, and
                regional orientation programs on Universal Human Values.
              </p>
            </div>
          </div>
        </div>

        {/* Supporting Pillars */}
        <div className="space-y-6 text-left">
          <div>
            <h2 className="text-2xl font-bold text-institutional-950 tracking-tight">
              Foundational Pillars
            </h2>
            <p className="text-sm text-slate-600">
              Three cornerstones defining our approach to value-based technical education.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {supportingCards.map((c, i) => {
              const Icon = c.icon;
              return (
                <div
                  key={i}
                  className="p-6 rounded-xl bg-white border border-emerald-900/10 shadow-card flex flex-col justify-between"
                >
                  <div>
                    <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center mb-4 border border-emerald-100">
                      <Icon className="w-6 h-6 text-emerald-700" />
                    </div>
                    <h3 className="text-lg font-bold text-institutional-950 mb-2">{c.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{c.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Philosophy Section */}
        <Philosophy />

        {/* Reference Documents */}
        <AICTEDocuments />

      </div>
    </div>
  );
};
