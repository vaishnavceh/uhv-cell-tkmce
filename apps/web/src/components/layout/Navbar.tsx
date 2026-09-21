import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Shield, ExternalLink } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Objectives', path: '/objectives' },
    { name: 'Activities', path: '/activities' },
    { name: 'Events', path: '/events' },
    { name: 'Workshops', path: '/workshops' },
    { name: 'Team', path: '/team' },
    { name: 'Resources', path: '/resources' },
    { name: 'Gallery', path: '/gallery' },
    { name: 'Announcements', path: '/announcements' },
    { name: 'Contact', path: '/contact' },
  ];

  const isActive = (path: string) => {
    if (path === '/' && location.pathname !== '/') return false;
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur border-b border-emerald-900/10 shadow-subtle transition-all">
      {/* Top Institutional Notification Bar */}
      <div className="bg-institutional-950 text-emerald-100 text-xs py-1.5 px-4 border-b border-emerald-900">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-medium text-white">
              AICTE Mandated Universal Human Values Cell
            </span>
            <span className="hidden sm:inline text-emerald-600">|</span>
            <span className="hidden sm:inline text-emerald-200">
              TKM College of Engineering, Kollam (Autonomous)
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <a
              href="https://fdp-si.aicte-india.org/download/G911%20UHV%20Cell,%20Nodal%20and%20Resource%20Centres.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white inline-flex items-center gap-1 transition text-emerald-300"
            >
              AICTE G911 Directives <ExternalLink className="w-2.5 h-2.5" />
            </a>
            <span className="text-emerald-800">|</span>
            {isAuthenticated ? (
              <Link
                to="/admin"
                className="text-uhv-goldLight hover:text-white font-semibold inline-flex items-center gap-1"
              >
                <Shield className="w-3 h-3 text-emerald-400" /> CMS ({user?.role?.name})
              </Link>
            ) : (
              <Link
                to="/admin/login"
                className="hover:text-white text-emerald-300 inline-flex items-center gap-1 transition"
              >
                <Shield className="w-3 h-3" /> Admin Portal
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo branding featuring official updated logo */}
          <Link to="/" className="flex items-center gap-3.5 group shrink-0">
            <img
              src="/assets/tkm-logo.png"
              alt="TKM College of Engineering Emblem"
              className="h-12 w-auto object-contain transition-transform group-hover:scale-105"
            />
            <div className="h-9 w-[1px] bg-emerald-200 hidden sm:block" />
            <img
              src="/assets/uhv_logo_green.png"
              alt="Universal Human Values Cell TKMCE Official Logo"
              className="h-12 w-auto object-contain transition-transform group-hover:scale-105"
            />
            <div className="flex flex-col">
              <span className="text-base sm:text-lg font-extrabold tracking-tight text-institutional-900 leading-tight">
                UHV CELL
              </span>
              <span className="text-[11px] sm:text-xs text-institutional-700 font-medium">
                TKM College of Engineering
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center gap-1">
            {navLinks.map((link) => {
              const active = isActive(link.path);
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    active
                      ? 'text-institutional-900 bg-emerald-50 font-bold border border-emerald-200'
                      : 'text-institutional-700 hover:text-institutional-900 hover:bg-emerald-50/50'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Mobile hamburger button */}
          <div className="flex items-center xl:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-md text-institutional-800 hover:text-institutional-950 hover:bg-emerald-50 focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown drawer */}
      {isOpen && (
        <div className="xl:hidden bg-white border-b border-emerald-100 px-4 pt-2 pb-6 space-y-1 shadow-lg animate-in slide-in-from-top-2">
          {navLinks.map((link) => {
            const active = isActive(link.path);
            return (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`block px-3 py-2.5 rounded-md text-sm font-medium ${
                  active
                    ? 'bg-institutional-850 text-white font-semibold'
                    : 'text-institutional-800 hover:bg-emerald-50'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
          <div className="pt-3 border-t border-emerald-100 mt-2">
            <Link
              to="/admin/login"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium text-institutional-800 bg-emerald-50 hover:bg-emerald-100"
            >
              <Shield className="w-4 h-4 text-institutional-850" />
              Administrative CMS Portal
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
