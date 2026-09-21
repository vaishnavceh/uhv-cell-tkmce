import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { GalleryAlbum, GalleryImage } from '@uhv/shared-types';
import { usePageTitle } from '../../hooks/usePageTitle';
import {
  Plus,
  Edit2,
  Trash2,
  Image as ImageIcon,
  FolderPlus,
  ArrowLeft,
  Upload,
  Eye,
  ExternalLink,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Badge } from '../../components/ui/Badge';

export const GalleryManager: React.FC = () => {
  usePageTitle('Manage Gallery & Media');
  const queryClient = useQueryClient();

  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [isAlbumModalOpen, setIsAlbumModalOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<GalleryAlbum | null>(null);
  const [deleteAlbumId, setDeleteAlbumId] = useState<string | null>(null);
  const [deletePhotoId, setDeletePhotoId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Album Form
  const [albumForm, setAlbumForm] = useState({
    title: '',
    description: '',
    coverImage: '',
    published: true,
  });

  // Photo Form
  const [photoForm, setPhotoForm] = useState({
    title: '',
    caption: '',
    imageUrl: '',
    altText: '',
    order: 0,
  });

  // Query: All Albums
  const { data: albums, isLoading: loadingAlbums } = useQuery<GalleryAlbum[]>({
    queryKey: ['admin-gallery-albums'],
    queryFn: async () => {
      const res = await apiClient.get('/gallery/admin/all');
      return res.data;
    },
  });

  // Query: Selected Album Details
  const { data: currentAlbum, isLoading: loadingCurrentAlbum } = useQuery<GalleryAlbum>({
    queryKey: ['admin-gallery-album', selectedAlbumId],
    queryFn: async () => {
      const res = await apiClient.get(`/gallery/${selectedAlbumId}`);
      return res.data;
    },
    enabled: !!selectedAlbumId,
  });

  // Mutations for Album
  const saveAlbumMutation = useMutation({
    mutationFn: async () => {
      if (editingAlbum) {
        await apiClient.patch(`/gallery/${editingAlbum.id}`, albumForm);
      } else {
        await apiClient.post('/gallery', albumForm);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-gallery-albums'] });
      setIsAlbumModalOpen(false);
      setEditingAlbum(null);
      setAlbumForm({ title: '', description: '', coverImage: '', published: true });
    },
  });

  const deleteAlbumMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/gallery/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-gallery-albums'] });
      if (selectedAlbumId === deleteAlbumId) setSelectedAlbumId(null);
      setDeleteAlbumId(null);
    },
  });

  // Mutations for Photo
  const addPhotoMutation = useMutation({
    mutationFn: async () => {
      if (!selectedAlbumId) return;
      await apiClient.post(`/gallery/${selectedAlbumId}/images`, photoForm);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-gallery-album', selectedAlbumId] });
      queryClient.invalidateQueries({ queryKey: ['admin-gallery-albums'] });
      setIsPhotoModalOpen(false);
      setPhotoForm({ title: '', caption: '', imageUrl: '', altText: '', order: 0 });
    },
  });

  const deletePhotoMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/gallery/images/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-gallery-album', selectedAlbumId] });
      queryClient.invalidateQueries({ queryKey: ['admin-gallery-albums'] });
      setDeletePhotoId(null);
    },
  });

  // Handle Photo File Upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const form = new FormData();
    form.append('file', file);
    form.append('folder', 'gallery');

    try {
      setUploading(true);
      const res = await apiClient.post('/uploads', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const uploaded = res.data?.data || res.data;
      setPhotoForm((prev) => ({
        ...prev,
        imageUrl: uploaded.url,
        title: prev.title || file.name.replace(/\.[^/.]+$/, ''),
        altText: prev.altText || file.name.replace(/\.[^/.]+$/, ''),
      }));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Photo upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-emerald-900/10 shadow-subtle">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-emerald-800" />
            <h1 className="text-xl font-bold text-institutional-950">Gallery & Media Archives</h1>
          </div>
          <p className="text-xs text-slate-500">
            Organize institutional photo albums, induction ceremonies, workshop highlights, and exhibitions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedAlbumId && (
            <Button
              onClick={() => {
                setPhotoForm({
                  title: '',
                  caption: '',
                  imageUrl: '',
                  altText: '',
                  order: (currentAlbum?.images?.length || 0) + 1,
                });
                setIsPhotoModalOpen(true);
              }}
              size="sm"
              className="bg-institutional-850 hover:bg-institutional-950 text-white"
            >
              <Plus className="w-4 h-4 mr-1.5" /> Add Photo
            </Button>
          )}

          <Button
            onClick={() => {
              setEditingAlbum(null);
              setAlbumForm({ title: '', description: '', coverImage: '', published: true });
              setIsAlbumModalOpen(true);
            }}
            size="sm"
            variant="outline"
          >
            <FolderPlus className="w-4 h-4 mr-1.5" /> New Album
          </Button>
        </div>
      </div>

      {/* If Inside an Album */}
      {selectedAlbumId ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
            <button
              onClick={() => setSelectedAlbumId(null)}
              className="inline-flex items-center gap-2 text-xs font-bold text-emerald-800 hover:text-emerald-950"
            >
              <ArrowLeft className="w-4 h-4" /> Back to All Albums
            </button>
            <div className="text-xs font-bold text-slate-700">
              Viewing Album: <span className="text-institutional-950">{currentAlbum?.title}</span>
            </div>
          </div>

          {loadingCurrentAlbum ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-44 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : !currentAlbum?.images || currentAlbum.images.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border border-dashed border-slate-300 space-y-3">
              <ImageIcon className="w-10 h-10 text-slate-400 mx-auto" />
              <p className="text-xs text-slate-500 font-semibold">No photos uploaded to this album yet.</p>
              <Button
                onClick={() => setIsPhotoModalOpen(true)}
                size="sm"
                className="bg-institutional-850 hover:bg-institutional-950 text-white"
              >
                Upload First Photo
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {currentAlbum.images.map((img) => (
                <div
                  key={img.id}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-subtle group relative"
                >
                  <div className="h-44 bg-slate-100 overflow-hidden relative">
                    <img
                      src={img.imageUrl}
                      alt={img.altText || img.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition">
                      <button
                        onClick={() => setDeletePhotoId(img.id)}
                        className="p-1.5 bg-red-600 text-white rounded-md shadow-md hover:bg-red-700"
                        title="Delete photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-bold text-slate-800 truncate">{img.title}</p>
                    {img.caption && <p className="text-[11px] text-slate-500 truncate">{img.caption}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Albums Grid */
        <div className="space-y-4">
          {loadingAlbums ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-56 bg-white rounded-xl animate-pulse border border-slate-200" />
              ))}
            </div>
          ) : !albums || albums.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border border-dashed border-slate-300 space-y-3">
              <FolderPlus className="w-10 h-10 text-slate-400 mx-auto" />
              <p className="text-xs text-slate-500 font-semibold">No gallery albums created yet.</p>
              <Button
                onClick={() => setIsAlbumModalOpen(true)}
                size="sm"
                className="bg-institutional-850 hover:bg-institutional-950 text-white"
              >
                Create First Album
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {albums.map((album) => (
                <div
                  key={album.id}
                  className="bg-white rounded-2xl border border-emerald-900/10 shadow-subtle overflow-hidden flex flex-col justify-between"
                >
                  <div className="h-44 bg-slate-100 relative overflow-hidden">
                    {album.coverImage ? (
                      <img src={album.coverImage} alt={album.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-100">
                        <ImageIcon className="w-12 h-12" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      <Badge variant={album.published ? 'success' : 'default'} className="text-[10px]">
                        {album.published ? 'Live' : 'Draft'}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-institutional-950">{album.title}</h3>
                      <p className="text-xs text-slate-500 line-clamp-2">
                        {album.description || 'No description provided for this collection.'}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <button
                        onClick={() => setSelectedAlbumId(album.id)}
                        className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
                      >
                        Manage Photos ({album._count?.images || album.images?.length || 0})
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingAlbum(album);
                            setAlbumForm({
                              title: album.title,
                              description: album.description || '',
                              coverImage: album.coverImage || '',
                              published: album.published,
                            });
                            setIsAlbumModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-emerald-800"
                          title="Edit Album"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteAlbumId(album.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600"
                          title="Delete Album"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Album Create/Edit Modal */}
      <Modal
        isOpen={isAlbumModalOpen}
        onClose={() => setIsAlbumModalOpen(false)}
        title={editingAlbum ? 'Edit Album Details' : 'Create New Album'}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveAlbumMutation.mutate();
          }}
          className="space-y-4"
        >
          <Input
            label="Album Title *"
            value={albumForm.title}
            onChange={(e) => setAlbumForm({ ...albumForm, title: e.target.value })}
            placeholder="e.g. AICTE 2024 National Workshop"
            required
          />

          <Input
            label="Cover Image URL (Optional)"
            value={albumForm.coverImage}
            onChange={(e) => setAlbumForm({ ...albumForm, coverImage: e.target.value })}
            placeholder="/assets/gallery/... or /uploads/gallery/..."
          />

          <Textarea
            label="Album Description"
            value={albumForm.description}
            onChange={(e) => setAlbumForm({ ...albumForm, description: e.target.value })}
            rows={3}
            placeholder="Brief background on the event, venue, and highlights..."
          />

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={albumForm.published}
                onChange={(e) => setAlbumForm({ ...albumForm, published: e.target.checked })}
                className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
              />
              <span>Published on Public Gallery</span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAlbumModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={saveAlbumMutation.isPending}
              className="bg-institutional-850 hover:bg-institutional-950 text-white"
            >
              {saveAlbumMutation.isPending ? 'Saving...' : editingAlbum ? 'Update Album' : 'Create Album'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Photo Add Modal */}
      <Modal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        title="Add Photo to Album"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!photoForm.imageUrl) {
              alert('Please upload an image or supply an image URL');
              return;
            }
            addPhotoMutation.mutate();
          }}
          className="space-y-4"
        >
          {/* Photo File Upload Box */}
          <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center space-y-2">
            <Upload className="w-6 h-6 text-slate-400 mx-auto" />
            <div className="text-xs text-slate-600">
              <label className="text-emerald-700 font-bold hover:underline cursor-pointer">
                <span>Select image file to upload</span>
                <input
                  type="file"
                  onChange={handlePhotoUpload}
                  className="sr-only"
                  accept="image/jpeg,image/png,image/webp"
                />
              </label>
            </div>
            {uploading && <p className="text-xs text-emerald-700 font-bold animate-pulse">Uploading photo...</p>}
          </div>

          <Input
            label="Image URL *"
            value={photoForm.imageUrl}
            onChange={(e) => setPhotoForm({ ...photoForm, imageUrl: e.target.value })}
            placeholder="/uploads/gallery/... or /assets/..."
            required
          />

          <Input
            label="Photo Title *"
            value={photoForm.title}
            onChange={(e) => setPhotoForm({ ...photoForm, title: e.target.value })}
            placeholder="e.g. Inaugural address by the Principal"
            required
          />

          <Input
            label="Caption (Optional)"
            value={photoForm.caption}
            onChange={(e) => setPhotoForm({ ...photoForm, caption: e.target.value })}
            placeholder="Detailed description of the moment"
          />

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsPhotoModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={addPhotoMutation.isPending || uploading}
              className="bg-institutional-850 hover:bg-institutional-950 text-white"
            >
              {addPhotoMutation.isPending ? 'Saving...' : 'Add Photo to Album'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Album */}
      <ConfirmDialog
        isOpen={!!deleteAlbumId}
        onClose={() => setDeleteAlbumId(null)}
        onConfirm={() => deleteAlbumId && deleteAlbumMutation.mutate(deleteAlbumId)}
        title="Delete Album"
        message="Are you sure you want to permanently delete this album and all photos inside it?"
        confirmText="Delete Album"
        variant="danger"
      />

      {/* Confirm Delete Photo */}
      <ConfirmDialog
        isOpen={!!deletePhotoId}
        onClose={() => setDeletePhotoId(null)}
        onConfirm={() => deletePhotoId && deletePhotoMutation.mutate(deletePhotoId)}
        title="Delete Photo"
        message="Are you sure you want to remove this photo from the gallery album?"
        confirmText="Delete Photo"
        variant="danger"
      />
    </div>
  );
};
