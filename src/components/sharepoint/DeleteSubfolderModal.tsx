'use client';

import React, { useState } from 'react';
import { X, Trash2, ShieldAlert, Loader2 } from 'lucide-react';
import { FolderItem } from '@/types/sharepoint';

interface DeleteSubfolderModalProps {
  subFolder: FolderItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: (folderId: string) => Promise<boolean>;
}

export const DeleteSubfolderModal: React.FC<DeleteSubfolderModalProps> = ({
  subFolder,
  isOpen,
  onClose,
  onConfirmDelete,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !subFolder) return null;

  const handleDelete = async () => {
    setLoading(true);
    setError('');

    const success = await onConfirmDelete(subFolder.id);
    setLoading(false);

    if (success) {
      onClose();
    } else {
      setError('Xóa thư mục thất bại. Vui lòng thử lại!');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in select-none">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="p-4 bg-red-950 text-white flex items-center justify-between border-b border-red-900">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-red-500/20 text-red-300 border border-red-400/30">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-red-100">Xác Nhận Xóa Thư Mục</h3>
              <p className="text-[11px] text-red-300 truncate max-w-[240px]">
                {subFolder.name}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 text-red-300 hover:text-white hover:bg-red-900 rounded-md transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs space-y-1">
            <p className="font-bold">⚠️ Bạn có chắc chắn muốn xóa thư mục này?</p>
            <p className="text-amber-800">
              Thư mục <strong className="text-slate-900">{subFolder.name}</strong> sẽ bị xóa khỏi hệ thống.
            </p>
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
              onClick={handleDelete}
              disabled={loading}
              className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-all shadow-md disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang xóa...</span>
                </>
              ) : (
                <span>Xóa Thư Mục</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
