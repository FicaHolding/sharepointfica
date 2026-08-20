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
  Globe,
  Eye,
  RefreshCw,
  Smartphone,
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
  const [httpCloudUrl, setHttpCloudUrl] = useState<string | null>(null);

  // View engine mode: 'office' | 'google' | 'native'
  const [activeEngine, setActiveEngine] = useState<'office' | 'google' | 'native'>('office');
  const [loading, setLoading] = useState(true);
  const [hasStorageError, setHasStorageError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  // Native Content Render States (.docx, .xlsx)
  const [renderingDoc, setRenderingDoc] = useState(false);
  const [fallbackHtml, setFallbackHtml] = useState<string | null>(null);
  const [excelHtml, setExcelHtml] = useState<string | null>(null);
  const docContainerRef = useRef<HTMLDivElement>(null);

  // Mobile User Agent Detection
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mobileCheck = /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
      setIsMobile(mobileCheck);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setFileUrl(null);
      setHttpCloudUrl(null);
      setExcelHtml(null);
      setFallbackHtml(null);
      setIframeLoaded(false);
      setZoomLevel(100);
      setRotation(0);
    }
  }, [isOpen]);

  useEffect(() => {
    async function loadPreviewUrl() {
      if (!file || !isOpen) return;

      setLoading(true);
      setHasStorageError(false);
      setErrorMessage(null);
      setFallbackHtml(null);
      setExcelHtml(null);
      setFileUrl(null);
      setHttpCloudUrl(null);
      setIframeLoaded(false);

      if (!file.storage_path) {
        setLoading(false);
        return;
      }

      try {
        await sharepointService.ensureBucketExists();

        // Retrieve Public URL / Signed URL / Local Blob
        const res = await sharepointService.getFilePreviewOrDownloadUrl(file.storage_path);
        const targetUrl = res.url || res.httpSignedUrl;

        if (res.httpSignedUrl && res.httpSignedUrl.startsWith('http')) {
          setHttpCloudUrl(res.httpSignedUrl);
        }

        if (targetUrl) {
          // 1. Data URLs & Blob URLs (Cached local content)
          if (targetUrl.startsWith('data:') || targetUrl.startsWith('blob:')) {
            setFileUrl(targetUrl);
            setActiveEngine('native');
            setLoading(false);
            return;
          }

          // 2. HTTP URLs (Supabase Storage Public URLs)
          if (targetUrl.startsWith('http')) {
            try {
              const testRes = await fetch(targetUrl, { method: 'HEAD' });
              if (!testRes.ok && testRes.status === 404) {
                setHasStorageError(true);
                setErrorMessage('File vật lý chưa được lưu trên Storage Cloud.');
                setLoading(false);
                return;
              }
            } catch {
              // Ignore CORS head test
            }

            setFileUrl(targetUrl);
            if (!httpCloudUrl) setHttpCloudUrl(targetUrl);

            // Default engine selection: Use 'native' local viewer for Excel & Word to prevent MS Office iframe auto-downloads!
            setActiveEngine('native');
          } else {
            setFileUrl(targetUrl);
            setActiveEngine('native');
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
  const isImage = Boolean((file?.mime_type && file.mime_type.includes('image')) || file?.name.match(/\.(jpg|jpeg|png|webp|svg|gif|bmp)$/i));
  const isDoc = Boolean(file?.name.match(/\.(docx|doc|txt)$/i));
  const isSpreadsheet = Boolean(file?.name.match(/\.(xlsx|xls|csv)$/i) || (file?.mime_type && (file.mime_type.includes('spreadsheet') || file.mime_type.includes('excel'))));
  const isVideo = Boolean(file?.name.match(/\.(mp4|webm|mov|m4v|mkv)$/i) || (file?.mime_type && file.mime_type.includes('video')));
  const isAudio = Boolean(file?.name.match(/\.(mp3|wav|m4a|ogg)$/i) || (file?.mime_type && file.mime_type.includes('audio')));

  const activeHttpUrl = (httpCloudUrl && httpCloudUrl.startsWith('http')) ? httpCloudUrl : (fileUrl && fileUrl.startsWith('http') ? fileUrl : null);
  const officeViewerUrl = activeHttpUrl ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(activeHttpUrl)}` : null;
  const officeDirectUrl = activeHttpUrl ? `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(activeHttpUrl)}` : null;
  const googleViewerUrl = activeHttpUrl ? `https://docs.google.com/viewer?url=${encodeURIComponent(activeHttpUrl)}&embedded=true` : (fileUrl && fileUrl.startsWith('http') ? `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true` : null);

  // Native DOCX & XLSX Render Engine Effect
  useEffect(() => {
    async function renderDocumentContent() {
      if (!isOpen || !fileUrl) return;
      if (activeEngine !== 'native' && activeHttpUrl) return;

      if (isDoc) {
        setRenderingDoc(true);
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

                if (cleanP.includes('VIỆT NAM') && (cleanP.includes('ĐỘC LẬP') || cleanP.includes('Độc lập'))) {
                  html += `<div style="text-align: center; font-weight: bold; font-size: 15px; margin: 6px 0 2px 0; font-family: serif; text-transform: uppercase; color: #0f172a;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>`;
                  html += `<div style="text-align: center; font-weight: bold; font-size: 13px; margin: 2px 0 4px 0; font-family: serif; color: #0f172a;">Độc lập - Tự do - Hạnh phúc</div>`;
                  html += `<div style="text-align: center; font-size: 12px; margin: 4px 0 12px 0; font-family: serif; color: #64748b;">----------o0o----------</div>`;
                } else if (cleanP.includes('CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM')) {
                  html += `<div style="text-align: center; font-weight: bold; font-size: 15px; margin: 6px 0; font-family: serif; text-transform: uppercase; color: #0f172a;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>`;
                } else if (cleanP.includes('Độc lập') || cleanP.includes('ĐỘC LẬP')) {
                  html += `<div style="text-align: center; font-weight: bold; font-size: 13px; margin: 4px 0; font-family: serif; color: #0f172a;">Độc lập - Tự do - Hạnh phúc</div>`;
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
  }, [isOpen, fileUrl, isDoc, isSpreadsheet, activeEngine, activeHttpUrl]);

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

  if (!isOpen || !file) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-0 sm:p-4 select-none animate-fade-in">
      <div className="w-full h-full sm:h-[94vh] sm:max-w-6xl bg-slate-900 rounded-none sm:rounded-2xl shadow-2xl border-0 sm:border border-slate-800 flex flex-col justify-between overflow-hidden">
        {/* Header Toolbar */}
        <div className="h-14 sm:h-16 px-3 sm:px-5 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800 shrink-0 gap-2">
          {/* Left: File Metadata & Icon */}
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            <div className="p-1.5 sm:p-2 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-400/30 shrink-0">
              {isPdf ? (
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
              ) : isDoc ? (
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
              ) : isSpreadsheet ? (
                <FileSpreadsheet className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
              ) : isVideo ? (
                <Film className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
              ) : isAudio ? (
                <Music className="w-4 h-4 sm:w-5 sm:h-5 text-pink-400" />
              ) : (
                <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-xs sm:text-sm text-slate-100 flex items-center space-x-1.5">
                <span className="truncate max-w-[130px] xs:max-w-[180px] sm:max-w-md">{file.name}</span>
                <span className="bg-blue-600 text-white text-[9px] sm:text-[10px] font-mono px-1.5 py-0.2 rounded font-bold shrink-0">
                  v{file.current_version || 1}
                </span>
              </h3>
              <p className="text-[10px] sm:text-[11px] text-slate-400 font-mono truncate">
                {formatFileSize(file.file_size)} • {file.service_type || 'CFO'}
              </p>
            </div>
          </div>

          {/* Engine Selector Tabs for Office/PDF (Desktop View) */}
          {(isDoc || isSpreadsheet || isPdf) && activeHttpUrl && (
            <div className="hidden lg:flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 space-x-1 text-xs">
              <button
                onClick={() => setActiveEngine('office')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors flex items-center space-x-1.5 ${
                  activeEngine === 'office' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>MS Office Online</span>
              </button>
              <button
                onClick={() => setActiveEngine('google')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors flex items-center space-x-1.5 ${
                  activeEngine === 'google' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Google Docs Viewer</span>
              </button>
              <button
                onClick={() => setActiveEngine('native')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors flex items-center space-x-1.5 ${
                  activeEngine === 'native' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Đọc Nhanh (Native)</span>
              </button>
            </div>
          )}

          {/* Right Toolbar Actions */}
          <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
            {/* Open Direct Office Link in New Tab */}
            {(isDoc || isSpreadsheet) && activeHttpUrl && (
              <a
                href={officeDirectUrl || officeViewerUrl || activeHttpUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-xs min-h-[38px]"
                title="Mở xem qua MS Office Online trên tab mới"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Xem Office Online</span>
              </a>
            )}

            {/* External Link (New Tab) */}
            {fileUrl && !hasStorageError && (
              <a
                href={activeHttpUrl || fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors min-w-[38px] min-h-[38px] sm:min-w-[44px] sm:min-h-[44px] flex items-center justify-center cursor-pointer"
                title="Mở trong tab mới"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}

            {/* Download Button */}
            <button
              onClick={handleRealDownload}
              className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg transition-colors shadow-xs cursor-pointer min-h-[38px]"
              title="Tải file về thiết bị"
            >
              <Download className="w-4 h-4" />
              <span className="hidden xs:inline">Tải về</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors min-w-[38px] min-h-[38px] sm:min-w-[44px] sm:min-h-[44px] flex items-center justify-center cursor-pointer"
              title="Đóng cửa sổ"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile View Engine Switcher Bar */}
        {(isDoc || isSpreadsheet || isPdf) && activeHttpUrl && (
          <div className="flex lg:hidden bg-slate-950 px-3 py-2 border-b border-slate-800 items-center justify-around text-[11px] font-medium text-slate-300 gap-1 overflow-x-auto select-none shrink-0">
            <button
              onClick={() => setActiveEngine('office')}
              className={`px-2.5 py-1 rounded-lg flex items-center space-x-1 transition-colors shrink-0 ${
                activeEngine === 'office' ? 'bg-blue-600 text-white font-bold' : 'bg-slate-900 text-slate-400 border border-slate-800'
              }`}
            >
              <Globe className="w-3 h-3" />
              <span>MS Office Online</span>
            </button>

            <button
              onClick={() => setActiveEngine('google')}
              className={`px-2.5 py-1 rounded-lg flex items-center space-x-1 transition-colors shrink-0 ${
                activeEngine === 'google' ? 'bg-blue-600 text-white font-bold' : 'bg-slate-900 text-slate-400 border border-slate-800'
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>Google Viewer</span>
            </button>

            <button
              onClick={() => setActiveEngine('native')}
              className={`px-2.5 py-1 rounded-lg flex items-center space-x-1 transition-colors shrink-0 ${
                activeEngine === 'native' ? 'bg-blue-600 text-white font-bold' : 'bg-slate-900 text-slate-400 border border-slate-800'
              }`}
            >
              <FileText className="w-3 h-3" />
              <span>Đọc Nhanh</span>
            </button>
          </div>
        )}

        {/* Main Content Viewer Canvas */}
        <div
          className={`flex-1 overflow-auto p-1 sm:p-6 flex justify-center relative ${
            isDoc || isSpreadsheet ? 'bg-slate-200/90 text-slate-900' : 'bg-slate-950 text-slate-100'
          }`}
        >
          {loading || renderingDoc ? (
            <div className="flex flex-col items-center space-y-3 text-slate-400 text-xs my-auto">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <span>{renderingDoc ? 'Đang trích xuất nội dung văn bản...' : 'Đang nạp file...'}</span>
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
          ) : (isDoc || isSpreadsheet) && activeEngine === 'office' && officeViewerUrl ? (
            /* 1. MS Office Online Embed Viewer */
            <div className="w-full h-full relative flex flex-col items-center">
              {!iframeLoaded && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-slate-400 text-xs space-y-2 z-10">
                  <Loader2 className="w-7 h-7 animate-spin text-blue-400" />
                  <span>Đang kết nối Microsoft Office Online Viewer...</span>
                </div>
              )}
              <iframe
                src={officeViewerUrl}
                onLoad={() => setIframeLoaded(true)}
                className="w-full h-full border-0 rounded-none sm:rounded-xl bg-white shadow-2xl"
                title={file.name}
              />
            </div>
          ) : (isDoc || isSpreadsheet) && activeEngine === 'google' && googleViewerUrl ? (
            /* 2. Google Docs Embed Viewer */
            <div className="w-full h-full relative flex flex-col items-center">
              {!iframeLoaded && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-slate-400 text-xs space-y-2 z-10">
                  <Loader2 className="w-7 h-7 animate-spin text-blue-400" />
                  <span>Đang nạp Google Docs Viewer...</span>
                </div>
              )}
              <iframe
                src={googleViewerUrl}
                onLoad={() => setIframeLoaded(true)}
                className="w-full h-full border-0 rounded-none sm:rounded-xl bg-white shadow-2xl"
                title={file.name}
              />
            </div>
          ) : isPdf && fileUrl ? (
            /* 3. PDF Viewer Engine */
            <div className="w-full h-full flex flex-col items-center">
              {activeEngine === 'google' && googleViewerUrl ? (
                <iframe
                  src={googleViewerUrl}
                  className="w-full h-full border-0 rounded-none sm:rounded-xl bg-white shadow-2xl"
                  title={file.name}
                />
              ) : (
                <object
                  data={fileUrl.startsWith('blob:') || fileUrl.startsWith('data:') ? fileUrl : `${fileUrl}#toolbar=1&navpanes=1`}
                  type="application/pdf"
                  className="w-full h-full rounded-none sm:rounded-xl border border-slate-800 bg-white shadow-2xl"
                >
                  <iframe
                    src={fileUrl.startsWith('blob:') || fileUrl.startsWith('data:') ? fileUrl : `${fileUrl}#toolbar=1&navpanes=1`}
                    className="w-full h-full rounded-none sm:rounded-xl border border-slate-800 bg-white shadow-2xl"
                    title={file.name}
                  />
                </object>
              )}
            </div>
          ) : isImage && fileUrl ? (
            /* 4. Touch-Friendly Responsive Image Viewer */
            <div className="w-full h-full flex flex-col items-center justify-center relative overflow-auto touch-pan-x touch-pan-y">
              {/* Zoom Floating Bar */}
              <div className="absolute top-3 right-3 z-20 flex items-center space-x-1 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800 shadow-xl backdrop-blur-md">
                <button
                  onClick={() => setZoomLevel((z) => Math.max(40, z - 20))}
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
                  title="Thu nhỏ"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono font-semibold px-2 text-slate-200">{zoomLevel}%</span>
                <button
                  onClick={() => setZoomLevel((z) => Math.min(250, z + 20))}
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
                  title="Phóng to"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <div className="h-4 w-[1px] bg-slate-800 mx-1" />
                <button
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
                  title="Xoay 90 độ"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              </div>

              <div
                style={{
                  transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                  transition: 'transform 0.2s ease-in-out',
                }}
                className="max-w-full max-h-full flex items-center justify-center my-auto p-2"
              >
                <img
                  src={fileUrl}
                  alt={file.name}
                  className="max-h-[80vh] max-w-full object-contain rounded-xl shadow-2xl border border-slate-800"
                />
              </div>
            </div>
          ) : isVideo && fileUrl ? (
            /* 5. Video Player */
            <div className="w-full h-full flex items-center justify-center p-2 my-auto">
              <video
                controls
                autoPlay
                src={fileUrl}
                className="max-h-[80vh] max-w-full rounded-xl shadow-2xl border border-slate-800 bg-black"
              >
                Trình duyệt không hỗ trợ phát Video này.
              </video>
            </div>
          ) : isAudio && fileUrl ? (
            /* 6. Audio Player */
            <div className="text-center p-6 sm:p-8 bg-slate-900 rounded-2xl border border-slate-800 max-w-md w-full text-slate-200 text-xs space-y-6 shadow-2xl my-auto animate-fade-in">
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
            /* 7. Native DOCX Rendered Sheet Canvas */
            <div className="w-full flex justify-center py-2 sm:py-4 overflow-auto">
              <div
                style={{
                  transform: `scale(${zoomLevel / 100})`,
                  transformOrigin: 'top center',
                  transition: 'transform 0.2s ease-in-out',
                }}
                className="w-full max-w-4xl bg-white text-slate-900 shadow-2xl rounded-none sm:rounded-md p-4 sm:p-14 border border-slate-300 font-serif leading-relaxed text-xs sm:text-sm select-text min-h-[75vh]"
              >
                <div className="border-b border-slate-200 pb-3 mb-6 flex items-center justify-between font-sans text-xs text-slate-500">
                  <span className="font-bold text-slate-700 flex items-center space-x-1.5">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>NỘI DUNG TÀI LIỆU WORD (XEM PREVIEW A4)</span>
                  </span>
                  {activeHttpUrl && (
                    <a
                      href={officeDirectUrl || officeViewerUrl || activeHttpUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-700 hover:text-emerald-800 font-bold bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 flex items-center space-x-1"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Mở xem MS Office Online →</span>
                    </a>
                  )}
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
            /* 8. Native Excel Table Sheet View */
            <div className="w-full flex justify-center py-2 sm:py-4 overflow-auto">
              <div
                style={{
                  transform: `scale(${zoomLevel / 100})`,
                  transformOrigin: 'top center',
                  transition: 'transform 0.2s ease-in-out',
                }}
                className="w-full max-w-6xl bg-white text-slate-900 shadow-2xl rounded-none sm:rounded-lg p-3 sm:p-5 overflow-auto border border-slate-300 font-sans text-xs select-text"
              >
                <div className="border-b border-slate-200 pb-2 mb-3 flex items-center justify-between font-sans text-xs text-slate-500">
                  <span className="font-bold text-slate-700 flex items-center space-x-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>BẢNG TÍNH EXCEL (PREVIEW)</span>
                  </span>
                  {activeHttpUrl && (
                    <a
                      href={officeDirectUrl || officeViewerUrl || activeHttpUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-700 hover:text-emerald-800 font-bold bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 flex items-center space-x-1"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Mở xem MS Office Online →</span>
                    </a>
                  )}
                </div>

                <div
                  className="overflow-auto max-h-[75vh] [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-slate-300 [&_td]:p-2 [&_td]:whitespace-nowrap [&_th]:border [&_th]:border-slate-300 [&_th]:p-2 [&_th]:bg-slate-100 [&_th]:font-bold [&_th]:whitespace-nowrap"
                  dangerouslySetInnerHTML={{ __html: excelHtml }}
                />
              </div>
            </div>
          ) : (
            /* 9. Fallback Document Card */
            <div className="text-center p-6 sm:p-8 bg-slate-900/90 rounded-2xl border border-slate-800 max-w-md text-slate-200 text-xs space-y-4 shadow-2xl my-auto animate-fade-in">
              <div className="p-4 bg-blue-500/10 rounded-2xl w-16 h-16 mx-auto flex items-center justify-center text-blue-400 border border-blue-500/20">
                <FileText className="w-8 h-8 text-blue-400" />
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-base text-white">{file.name}</h4>
                <p className="text-slate-400 text-xs font-mono">
                  Dung lượng: {formatFileSize(file.file_size)} • {file.service_type || 'CFO'}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                {activeHttpUrl && (
                  <a
                    href={officeDirectUrl || googleViewerUrl || activeHttpUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all shadow-md text-xs min-h-[44px] flex items-center justify-center space-x-2"
                  >
                    <Globe className="w-4 h-4" />
                    <span>Mở xem Office Online</span>
                  </a>
                )}
                <button
                  onClick={handleRealDownload}
                  className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-md text-xs min-h-[44px] flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Tải file về máy</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Bottom Quick Action Toolbar */}
        <div className="flex sm:hidden bg-slate-950 p-2.5 border-t border-slate-800 items-center justify-between gap-2 shrink-0">
          {activeHttpUrl && (isDoc || isSpreadsheet) ? (
            <a
              href={officeDirectUrl || officeViewerUrl || activeHttpUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 px-3 rounded-xl flex items-center justify-center space-x-1.5 shadow-md min-h-[40px]"
            >
              <Globe className="w-4 h-4" />
              <span>Xem MS Office Online</span>
            </a>
          ) : (
            <a
              href={activeHttpUrl || fileUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold py-2.5 px-3 rounded-xl flex items-center justify-center space-x-1.5 border border-slate-700 min-h-[40px]"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Mở Tab Mới</span>
            </a>
          )}

          <button
            onClick={handleRealDownload}
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2.5 px-3 rounded-xl flex items-center justify-center space-x-1.5 shadow-md min-h-[40px] cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Tải Xuống</span>
          </button>
        </div>
      </div>
    </div>
  );
};

