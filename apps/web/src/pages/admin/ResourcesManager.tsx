import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { ResourceItem } from '@uhv/shared-types';
import { usePageTitle } from '../../hooks/usePageTitle';
import { Plus, Edit2, Trash2, FileText, Upload, Download, Search, ExternalLink } from 'lucide-react';
import { formatDate, formatFileSize } from '../../utils/cn';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Badge } from '../../components/ui/Badge';
import { Table, Thead, Tbody, Tr, Th, Td } from '../../components/ui/Table';

export const ResourcesManager: React.FC = () => {
  usePageTitle('Manage Curricular Resources');
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ResourceItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'AICTE Guidelines',
    fileUrl: '',
    fileName: '',
    fileType: 'application/pdf',
    fileSize: 0,
    published: true,
  });

  const { data, isLoading } = useQuery<{ data: ResourceItem[]; meta: any }>({
    queryKey: ['admin-resources'],
    queryFn: async () => {
      const res = await apiClient.get('/resources/admin/all');
      return res.data;
    },
  });

  const resources = data?.data || [];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const form = new FormData();
    form.append('file', file);
    form.append('folder', 'documents');

    try {
      setUploading(true);
      const res = await apiClient.post('/uploads', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const uploaded = res.data?.data || res.data;
      setFormData((prev) => ({
        ...prev,
        fileUrl: uploaded.url,
        fileName: file.name,
        fileType: file.type || 'application/pdf',
        fileSize: file.size,
        title: prev.title || file.name.replace(/\.[^/.]+$/, ''),
      }));
    } catch (err: any) {
      alert(err.response?.data?.message || 'File upload failed');
    } finally {
      setUploading(false);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingItem) {
        await apiClient.patch(`/resources/${editingItem.id}`, formData);
      } else {
        await apiClient.post('/resources', formData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-resources'] });
      setIsModalOpen(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/resources/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-resources'] });
      setDeleteId(null);
    },
  });

  const resetForm = () => {
    setEditingItem(null);
    setFormData({
      title: '',
      description: '',
      category: 'AICTE Guidelines',
      fileUrl: '',
      fileName: '',
      fileType: 'application/pdf',
      fileSize: 0,
      published: true,
    });
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: ResourceItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      description: item.description,
      category: item.category,
      fileUrl: item.fileUrl,
      fileName: item.fileName,
      fileType: item.fileType,
      fileSize: item.fileSize,
      published: item.published,
    });
    setIsModalOpen(true);
  };

  const filtered = resources.filter(
    (r) =>
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.fileName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-emerald-900/10 shadow-subtle">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-800" />
            <h1 className="text-xl font-bold text-institutional-950">Curricular Resource Library</h1>
          </div>
          <p className="text-xs text-slate-500">
            Upload AICTE guidelines, textbooks, presentation slides, and curriculum documents.
          </p>
        </div>

        <Button onClick={handleOpenCreate} size="sm" className="bg-institutional-850 hover:bg-institutional-950 text-white">
          <Plus className="w-4 h-4 mr-1.5" /> Upload Resource
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search documents by title or filename..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="text-xs"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Total: <span className="font-bold text-slate-800">{filtered.length}</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-subtle">
        <Table>
          <Thead>
            <Tr>
              <Th>Document Information</Th>
              <Th className="w-40">Category</Th>
              <Th className="w-28 text-center">File Size</Th>
              <Th className="w-24 text-center">Downloads</Th>
              <Th className="w-20 text-center">Status</Th>
              <Th className="w-28 text-right">Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {isLoading ? (
              <Tr>
                <Td colSpan={6} className="text-center py-8 text-xs text-slate-400">
                  Loading resource library...
                </Td>
              </Tr>
            ) : filtered.length === 0 ? (
              <Tr>
                <Td colSpan={6} className="text-center py-8 text-xs text-slate-400">
                  No resources uploaded yet.
                </Td>
              </Tr>
            ) : (
              filtered.map((item) => (
                <Tr key={item.id}>
                  <Td>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-institutional-950">{item.title}</p>
                        <a
                          href={item.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-400 hover:text-emerald-700"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{item.description}</p>
                      <span className="text-[10px] text-slate-400 font-mono">{item.fileName}</span>
                    </div>
                  </Td>
                  <Td>
                    <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                      {item.category}
                    </span>
                  </Td>
                  <Td className="text-center text-xs text-slate-600 font-mono">
                    {formatFileSize(item.fileSize)}
                  </Td>
                  <Td className="text-center text-xs font-bold text-emerald-800">
                    {item.downloadCount}
                  </Td>
                  <Td className="text-center">
                    <Badge variant={item.published ? 'success' : 'default'} className="text-[10px]">
                      {item.published ? 'Live' : 'Draft'}
                    </Badge>
                  </Td>
                  <Td className="text-right space-x-1">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-1.5 rounded text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteId(item.id)}
                      className="p-1.5 rounded text-slate-500 hover:text-red-600 hover:bg-red-50 transition"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Resource Document' : 'Upload Curricular Resource'}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!formData.fileUrl) {
              alert('Please upload a file or enter a valid file URL');
              return;
            }
            saveMutation.mutate();
          }}
          className="space-y-4"
        >
          {/* File Uploader */}
          <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center space-y-2">
            <Upload className="w-6 h-6 text-slate-400 mx-auto" />
            <div className="text-xs text-slate-600">
              <label className="text-emerald-700 font-bold hover:underline cursor-pointer">
                <span>Select file to upload</span>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="sr-only"
                  accept=".pdf,.doc,.docx,.ppt,.pptx"
                />
              </label>
              <p className="text-[10px] text-slate-400 mt-1">
                Supported formats: PDF, DOCX, PPTX (Max size: 25MB)
              </p>
            </div>
            {uploading && <p className="text-xs text-emerald-700 font-bold animate-pulse">Uploading file...</p>}
          </div>

          <Input
            label="Resource Title *"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g. AICTE Mandate Circular G911 Official Copy"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full text-xs rounded-lg border border-slate-300 p-2 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              >
                <option value="AICTE Guidelines">AICTE Guidelines</option>
                <option value="Study Materials">Study Materials</option>
                <option value="UHV Books">UHV Books</option>
                <option value="Workshop Materials">Workshop Materials</option>
                <option value="Academic Resources">Academic Resources</option>
              </select>
            </div>

            <Input
              label="Original File Name *"
              value={formData.fileName}
              onChange={(e) => setFormData({ ...formData, fileName: e.target.value })}
              placeholder="aicte-mandate-g911.pdf"
              required
            />
          </div>

          <Input
            label="File Access URL *"
            value={formData.fileUrl}
            onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
            placeholder="/uploads/documents/..."
            required
          />

          <Textarea
            label="Document Description *"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            placeholder="Describe the relevance, target audience, and syllabus mapping..."
            required
          />

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={formData.published}
                onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
              />
              <span>Publish in Digital Library</span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={saveMutation.isPending || uploading}
              className="bg-institutional-850 hover:bg-institutional-950 text-white"
            >
              {saveMutation.isPending ? 'Saving...' : editingItem ? 'Update Resource' : 'Publish Resource'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Delete Resource"
        message="Are you sure you want to permanently delete this resource from the digital repository?"
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};
