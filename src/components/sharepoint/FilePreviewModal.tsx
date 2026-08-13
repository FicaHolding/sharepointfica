'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  ExternalLink,
  ShieldCheck,
  Tag,
  CheckCircle2,
  Lock,
  Loader2,
} from 'lucide-react';
import { DocumentFile } from '@/types/sharepoint';
import { sharepointService } from '@/services/sharepointService';
import { createClient } from '@/utils/supabase/client';

interface FilePreviewModalProps {
  file: DocumentFile | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload: (file: DocumentFile) => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  file,
  isOpen,
  onClose,
  onDownload,
}) => {
  const [zoomLevel, setZoomLevel] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (file && isOpen) {
      setLoading(true);

      // Fetch public URL from Supabase Storage bucket 'documents'
      if (file.storage_path) {
        const { data } = supabase.storage.from('documents').getPublicUrl(file.storage_path);
        if (data?.publicUrl) {
          setFileUrl(data.publicUrl);
        } else {
          setFileUrl(`https://flcteenudjlmosooxtzh.supabase.co/storage/v1/object/public/documents/${file.storage_path}`);
        }
      } else {
        setFileUrl(null);
      }

      setLoading(false);
    }
  }, [file, isOpen]);

  if (!isOpen || !file) return null;

  const isPdf = file.name.toLowerCase().endsWith('.pdf') || (file.mime_type && file.mime_type.includes('pdf'));
  const isImage = (file.mime_type && file.mime_type.includes('image')) || Boolean(file.name.match(/\.(jpg|jpeg|png|webp|svg|gif)$/i));
  const isSpreadsheet = Boolean(file.name.match(/\.(xlsx|xls|csv)$/i)) || (file.mime_type && (file.mime_type.includes('spreadsheet') || file.mime_type.includes('excel')));

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleRealDownload = () => {
    if (fileUrl) {
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = file.name;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    onDownload(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-fade-in">
      <div className="w-full max-w-5xl h-[88vh] bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 flex flex-col justify-between overflow-hidden">
        {/* Header Toolbar */}
        <div className="h-14 px-5 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
          {/* Left: File metadata */}
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-400/30">
              {isPdf ? (
                <FileText className="w-5 h-5 text-red-400" />
              ) : isSpreadsheet ? (
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
              ) : isImage ? (
                <ImageIcon className="w-5 h-5 text-purple-400" />
              ) : (
                <FileText className="w-5 h-5 text-blue-400" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100 flex items-center space-x-2">
                <span className="truncate max-w-md">{file.name}</span>
                <span className="bg-blue-600 text-white text-[10px] font-mono px-1.5 py-0.2 rounded font-bold">
                  v{file.current_version || 1}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                {formatFileSize(file.file_size)} • {file.service_type || 'CFO'} • Năm {file.fiscal_year || 2025}
              </p>
            </div>
          </div>

          {/* Middle: Zoom & View Controls */}
          <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setZoomLevel((z) => Math.max(50, z - 25))}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
              title="Thu nhỏ"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-semibold px-2 text-slate-300">{zoomLevel}%</span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(200, z + 25))}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
              title="Phóng to"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <div className="h-4 w-[1px] bg-slate-800 mx-1" />
            <button
              onClick={() => setRotation((r) => (r + 90) % 360)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
              title="Xoay 90 độ"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>

          {/* Right: Download & Close */}
          <div className="flex items-center space-x-2">
            {fileUrl && (
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                title="Mở tab mới"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}

            <button
              onClick={handleRealDownload}
              className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Tải file gốc</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Viewer Area */}
        <div className="flex-1 bg-slate-950 p-4 overflow-auto flex items-center justify-center relative">
          {loading ? (
            <div className="flex flex-col items-center space-y-2 text-slate-400 text-xs">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <span>Đang tải xem trước từ Supabase Storage...</span>
            </div>
          ) : isPdf && fileUrl ? (
            <iframe
              src={`${fileUrl}#toolbar=1&navpanes=1`}
              className="w-full h-full rounded-xl border border-slate-800 bg-white shadow-2xl"
              title={file.name}
            />
          ) : isImage && fileUrl ? (
            <div
              style={{
                transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                transition: 'transform 0.2s ease-in-out',
              }}
              className="max-w-full max-h-full flex items-center justify-center"
            >
              <img
                src={fileUrl}
                alt={file.name}
                className="max-h-[75vh] max-w-full object-contain rounded-xl shadow-2xl border border-slate-800"
              />
            </div>
          ) : fileUrl ? (
            <iframe
              src={`https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true`}
              className="w-full h-full rounded-xl border border-slate-800 bg-white shadow-2xl"
              title={file.name}
            />
          ) : (
            <div className="text-center p-8 bg-slate-900 rounded-2xl border border-slate-800 max-w-md text-slate-400 text-xs space-y-3">
              <FileText className="w-12 h-12 text-blue-400 mx-auto" />
              <h4 className="font-bold text-sm text-slate-200">{file.name}</h4>
              <p>Chế độ xem trực tiếp không hỗ trợ định dạng này. Vui lòng bấm "Tải file gốc" bên trên để xem chi tiết.</p>
              <button
                onClick={handleRealDownload}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-colors"
              >
                Tải xuống File ngay
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
