import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { usePageTitle } from '../../hooks/usePageTitle';
import { Settings, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Button } from '../../components/ui/Button';

export const SettingsManager: React.FC = () => {
  usePageTitle('Site Settings');
  const queryClient = useQueryClient();

  const [settings, setSettings] = useState<Record<string, string>>({
    site_title: 'Universal Human Values Cell | TKM College of Engineering',
    institution_name: 'TKM College of Engineering (Autonomous)',
    aicte_mandate_ref: 'AICTE Mandate G911 / National Education Policy (NEP)',
    contact_email: 'uhv@tkmce.ac.in',
    contact_phone: '+91 474 2712020',
    office_address: 'Karicode, Perumpuzha P.O, Kollam, Kerala – 691005',
    working_hours: 'Monday – Friday: 9:00 AM – 4:30 PM (IST)',
    announcement_ticker: 'Welcome to the official portal of Universal Human Values (UHV) Cell, TKMCE.',
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  const { data, isLoading } = useQuery<Record<string, string>>({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const res = await apiClient.get('/settings');
      return res.data;
    },
  });

  useEffect(() => {
    if (data) {
      setSettings((prev) => ({ ...prev, ...data }));
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      await apiClient.patch('/settings', { settings });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    },
  });

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate();
  };

  return (
    <div className="space-y-6 max-w-4xl pb-12">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-emerald-900/10 shadow-subtle space-y-1">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-emerald-800" />
          <h1 className="text-xl font-bold text-institutional-950">Site Configuration & Metadata</h1>
        </div>
        <p className="text-xs text-slate-500">
          Configure global metadata, institutional contact coordinates, and public portal announcements.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          Settings persisted successfully across public portal cache.
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl border border-emerald-900/10 shadow-subtle space-y-6">
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-institutional-950 border-b border-slate-100 pb-2">
            Institutional Brand & Header
          </h2>

          <Input
            label="Portal Title"
            value={settings.site_title || ''}
            onChange={(e) => handleChange('site_title', e.target.value)}
            placeholder="Universal Human Values Cell | TKM College of Engineering"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="College Legal Entity"
              value={settings.institution_name || ''}
              onChange={(e) => handleChange('institution_name', e.target.value)}
              placeholder="TKM College of Engineering (Autonomous)"
            />

            <Input
              label="Regulatory Mandate Reference"
              value={settings.aicte_mandate_ref || ''}
              onChange={(e) => handleChange('aicte_mandate_ref', e.target.value)}
              placeholder="AICTE Mandate G911"
            />
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h2 className="text-sm font-bold text-institutional-950 border-b border-slate-100 pb-2">
            Secretariat & Contact Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Coordinator Inquiries Email"
              value={settings.contact_email || ''}
              onChange={(e) => handleChange('contact_email', e.target.value)}
              placeholder="uhv@tkmce.ac.in"
            />

            <Input
              label="Official Contact Number"
              value={settings.contact_phone || ''}
              onChange={(e) => handleChange('contact_phone', e.target.value)}
              placeholder="+91 474 2712020"
            />
          </div>

          <Input
            label="Secretariat Address"
            value={settings.office_address || ''}
            onChange={(e) => handleChange('office_address', e.target.value)}
            placeholder="Karicode, Perumpuzha P.O, Kollam, Kerala – 691005"
          />

          <Input
            label="Office Working Hours"
            value={settings.working_hours || ''}
            onChange={(e) => handleChange('working_hours', e.target.value)}
            placeholder="Monday – Friday: 9:00 AM – 4:30 PM (IST)"
          />
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h2 className="text-sm font-bold text-institutional-950 border-b border-slate-100 pb-2">
            Public Portal Announcement Banner
          </h2>

          <Textarea
            label="Homepage Bulletin / Notice Ticker"
            value={settings.announcement_ticker || ''}
            onChange={(e) => handleChange('announcement_ticker', e.target.value)}
            rows={3}
            placeholder="Important notifications highlighted to portal visitors..."
          />
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <Button
            type="submit"
            disabled={updateMutation.isPending}
            className="bg-institutional-850 hover:bg-institutional-950 text-white px-6"
          >
            {updateMutation.isPending ? (
              'Persisting Changes...'
            ) : (
              <span className="flex items-center gap-2">
                <Save className="w-4 h-4" /> Save Configuration
              </span>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};
