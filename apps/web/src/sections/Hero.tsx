import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, CheckCircle2, BookOpen, Layers } from 'lucide-react';
import { CircularGeometry } from '../components/common/CircularGeometry';

export const Hero: React.FC = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-emerald-50/40 to-institutional-warm border-b border-emerald-900/10 pt-12 pb-20 sm:pt-20 sm:pb-28">
      {/* Background Soft Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-200/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Institutional Editorial Typography */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100/70 border border-emerald-300 text-institutional-900 text-xs font-bold tracking-wide uppercase shadow-subtle">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
              AICTE ALIGNED INITIATIVE &bull; TKMCE
            </div>

            <div className="space-y-2">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-institutional-950 tracking-tight leading-[1.1]">
                Universal Human <br className="hidden sm:inline" />
                <span className="text-institutional-700">Values Cell</span>
              </h1>
              <p className="text-xl sm:text-2xl font-bold text-institutional-850 tracking-tight">
                TKM College of Engineering
              </p>
            </div>

            <p className="text-base sm:text-lg text-slate-700 max-w-2xl leading-relaxed">
              Promoting ethical, value-based education and holistic development through Universal
              Human Values. Fostering clarity in thinking, harmony in relationships, and mutual
              coexistence in nature.
            </p>

            {/* Directives & Recognition Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs font-semibold text-institutional-900">
              <div className="flex items-center gap-2 bg-white/80 backdrop-blur px-3 py-2 rounded-lg border border-emerald-100 shadow-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>AICTE Mandate G911 Compliant</span>
              </div>
              <div className="flex items-center gap-2 bg-white/80 backdrop-blur px-3 py-2 rounded-lg border border-emerald-100 shadow-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>UHV-I Induction &amp; UHV-II Curricula</span>
              </div>
            </div>

            {/* Call to Actions */}
            <div className="pt-4 flex flex-wrap items-center gap-4">
              <Link
                to="/about"
                className="inline-flex items-center justify-center px-6 py-3.5 rounded-lg text-sm font-bold text-white bg-institutional-850 hover:bg-institutional-900 shadow-card hover:shadow-elevation transition-all duration-200 gap-2.5 group border border-institutional-800"
              >
                <span>Explore UHV Cell</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <a
                href="#sections-hub"
                className="inline-flex items-center justify-center px-6 py-3.5 rounded-lg text-sm font-bold text-institutional-900 bg-white hover:bg-emerald-50/80 border border-emerald-900/20 shadow-subtle transition-all duration-200 gap-2"
              >
                <Layers className="w-4 h-4 text-emerald-700" />
                <span>Browse Web Sections</span>
              </a>
            </div>
          </div>

          {/* Right Column: Background Removed Official UHV Logo with Concentric Orbital Rings */}
          <div className="lg:col-span-5 relative flex items-center justify-center py-6">
            {/* Background Circular Orbit Rings */}
            <CircularGeometry className="w-[380px] h-[380px] sm:w-[480px] sm:h-[480px] text-emerald-500" />

            {/* Central Focal Plate with Background Removed Logo */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative p-6 sm:p-8 rounded-full bg-white/95 shadow-elevation border border-emerald-200/90 backdrop-blur-md transition-transform duration-500 hover:scale-105">
                <img
                  src="/assets/uhv_logo_green.png"
                  alt="Universal Human Values Cell TKMCE Official Emblem"
                  className="w-48 h-48 sm:w-64 sm:h-64 object-contain drop-shadow-md"
                />
              </div>
            </div>

            {/* Floating Badges */}
            <div className="absolute -bottom-2 -left-2 sm:left-4 bg-white/95 px-3.5 py-2 rounded-lg border border-emerald-200 shadow-md text-xs font-bold text-institutional-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-uhv-gold animate-pulse"></span>
              <span>Existence is Co-existence</span>
            </div>

            <div className="absolute top-2 right-2 sm:right-6 bg-white/95 px-3.5 py-2 rounded-lg border border-emerald-200 shadow-md text-xs font-bold text-institutional-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-700" />
              <span>Values in Learning</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
