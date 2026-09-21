import React from 'react';
import { Eye, HeartHandshake, ShieldCheck, Users, Globe2, Sparkles } from 'lucide-react';

export const Philosophy: React.FC = () => {
  const pillars = [
    {
      title: 'Right Understanding',
      desc: 'Clarity in thinking and self-exploration on natural acceptance rather than dogma or assumptions.',
      icon: Eye,
    },
    {
      title: 'Harmony',
      desc: 'Living in peace within oneself, in the family, in society, and in the natural ecosystem.',
      icon: HeartHandshake,
    },
    {
      title: 'Responsibility',
      desc: 'Developing intrinsic ethical competence in technical professions and societal duties.',
      icon: ShieldCheck,
    },
    {
      title: 'Relationships',
      desc: 'Fostering mutual trust and respect across students, mentors, colleagues, and community.',
      icon: Users,
    },
    {
      title: 'Human Values',
      desc: 'Universal guiding proposals applicable across cultures, disciplines, and generations.',
      icon: Sparkles,
    },
    {
      title: 'Coexistence',
      desc: 'Recognizing interconnectedness with nature and promoting sustainable existence for all.',
      icon: Globe2,
    },
  ];

  return (
    <section className="py-20 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-uhv-gold">
            Institutional Philosophy
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-institutional-900 tracking-tight">
            Learning Beyond the Classroom
          </h2>
          <p className="text-base text-slate-600 leading-relaxed">
            The Universal Human Values framework moves beyond traditional lecture models into an
            open proposal of self-inquiry, cultivating ethical awareness and mutual fulfillment.
          </p>
        </div>

        {/* Philosophy Quote Callout */}
        <div className="mt-12 max-w-4xl mx-auto bg-slate-50 border border-slate-200 rounded-xl p-8 sm:p-10 shadow-subtle text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-institutional-850" />
          <blockquote className="text-lg sm:text-xl font-medium text-slate-800 italic leading-relaxed">
            &quot;Education is not only about acquiring knowledge, but also about developing clarity,
            responsibility and harmony in life.&quot;
          </blockquote>
          <p className="mt-3 text-xs font-semibold text-slate-500 uppercase tracking-widest">
            UHV Foundational Tenet &bull; TKMCE
          </p>
        </div>

        {/* 6 Interconnected Pillars Grid */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {pillars.map((p, idx) => {
            const Icon = p.icon;
            return (
              <div
                key={idx}
                className="group relative p-6 rounded-lg border border-slate-200 bg-white hover:border-slate-400 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-md bg-slate-100 text-institutional-850 flex items-center justify-center mb-4 group-hover:bg-institutional-850 group-hover:text-white transition-colors duration-200">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-institutional-900 tracking-tight mb-2">
                    {p.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{p.desc}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Pillar {idx + 1}</span>
                  <span className="font-semibold text-uhv-gold">AICTE G911</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
