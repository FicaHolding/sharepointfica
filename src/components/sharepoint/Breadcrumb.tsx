'use client';

import React from 'react';
import { ChevronRight, Home, Folder, Lock, ArrowLeft } from 'lucide-react';
import { ClientFolder, FolderItem } from '@/types/sharepoint';

interface BreadcrumbProps {
  currentClient: ClientFolder | null;
  currentSubFolder: FolderItem | null;
  activeTab: string;
  onNavigateHome: () => void;
  onNavigateClient: () => void;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  currentClient,
  currentSubFolder,
  activeTab,
  onNavigateHome,
  onNavigateClient,
}) => {
  return (
    <div className="bg-white border-b border-slate-200 shadow-xs select-none sticky top-14 z-20">
      {/* Desktop Breadcrumb View (Hidden on mobile < md) */}
      <div className="hidden md:flex items-center space-x-2 text-xs text-slate-600 px-4 py-2">
        <button
          onClick={onNavigateHome}
          className="flex items-center space-x-1 hover:text-blue-600 font-medium transition-colors min-h-[36px]"
        >
          <Home className="w-3.5 h-3.5 text-slate-500" />
          <span>Document Hub</span>
        </button>

        <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />

        {activeTab === 'archived_clients' ? (
          <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            Kho Lưu trữ (Archived)
          </span>
        ) : activeTab === 'reports' ? (
          <span className="font-semibold text-purple-700">Báo cáo & Thống kê</span>
        ) : activeTab === 'settings' ? (
          <span className="font-semibold text-slate-700">Cài đặt Hệ thống</span>
        ) : (
          <button
            onClick={onNavigateHome}
            className="hover:text-blue-600 font-medium transition-colors text-slate-700"
          >
            Danh sách Khách hàng
          </button>
        )}

        {currentClient && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <button
              onClick={onNavigateClient}
              className={`flex items-center space-x-1.5 font-semibold px-2 py-0.5 rounded transition-colors ${
                currentClient.status === 'archived'
                  ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                  : 'bg-blue-50 text-blue-900 border border-blue-200 hover:bg-blue-100'
              }`}
            >
              <Folder className="w-3.5 h-3.5 text-blue-600" />
              <span>{currentClient.folder_name}</span>
              {currentClient.status === 'archived' && (
                <span className="flex items-center text-[10px] text-amber-700 bg-amber-200/80 px-1.5 rounded ml-1 font-mono">
                  <Lock className="w-2.5 h-2.5 mr-0.5" /> Read-Only
                </span>
              )}
            </button>
          </>
        )}

        {currentSubFolder && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              {currentSubFolder.name}
            </span>
          </>
        )}
      </div>

      {/* Mobile Compact Breadcrumb View (< md) */}
      <div className="md:hidden flex items-center justify-between px-3 py-2 text-xs">
        <div className="flex items-center space-x-2 overflow-hidden">
          {/* Quick Back Button */}
          {currentSubFolder ? (
            <button
              onClick={onNavigateClient}
              className="flex items-center space-x-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-2.5 py-1.5 rounded-lg border border-slate-300 shrink-0 min-h-[44px]"
            >
              <ArrowLeft className="w-4 h-4 text-blue-600" />
              <span className="text-[11px]">Trở lại</span>
            </button>
          ) : currentClient ? (
            <button
              onClick={onNavigateHome}
              className="flex items-center space-x-1 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold px-2.5 py-1.5 rounded-lg border border-blue-200 shrink-0 min-h-[44px]"
            >
              <ArrowLeft className="w-4 h-4 text-blue-600" />
              <span className="text-[11px]">Về Danh sách KH</span>
            </button>
          ) : (
            <div className="flex items-center space-x-1 text-slate-700 font-bold text-xs">
              <Home className="w-4 h-4 text-blue-600" />
              <span>Document Hub</span>
            </div>
          )}

          {/* Current Path Label */}
          <div className="truncate font-semibold text-slate-900 text-xs">
            {currentSubFolder ? (
              <span className="text-blue-700 font-bold">{currentSubFolder.name}</span>
            ) : currentClient ? (
              <span className="truncate">{currentClient.folder_name}</span>
            ) : (
              <span>{activeTab === 'archived_clients' ? 'Kho Lưu trữ' : 'Danh sách KH'}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
