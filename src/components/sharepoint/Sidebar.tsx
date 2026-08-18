'use client';

import React from 'react';
import { Home, Users, Archive, BarChart3, Settings, Filter, HardDrive, Sparkles, FolderKanban, X, SlidersHorizontal } from 'lucide-react';
import { MetadataFilterState, UserRole } from '@/types/sharepoint';

export type ActiveNavTab = 'home' | 'active_clients' | 'archived_clients' | 'reports' | 'settings';

interface SidebarProps {
  activeTab: ActiveNavTab;
  onTabChange: (tab: ActiveNavTab) => void;
  activeCount: number;
  archivedCount: number;
  filterState: MetadataFilterState;
  onFilterChange: (filters: Partial<MetadataFilterState>) => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  onOpenFilterDrawer?: () => void;
  userRole?: UserRole;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  activeCount,
  archivedCount,
  filterState,
  onFilterChange,
  isMobileOpen = false,
  onCloseMobile,
  onOpenFilterDrawer,
  userRole = 'admin',
}) => {
  const sidebarContent = (
    <div className="flex flex-col justify-between h-full select-none">
      {/* Top Navigation Links */}
      <div className="p-3 space-y-6 overflow-y-auto">
        <div>
          {onCloseMobile && (
            <div className="md:hidden flex justify-end px-3 py-1">
              <button
                onClick={onCloseMobile}
                className="p-1 text-slate-400 hover:text-white rounded-md min-w-[36px] min-h-[36px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
          <nav className="mt-1 space-y-1">
            <button
              onClick={() => {
                onTabChange('home');
                onCloseMobile?.();
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 text-xs rounded-lg transition-all font-medium min-h-[44px] ${
                activeTab === 'home'
                  ? 'bg-blue-600/20 text-blue-400 font-semibold border-l-4 border-blue-500 pl-2'
                  : 'hover:bg-slate-800/80 text-slate-300 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Home className="w-4 h-4 text-blue-400" />
                <span>Trang chủ Hub</span>
              </div>
            </button>

            <button
              onClick={() => {
                onTabChange('active_clients');
                onCloseMobile?.();
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 text-xs rounded-lg transition-all font-medium min-h-[44px] ${
                activeTab === 'active_clients'
                  ? 'bg-blue-600/20 text-blue-400 font-semibold border-l-4 border-blue-500 pl-2'
                  : 'hover:bg-slate-800/80 text-slate-300 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <FolderKanban className="w-4 h-4 text-emerald-400" />
                <span>Khách hàng (Active)</span>
              </div>
              <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-mono">
                {activeCount}
              </span>
            </button>

            <button
              onClick={() => {
                onTabChange('archived_clients');
                onCloseMobile?.();
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 text-xs rounded-lg transition-all font-medium min-h-[44px] ${
                activeTab === 'archived_clients'
                  ? 'bg-blue-600/20 text-blue-400 font-semibold border-l-4 border-blue-500 pl-2'
                  : 'hover:bg-slate-800/80 text-slate-300 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Archive className="w-4 h-4 text-amber-400" />
                <span>Kho Lưu trữ (Archived)</span>
              </div>
              <span className="bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 rounded-full text-[10px] font-mono">
                {archivedCount}
              </span>
            </button>

            <button
              onClick={() => {
                onTabChange('reports');
                onCloseMobile?.();
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 text-xs rounded-lg transition-all font-medium min-h-[44px] ${
                activeTab === 'reports'
                  ? 'bg-blue-600/20 text-blue-400 font-semibold border-l-4 border-blue-500 pl-2'
                  : 'hover:bg-slate-800/80 text-slate-300 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <BarChart3 className="w-4 h-4 text-purple-400" />
                <span>Báo cáo & Thống kê</span>
              </div>
            </button>

            {(userRole === 'admin' || userRole === 'manager') && (
              <button
                onClick={() => {
                  onTabChange('settings');
                  onCloseMobile?.();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-xs rounded-lg transition-all font-medium min-h-[44px] ${
                  activeTab === 'settings'
                    ? 'bg-blue-600/20 text-blue-400 font-semibold border-l-4 border-blue-500 pl-2'
                    : 'hover:bg-slate-800/80 text-slate-300 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Settings className="w-4 h-4 text-slate-400" />
                  <span>Cài đặt hệ thống</span>
                </div>
              </button>
            )}
          </nav>
        </div>

        {/* Quick Filter presets - ONLY Service Type Filter */}
        <div className="pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between px-3 py-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
              <Filter className="w-3 h-3 text-slate-400" />
              <span>Bộ lọc Loại dịch vụ</span>
            </span>
            {(filterState.serviceType !== 'all' || filterState.status !== 'all') && (
              <button
                onClick={() => onFilterChange({ serviceType: 'all', status: 'all' })}
                className="text-[10px] text-blue-400 hover:underline min-h-[30px] flex items-center font-medium"
              >
                Đặt lại
              </button>
            )}
          </div>

          <div className="space-y-3 px-1 mt-1">
            {/* Service Type Filter */}
            <div>
              <label className="text-[11px] text-slate-400 block mb-1 font-medium">Nhóm dịch vụ:</label>
              <div className="flex flex-wrap gap-1">
                {['all', 'Audit', 'CFO', 'Consulting', 'Tax'].map((st) => (
                  <button
                    key={st}
                    onClick={() => onFilterChange({ serviceType: st })}
                    className={`px-2.5 py-1 text-[10px] rounded-lg border transition-all min-h-[36px] ${
                      filterState.serviceType === st
                        ? 'bg-indigo-600 border-indigo-500 text-white font-bold shadow-xs'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {st === 'all' ? 'Tất cả' : st}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Storage usage widget at bottom */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60">
        <div className="flex items-center justify-between text-xs text-slate-300 mb-1.5">
          <div className="flex items-center space-x-1.5 font-medium">
            <HardDrive className="w-3.5 h-3.5 text-blue-400" />
            <span>Supabase Storage</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800">
            Realtime Active
          </span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-1.5 rounded-full w-[38%]" />
        </div>
        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 font-mono">
          <span>Đã dùng: 184.7 MB</span>
          <span>Hạn mức: 5 GB</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="w-64 bg-[#0F172A] text-white border-r border-slate-800 hidden md:block shrink-0 h-[calc(100vh-56px)]">
        {sidebarContent}
      </aside>

      {/* Mobile Navigation Drawer (Slide-over from Left) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-fade-in select-none">
          {/* Backdrop Overlay */}
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs" onClick={onCloseMobile} />

          {/* Drawer Content */}
          <div className="relative w-4/5 max-w-xs bg-[#0F172A] text-white h-full shadow-2xl z-10 border-r border-slate-800 flex flex-col">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar (Fixed at bottom on phones) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0F172A] border-t border-slate-800 flex items-center justify-around py-1 px-2 select-none shadow-2xl">
        <button
          onClick={() => onTabChange('active_clients')}
          className={`flex flex-col items-center justify-center p-1.5 rounded-lg min-w-[54px] min-h-[44px] ${
            activeTab === 'active_clients' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FolderKanban className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Khách hàng</span>
        </button>

        <button
          onClick={() => onTabChange('archived_clients')}
          className={`flex flex-col items-center justify-center p-1.5 rounded-lg min-w-[54px] min-h-[44px] ${
            activeTab === 'archived_clients' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Archive className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Kho Archive</span>
        </button>

        <button
          onClick={() => onTabChange('reports')}
          className={`flex flex-col items-center justify-center p-1.5 rounded-lg min-w-[54px] min-h-[44px] ${
            activeTab === 'reports' ? 'text-purple-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Báo cáo</span>
        </button>

        {onOpenFilterDrawer && (
          <button
            onClick={onOpenFilterDrawer}
            className="flex flex-col items-center justify-center p-1.5 text-indigo-400 hover:text-indigo-300 rounded-lg min-w-[54px] min-h-[44px]"
          >
            <SlidersHorizontal className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Bộ lọc</span>
          </button>
        )}

        <button
          onClick={() => onTabChange('settings')}
          className={`flex flex-col items-center justify-center p-1.5 rounded-lg min-w-[54px] min-h-[44px] ${
            activeTab === 'settings' ? 'text-slate-200 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Cài đặt</span>
        </button>
      </nav>
    </>
  );
};
