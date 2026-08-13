'use client';

import React, { useEffect } from 'react';
import { ShieldAlert, RefreshCw, Home, AlertTriangle } from 'lucide-react';
import { FicaLogo } from '@/components/sharepoint/FicaLogo';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled SharePoint Hub Application Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white select-none">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-8 text-center space-y-6 animate-fade-in relative overflow-hidden">
        {/* Background accent glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/20 rounded-full blur-2xl pointer-events-none" />

        {/* Fica Logo */}
        <div className="flex justify-center">
          <FicaLogo className="w-16 h-16" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-red-500/10 text-red-400 rounded-full border border-red-500/20 text-xs font-semibold">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Hệ Thống Đã Khôi Phục Tự Động</span>
          </div>

          <h2 className="text-xl font-bold text-slate-100">
            SharePoint Fica Hub
          </h2>

          <p className="text-xs text-slate-400 leading-relaxed">
            Ứng dụng vừa gặp sự cố kết nối dữ liệu tạm thời. Hệ thống đã ngăn ngừa gián đoạn và sẵn sàng tải lại trang.
          </p>
        </div>

        {/* Technical details accordion if digest */}
        {error?.digest && (
          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-[10px] font-mono text-slate-500 truncate">
            Error Digest ID: {error.digest}
          </div>
        )}

        {/* Actions */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => reset()}
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold py-3 rounded-xl transition-all flex items-center justify-center space-x-2 shadow-lg shadow-blue-600/20"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Thử lại (Try Again)</span>
          </button>

          <button
            onClick={() => (window.location.href = '/')}
            className="px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold py-3 rounded-xl transition-colors flex items-center justify-center space-x-1.5"
          >
            <Home className="w-4 h-4" />
            <span>Về Trang chủ</span>
          </button>
        </div>
      </div>
    </div>
  );
}
