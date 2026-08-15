'use client';

import React, { useState } from 'react';
import { X, FolderPlus, Sparkles, CheckCircle2, ShieldAlert, Loader2, Briefcase } from 'lucide-react';
import { ServiceType } from '@/types/sharepoint';

interface NewClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateClient: (code: string, name: string, serviceType: ServiceType) => Promise<{ success: boolean; error?: string }>;
  defaultServiceType?: ServiceType;
}

export const NewClientModal: React.FC<NewClientModalProps> = ({
  isOpen,
  onClose,
  onCreateClient,
  defaultServiceType = 'Audit',
}) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [serviceType, setServiceType] = useState<ServiceType>(defaultServiceType);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (isOpen && defaultServiceType) {
      setServiceType(defaultServiceType);
    }
  }, [isOpen, defaultServiceType]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) {
      setError('Vui lòng nhập đầy đủ Mã Khách hàng và Tên Khách hàng.');
      return;
    }

    setLoading(true);
    setError('');

    const res = await onCreateClient(code.trim().toUpperCase(), name.trim(), serviceType);
    setLoading(false);

    if (res.success) {
      setCode('');
      setName('');
      setServiceType(defaultServiceType);
      onClose();
    } else {
      setError(res.error || 'Tạo khách hàng thất bại. Vui lòng kiểm tra lại Supabase Database!');
    }
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
            disabled={loading}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors disabled:opacity-50"
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Mã KH (Code) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="VD: KH005, MASAN"
                value={code}
                disabled={loading}
                onChange={(e) => {
                  setCode(e.target.value);
                  setError('');
                }}
                className="w-full text-xs font-mono uppercase p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 disabled:bg-slate-100"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Loại Dịch vụ Fica <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                <select
                  value={serviceType}
                  disabled={loading}
                  onChange={(e) => setServiceType(e.target.value as ServiceType)}
                  className="w-full text-xs p-2.5 pl-8 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-600 font-semibold bg-white disabled:bg-slate-100"
                >
                  <option value="CFO">CFO (Tư vấn CFO)</option>
                  <option value="Audit">Audit (Kiểm toán)</option>
                  <option value="Consulting">Consulting (Tư vấn)</option>
                  <option value="Tax">Tax (Tư vấn Thuế)</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Tên Khách hàng (Client Name) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="VD: Tập đoàn Masan Group"
              value={name}
              disabled={loading}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 disabled:bg-slate-100"
              required
            />
          </div>

          {/* Folder name preview */}
          {code && name && (
            <div className="p-3 bg-blue-50/80 rounded-lg border border-blue-200 text-xs flex items-center justify-between">
              <div>
                <span className="text-slate-500">Folder tự sinh: </span>
                <p className="font-bold text-blue-900 font-mono mt-0.5">[{code.toUpperCase()}] - {name}</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-600 text-white rounded font-mono">
                {serviceType}
              </span>
            </div>
          )}

          {/* Auto-generated subfolders preview */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
            <span className="font-bold text-slate-700 flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Tự động tạo 4 Subfolder chuẩn:</span>
            </span>
            <ul className="text-[11px] text-slate-600 space-y-0.5 pl-4 list-disc font-mono">
              <li>01_Pháp lý & Hợp đồng</li>
              <li>02_Chứng từ & Báo cáo Tài chính</li>
              <li>03_Dự án Tư vấn & Kiểm toán</li>
              <li>04_Báo cáo Nghiệm thu</li>
            </ul>
          </div>

          {/* Footer */}
          <div className="pt-2 flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2.5 rounded-lg transition-colors shadow-xs flex items-center justify-center space-x-1.5 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Đang ghi Supabase...</span>
                </>
              ) : (
                <span>Tạo Khách hàng & 4 Subfolders</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
