import React from 'react';
import { FileText, ExternalLink, ShieldCheck, ArrowRight } from 'lucide-react';

export const AICTEDocuments: React.FC = () => {
  const documents = [
    {
      title: 'AICTE Reference Document G911',
      subtitle: 'UHV Cell, Nodal and Resource Centres Guidelines',
      description:
        'Official mandate from the All India Council for Technical Education specifying structure, role, evaluation pattern, and curriculum guidelines for UHV Cells.',
      url: 'https://fdp-si.aicte-india.org/download/G911%20UHV%20Cell,%20Nodal%20and%20Resource%20Centres.pdf',
      badge: 'National AICTE Policy',
      size: 'PDF Document',
    },
    {
      title: 'TKMCE UHV Cell Official Charter',
      subtitle: 'Institutional Collegiate Order & Constitution',
      description:
        'Official notification and charter establishing the Universal Human Values (UHV) Cell at TKM College of Engineering in accordance with council directives.',
      url: 'https://tkmce.ac.in/uploads/UHV%20Cell%20(1).pdf',
      badge: 'Collegiate Directive',
      size: 'PDF Document',
    },
  ];

  return (
    <section className="py-20 bg-slate-900 text-white border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div className="space-y-2 text-left">
            <span className="text-xs font-semibold uppercase tracking-wider text-uhv-goldLight">
              Compliance &amp; Policy
            </span>
            <h2 className="text-3xl font-bold tracking-tight">Institutional Reference Documents</h2>
            <p className="text-sm text-slate-400 max-w-xl">
              Access the official AICTE mandate and TKMCE collegiate charter outlining the foundation
              and governance of the Universal Human Values initiative.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {documents.map((doc, idx) => (
            <div
              key={idx}
              className="p-8 rounded-xl bg-slate-800/80 border border-slate-700 hover:border-slate-500 shadow-xl transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-institutional-850 flex items-center justify-center text-white border border-slate-700">
                    <FileText className="w-6 h-6 text-uhv-goldLight" />
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-slate-700 text-slate-300 font-medium">
                    {doc.badge}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-white mb-1">{doc.title}</h3>
                <p className="text-xs font-medium text-uhv-goldLight mb-3">{doc.subtitle}</p>
                <p className="text-xs text-slate-300 leading-relaxed mb-6">{doc.description}</p>
              </div>

              <div className="pt-4 border-t border-slate-700/80 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Verified Institutional Source
                </span>
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-white text-slate-900 text-xs font-semibold hover:bg-slate-100 transition shadow-sm"
                >
                  <span>Open Document</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
