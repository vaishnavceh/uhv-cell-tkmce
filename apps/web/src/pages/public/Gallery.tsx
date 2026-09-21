import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { GalleryAlbum, GalleryImage } from '@uhv/shared-types';
import { usePageTitle } from '../../hooks/usePageTitle';
import { Image as ImageIcon, ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';

export const Gallery: React.FC = () => {
  usePageTitle('Visual Media Gallery');
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [activeLightboxIndex, setActiveLightboxIndex] = useState<number | null>(null);

  const { data: albums, isLoading } = useQuery<GalleryAlbum[]>({
    queryKey: ['public-gallery'],
    queryFn: async () => {
      const res = await apiClient.get('/gallery');
      return res.data;
    },
  });

  const currentAlbum = albums?.find((a) => (selectedAlbumId ? a.id === selectedAlbumId : true)) || albums?.[0];
  const images = currentAlbum?.images || [];

  const handleNextPhoto = () => {
    if (activeLightboxIndex !== null) {
      setActiveLightboxIndex((prev) => (prev! + 1) % images.length);
    }
  };

  const handlePrevPhoto = () => {
    if (activeLightboxIndex !== null) {
      setActiveLightboxIndex((prev) => (prev! - 1 + images.length) % images.length);
    }
  };

  return (
    <div className="py-12 bg-institutional-warm min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Header */}
        <div className="text-left border-b border-emerald-900/10 pb-8 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/70 border border-emerald-300 text-emerald-900 text-xs font-bold tracking-wide uppercase">
            Campus Visual Documentation
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-institutional-950 tracking-tight">
            Visual Media Gallery
          </h1>
          <p className="text-base text-slate-600 max-w-3xl">
            Moments from student induction circles, faculty training workshops, and peer mentorship
            dialogues at TKM College of Engineering.
          </p>
        </div>

        {/* Album Switcher Tabs */}
        {albums && albums.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {albums.map((alb) => (
              <button
                key={alb.id}
                onClick={() => {
                  setSelectedAlbumId(alb.id);
                  setActiveLightboxIndex(null);
                }}
                className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  currentAlbum?.id === alb.id
                    ? 'bg-institutional-850 text-white shadow-sm'
                    : 'bg-white text-slate-700 hover:bg-emerald-50 border border-slate-200'
                }`}
              >
                {alb.title} ({alb.images?.length || 0})
              </button>
            ))}
          </div>
        )}

        {/* Selected Album Description */}
        {currentAlbum && (
          <div className="text-left p-6 bg-white rounded-xl border border-emerald-900/10 shadow-subtle space-y-1">
            <h2 className="text-lg font-bold text-institutional-950">{currentAlbum.title}</h2>
            {currentAlbum.description && (
              <p className="text-xs text-slate-600">{currentAlbum.description}</p>
            )}
          </div>
        )}

        {/* Photos Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 bg-white rounded-xl border border-slate-200 animate-pulse" />
            ))}
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200 p-8">
            <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700">No images in this album</h3>
            <p className="text-xs text-slate-500 mt-1">Images will appear once uploaded by the administrator.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {images.map((img, idx) => (
              <div
                key={img.id}
                onClick={() => setActiveLightboxIndex(idx)}
                className="group relative h-64 rounded-xl overflow-hidden bg-slate-900 border border-emerald-900/10 cursor-pointer shadow-card hover:shadow-elevation transition-all"
              >
                <img
                  src={img.imageUrl}
                  alt={img.altText || img.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90 group-hover:opacity-100"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-5 text-left">
                  <div className="flex items-center justify-between text-white mb-1">
                    <h3 className="text-sm font-bold truncate">{img.title}</h3>
                    <ZoomIn className="w-4 h-4 text-emerald-400 shrink-0" />
                  </div>
                  {img.caption && (
                    <p className="text-xs text-slate-300 line-clamp-2">{img.caption}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Interactive Lightbox Modal */}
        {activeLightboxIndex !== null && images[activeLightboxIndex] && (
          <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
            <button
              onClick={() => setActiveLightboxIndex(null)}
              className="absolute top-6 right-6 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition"
              aria-label="Close Lightbox"
            >
              <X className="w-6 h-6" />
            </button>

            {images.length > 1 && (
              <>
                <button
                  onClick={handlePrevPhoto}
                  className="absolute left-6 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={handleNextPhoto}
                  className="absolute right-6 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            <div className="max-w-4xl max-h-[85vh] flex flex-col items-center">
              <img
                src={images[activeLightboxIndex].imageUrl}
                alt={images[activeLightboxIndex].title}
                className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-2xl"
                loading="lazy"
              />
              <div className="mt-4 text-center text-white space-y-1">
                <h3 className="text-base font-bold">{images[activeLightboxIndex].title}</h3>
                {images[activeLightboxIndex].caption && (
                  <p className="text-xs text-slate-300 max-w-lg">{images[activeLightboxIndex].caption}</p>
                )}
                <span className="text-[11px] text-slate-500 font-semibold block pt-1">
                  Photo {activeLightboxIndex + 1} of {images.length}
                </span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
