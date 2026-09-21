import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Compass,
  Target,
  Sparkles,
  Calendar,
  GraduationCap,
  Users,
  FileText,
  ImageIcon,
  Bell,
  Mail,
} from 'lucide-react';

export const SectionNavHeader: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { label: 'About', path: '/about', icon: Compass },
    { label: 'Objectives', path: '/objectives', icon: Target },
    { label: 'Activities', path: '/activities', icon: Sparkles },
    { label: 'Events', path: '/events', icon: Calendar },
    { label: 'Workshops', path: '/workshops', icon: GraduationCap },
    { label: 'Team', path: '/team', icon: Users },
    { label: 'Resources', path: '/resources', icon: FileText },
    { label: 'Gallery', path: '/gallery', icon: ImageIcon },
    { label: 'Announcements', path: '/announcements', icon: Bell },
    { label: 'Contact', path: '/contact', icon: Mail },
  ];

  return (
    <div className="bg-emerald-950 text-white py-2.5 px-4 border-b border-emerald-800/80 sticky top-20 z-30 shadow-sm overflow-x-auto">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 min-w-max">
        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300 uppercase tracking-wider shrink-0 pr-2 border-r border-emerald-800">
          <span>Sections</span>
        </div>

        <div className="flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  active
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-emerald-200 hover:text-white hover:bg-emerald-800/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};
