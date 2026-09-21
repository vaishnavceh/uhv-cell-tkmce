import React, { useState, useRef } from 'react';
import { apiClient } from '../../api/client';
import { Upload, X, Image as ImageIcon, Link as LinkIcon, Check, Loader2, AlertCircle } from 'lucide-react';
import { Button } from './Button';

export interface ImageUploadProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  helperText?: string;
  required?: boolean;
  aspectRatio?: 'square' | 'video' | 'wide' | 'auto';
  className?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  label,
  value,
  onChange,
  folder = 'general',
  helperText,
  required = false,
  aspectRatio = 'auto',
  className = '',
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadFile(file);
    }
  };

  const uploadFile = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG, JPG, JPEG, WEBP, SVG)');
      return;
    }

    // Validate size (e.g. 15MB limit)
    if (file.size > 15 * 1024 * 1024) {
      setUploadError('Image exceeds the 15MB size limit');
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    try {
      const res = await apiClient.post(`/uploads?folder=${encodeURIComponent(folder)}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const data = res.data;
      const uploadedUrl = data?.url || data?.file?.url || data?.data?.url || data?.data?.file?.url;

      if (uploadedUrl) {
        // If the URL is relative (e.g. /uploads/team/file.jpg), make it absolute
        // so it resolves to the backend server (Render) not the frontend (Vercel)
        let absoluteUrl = uploadedUrl;
        if (uploadedUrl.startsWith('/')) {
          const apiBase = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/api\/v1\/?$/, '');
          absoluteUrl = apiBase ? `${apiBase}${uploadedUrl}` : uploadedUrl;
        }
        onChange(absoluteUrl);
      } else {
        throw new Error('Upload server did not return image URL');
      }
    } catch (err: any) {
      const message =
        err.response?.data?.message || err.message || 'Image upload failed. Please try again.';
      setUploadError(message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await uploadFile(file);
    }
  };

  const handleClear = () => {
    onChange('');
    setUploadError(null);
  };

  const getAspectClass = () => {
    switch (aspectRatio) {
      case 'square':
        return 'aspect-square w-32 h-32 sm:w-40 sm:h-40';
      case 'video':
        return 'aspect-video w-full max-h-48';
      case 'wide':
        return 'aspect-[21/9] w-full max-h-40';
      default:
        return 'h-40 w-full max-w-sm';
    }
  };

  return (
    <div className={`space-y-1.5 text-left ${className}`}>
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-slate-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="text-[11px] text-emerald-700 hover:text-emerald-800 font-medium flex items-center gap-1 transition"
        >
          <LinkIcon className="w-3 h-3" />
          <span>{showUrlInput ? 'Hide URL field' : 'Enter URL instead'}</span>
        </button>
      </div>

      {/* Hidden native file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml,image/gif"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Upload & Preview Area */}
      {value ? (
        <div className="relative group border border-slate-200 rounded-xl overflow-hidden bg-slate-50 p-2">
          <div className="flex items-center gap-4">
            {/* Thumbnail Preview */}
            <div
              className={`relative rounded-lg overflow-hidden border border-slate-200 bg-white shadow-xs shrink-0 flex items-center justify-center ${getAspectClass()}`}
            >
              <img
                src={value}
                alt="Uploaded preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/uhv_logo_green.png';
                }}
              />
              <div className="absolute top-1 left-1 bg-emerald-900/80 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                Preview
              </div>
            </div>

            {/* Info & Action Controls */}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="text-xs text-slate-600 truncate font-mono bg-white p-2 rounded border border-slate-200 text-[11px]">
                {value}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="text-xs h-8 px-3"
                >
                  <Upload className="w-3.5 h-3.5 mr-1.5 text-emerald-700" />
                  Replace
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={handleClear}
                  disabled={isUploading}
                  className="text-xs h-8 px-2.5 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="w-3.5 h-3.5 mr-1" />
                  Remove
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer border-2 border-dashed rounded-xl p-5 text-center transition-all ${
            dragOver
              ? 'border-emerald-500 bg-emerald-50/60'
              : 'border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/30'
          } ${isUploading ? 'pointer-events-none opacity-70' : ''}`}
        >
          {isUploading ? (
            <div className="py-3 flex flex-col items-center justify-center space-y-2">
              <Loader2 className="w-7 h-7 text-emerald-600 animate-spin" />
              <p className="text-xs font-semibold text-slate-700">Uploading image to server...</p>
              <p className="text-[11px] text-slate-500">Please wait</p>
            </div>
          ) : (
            <div className="py-2 flex flex-col items-center justify-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-xs">
                <Upload className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <p className="text-xs font-bold text-institutional-900">
                  Click to upload <span className="font-normal text-slate-500">or drag and drop</span>
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  PNG, JPG, JPEG, WEBP or SVG (Max 15MB)
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Manual URL Input Box (Shown if toggled) */}
      {showUrlInput && (
        <div className="pt-2 animate-in fade-in duration-200">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Paste image URL (e.g. /assets/... or https://...)"
            className="w-full text-xs font-mono rounded-lg border border-slate-300 p-2 focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-white"
          />
        </div>
      )}

      {/* Error message */}
      {uploadError && (
        <div className="flex items-center gap-1.5 text-xs text-red-600 pt-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Helper text */}
      {helperText && !uploadError && (
        <p className="text-[11px] text-slate-500">{helperText}</p>
      )}
    </div>
  );
};
