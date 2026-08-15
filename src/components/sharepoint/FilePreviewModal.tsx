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
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { DocumentFile } from '@/types/sharepoint';
import { sharepointService } from '@/services/sharepointService';

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
  const [signedUrlForOffice, setSignedUrlForOffice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasStorageError, setHasStorageError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Office Viewer Loading & Timeout Control
  const [officeLoading, setOfficeLoading] = useState(true);
  const [officeTimeout, setOfficeTimeout] = useState(false);

  useEffect(() => {
    async function loadPreviewUrl() {
      if (!file || !isOpen) return;

      setLoading(true);
      setHasStorageError(false);
      setErrorMessage(null);
      setOfficeLoading(true);
      setOfficeTimeout(false);
      setFileUrl(null);
      setSignedUrlForOffice(null);

      if (!file.storage_path) {
        setLoading(false);
        return;
      }

      try {
        await sharepointService.ensureBucketExists();

        // Retrieve Signed URL / Local Blob URL
        const res = await sharepointService.getFilePreviewOrDownloadUrl(file.storage_path);

        if (res.url) {
          setFileUrl(res.url);
          setSignedUrlForOffice(res.url);
        } else {
          setHasStorageError(true);
          setErrorMessage(res.error || 'File vật lý chưa có trên Storage.');
        }
      } catch (err: any) {
        setHasStorageError(true);
        setErrorMessage(err.message || 'Không thể truy cập Storage.');
      } finally {
        setLoading(false);
      }
    }

    loadPreviewUrl();
  }, [file, isOpen]);

  // Timeout handler for Office Viewer iframe (15 Seconds Timeout Fallback)
  useEffect(() => {
    if (!isOpen || !fileUrl) return;

    const isOfficeFile = Boolean(file?.name.match(/\.(docx|doc|xlsx|xls|pptx|ppt)$/i));
    if (!isOfficeFile) return;

    setOfficeLoading(true);
    setOfficeTimeout(false);

    const timer = setTimeout(() => {
      setOfficeLoading(false);
      setOfficeTimeout(true);
    }, 15000);

    return () => clearTimeout(timer);
  }, [isOpen, fileUrl, file]);

  if (!isOpen || !file) return null;

  const isPdf = file.name.toLowerCase().endsWith('.pdf') || (file.mime_type && file.mime_type.includes('pdf'));
  const isImage = (file.mime_type && file.mime_type.includes('image')) || Boolean(file.name.match(/\.(jpg|jpeg|png|webp|svg|gif)$/i));
  const isOfficeDoc = Boolean(file.name.match(/\.(docx|doc|xlsx|xls|pptx|ppt)$/i));

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleRealDownload = async () => {
    if (!file) return;

    if (file.storage_path) {
      const success = await sharepointService.downloadFileBlob(file.storage_path, file.name);
      if (!success && fileUrl) {
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = file.name;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
    onDownload(file);
  };

  // Build Encoded Office Online Viewer URL
  const officeOnlineViewerUrl = signedUrlForOffice
    ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(signedUrlForOffice)}`
    : null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 select-none animate-fade-in">
      <div className="w-full max-w-6xl h-[92vh] bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 flex flex-col justify-between overflow-hidden">
        {/* Header Toolbar */}
        <div className="h-14 px-4 sm:px-5 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          {/* Left: File metadata */}
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-400/30 shrink-0">
              {isPdf ? (
                <FileText className="w-5 h-5 text-red-400" />
              ) : isOfficeDoc ? (
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
              ) : isImage ? (
                <ImageIcon className="w-5 h-5 text-purple-400" />
              ) : (
                <FileText className="w-5 h-5 text-blue-400" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-xs sm:text-sm text-slate-100 flex items-center space-x-2">
                <span className="truncate max-w-[200px] sm:max-w-md">{file.name}</span>
                <span className="bg-blue-600 text-white text-[10px] font-mono px-1.5 py-0.2 rounded font-bold shrink-0">
                  v{file.current_version || 1}
                </span>
              </h3>
              <p className="text-[10px] sm:text-[11px] text-slate-400 font-mono truncate">
                {formatFileSize(file.file_size)} • {file.service_type || 'CFO'} • Năm {file.fiscal_year || 2025}
              </p>
            </div>
          </div>

          {/* Middle: Zoom Controls for Images */}
          {isImage && (
            <div className="hidden md:flex items-center space-x-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
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
          )}

          {/* Right: Download & Close */}
          <div className="flex items-center space-x-2 shrink-0">
            {fileUrl && !hasStorageError && (
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                title="Mở tab mới"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}

            <button
              onClick={handleRealDownload}
              className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors shadow-xs min-h-[44px]"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Tải file gốc</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Viewer Area */}
        <div className="flex-1 bg-slate-950 p-2 sm:p-4 overflow-auto flex items-center justify-center relative">
          {loading ? (
            <div className="flex flex-col items-center space-y-3 text-slate-400 text-xs">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <span>Đang kết nối Supabase Private Storage...</span>
            </div>
          ) : hasStorageError ? (
            /* Clean Error Banner */
            <div className="text-center p-6 sm:p-8 bg-slate-900/90 rounded-2xl border border-slate-800 max-w-lg text-slate-300 text-xs space-y-4 shadow-2xl animate-in fade-in my-auto">
              <div className="p-3 bg-amber-500/20 rounded-full w-12 h-12 mx-auto flex items-center justify-center text-amber-400 border border-amber-500/30">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-slate-200">File Vật Lý Chưa Có Trên Storage</h4>
                <p className="text-slate-400 text-[11px] font-mono bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-left">
                  {errorMessage || 'Dữ liệu Metadata file hợp lệ trong CSDL. File vật lý chưa từng được lưu vào Storage.'}
                </p>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-left text-[11px] space-y-1.5 text-slate-400">
                <p className="font-bold text-slate-300">💡 Hướng dẫn cho Quản trị viên:</p>
                <p>• Nhấn nút <strong>"Tải lên File"</strong> tại thư mục chứa file này để cập nhật bản nén vật lý mới.</p>
                <p>• Dữ liệu phiên bản v{file.current_version || 1} & Metadata sẽ tự động liên kết chuẩn xác.</p>
              </div>

              <div className="flex items-center justify-center space-x-2 pt-1">
                <button
                  onClick={handleRealDownload}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-colors shadow-md text-xs min-h-[44px]"
                >
                  Tải file xuống
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-colors text-xs min-h-[44px]"
                >
                  Đóng
                </button>
              </div>
            </div>
          ) : isPdf && fileUrl ? (
            /* Native PDF Viewer */
            <iframe
              src={`${fileUrl}#toolbar=1&navpanes=1`}
              className="w-full h-full rounded-xl border border-slate-800 bg-white shadow-2xl"
              title={file.name}
            />
          ) : isImage && fileUrl ? (
            /* Native Image Viewer */
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
          ) : isOfficeDoc && officeOnlineViewerUrl && !officeTimeout ? (
            /* Microsoft Office Online Viewer Embedded Iframe */
            <div className="w-full h-full relative rounded-xl overflow-hidden border border-slate-800 bg-white shadow-2xl">
              {officeLoading && (
                <div className="absolute inset-0 bg-slate-950/90 z-10 flex flex-col items-center justify-center space-y-3 text-slate-300 text-xs">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                  <span>Đang nhúng trình xem Microsoft Office Online Viewer...</span>
                </div>
              )}
              <iframe
                src={officeOnlineViewerUrl}
                className="w-full h-full border-0"
                title={file.name}
                onLoad={() => setOfficeLoading(false)}
                onError={() => {
                  setOfficeLoading(false);
                  setOfficeTimeout(true);
                }}
              />
            </div>
          ) : (
            /* Fallback Document Information Card on Timeout / Error */
            <div className="text-center p-8 bg-slate-900/90 rounded-2xl border border-slate-800 max-w-md text-slate-200 text-xs space-y-4 shadow-2xl my-auto animate-fade-in">
              <div className="p-4 bg-blue-500/10 rounded-2xl w-16 h-16 mx-auto flex items-center justify-center text-blue-400 border border-blue-500/20">
                <FileText className="w-8 h-8 text-blue-400" />
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-base text-white">{file.name}</h4>
                <p className="text-slate-400 text-xs font-mono">
                  Dung lượng: {formatFileSize(file.file_size)} • {file.service_type || 'CFO'} • Năm {file.fiscal_year || 2025}
                </p>
              </div>

              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-left text-[11px] space-y-1.5 text-slate-400">
                <p className="font-semibold text-slate-300">📄 Thông tin tài liệu bảo mật:</p>
                <p>• Phiên bản: <strong className="text-blue-400">v{file.current_version || 1}</strong></p>
                <p>• Thẻ tag: <strong className="text-slate-300">{file.tags?.join(', ') || 'Tài liệu Office'}</strong></p>
                <p>• Trạng thái: <strong className="text-emerald-400">{file.status || 'Approved'}</strong></p>
              </div>

              <div className="flex items-center justify-center space-x-2 pt-2">
                <button
                  onClick={handleRealDownload}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-md text-xs min-h-[44px] flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Tải file gốc xuống</span>
                </button>

                {fileUrl && (
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold transition-all text-xs min-h-[44px] flex items-center space-x-1.5"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Mở trong tab mới</span>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
