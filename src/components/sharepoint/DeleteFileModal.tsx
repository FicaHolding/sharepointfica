'use client';

import React, { useState } from 'react';
import { X, Trash2, Archive, ShieldAlert, Loader2, FileText, CheckCircle2 } from 'lucide-react';
import { DocumentFile } from '@/types/sharepoint';

interface DeleteFileModalProps {
  file: DocumentFile | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: (fileId: string, mode: 'archive' | 'permanent') => Promise<boolean>;
}

export const DeleteFileModal: React.FC<DeleteFileModalProps> = ({
  file,
  isOpen,
  onClose,
  onConfirmDelete,
}) => {
  const [mode, setMode] = useState<'archive' | 'permanent'>('archive');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !file) return null;

  const handleAction = async () => {
    setLoading(true);
    setError('');

    const success = await onConfirmDelete(file.id, mode);
    setLoading(false);

    if (success) {
      onClose();
    } else {
      setError('Thao tác xóa file thất bại. Vui lòng thử lại!');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in select-none">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className={`p-4 ${mode === 'permanent' ? 'bg-red-950 border-red-900' : 'bg-[#0F172A] border-slate-800'} text-white flex items-center justify-between border-b transition-colors`}>
          <div className="flex items-center space-x-2.5">
            <div className={`p-2 rounded-lg ${mode === 'permanent' ? 'bg-red-500/20 text-red-300 border border-red-400/30' : 'bg-blue-500/20 text-blue-300 border border-blue-400/30'}`}>
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Xác Nhận Xóa Tài Liệu</h3>
              <p className="text-[11px] text-slate-300 truncate max-w-[240px]">
                {file.name}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Target File Overview Card */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-700 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-slate-900 text-xs truncate" title={file.name}>
                {file.name}
              </p>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                Dung lượng: {(file.file_size / (1024 * 1024)).toFixed(2)} MB | Loại: {file.service_type || 'CFO'}
              </p>
            </div>
          </div>

          {/* Mode Option Selection */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold text-slate-800">
              Chọn phương thức xử lý tài liệu:
            </label>

            {/* Option 1: Archive (Soft Delete / Recommended) */}
            <div
              onClick={() => setMode('archive')}
              className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start space-x-3 ${
                mode === 'archive'
                  ? 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-400/20'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800 shrink-0 mt-0.5">
                <Archive className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">📦 Chuyển vào Kho Lưu Trữ (Archive)</span>
                  <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-1.5 py-0.2 rounded shrink-0">
                    Khuyên dùng
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                  Lưu file ở chế độ Read-Only, đảm bảo dữ liệu an toàn 100% và có thể khôi phục bất cứ lúc nào.
                </p>
              </div>
            </div>

            {/* Option 2: Permanent Delete (Hard Delete) */}
            <div
              onClick={() => setMode('permanent')}
              className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start space-x-3 ${
                mode === 'permanent'
                  ? 'bg-red-50/80 border-red-400 ring-2 ring-red-400/20'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="p-1.5 rounded-lg bg-red-100 text-red-700 shrink-0 mt-0.5">
                <Trash2 className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">🗑️ Xóa Vĩnh Viễn khỏi Hệ Thống</span>
                </div>
                <p className="text-[11px] text-red-600 mt-0.5 leading-relaxed">
                  Cảnh báo: File sẽ bị xóa hoàn toàn khỏi Supabase Storage & CSDL, không thể khôi phục sau khi xóa.
                </p>
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
            >
              Hủy Hỏ
            </button>
            <button
              type="button"
              onClick={handleAction}
              disabled={loading}
              className={`flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white rounded-lg transition-all shadow-md disabled:opacity-50 ${
                mode === 'permanent'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : mode === 'permanent' ? (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Xóa Vĩnh Viễn</span>
                </>
              ) : (
                <>
                  <Archive className="w-4 h-4" />
                  <span>Lưu Vào Kho Archive</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
