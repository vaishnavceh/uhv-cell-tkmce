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
  RefreshCw,
  Ticket,
  Lock,
  Radio,
  TrendingUp,
} from 'lucide-react';
import { formatDate } from '../../utils/cn';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export const Dashboard: React.FC = () => {
  usePageTitle('CMS Dashboard');
  const { user } = useAuth();

  const { data, isLoading, isFetching, dataUpdatedAt, refetch } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: async () => {
      const res = await apiClient.get('/dashboard/statistics');
      return res.data;
    },
    refetchInterval: 5000, // Real-time sync every 5 seconds
    refetchIntervalInBackground: false,
  });

  const cards = data?.cards || {
    upcomingEvents: 0,
    publishedResources: 0,
    galleryImages: 0,
    teamMembers: 0,
    unreadMessages: 0,
    totalRegistrations: 0,
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
      title: 'Total Registrations',
      value: cards.totalRegistrations || 0,
      icon: Ticket,
      link: '/admin/events',
      color: 'border-l-4 border-indigo-600',
      badge: 'Live Attendees',
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
      {/* Real-time System Sync Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-gradient-to-r from-emerald-950 via-institutional-950 to-slate-900 text-white rounded-2xl shadow-subtle border border-emerald-500/25">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              Live Real-Time Sync Active
            </span>
            <span className="text-[11px] text-emerald-200/70 hidden sm:inline">
              (Auto-syncing every 5 seconds)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] text-slate-300 font-mono">
            Last Synced:{' '}
            {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : 'Connecting...'}
          </span>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-white transition active:scale-95 disabled:opacity-50"
            title="Force instant sync"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-emerald-400' : ''}`} />
            <span>{isFetching ? 'Syncing...' : 'Sync Now'}</span>
          </button>
        </div>
      </div>

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
            <Button size="sm" variant="primary" className="text-xs bg-institutional-850 hover:bg-institutional-950">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Link
              key={idx}
              to={stat.link}
              className={`bg-white p-4 sm:p-5 rounded-xl shadow-subtle hover:shadow-md transition border border-slate-200/80 ${stat.color} flex flex-col justify-between`}
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

      {/* Real-time Seating & Capacity Tracker for Events */}
      <div className="bg-white rounded-2xl p-6 border border-emerald-900/10 shadow-subtle space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-800" />
            <h2 className="text-sm font-bold text-institutional-950">
              Live Event Seating &amp; Registration Capacity
            </h2>
          </div>
          <Link to="/admin/events" className="text-xs text-emerald-800 font-bold hover:underline">
            Manage Seating &amp; Events
          </Link>
        </div>

        {isLoading ? (
          <div className="h-32 bg-slate-50 rounded-lg animate-pulse" />
        ) : !data?.recentEvents || data.recentEvents.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            No events currently found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.recentEvents.map((evt: any) => {
              const isLocked = evt.status !== 'UPCOMING';
              const percent = evt.percentFilled || 0;
              return (
                <div
                  key={evt.id}
                  className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:shadow-2xs transition space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {evt.category}
                    </span>
                    <div className="flex items-center gap-1">
                      {isLocked ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700 flex items-center gap-1">
                          <Lock className="w-3 h-3 text-slate-500" />
                          Locked
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {evt.status}
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-slate-900 truncate" title={evt.title}>
                      {evt.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {formatDate(evt.eventDate)} • {evt.venue}
                    </p>
                  </div>

                  {evt.registrationCapacity ? (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-slate-600">
                          Capacity: {evt.seatsTaken} / {evt.registrationCapacity}
                        </span>
                        <span className={`font-black ${percent >= 100 ? 'text-red-700' : percent >= 80 ? 'text-amber-700' : 'text-emerald-700'}`}>
                          {percent}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            percent >= 100 ? 'bg-red-600' : percent >= 80 ? 'bg-amber-500' : 'bg-emerald-600'
                          }`}
                          style={{ width: `${Math.min(100, percent)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] pt-0.5">
                        <span className="text-slate-500">
                          {evt.remainingCapacity !== null && evt.remainingCapacity > 0
                            ? `${evt.remainingCapacity} seats remaining`
                            : isLocked
                            ? 'Registration Locked'
                            : 'Sold Out'}
                        </span>
                        {evt.isPaid && (
                          <span className="font-mono text-emerald-800 font-bold">
                            ₹{evt.ticketPrice}/ticket
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-2 rounded bg-white border border-slate-200 text-[11px] flex items-center justify-between">
                      <span className="text-slate-500">Open Registration:</span>
                      <span className="font-bold text-emerald-700">
                        {evt.seatsTaken || 0} Registered (Unlimited)
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Live Attendee Registrations Stream */}
      <div className="bg-white rounded-2xl p-6 border border-emerald-900/10 shadow-subtle space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-600"></span>
            </span>
            <h2 className="text-sm font-bold text-institutional-950">
              Live Attendee Registration Feed
            </h2>
          </div>
          <Link to="/admin/events" className="text-xs text-emerald-800 font-bold hover:underline">
            View All in Events Hub
          </Link>
        </div>

        {isLoading ? (
          <div className="h-32 bg-slate-50 rounded-lg animate-pulse" />
        ) : !data?.recentRegistrations || data.recentRegistrations.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            No attendee registrations recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="pb-2 font-bold">Attendee</th>
                  <th className="pb-2 font-bold">Event</th>
                  <th className="pb-2 font-bold">Type</th>
                  <th className="pb-2 font-bold">Fee / Payment</th>
                  <th className="pb-2 font-bold">Registered At</th>
                  <th className="pb-2 font-bold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.recentRegistrations.map((reg: any) => (
                  <tr key={reg.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 pr-3">
                      <div className="font-bold text-slate-800">{reg.fullName}</div>
                      <div className="text-[11px] text-slate-400">{reg.email}</div>
                    </td>
                    <td className="py-2.5 pr-3 max-w-[180px] truncate">
                      <span className="font-medium text-slate-700 truncate block">
                        {reg.event?.title || 'Event'}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {reg.ticketType === 'GROUP' ? `Group (${reg.groupSize})` : 'Individual'}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3">
                      {reg.totalAmount > 0 ? (
                        <span className="font-mono text-emerald-700 font-bold text-[11px]">
                          ₹{reg.totalAmount} ({reg.paymentStatus || 'PAID'})
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px] font-medium">Free</span>
                      )}
                    </td>
                    <td className="py-2.5 pr-3 text-[11px] text-slate-400 whitespace-nowrap">
                      {formatDate(reg.createdAt)}
                    </td>
                    <td className="py-2.5 text-right">
                      <Badge
                        variant={reg.status === 'APPROVED' ? 'success' : 'default'}
                        className="text-[10px]"
                      >
                        {reg.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
