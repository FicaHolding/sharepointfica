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
  AlertTriangle,
  RefreshCcw,
  Upload,
} from 'lucide-react';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
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
  const [loading, setLoading] = useState(true);
  const [hasStorageError, setHasStorageError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Document Content State for Client-Side Native Parsing (.docx, .xlsx)
  const [docContentHtml, setDocContentHtml] = useState<string | null>(null);
  const [renderingDoc, setRenderingDoc] = useState(false);
  const [docRenderError, setDocRenderError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPreviewUrl() {
      if (!file || !isOpen) return;

      setLoading(true);
      setHasStorageError(false);
      setErrorMessage(null);
      setDocContentHtml(null);
      setDocRenderError(null);

      if (!file.storage_path) {
        setFileUrl(null);
        setLoading(false);
        return;
      }

      try {
        await sharepointService.ensureBucketExists();

        // Get URL via Signed URL or Persistent Local Blob Cache
        const res = await sharepointService.getFilePreviewOrDownloadUrl(file.storage_path);

        if (res.url) {
          setFileUrl(res.url);
        } else {
          setHasStorageError(true);
          setErrorMessage(res.error || 'File vật lý chưa từng được tải lên Storage.');
        }
      } catch (err: any) {
        setHasStorageError(true);
        setErrorMessage(err.message || 'Không thể truy cập Supabase Private Storage.');
      } finally {
        setLoading(false);
      }
    }

    loadPreviewUrl();
  }, [file, isOpen]);

  if (!isOpen || !file) return null;

  const isPdf = file.name.toLowerCase().endsWith('.pdf') || (file.mime_type && file.mime_type.includes('pdf'));
  const isImage = (file.mime_type && file.mime_type.includes('image')) || Boolean(file.name.match(/\.(jpg|jpeg|png|webp|svg|gif)$/i));
  const isSpreadsheet = Boolean(file.name.match(/\.(xlsx|xls|csv)$/i)) || (file.mime_type && (file.mime_type.includes('spreadsheet') || file.mime_type.includes('excel')));
  const isDoc = Boolean(file.name.match(/\.(docx|doc|txt)$/i));

  // Render .docx / .xlsx document content directly into HTML canvas
  useEffect(() => {
    async function parseDocumentContent() {
      if (!fileUrl || !file || (!isDoc && !isSpreadsheet)) {
        setDocContentHtml(null);
        return;
      }

      setRenderingDoc(true);
      setDocRenderError(null);

      try {
        const response = await fetch(fileUrl);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: Không thể nạp file từ Storage`);
        }
        const arrayBuffer = await response.arrayBuffer();

        if (isDoc) {
          // Parse DOCX via Mammoth library
          const result = await mammoth.convertToHtml({ arrayBuffer });
          if (result.value && result.value.trim().length > 0) {
            setDocContentHtml(result.value);
          } else {
            setDocRenderError('Nội dung tài liệu Word rỗng hoặc chưa khớp định dạng HTML.');
          }
        } else if (isSpreadsheet) {
          // Parse XLSX / XLS via SheetJS library
          const workbook = XLSX.read(arrayBuffer, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const htmlTable = XLSX.utils.sheet_to_html(worksheet);
          setDocContentHtml(htmlTable);
        }
      } catch (err: any) {
        console.warn('Document content parsing notice:', err.message);
        setDocRenderError(err.message || 'Lỗi phân tích nội dung tài liệu.');
      } finally {
        setRenderingDoc(false);
      }
    }

    parseDocumentContent();
  }, [fileUrl, file, isDoc, isSpreadsheet]);

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
              ) : isSpreadsheet ? (
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

          {/* Middle: Zoom & View Controls for Images/PDFs */}
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
              className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors shadow-xs min-h-[44px]"
            >
              <Download className="w-4 h-4" />
              <span>Tải file gốc</span>
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
          {loading || renderingDoc ? (
            <div className="flex flex-col items-center space-y-3 text-slate-400 text-xs">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <span>{renderingDoc ? 'Đang trích xuất nội dung văn bản...' : 'Đang xác thực Supabase Private Storage...'}</span>
            </div>
          ) : hasStorageError ? (
            /* Clean Professional Error Banner */
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
          ) : isDoc && docContentHtml ? (
            /* Native Rich HTML Paper View for Word (.docx) Documents */
            <div className="w-full h-full overflow-auto bg-slate-950 p-2 sm:p-6 flex justify-center">
              <div
                style={{
                  transform: `scale(${zoomLevel / 100})`,
                  transformOrigin: 'top center',
                  transition: 'transform 0.2s ease-in-out',
                }}
                className="w-full max-w-4xl bg-white text-slate-900 shadow-2xl rounded-sm p-6 sm:p-12 min-h-[85vh] border border-slate-300 font-serif leading-relaxed text-sm select-text my-auto"
              >
                {/* Header Banner */}
                <div className="border-b border-slate-200 pb-3 mb-6 flex items-center justify-between font-sans text-xs text-slate-500">
                  <span className="font-bold text-slate-700 flex items-center space-x-1.5">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>NỘI DUNG VĂN BẢN (DOCX NATIVE PREVIEW)</span>
                  </span>
                  <span>{file.name}</span>
                </div>

                {/* Rendered DOCX HTML */}
                <div
                  className="prose max-w-none text-slate-900 prose-headings:font-sans prose-headings:font-bold prose-h1:text-xl prose-h1:text-slate-900 prose-h2:text-lg prose-h2:text-slate-800 prose-p:my-2 prose-p:leading-relaxed [&_table]:w-full [&_table]:border-collapse [&_table]:my-4 [&_td]:border [&_td]:border-slate-300 [&_td]:p-2 [&_td]:text-xs [&_th]:border [&_th]:border-slate-300 [&_th]:p-2 [&_th]:bg-slate-100 [&_th]:font-bold [&_th]:text-xs [&_img]:max-w-full [&_img]:mx-auto"
                  dangerouslySetInnerHTML={{ __html: docContentHtml }}
                />
              </div>
            </div>
          ) : isSpreadsheet && docContentHtml ? (
            /* Native Spreadsheet Table View for Excel (.xlsx) Files */
            <div className="w-full h-full overflow-auto bg-slate-950 p-2 sm:p-6 flex justify-center">
              <div
                style={{
                  transform: `scale(${zoomLevel / 100})`,
                  transformOrigin: 'top center',
                  transition: 'transform 0.2s ease-in-out',
                }}
                className="w-full max-w-6xl bg-white text-slate-900 shadow-2xl rounded-lg p-4 overflow-auto border border-slate-300 font-sans text-xs select-text my-auto"
              >
                <div className="border-b border-slate-200 pb-2 mb-3 flex items-center justify-between font-sans text-xs text-slate-500">
                  <span className="font-bold text-emerald-700 flex items-center space-x-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>NỘI DUNG BẢNG TÍNH EXCEL (XLSX PREVIEW)</span>
                  </span>
                  <span>{file.name}</span>
                </div>

                <div
                  className="overflow-auto max-h-[75vh] [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-slate-300 [&_td]:p-2 [&_td]:whitespace-nowrap [&_th]:border [&_th]:border-slate-300 [&_th]:p-2 [&_th]:bg-slate-100 [&_th]:font-bold [&_th]:whitespace-nowrap"
                  dangerouslySetInnerHTML={{ __html: docContentHtml }}
                />
              </div>
            </div>
          ) : (
            /* Fallback Document Preview Card if content parsing is not applicable */
            <div className="text-center p-8 bg-slate-900/90 rounded-2xl border border-slate-800 max-w-md text-slate-200 text-xs space-y-4 shadow-2xl my-auto animate-fade-in">
              <div className="p-4 bg-blue-500/10 rounded-2xl w-16 h-16 mx-auto flex items-center justify-center text-blue-400 border border-blue-500/20">
                {isSpreadsheet ? <FileSpreadsheet className="w-8 h-8 text-emerald-400" /> : <FileText className="w-8 h-8 text-blue-400" />}
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-base text-white">{file.name}</h4>
                <p className="text-slate-400 text-xs font-mono">
                  Dung lượng: {formatFileSize(file.file_size)} • {file.service_type || 'CFO'} • Năm {file.fiscal_year || 2025}
                </p>
              </div>

              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-left text-[11px] space-y-1.5 text-slate-400">
                <p className="font-semibold text-slate-300">📄 Chi tiết tài liệu bảo mật:</p>
                <p>• Phiên bản: <strong className="text-blue-400">v{file.current_version || 1}</strong></p>
                <p>• Thẻ tag: <strong className="text-slate-300">{file.tags?.join(', ') || 'Hợp đồng'}</strong></p>
                <p>• Trạng thái: <strong className="text-emerald-400">{file.status || 'Approved'}</strong></p>
                {docRenderError && <p className="text-amber-400 font-mono pt-1">• Lưu ý: {docRenderError}</p>}
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
