import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { ResourceItem } from '@uhv/shared-types';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useDebounce } from '../../hooks/useDebounce';
import { FileText, Download, Search, Filter, ExternalLink, ShieldCheck } from 'lucide-react';
import { formatFileSize, formatDate } from '../../utils/cn';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export const Resources: React.FC = () => {
  usePageTitle('Resource Library');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const debouncedSearch = useDebounce(searchTerm, 350);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{ data: ResourceItem[]; meta: any }>({
    queryKey: ['public-resources', debouncedSearch, selectedCategory],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('limit', '50');
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (selectedCategory !== 'ALL') params.append('category', selectedCategory);

      const res = await apiClient.get(`/resources?${params.toString()}`);
      return res.data;
    },
  });

  const downloadMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.post(`/resources/${id}/download`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['public-resources'] });
    },
  });

  const handleDownload = (resource: ResourceItem) => {
    downloadMutation.mutate(resource.id);
    window.open(resource.fileUrl, '_blank');
  };

  const categories = [
    'ALL',
    'AICTE Guidelines',
    'Study Materials',
    'UHV Books',
    'Workshop Materials',
    'Academic Resources',
  ];

  const resources = data?.data || [];

  return (
    <div className="py-12 bg-institutional-warm min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Header */}
        <div className="text-left border-b border-emerald-900/10 pb-8 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/70 border border-emerald-300 text-emerald-900 text-xs font-bold tracking-wide uppercase">
            Curricular Repository
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-institutional-950 tracking-tight">
            Universal Human Values Digital Library
          </h1>
          <p className="text-base text-slate-600 max-w-3xl">
            Access and download verified AICTE directives, official collegiate notifications, lecture
            presentations, textbooks, and self-exploration course syllabi.
          </p>
        </div>

        {/* Search & Category Filter Toolbar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-emerald-900/10 shadow-subtle">
          <div className="w-full md:w-80">
            <Input
              placeholder="Search title, document keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-50 text-xs"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-md text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-institutional-850 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-emerald-50'
                }`}
              >
                {cat === 'ALL' ? 'All Materials' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Resources Cards Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-56 bg-white rounded-xl border border-slate-200 animate-pulse" />
            ))}
          </div>
        ) : resources.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200 p-8">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700">No resources found</h3>
            <p className="text-xs text-slate-500 mt-1">Try adjusting your category filter or search query.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map((res) => (
              <div
                key={res.id}
                className="bg-white p-6 rounded-xl border border-emerald-900/10 shadow-card hover:border-emerald-600 hover:shadow-elevation transition-all flex flex-col justify-between text-left"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-100 shadow-subtle">
                      <FileText className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {res.category}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-institutional-950 mb-2 line-clamp-2">
                    {res.title}
                  </h3>
                  <p className="text-xs text-slate-600 mb-4 line-clamp-3 leading-relaxed">
                    {res.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{formatFileSize(res.fileSize)} &bull; {res.fileType.split('/')[1]?.toUpperCase() || 'DOC'}</span>
                    <span className="font-semibold text-emerald-700">{res.downloadCount} downloads</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleDownload(res)}
                      className="w-full text-xs font-bold gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download File</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};
