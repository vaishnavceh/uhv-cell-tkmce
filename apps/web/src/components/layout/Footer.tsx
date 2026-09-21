import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Mail, Phone, MapPin, Shield } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-institutional-950 text-emerald-100 pt-16 pb-12 border-t border-emerald-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-emerald-900/80">
          {/* Col 1: Institutional Identity */}
          <div className="space-y-4 text-left">
            <div className="flex items-center gap-3">
              <img
                src="/assets/tkm-logo.png"
                alt="TKMCE Crest"
                className="h-11 w-auto brightness-0 invert opacity-90"
              />
              <img
                src="/assets/uhv_logo_white.png"
                alt="UHV Cell Official Emblem"
                className="h-12 w-auto opacity-95"
              />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white tracking-wide uppercase">
                Universal Human Values Cell
              </h4>
              <p className="text-xs text-emerald-300 font-medium">TKM College of Engineering, Kollam</p>
            </div>
            <p className="text-xs text-emerald-200/80 leading-relaxed">
              Mandated by the All India Council for Technical Education (AICTE) to inculcate ethical,
              value-based education and holistic development.
            </p>
            <p className="text-xs text-uhv-goldLight italic border-l-2 border-uhv-gold pl-2.5 py-0.5">
              &quot;Existence is Co-Existence&quot;
            </p>
          </div>

          {/* Col 2: AICTE Mandate & Reference Docs */}
          <div className="text-left">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Institutional Directives
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <a
                  href="https://fdp-si.aicte-india.org/download/G911%20UHV%20Cell,%20Nodal%20and%20Resource%20Centres.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white inline-flex items-center gap-1.5 transition text-emerald-200"
                >
                  AICTE G911 Document <ExternalLink className="w-3 h-3 text-emerald-400" />
                </a>
              </li>
              <li>
                <a
                  href="https://tkmce.ac.in/uploads/UHV%20Cell%20(1).pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white inline-flex items-center gap-1.5 transition text-emerald-200"
                >
                  TKMCE UHV Cell Charter <ExternalLink className="w-3 h-3 text-emerald-400" />
                </a>
              </li>
              <li>
                <a
                  href="https://uhv.org.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white inline-flex items-center gap-1.5 transition text-emerald-200"
                >
                  National UHV Portal (uhv.org.in) <ExternalLink className="w-3 h-3 text-emerald-400" />
                </a>
              </li>
              <li>
                <a
                  href="https://tkmce.ac.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white inline-flex items-center gap-1.5 transition text-emerald-200"
                >
                  TKMCE Main Website <ExternalLink className="w-3 h-3 text-emerald-400" />
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Dedicated Sections Navigation */}
          <div className="text-left">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Web Sections
            </h4>
            <ul className="grid grid-cols-2 gap-2 text-xs">
              <li>
                <Link to="/about" className="hover:text-white text-emerald-200 transition">About UHV</Link>
              </li>
              <li>
                <Link to="/objectives" className="hover:text-white text-emerald-200 transition">Objectives</Link>
              </li>
              <li>
                <Link to="/activities" className="hover:text-white text-emerald-200 transition">Activities</Link>
              </li>
              <li>
                <Link to="/events" className="hover:text-white text-emerald-200 transition">Events &amp; Workshops</Link>
              </li>
              <li>
                <Link to="/team" className="hover:text-white text-emerald-200 transition">Committee</Link>
              </li>
              <li>
                <Link to="/resources" className="hover:text-white text-emerald-200 transition">Resources</Link>
              </li>
              <li>
                <Link to="/gallery" className="hover:text-white text-emerald-200 transition">Gallery</Link>
              </li>
              <li>
                <Link to="/announcements" className="hover:text-white text-emerald-200 transition">Notices</Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white text-emerald-200 transition">Contact</Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact & Office */}
          <div className="text-left">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              UHV Secretariat
            </h4>
            <div className="space-y-3 text-xs text-emerald-200/90">
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  TKM College of Engineering,
                  <br />
                  Karicode, Kollam, Kerala - 691005
                </span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                <a href="mailto:uhv@tkmce.ac.in" className="hover:text-white transition">
                  uhv@tkmce.ac.in
                </a>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>+91 474 2712024</span>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom copyright & disclaimer */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-emerald-400/80">
          <p>
            &copy; {new Date().getFullYear()} Universal Human Values (UHV) Cell, TKM College of
            Engineering. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link to="/admin/login" className="hover:text-white flex items-center gap-1 transition text-emerald-300">
              <Shield className="w-3 h-3" /> Admin Portal
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
