'use client';

import React, { useState, useEffect } from 'react';
import { X, Edit3, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { ClientFolder } from '@/types/sharepoint';

interface RenameClientModalProps {
  client: ClientFolder | null;
  isOpen: boolean;
  onClose: () => void;
  onRename: (clientId: string, newCode: string, newName: string) => void;
}

export const RenameClientModal: React.FC<RenameClientModalProps> = ({
  client,
  isOpen,
  onClose,
  onRename,
}) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (client) {
      setCode(client.code);
      setName(client.name);
      setError('');
    }
  }, [client]);

  if (!isOpen || !client) return null;

  const validate = () => {
    if (!code.trim() || !name.trim()) {
      setError('Mã Khách hàng và Tên Khách hàng không được để trống.');
      return false;
    }
    const illegalChars = /[\/\\:\*\?"<>\|]/;
    if (illegalChars.test(code) || illegalChars.test(name)) {
      setError('Tên thư mục không được chứa các ký tự đặc biệt: / \\ : * ? " < > |');
      return false;
    }
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onRename(client.id, code.trim().toUpperCase(), name.trim());
    onClose();
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
              <h3 className="font-bold text-sm">Đổi tên Thư mục Khách hàng</h3>
              <p className="text-[11px] text-slate-400 font-mono">Đang sửa: {client.folder_name}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Mã Khách hàng mới (Client Code) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setError('');
              }}
              className="w-full text-xs font-mono uppercase p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Tên Khách hàng mới (Client Name) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              required
            />
          </div>

          {/* Folder name preview */}
          {code && name && (
            <div className="p-3 bg-blue-50/80 rounded-lg border border-blue-200 text-xs">
              <span className="text-slate-500">Tên Folder hiển thị mới: </span>
              <p className="font-bold text-blue-900 font-mono mt-0.5">[{code.trim().toUpperCase()}] - {name.trim()}</p>
            </div>
          )}

          {/* Footer */}
          <div className="pt-3 flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold py-2.5 rounded-lg transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2.5 rounded-lg transition-colors shadow-xs"
            >
              Lưu tên mới
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
