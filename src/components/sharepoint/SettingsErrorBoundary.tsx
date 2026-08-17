'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface Props {
  children: ReactNode;
  onClose?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class SettingsErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('SettingsErrorBoundary caught an isolated settings error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full text-center space-y-4 shadow-2xl animate-fade-in text-white select-none">
            <div className="w-12 h-12 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-100 text-sm">Cài Đặt Hệ Thống — Thông Báo An Toàn (Isolated)</h3>
            <p className="text-xs text-slate-300 font-mono bg-slate-950 p-3 rounded-lg border border-slate-800 text-left overflow-auto max-h-32">
              {this.state.error?.message || 'Có ngoại lệ tạm thời trong modul Cài Đặt Hệ Thống.'}
            </p>
            <p className="text-[11px] text-slate-400">
              Hệ thống chính & toàn bộ dữ liệu CSDL vẫn an toàn 100%. Bạn có thể đóng cửa sổ hoặc tải lại trang.
            </p>
            <div className="flex items-center justify-center space-x-2 pt-2">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  if (this.props.onClose) this.props.onClose();
                }}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center space-x-1.5 min-h-[44px]"
              >
                <X className="w-4 h-4 text-slate-400" />
                <span>Đóng Cài Đặt & Quay về Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
