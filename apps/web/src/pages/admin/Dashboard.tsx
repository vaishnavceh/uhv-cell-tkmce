import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { usePageTitle } from '../../hooks/usePageTitle';
import {
  Calendar,
  FileText,
  Image as ImageIcon,
  Users,
  Mail,
  ArrowUpRight,
  Plus,
  Clock,
  Shield,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { formatDate } from '../../utils/cn';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export const Dashboard: React.FC = () => {
  usePageTitle('CMS Dashboard');
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: async () => {
      const res = await apiClient.get('/dashboard/statistics');
      return res.data;
    },
  });

  const cards = data?.cards || {
    upcomingEvents: 0,
    publishedResources: 0,
    galleryImages: 0,
    teamMembers: 0,
    unreadMessages: 0,
  };

  const statCards = [
    {
      title: 'Active Events',
      value: cards.upcomingEvents,
      icon: Calendar,
      link: '/admin/events',
      color: 'border-l-4 border-emerald-600',
      badge: 'Upcoming & Live',
    },
    {
      title: 'Digital Resources',
      value: cards.publishedResources,
      icon: FileText,
      link: '/admin/resources',
      color: 'border-l-4 border-teal-600',
      badge: 'In Library',
    },
    {
      title: 'Gallery Media',
      value: cards.galleryImages,
      icon: ImageIcon,
      link: '/admin/gallery',
      color: 'border-l-4 border-cyan-600',
      badge: 'Archived Photos',
    },
    {
      title: 'Team Directory',
      value: cards.teamMembers,
      icon: Users,
      link: '/admin/team',
      color: 'border-l-4 border-emerald-700',
      badge: 'Roster',
    },
    {
      title: 'Unread Messages',
      value: cards.unreadMessages,
      icon: Mail,
      link: '/admin/messages',
      color: 'border-l-4 border-amber-500',
      badge: cards.unreadMessages > 0 ? 'Requires Attention' : 'Inbox Clear',
      alert: cards.unreadMessages > 0,
    },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-emerald-900/10 shadow-subtle">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-institutional-950">
              Welcome back, {user?.firstName}
            </h1>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 uppercase">
              {user?.role?.name}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Universal Human Values Cell • Institutional Administration & Curriculum Content Management
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link to="/admin/events">
            <Button size="sm" variant="default" className="text-xs bg-institutional-850 hover:bg-institutional-950">
              <Plus className="w-3.5 h-3.5 mr-1" /> New Event
            </Button>
          </Link>
          <Link to="/admin/announcements">
            <Button size="sm" variant="outline" className="text-xs">
              <Plus className="w-3.5 h-3.5 mr-1" /> Post Notice
            </Button>
          </Link>
          <Link to="/admin/resources">
            <Button size="sm" variant="outline" className="text-xs">
              <Plus className="w-3.5 h-3.5 mr-1" /> Upload Resource
            </Button>
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Link
              key={idx}
              to={stat.link}
              className={`bg-white p-5 rounded-xl shadow-subtle hover:shadow-md transition border border-slate-200/80 ${stat.color} flex flex-col justify-between`}
            >
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold">{stat.title}</span>
                <Icon className={`w-4 h-4 ${stat.alert ? 'text-amber-600' : 'text-slate-400'}`} />
              </div>
              <div>
                <div className="text-2xl font-black text-institutional-950 tracking-tight">
                  {isLoading ? '...' : stat.value}
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                  <span className={`text-[10px] font-medium ${stat.alert ? 'text-amber-700 font-bold' : 'text-slate-400'}`}>
                    {stat.badge}
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Main Grid: Recent Messages & Upcoming Events */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Recent Inbound Queries */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-6 border border-emerald-900/10 shadow-subtle space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-emerald-800" />
              <h2 className="text-sm font-bold text-institutional-950">Inbound Inquiries</h2>
            </div>
            <Link to="/admin/messages" className="text-xs text-emerald-800 font-bold hover:underline">
              View All
            </Link>
          </div>

          {isLoading ? (
            <div className="h-40 bg-slate-50 rounded-lg animate-pulse" />
          ) : !data?.recentMessages || data.recentMessages.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              No pending unread messages in the inbox.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {data.recentMessages.map((msg: any) => (
                <div key={msg.id} className="py-3 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-800 leading-none">{msg.name}</p>
                    <p className="text-xs text-slate-600 font-medium truncate max-w-xs">{msg.subject}</p>
                    <p className="text-[10px] text-slate-400">{formatDate(msg.createdAt)}</p>
                  </div>
                  <Link
                    to="/admin/messages"
                    className="text-[11px] px-2.5 py-1 rounded bg-slate-100 text-slate-700 hover:bg-emerald-100 hover:text-emerald-900 font-semibold transition shrink-0"
                  >
                    Open
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Events Scheduled */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-6 border border-emerald-900/10 shadow-subtle space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-800" />
              <h2 className="text-sm font-bold text-institutional-950">Scheduled Programs</h2>
            </div>
            <Link to="/admin/events" className="text-xs text-emerald-800 font-bold hover:underline">
              Manage Events
            </Link>
          </div>

          {isLoading ? (
            <div className="h-40 bg-slate-50 rounded-lg animate-pulse" />
          ) : !data?.recentEvents || data.recentEvents.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              No recent events logged in the database.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {data.recentEvents.map((evt: any) => (
                <div key={evt.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="space-y-1 truncate">
                    <p className="text-xs font-bold text-slate-800 truncate">{evt.title}</p>
                    <p className="text-[10px] text-slate-500">
                      {formatDate(evt.eventDate)} • {evt.venue}
                    </p>
                  </div>
                  <Badge
                    variant={evt.status === 'UPCOMING' ? 'success' : 'default'}
                    className="text-[10px] shrink-0"
                  >
                    {evt.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Audit Log Stream */}
      <div className="bg-white rounded-2xl p-6 border border-emerald-900/10 shadow-subtle space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-800" />
            <h2 className="text-sm font-bold text-institutional-950">Recent System Activity Audit</h2>
          </div>
          <Link to="/admin/audit-logs" className="text-xs text-emerald-800 font-bold hover:underline">
            View Complete Audit Trail
          </Link>
        </div>

        {isLoading ? (
          <div className="h-28 bg-slate-50 rounded-lg animate-pulse" />
        ) : !data?.recentActivity || data.recentActivity.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">No activity logged yet.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {data.recentActivity.map((log: any) => (
              <div key={log.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="font-bold text-slate-800">{log.action}</span>
                  <span className="text-slate-500">• {log.entity}</span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-3">
                  <span>{log.user ? `${log.user.firstName} (${log.user.email})` : 'System'}</span>
                  <span>{formatDate(log.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
