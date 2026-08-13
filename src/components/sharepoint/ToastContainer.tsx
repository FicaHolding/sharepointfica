'use client';

import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-16 right-5 z-50 space-y-2 max-w-sm w-full select-none pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`p-4 rounded-xl shadow-2xl border flex items-start justify-between space-x-3 pointer-events-auto transition-all animate-fade-in backdrop-blur-md ${
            t.type === 'success'
              ? 'bg-slate-900/95 border-emerald-500/50 text-emerald-100'
              : t.type === 'error'
              ? 'bg-slate-900/95 border-red-500/50 text-red-100'
              : 'bg-slate-900/95 border-blue-500/50 text-blue-100'
          }`}
        >
          <div className="flex items-start space-x-2.5">
            {t.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : t.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            ) : (
              <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            )}

            <div>
              <h4 className="font-bold text-xs">{t.title}</h4>
              {t.message && <p className="text-[11px] opacity-80 mt-0.5 leading-relaxed">{t.message}</p>}
            </div>
          </div>

          <button
            onClick={() => onDismiss(t.id)}
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
