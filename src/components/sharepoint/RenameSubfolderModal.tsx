'use client';

import React, { useState, useEffect } from 'react';
import { X, Edit3, ShieldAlert, Loader2 } from 'lucide-react';
import { FolderItem } from '@/types/sharepoint';

interface RenameSubfolderModalProps {
  subFolder: FolderItem | null;
  isOpen: boolean;
  onClose: () => void;
  onRenameSubfolder: (folderId: string, newName: string) => Promise<{ success: boolean; error?: string }>;
}

export const RenameSubfolderModal: React.FC<RenameSubfolderModalProps> = ({
  subFolder,
  isOpen,
  onClose,
  onRenameSubfolder,
}) => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (subFolder) {
      setName(subFolder.name);
      setError('');
    }
  }, [subFolder]);

  if (!isOpen || !subFolder) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Vui lòng nhập Tên thư mục mới.');
      return;
    }

    setLoading(true);
    setError('');

    const res = await onRenameSubfolder(subFolder.id, name.trim());
    setLoading(false);

    if (res.success) {
      onClose();
    } else {
      setError(res.error || 'Cập nhật tên thư mục thất bại. Vui lòng thử lại!');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in select-none">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="p-4 bg-[#0F172A] text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-400/30">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Đổi Tên Thư Mục</h3>
              <p className="text-[11px] text-slate-400 truncate max-w-[240px]">
                {subFolder.name}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Tên Thư Mục Mới <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              disabled={loading}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              className="w-full text-xs font-medium p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 disabled:bg-slate-100"
              required
              autoFocus
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all shadow-md disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang cập nhật...</span>
                </>
              ) : (
                <span>Cập Nhật Tên</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
