import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { usePageTitle } from '../../hooks/usePageTitle';
import { ShieldCheck, Lock, Check, X, ShieldAlert } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';

export const RolesViewer: React.FC = () => {
  usePageTitle('Role-Based Access Control (RBAC)');

  const { data: roles, isLoading } = useQuery<any[]>({
    queryKey: ['admin-roles'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/roles');
      return res.data;
    },
  });

  const permissionsMatrix = [
    { module: 'User Provisioning & Credentials', superAdmin: true, admin: false, editor: false, contentManager: false },
    { module: 'Audit Trail Inspection', superAdmin: true, admin: true, editor: false, contentManager: false },
    { module: 'Site Configuration Settings', superAdmin: true, admin: true, editor: false, contentManager: false },
    { module: 'Inbound Contact Message Response', superAdmin: true, admin: true, editor: false, contentManager: false },
    { module: 'Objectives & Activities Management', superAdmin: true, admin: true, editor: true, contentManager: false },
    { module: 'Events Scheduling & Management', superAdmin: true, admin: true, editor: true, contentManager: true },
    { module: 'Workshops & FDP Archive Records', superAdmin: true, admin: true, editor: true, contentManager: true },
    { module: 'Digital Resources & AICTE Directives', superAdmin: true, admin: true, editor: true, contentManager: true },
    { module: 'Gallery Albums & Photo Uploads', superAdmin: true, admin: true, editor: true, contentManager: true },
    { module: 'Official Announcements & Circulars', superAdmin: true, admin: true, editor: true, contentManager: true },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-emerald-900/10 shadow-subtle space-y-1">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-800" />
          <h1 className="text-xl font-bold text-institutional-950">
            Role-Based Access Control (RBAC) Architecture
          </h1>
        </div>
        <p className="text-xs text-slate-500">
          Institutional permission tiers defined for governance compliance, audit tracing, and operational separation of concerns.
        </p>
      </div>

      {/* Role Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {(roles || []).map((role) => (
          <div
            key={role.id}
            className="bg-white p-6 rounded-2xl border border-emerald-900/10 shadow-subtle flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-institutional-950 tracking-wide font-mono">
                  {role.name}
                </span>
                <Badge variant="success" className="text-[10px]">
                  Active
                </Badge>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {role.description}
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400">
              System Protected Tier
            </div>
          </div>
        ))}
      </div>

      {/* Permissions Matrix */}
      <div className="bg-white rounded-2xl border border-emerald-900/10 shadow-subtle overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-sm font-bold text-institutional-950">Institutional Authorization Matrix</h2>
          <p className="text-xs text-slate-500">Visual mapping of capabilities across administrative roles.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-3 px-4">Functional Module</th>
                <th className="py-3 px-4 text-center">SUPER_ADMIN</th>
                <th className="py-3 px-4 text-center">ADMIN</th>
                <th className="py-3 px-4 text-center">EDITOR</th>
                <th className="py-3 px-4 text-center">CONTENT_MANAGER</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {permissionsMatrix.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60 transition">
                  <td className="py-3 px-4 font-semibold text-slate-800">{item.module}</td>
                  <td className="py-3 px-4 text-center">
                    {item.superAdmin ? (
                      <span className="inline-flex p-1 rounded-full bg-emerald-100 text-emerald-800">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="inline-flex p-1 rounded-full bg-slate-100 text-slate-400">
                        <X className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {item.admin ? (
                      <span className="inline-flex p-1 rounded-full bg-emerald-100 text-emerald-800">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="inline-flex p-1 rounded-full bg-slate-100 text-slate-400">
                        <X className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {item.editor ? (
                      <span className="inline-flex p-1 rounded-full bg-emerald-100 text-emerald-800">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="inline-flex p-1 rounded-full bg-slate-100 text-slate-400">
                        <X className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {item.contentManager ? (
                      <span className="inline-flex p-1 rounded-full bg-emerald-100 text-emerald-800">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="inline-flex p-1 rounded-full bg-slate-100 text-slate-400">
                        <X className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
