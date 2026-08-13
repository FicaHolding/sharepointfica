'use client';

import React from 'react';
import { X, FolderPlus, Sparkles, CheckCircle2, ShieldAlert } from 'lucide-react';

interface NewClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateClient: (code: string, name: string) => void;
}

export const NewClientModal: React.FC<NewClientModalProps> = ({ isOpen, onClose, onCreateClient }) => {
  const [code, setCode] = React.useState('');
  const [name, setName] = React.useState('');
  const [error, setError] = React.useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) {
      setError('Vui lòng nhập đầy đủ Mã Khách hàng và Tên Khách hàng.');
      return;
    }
    onCreateClient(code.trim().toUpperCase(), name.trim());
    setCode('');
    setName('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in select-none">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="p-4 bg-[#0F172A] text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-400/30">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Tạo Khách hàng Mới</h3>
              <p className="text-[11px] text-slate-400">Khởi tạo folder chuẩn SharePoint với 4 thư mục con</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Mã Khách hàng (Client Code) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="VD: KH005, MASAN, VINGROUP"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full text-xs font-mono uppercase p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Tên Khách hàng (Client Name) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="VD: Tập đoàn Masan Group"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              required
            />
          </div>

          {/* Folder name preview */}
          {code && name && (
            <div className="p-3 bg-blue-50/80 rounded-lg border border-blue-200 text-xs">
              <span className="text-slate-500">Tên Folder cha tự sinh: </span>
              <p className="font-bold text-blue-900 font-mono mt-0.5">[{code.toUpperCase()}] - {name}</p>
            </div>
          )}

          {/* Auto-generated subfolders preview */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-[11px] font-bold text-slate-700 mb-2 flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Tự động sinh 4 thư mục con chuẩn Fica:</span>
            </p>
            <ul className="space-y-1.5 text-[11px] text-slate-600 font-medium pl-1">
              <li className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>01_Pháp lý & Hợp đồng</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>02_Chứng từ & Báo cáo Tài chính</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>03_Dự án Tư vấn & Kiểm toán</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>04_Báo cáo Nghiệm thu</span>
              </li>
            </ul>
          </div>

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
              Khởi tạo Khách hàng
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
