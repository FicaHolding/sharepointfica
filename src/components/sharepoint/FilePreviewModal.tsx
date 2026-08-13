'use client';

import React, { useState } from 'react';
import {
  X,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Printer,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  ExternalLink,
  ShieldCheck,
  Tag,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { DocumentFile } from '@/types/sharepoint';

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

  if (!isOpen || !file) return null;

  const isPdf = file.name.endsWith('.pdf') || file.mime_type.includes('pdf');
  const isImage = file.mime_type.includes('image') || file.name.match(/\.(jpg|jpeg|png|webp|svg)$/i);
  const isSpreadsheet = file.name.match(/\.(xlsx|xls|csv)$/i) || file.mime_type.includes('spreadsheet') || file.mime_type.includes('excel');
  const isWord = file.name.match(/\.(docx|doc)$/i) || file.mime_type.includes('word');

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
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
                  v{file.current_version}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                {formatFileSize(file.file_size)} • {file.service_type} • Năm {file.fiscal_year}
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
            <button
              onClick={() => onDownload(file)}
              className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Tải xuống</span>
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
        <div className="flex-1 bg-slate-950 p-6 overflow-auto flex items-center justify-center relative">
          {/* PDF Viewer Mock Canvas */}
          {isPdf && (
            <div
              style={{
                transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                transition: 'transform 0.2s ease-in-out',
              }}
              className="w-full max-w-2xl bg-white text-slate-900 rounded-xl shadow-2xl p-8 min-h-[500px] border border-slate-700"
            >
              <div className="border-b-2 border-slate-900 pb-4 mb-6 flex items-center justify-between">
                <div>
                  <div className="text-xl font-bold tracking-wider text-slate-900">FICA HOLDING JSC</div>
                  <p className="text-xs text-slate-500 uppercase tracking-widest font-mono">BÁO CÁO TÀI CHÍNH VÀ KIỂM TOÁN CHÍNH THỨC</p>
                </div>
                <div className="text-right">
                  <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded font-mono">
                    ĐÃ DUYỆT (APPROVED)
                  </span>
                </div>
              </div>

              <div className="space-y-4 text-xs leading-relaxed text-slate-700 font-sans">
                <p className="font-semibold text-slate-900 text-sm">Tài liệu: {file.name}</p>
                <p>
                  Báo cáo này được lập cho <strong>Tập đoàn khách hàng đối tác của Fica Holding</strong> nhằm phục vụ công tác kiểm soát tài chính nội bộ, thẩm định dự án và tuân thủ các quy định pháp luật hiện hành.
                </p>

                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 my-4 font-mono text-[11px] space-y-1">
                  <div className="flex justify-between border-b border-slate-200 pb-1">
                    <span>Mã tài chính Fica:</span>
                    <span className="font-bold">FH-AUDIT-2025-001</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-1">
                    <span>Loại dịch vụ:</span>
                    <span className="font-bold">{file.service_type}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-1">
                    <span>Năm tài chính:</span>
                    <span className="font-bold">{file.fiscal_year}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Chữ ký số xác nhận:</span>
                    <span className="text-emerald-700 font-bold">SHA256-VERIFIED-VALID</span>
                  </div>
                </div>

                <p className="text-slate-500 italic">
                  * Ghi chú: Tài liệu chỉ có giá trị khi được phê duyệt và phát hành chính thức bởi Ban Giám Đốc Fica Holding.
                </p>
              </div>
            </div>
          )}

          {/* Excel Spreadsheet Interactive Sheet Preview */}
          {isSpreadsheet && (
            <div className="w-full max-w-3xl bg-white text-slate-900 rounded-xl shadow-2xl overflow-hidden border border-slate-700">
              <div className="bg-emerald-800 text-white px-4 py-2 text-xs font-bold flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
                  <span>Microsoft Excel Online Preview - {file.name}</span>
                </div>
                <span className="font-mono text-[10px] bg-emerald-900 px-2 py-0.5 rounded">Sheets: 3</span>
              </div>

              <div className="p-4 overflow-x-auto">
                <table className="w-full border-collapse text-xs font-mono">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-300">
                      <th className="p-2 border border-slate-300 w-12 text-center bg-slate-200">#</th>
                      <th className="p-2 border border-slate-300 text-left">Hạng mục Doanh thu / Chi phí</th>
                      <th className="p-2 border border-slate-300 text-right">Q1 2025 (VNĐ)</th>
                      <th className="p-2 border border-slate-300 text-right">Q2 2025 (VNĐ)</th>
                      <th className="p-2 border border-slate-300 text-right">Tăng trưởng</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2 border border-slate-200 text-center font-bold bg-slate-100">1</td>
                      <td className="p-2 border border-slate-200 font-semibold">Doanh thu tư vấn tài chính CFO</td>
                      <td className="p-2 border border-slate-200 text-right">14,500,000,000</td>
                      <td className="p-2 border border-slate-200 text-right">18,200,000,000</td>
                      <td className="p-2 border border-slate-200 text-right text-emerald-600 font-bold">+25.5%</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2 border border-slate-200 text-center font-bold bg-slate-100">2</td>
                      <td className="p-2 border border-slate-200 font-semibold">Chi phí kiểm toán độc lập</td>
                      <td className="p-2 border border-slate-200 text-right">2,100,000,000</td>
                      <td className="p-2 border border-slate-200 text-right">1,950,000,000</td>
                      <td className="p-2 border border-slate-200 text-right text-blue-600 font-bold">-7.1%</td>
                    </tr>
                    <tr className="bg-emerald-50 font-bold">
                      <td className="p-2 border border-slate-300 text-center bg-emerald-100">SUM</td>
                      <td className="p-2 border border-slate-300">LỢI NHUẬN RÒNG TẠM TÍNH</td>
                      <td className="p-2 border border-slate-300 text-right text-emerald-800">12,400,000,000</td>
                      <td className="p-2 border border-slate-300 text-right text-emerald-800">16,250,000,000</td>
                      <td className="p-2 border border-slate-300 text-right text-emerald-800">+31.0%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Image preview */}
          {isImage && (
            <div
              style={{
                transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                transition: 'transform 0.2s ease-in-out',
              }}
              className="max-w-full max-h-full flex items-center justify-center"
            >
              <div className="p-2 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl">
                <div className="w-96 h-64 bg-gradient-to-br from-blue-900 to-indigo-950 rounded-lg flex items-center justify-center text-slate-300 font-mono text-sm border border-slate-700">
                  <div className="text-center p-4">
                    <ImageIcon className="w-12 h-12 mx-auto text-blue-400 mb-2" />
                    <p className="font-bold text-white">{file.name}</p>
                    <p className="text-xs text-slate-400 mt-1">Hình ảnh scan bản vẽ / Hợp đồng đã đóng dấu</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Word / Fallback Office Online */}
          {!isPdf && !isSpreadsheet && !isImage && (
            <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl max-w-md text-slate-300">
              <FileText className="w-12 h-12 mx-auto text-blue-400 mb-3" />
              <h4 className="font-bold text-slate-100 text-base">{file.name}</h4>
              <p className="text-xs text-slate-400 mt-1 mb-4">
                Đang nhúng qua Office Online Viewer hoặc tải file để mở ứng dụng gốc.
              </p>
              <button
                onClick={() => onDownload(file)}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors inline-flex items-center space-x-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Mở / Tải file về máy</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="h-10 px-5 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="flex items-center space-x-1 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Phân quyền RLS Read-Only Active</span>
            </span>
          </div>
          <div className="font-mono text-slate-500">Press ESC or click X to close</div>
        </div>
      </div>
    </div>
  );
};
