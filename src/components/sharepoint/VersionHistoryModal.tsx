'use client';

import React from 'react';
import { X, History, Download, Clock, User, CheckCircle, FileText, ArrowLeftRight } from 'lucide-react';
import { DocumentFile, FileVersion } from '@/types/sharepoint';

interface VersionHistoryModalProps {
  file: DocumentFile | null;
  isOpen: boolean;
  onClose: () => void;
  onDownloadVersion: (version: FileVersion) => void;
  onRestoreVersion: (version: FileVersion) => void;
  isReadOnly: boolean;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
  file,
  isOpen,
  onClose,
  onDownloadVersion,
  onRestoreVersion,
  isReadOnly,
}) => {
  if (!isOpen || !file) return null;

  // Mock list of versions for demonstration
  const mockVersions: FileVersion[] = [
    {
      id: `v-cur-${file.id}`,
      file_id: file.id,
      version_number: file.current_version,
      file_name: file.name,
      storage_path: file.storage_path,
      file_size: file.file_size,
      mime_type: file.mime_type,
      change_summary: 'Cập nhật số liệu kiểm toán tài chính mới nhất & bổ sung chữ ký số',
      created_at: file.updated_at,
      created_by: file.created_by,
      created_by_name: file.modified_by_name || file.created_by_name,
    },
    {
      id: `v-prev-${file.id}`,
      file_id: file.id,
      version_number: Math.max(1, file.current_version - 1),
      file_name: file.name.replace(/(\.[\w]+)$/, '_v1$1'),
      storage_path: `${file.storage_path}_v1`,
      file_size: Math.round(file.file_size * 0.9),
      mime_type: file.mime_type,
      change_summary: 'Dự thảo ban đầu từ phòng Tư vấn CFO Fica Holding',
      created_at: file.created_at,
      created_by: file.created_by,
      created_by_name: file.created_by_name,
    },
  ];

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex justify-end z-50 animate-fade-in select-none">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between border-l border-slate-200">
        {/* Header */}
        <div className="p-4 bg-[#0F172A] text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-400/30">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100">Lịch sử Phiên bản Tài liệu</h3>
              <p className="text-[11px] text-slate-400 font-mono truncate max-w-[280px]">{file.name}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Document Summary */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-500">Phiên bản hiện tại: </span>
            <span className="font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded font-mono border border-blue-300 ml-1">
              v{file.current_version}
            </span>
          </div>

          <div>
            <span className="text-slate-500">Dung lượng: </span>
            <span className="font-mono font-semibold text-slate-800">{formatFileSize(file.file_size)}</span>
          </div>
        </div>

        {/* Version List */}
        <div className="p-4 flex-1 overflow-y-auto space-y-4">
          {mockVersions.map((v, idx) => (
            <div
              key={v.id}
              className={`p-4 rounded-xl border transition-all ${
                idx === 0
                  ? 'bg-blue-50/40 border-blue-300 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <span
                    className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                      idx === 0 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    v{v.version_number}
                  </span>
                  {idx === 0 && (
                    <span className="flex items-center text-[10px] text-emerald-700 bg-emerald-100 font-medium px-1.5 py-0.5 rounded border border-emerald-300">
                      <CheckCircle className="w-3 h-3 mr-0.5 text-emerald-600" />
                      Bản mới nhất
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => onDownloadVersion(v)}
                    className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors text-xs flex items-center space-x-1"
                    title="Tải phiên bản này"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="text-[11px]">Tải về</span>
                  </button>

                  {idx !== 0 && !isReadOnly && (
                    <button
                      onClick={() => onRestoreVersion(v)}
                      className="p-1.5 text-purple-600 hover:bg-purple-100 rounded transition-colors text-xs flex items-center space-x-1"
                      title="Khôi phục lại phiên bản này làm bản chính"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5" />
                      <span className="text-[11px]">Khôi phục</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Version info */}
              <div className="mt-2 space-y-1 text-xs">
                <div className="flex items-center space-x-2 text-slate-600">
                  <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-mono text-[11px] truncate">{v.file_name}</span>
                </div>

                <div className="flex items-center space-x-4 text-slate-500 text-[11px]">
                  <span className="flex items-center space-x-1">
                    <User className="w-3 h-3 text-slate-400" />
                    <span>{v.created_by_name}</span>
                  </span>

                  <span className="flex items-center space-x-1 font-mono">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{new Date(v.created_at).toLocaleString('vi-VN')}</span>
                  </span>
                </div>

                {v.change_summary && (
                  <div className="mt-2 p-2 bg-slate-100/80 rounded text-[11px] text-slate-700 border border-slate-200">
                    <strong className="text-slate-900">Ghi chú thay đổi: </strong>
                    <span>{v.change_summary}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-center">
          <button
            onClick={onClose}
            className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs py-2 rounded-lg transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
