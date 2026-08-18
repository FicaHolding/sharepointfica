'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  Film,
  Music,
  ExternalLink,
  Loader2,
  AlertTriangle,
  Laptop,
  Edit3,
  Save,
  CheckCircle2,
} from 'lucide-react';
import JSZip from 'jszip';
import { renderAsync } from 'docx-preview';
import { DocumentFile } from '@/types/sharepoint';
import { sharepointService } from '@/services/sharepointService';

interface FilePreviewModalProps {
  file: DocumentFile | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload: (file: DocumentFile) => void;
  onSuccess?: () => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  file,
  isOpen,
  onClose,
  onDownload,
  onSuccess,
}) => {
  const [zoomLevel, setZoomLevel] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [viewEngine, setViewEngine] = useState<'native'>('native');
  const [loading, setLoading] = useState(true);
  const [hasStorageError, setHasStorageError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [httpCloudUrl, setHttpCloudUrl] = useState<string | null>(null);

  // Native Content Render States (.docx, .xlsx)
  const [renderingDoc, setRenderingDoc] = useState(false);
  const [fallbackHtml, setFallbackHtml] = useState<string | null>(null);
  const [excelHtml, setExcelHtml] = useState<string | null>(null);
  const [renderSuccess, setRenderSuccess] = useState(false);
  const docContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadPreviewUrl() {
      if (!file || !isOpen) return;

      setLoading(true);
      setHasStorageError(false);
      setErrorMessage(null);
      setFallbackHtml(null);
      setExcelHtml(null);
      setRenderSuccess(false);
      setFileUrl(null);
      setHttpCloudUrl(null);
      setViewEngine('native');

      if (!file.storage_path) {
        setLoading(false);
        return;
      }

      try {
        await sharepointService.ensureBucketExists();

        // Retrieve Signed URL / Local Blob / Data URL
        const res = await sharepointService.getFilePreviewOrDownloadUrl(file.storage_path);
        const targetUrl = res.url || res.httpSignedUrl;

        if (res.httpSignedUrl && res.httpSignedUrl.startsWith('http')) {
          setHttpCloudUrl(res.httpSignedUrl);
        }

        if (targetUrl) {
          // 1. Data URLs & Blob URLs are 100% verified local/cached content
          if (targetUrl.startsWith('data:') || targetUrl.startsWith('blob:')) {
            setFileUrl(targetUrl);
            setLoading(false);
            return;
          }

          // 2. HTTP URLs: Fetch and verify blob before assigning to iframe to prevent raw 404 JSON rendering
          if (targetUrl.startsWith('http')) {
            try {
              const testRes = await fetch(targetUrl);
              if (!testRes.ok || testRes.status === 404) {
                setHasStorageError(true);
                setErrorMessage('File vật lý chưa được lưu trên Supabase Storage Cloud (hoặc Bucket documents chưa được chạy SQL Script).');
                setLoading(false);
                return;
              }

              const contentType = testRes.headers.get('content-type') || '';
              if (contentType.includes('application/json')) {
                const text = await testRes.clone().text();
                if (text.includes('NoSuchBucket') || text.includes('Bucket not found') || text.includes('404')) {
                  setHasStorageError(true);
                  setErrorMessage('Bucket Storage "documents" chưa được khởi tạo trên Supabase Cloud.');
                  setLoading(false);
                  return;
                }
              }

              // For PDFs: Convert response to a clean Blob object URL for 100% fail-safe iframe/object rendering
              if (isPdf) {
                const pdfBlob = await testRes.blob();
                if (pdfBlob && pdfBlob.size > 0 && !pdfBlob.type.includes('json')) {
                  const cleanPdfBlobUrl = URL.createObjectURL(pdfBlob);
                  setFileUrl(cleanPdfBlobUrl);
                  setLoading(false);
                  return;
                }
              }

              setFileUrl(targetUrl);
            } catch {
              // Fallback for CORS
              setFileUrl(targetUrl);
            }
          } else {
            setFileUrl(targetUrl);
          }
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

  const isPdf = Boolean(file?.name.toLowerCase().endsWith('.pdf') || (file?.mime_type && file.mime_type.includes('pdf')));
  const isImage = Boolean((file?.mime_type && file.mime_type.includes('image')) || file?.name.match(/\.(jpg|jpeg|png|webp|svg|gif)$/i));
  const isDoc = Boolean(file?.name.match(/\.(docx|doc|txt)$/i));
  const isSpreadsheet = Boolean(file?.name.match(/\.(xlsx|xls|csv)$/i) || (file?.mime_type && (file.mime_type.includes('spreadsheet') || file.mime_type.includes('excel'))));
  const isVideo = Boolean(file?.name.match(/\.(mp4|webm|mov|m4v|mkv)$/i) || (file?.mime_type && file.mime_type.includes('video')));
  const isAudio = Boolean(file?.name.match(/\.(mp3|wav|m4a|ogg)$/i) || (file?.mime_type && file.mime_type.includes('audio')));

  const activeHttpUrl = (httpCloudUrl && httpCloudUrl.startsWith('http')) ? httpCloudUrl : (fileUrl && fileUrl.startsWith('http') ? fileUrl : null);
  const officeViewerUrl = activeHttpUrl ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(activeHttpUrl)}` : null;
  const googleViewerUrl = activeHttpUrl ? `https://docs.google.com/viewer?url=${encodeURIComponent(activeHttpUrl)}&embedded=true` : null;

  // Native DOCX & XLSX Render Engine
  useEffect(() => {
    async function renderDocumentContent() {
      if (!isOpen || !fileUrl) return;

      if (isDoc) {
        setRenderingDoc(true);
        setRenderSuccess(false);
        setFallbackHtml(null);

        try {
          const response = await fetch(fileUrl);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: Không thể nạp file`);
          }
          const arrayBuffer = await response.arrayBuffer();

          // 1. Try docx-preview into DOM Container
          if (docContainerRef.current) {
            docContainerRef.current.innerHTML = '';
            try {
              await renderAsync(arrayBuffer, docContainerRef.current, undefined, {
                className: 'docx-rendered-page',
                inWrapper: false,
                ignoreWidth: true,
                ignoreHeight: true,
                experimental: true,
              });
              setRenderSuccess(true);
              setRenderingDoc(false);
              return;
            } catch (renderErr) {
              console.warn('docx-preview notice, switching to JSZip XML parser:', renderErr);
            }
          }

          // 2. Fallback XML Parser via JSZip + DOMParser
          const zip = await JSZip.loadAsync(arrayBuffer);
          const docXmlFile = zip.file('word/document.xml');
          if (docXmlFile) {
            const xmlText = await docXmlFile.async('text');
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, 'application/xml');

            let html = '';
            const paragraphs = xmlDoc.getElementsByTagName('w:p');
            for (let i = 0; i < paragraphs.length; i++) {
              const p = paragraphs[i];
              let pText = '';
              const textNodes = p.getElementsByTagName('w:t');
              for (let j = 0; j < textNodes.length; j++) {
                pText += textNodes[j].textContent || '';
              }
              const cleanP = pText.trim();
              if (cleanP.length > 0) {
                // Check alignment from w:jc tag
                const jcElem = p.getElementsByTagName('w:jc')[0];
                const alignVal = jcElem ? jcElem.getAttribute('w:val') : '';
                const alignStyle = alignVal === 'center'
                  ? 'text-align: center;'
                  : alignVal === 'right'
                  ? 'text-align: right;'
                  : alignVal === 'both'
                  ? 'text-align: justify;'
                  : 'text-align: left;';

                const isBold = p.getElementsByTagName('w:b').length > 0;

                // Special formatting for National Motto & Headers to prevent merged text bug
                if (cleanP.includes('VIỆT NAM') && (cleanP.includes('ĐỘC LẬP') || cleanP.includes('Độc lập'))) {
                  html += `<div style="text-align: center; font-weight: bold; font-size: 15px; margin: 6px 0 2px 0; font-family: serif; text-transform: uppercase; color: #0f172a;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>`;
                  html += `<div style="text-align: center; font-weight: bold; font-size: 13px; margin: 2px 0 4px 0; font-family: serif; color: #0f172a;">Độc lập - Tự do - Hạnh phúc</div>`;
                  html += `<div style="text-align: center; font-size: 12px; margin: 4px 0 12px 0; font-family: serif; color: #64748b;">----------o0o----------</div>`;
                } else if (cleanP.includes('CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM')) {
                  html += `<div style="text-align: center; font-weight: bold; font-size: 15px; margin: 6px 0; font-family: serif; text-transform: uppercase; color: #0f172a;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>`;
                } else if (cleanP.includes('Độc lập') || cleanP.includes('ĐỘC LẬP')) {
                  html += `<div style="text-align: center; font-weight: bold; font-size: 13px; margin: 4px 0; font-family: serif; color: #0f172a;">Độc lập - Tự do - Hạnh phúc</div>`;
                } else if (cleanP.includes('o0o') || cleanP.includes('000') || cleanP.includes('---')) {
                  html += `<div style="text-align: center; font-size: 12px; margin: 4px 0 12px 0; font-family: serif; color: #64748b;">----------o0o----------</div>`;
                } else if (cleanP.startsWith('HỢP ĐỒNG') || cleanP.startsWith('CĂN CỨ') || (isBold && cleanP.length < 120)) {
                  html += `<h3 style="${alignStyle || 'text-align: center;'} font-weight: bold; font-size: 16px; margin: 14px 0 8px 0; font-family: serif; color: #0284c7;">${cleanP}</h3>`;
                } else {
                  html += `<p style="${alignStyle} margin: 8px 0; line-height: 1.6; font-size: 14px; font-family: serif; color: #1e293b;">${cleanP}</p>`;
                }
              }
            }

            // Tables
            const tables = xmlDoc.getElementsByTagName('w:tbl');
            for (let t = 0; t < tables.length; t++) {
              const tbl = tables[t];
              html += '<table style="width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1; margin: 16px 0; font-size: 13px; font-family: sans-serif;">';
              const rows = tbl.getElementsByTagName('w:tr');
              for (let r = 0; r < rows.length; r++) {
                html += '<tr>';
                const cells = rows[r].getElementsByTagName('w:tc');
                for (let c = 0; c < cells.length; c++) {
                  const cellText = cells[c].textContent || '';
                  html += `<td style="border: 1px solid #cbd5e1; padding: 8px; vertical-align: top;">${cellText}</td>`;
                }
                html += '</tr>';
              }
              html += '</table>';
            }

            if (html.length > 0) {
              setFallbackHtml(html);
              setRenderSuccess(true);
            }
          }
        } catch (err: any) {
          console.warn('DOCX native parse exception:', err.message);
        } finally {
          setRenderingDoc(false);
        }
      } else if (isSpreadsheet) {
        setRenderingDoc(true);
        setExcelHtml(null);
        try {
          const response = await fetch(fileUrl);
          const arrayBuffer = await response.arrayBuffer();
          const XLSX = await import('xlsx');
          const workbook = XLSX.read(arrayBuffer, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const html = XLSX.utils.sheet_to_html(worksheet);
          setExcelHtml(html);
        } catch (err: any) {
          console.warn('Excel render exception:', err.message);
        } finally {
          setRenderingDoc(false);
        }
      }
    }

    renderDocumentContent();
  }, [isOpen, fileUrl, isDoc, isSpreadsheet]);

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

  // Open File with Native Desktop App on Windows PC (MS Word / MS Excel / Default App)
  const handleOpenNativeDesktopApp = async () => {
    if (!file) return;

    // Trigger clean file blob stream so Windows opens it cleanly with default installed desktop application
    if (file.storage_path) {
      const success = await sharepointService.downloadFileBlob(file.storage_path, file.name);
      if (success) {
        onDownload(file);
        return;
      }
    }

    if (fileUrl) {
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = file.name;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      onDownload(file);
    }
  };

  if (!isOpen || !file) return null;

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
              ) : isDoc ? (
                <FileText className="w-5 h-5 text-blue-400" />
              ) : isSpreadsheet ? (
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
              ) : isVideo ? (
                <Film className="w-5 h-5 text-amber-400" />
              ) : isAudio ? (
                <Music className="w-5 h-5 text-pink-400" />
              ) : (
                <ImageIcon className="w-5 h-5 text-purple-400" />
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

          {/* Middle: Zoom & Rotation Controls */}
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

          {/* Right: Native App Launcher & Download & Close */}
          <div className="flex items-center space-x-2 shrink-0">
            {/* Native Desktop Software Launcher Button */}
            {(isDoc || isSpreadsheet) && (
              <button
                onClick={handleOpenNativeDesktopApp}
                className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors shadow-xs min-h-[44px]"
                title="Mở file trực tiếp bằng phần mềm Microsoft Word/Excel trên máy tính"
              >
                <Laptop className="w-4 h-4" />
                <span className="hidden sm:inline">Mở bằng phần mềm PC (Word/Excel)</span>
              </button>
            )}

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
              <span>{renderingDoc ? 'Đang trích xuất nội dung văn bản...' : 'Đang nạp dữ liệu file...'}</span>
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
            /* Native PDF Viewer with Object Fallback */
            <object
              data={fileUrl.startsWith('blob:') || fileUrl.startsWith('data:') ? fileUrl : `${fileUrl}#toolbar=1&navpanes=1`}
              type="application/pdf"
              className="w-full h-full rounded-xl border border-slate-800 bg-white shadow-2xl"
            >
              <iframe
                src={fileUrl.startsWith('blob:') || fileUrl.startsWith('data:') ? fileUrl : `${fileUrl}#toolbar=1&navpanes=1`}
                className="w-full h-full rounded-xl border border-slate-800 bg-white shadow-2xl"
                title={file.name}
              />
            </object>
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
          ) : isVideo && fileUrl ? (
            /* Native Video Player (.mp4, .webm, .mov) */
            <div className="w-full h-full flex items-center justify-center p-2">
              <video
                controls
                autoPlay
                src={fileUrl}
                className="max-h-[78vh] max-w-full rounded-xl shadow-2xl border border-slate-800 bg-black"
              >
                Trình duyệt không hỗ trợ phát Video này.
              </video>
            </div>
          ) : isAudio && fileUrl ? (
            /* Native Audio Player (.mp3, .wav, .m4a) */
            <div className="text-center p-8 bg-slate-900 rounded-2xl border border-slate-800 max-w-md w-full text-slate-200 text-xs space-y-6 shadow-2xl my-auto animate-fade-in">
              <div className="p-5 bg-pink-500/10 rounded-2xl w-20 h-20 mx-auto flex items-center justify-center text-pink-400 border border-pink-500/20">
                <Music className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-base text-white">{file.name}</h4>
                <p className="text-slate-400 text-xs font-mono">{formatFileSize(file.file_size)} • Audio</p>
              </div>
              <audio controls src={fileUrl} className="w-full rounded-lg" />
            </div>
          ) : isDoc ? (
            /* Native DOCX Rendered A4 Paper Sheet Canvas */
            <div className="w-full h-full overflow-auto bg-slate-950 p-2 sm:p-6 flex flex-col items-center">
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
                    <span>NỘI DUNG TÀI LIỆU WORD (XEM PREVIEW A4)</span>
                  </span>
                  <button
                    onClick={handleOpenNativeDesktopApp}
                    className="text-emerald-700 hover:text-emerald-800 font-bold bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 flex items-center space-x-1"
                  >
                    <Laptop className="w-3.5 h-3.5" />
                    <span>Mở bằng MS Word trên PC →</span>
                  </button>
                </div>

                {/* docx-preview Container */}
                <div ref={docContainerRef} className="docx-container text-slate-900" />

                {/* JSZip XML Fallback HTML Container */}
                {fallbackHtml && (
                  <div
                    className="prose max-w-none text-slate-900 prose-headings:font-sans prose-headings:font-bold prose-p:my-2 outline-none"
                    dangerouslySetInnerHTML={{ __html: fallbackHtml }}
                  />
                )}
              </div>
            </div>
          ) : isSpreadsheet && excelHtml ? (
            /* Native Excel Sheet Table View (.xlsx, .xls, .csv) */
            <div className="w-full h-full overflow-auto bg-slate-950 p-2 sm:p-6 flex flex-col items-center">
              <div
                style={{
                  transform: `scale(${zoomLevel / 100})`,
                  transformOrigin: 'top center',
                  transition: 'transform 0.2s ease-in-out',
                }}
                className="w-full max-w-6xl bg-white text-slate-900 shadow-2xl rounded-lg p-4 overflow-auto border border-slate-300 font-sans text-xs select-text my-auto"
              >
                <div className="border-b border-slate-200 pb-2 mb-3 flex items-center justify-between font-sans text-xs text-slate-500">
                  <span className="font-bold text-slate-700 flex items-center space-x-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>BẢNG TÍNH EXCEL (PREVIEW)</span>
                  </span>
                  <button
                    onClick={handleOpenNativeDesktopApp}
                    className="text-emerald-700 hover:text-emerald-800 font-bold bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 flex items-center space-x-1"
                  >
                    <Laptop className="w-3.5 h-3.5" />
                    <span>Mở bằng MS Excel trên PC →</span>
                  </button>
                </div>

                <div
                  className="overflow-auto max-h-[75vh] [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-slate-300 [&_td]:p-2 [&_td]:whitespace-nowrap [&_th]:border [&_th]:border-slate-300 [&_th]:p-2 [&_th]:bg-slate-100 [&_th]:font-bold [&_th]:whitespace-nowrap"
                  dangerouslySetInnerHTML={{ __html: excelHtml }}
                />
              </div>
            </div>
          ) : (
            /* Fallback Document Card */
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

              <div className="flex items-center justify-center space-x-2 pt-2">
                <button
                  onClick={handleOpenNativeDesktopApp}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all shadow-md text-xs min-h-[44px] flex items-center space-x-2"
                >
                  <Laptop className="w-4 h-4" />
                  <span>Mở bằng Phần mềm Máy tính (PC)</span>
                </button>
                <button
                  onClick={handleRealDownload}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-md text-xs min-h-[44px] flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Tải file gốc</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
