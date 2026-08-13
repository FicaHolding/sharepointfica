'use client';

import React from 'react';
import {
  CheckSquare,
  Archive,
  Download,
  Trash2,
  Tag,
  X,
  Lock,
  Sparkles,
} from 'lucide-react';
import { UserRole } from '@/types/sharepoint';

interface FloatingActionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkArchive: () => void;
  onBulkDownloadZip: () => void;
  onBulkDelete: () => void;
  onBulkMetadata: () => void;
  userRole: UserRole;
  isReadOnly: boolean;
}

export const FloatingActionBar: React.FC<FloatingActionBarProps> = ({
  selectedCount,
  onClearSelection,
  onBulkArchive,
  onBulkDownloadZip,
  onBulkDelete,
  onBulkMetadata,
  userRole,
  isReadOnly,
}) => {
  if (selectedCount === 0) return null;

  const canModify = (userRole === 'admin' || userRole === 'manager' || userRole === 'staff') && !isReadOnly;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#0F172A] text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center space-x-4 animate-fade-in select-none backdrop-blur-md">
      {/* Selected count pill */}
      <div className="flex items-center space-x-2 border-r border-slate-700 pr-4">
        <span className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-xs text-white shadow-inner">
          {selectedCount}
        </span>
        <div>
          <p className="text-xs font-bold text-slate-100">Đã chọn {selectedCount} mục</p>
          <p className="text-[10px] text-slate-400">Thao tác hàng loạt (Bulk Actions)</p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center space-x-2">
        {/* Archive Selected */}
        <button
          onClick={onBulkArchive}
          disabled={!canModify}
          className="flex items-center space-x-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 disabled:opacity-50 disabled:cursor-not-allowed border border-amber-500/30 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all"
        >
          <Archive className="w-3.5 h-3.5" />
          <span>Archive hàng loạt</span>
        </button>

        {/* Download ZIP */}
        <button
          onClick={onBulkDownloadZip}
          className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded-xl shadow-xs transition-all"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Tải xuống ZIP</span>
        </button>

        {/* Bulk Metadata */}
        <button
          onClick={onBulkMetadata}
          disabled={!canModify}
          className="flex items-center space-x-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 disabled:opacity-50 disabled:cursor-not-allowed border border-purple-500/30 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all"
        >
          <Tag className="w-3.5 h-3.5" />
          <span>Gán Metadata</span>
        </button>

        {/* Bulk Delete */}
        <button
          onClick={onBulkDelete}
          disabled={!canModify}
          className="flex items-center space-x-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 disabled:opacity-50 disabled:cursor-not-allowed border border-red-500/30 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all"
        >
          <Trash2 className="w-3.5 h-3.5 text-red-400" />
          <span>Xóa đã chọn</span>
        </button>
      </div>

      {/* Clear selection */}
      <button
        onClick={onClearSelection}
        title="Bỏ chọn tất cả"
        className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors border-l border-slate-700 pl-3"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
