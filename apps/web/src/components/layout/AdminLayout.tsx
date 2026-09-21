import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Target,
  Sparkles,
  Calendar,
  GraduationCap,
  Users,
  FileText,
  Image as ImageIcon,
  Bell,
  Mail,
  UserCheck,
  ShieldAlert,
  History,
  Settings,
  Database,
  LogOut,
  Menu,
  X,
  ExternalLink,
  ChevronRight,
  Scan,
} from 'lucide-react';
import { RoleName } from '@uhv/shared-types';

export const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isSuperAdmin } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    {
      label: 'Content Management',
      isHeading: true,
    },
    { label: 'Objectives', path: '/admin/objectives', icon: Target },
    { label: 'Activities', path: '/admin/activities', icon: Sparkles },
    { label: 'Events & Workshops', path: '/admin/events', icon: Calendar },
    { label: 'Ticket Scanner', path: '/admin/scanner', icon: Scan },
    { label: 'Team Members', path: '/admin/team', icon: Users },
    { label: 'Resources & Docs', path: '/admin/resources', icon: FileText },
    { label: 'Gallery Albums', path: '/admin/gallery', icon: ImageIcon },
    { label: 'Announcements', path: '/admin/announcements', icon: Bell },
    {
      label: 'Communications',
      isHeading: true,
    },
    { label: 'Contact Messages', path: '/admin/messages', icon: Mail },
    {
      label: 'Administration',
      isHeading: true,
    },
    ...(isSuperAdmin
      ? [
          { label: 'User Accounts', path: '/admin/users', icon: UserCheck },
          { label: 'Database & Cleaning', path: '/admin/database', icon: Database },
        ]
      : []),
    { label: 'Roles & Permissions', path: '/admin/roles', icon: ShieldAlert },
    { label: 'Audit Trail', path: '/admin/audit-logs', icon: History },
    { label: 'Site Settings', path: '/admin/settings', icon: Settings },
  ];

  const isActive = (path: string) => {
    if (path === '/admin' && location.pathname !== '/admin') return false;
    return location.pathname === path || (path !== '/admin' && location.pathname.startsWith(path));
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top Header Bar */}
      <header className="bg-institutional-900 text-white border-b border-slate-800 sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-1.5 rounded-md text-slate-300 hover:text-white hover:bg-slate-800"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2.5">
            <img src="/assets/tkm-logo.png" alt="TKMCE" className="h-8 w-auto brightness-0 invert" />
            <img src="/assets/uhv_logo_white.png" alt="UHV" className="h-8 w-auto" />
            <div className="hidden sm:block">
              <span className="font-bold text-sm tracking-wide">UHV CELL CMS</span>
              <span className="text-[10px] block text-slate-400">TKM College of Engineering</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link
            to="/"
            target="_blank"
            className="text-xs text-slate-300 hover:text-white flex items-center gap-1 transition"
          >
            <ExternalLink className="w-3.5 h-3.5" /> View Public Site
          </Link>
          <div className="h-4 w-[1px] bg-slate-700 hidden sm:block" />
          <div className="flex items-center gap-2">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-white leading-tight">
                {user?.firstName} {user?.lastName}
              </p>
              <span className="text-[10px] text-uhv-goldLight uppercase font-medium">
                {user?.role?.name}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-md text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
              title="End session"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-20 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0 pt-16 lg:pt-0 flex flex-col justify-between ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="overflow-y-auto py-4 px-3 flex-1">
            <nav className="space-y-1">
              {navItems.map((item, idx) => {
                if (item.isHeading) {
                  return (
                    <div
                      key={idx}
                      className="px-3 pt-4 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider"
                    >
                      {item.label}
                    </div>
                  );
                }

                const Icon = item.icon!;
                const active = isActive(item.path!);

                return (
                  <Link
                    key={item.path}
                    to={item.path!}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                      active
                        ? 'bg-institutional-850 text-white font-semibold shadow-sm'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="p-3 border-t border-slate-100 bg-slate-50 text-[11px] text-slate-500">
            <div className="flex items-center justify-between">
              <span>Logged as:</span>
              <span className="font-semibold text-slate-700">{user?.role?.name}</span>
            </div>
          </div>
        </aside>

        {/* Backdrop for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-slate-900/50 z-10 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
