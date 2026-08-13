'use client';

import React from 'react';
import { Home, Users, Archive, BarChart3, Settings, Filter, HardDrive, Sparkles, FolderKanban } from 'lucide-react';
import { MetadataFilterState } from '@/types/sharepoint';

export type ActiveNavTab = 'home' | 'active_clients' | 'archived_clients' | 'reports' | 'settings';

interface SidebarProps {
  activeTab: ActiveNavTab;
  onTabChange: (tab: ActiveNavTab) => void;
  activeCount: number;
  archivedCount: number;
  filterState: MetadataFilterState;
  onFilterChange: (filters: Partial<MetadataFilterState>) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  activeCount,
  archivedCount,
  filterState,
  onFilterChange,
}) => {
  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col justify-between select-none h-[calc(100vh-3.5rem)] shrink-0">
      {/* Top Navigation Links */}
      <div className="p-3 space-y-6 overflow-y-auto">
        <div>
          <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Điều hướng chính
          </div>
          <nav className="mt-1 space-y-1">
            <button
              onClick={() => onTabChange('home')}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-md transition-all font-medium ${
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
              onClick={() => onTabChange('active_clients')}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-md transition-all font-medium ${
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
              onClick={() => onTabChange('archived_clients')}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-md transition-all font-medium ${
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
              onClick={() => onTabChange('reports')}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-md transition-all font-medium ${
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

            <button
              onClick={() => onTabChange('settings')}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-md transition-all font-medium ${
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
          </nav>
        </div>

        {/* Quick Filter presets */}
        <div className="pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between px-3 py-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
              <Filter className="w-3 h-3 text-slate-400" />
              <span>Bộ lọc nhanh</span>
            </span>
            {(filterState.fiscalYear !== 'all' || filterState.serviceType !== 'all' || filterState.status !== 'all') && (
              <button
                onClick={() => onFilterChange({ fiscalYear: 'all', serviceType: 'all', status: 'all' })}
                className="text-[10px] text-blue-400 hover:underline"
              >
                Đặt lại
              </button>
            )}
          </div>

          <div className="space-y-3 px-1 mt-1">
            {/* Fiscal Year Filter */}
            <div>
              <label className="text-[11px] text-slate-400 block mb-1 font-medium">Năm tài chính:</label>
              <div className="grid grid-cols-4 gap-1">
                {['all', '2025', '2024', '2023'].map((yr) => (
                  <button
                    key={yr}
                    onClick={() => onFilterChange({ fiscalYear: yr })}
                    className={`py-1 text-[10px] font-mono rounded border text-center transition-all ${
                      filterState.fiscalYear === yr
                        ? 'bg-blue-600 border-blue-500 text-white font-bold'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {yr === 'all' ? 'Tất cả' : yr}
                  </button>
                ))}
              </div>
            </div>

            {/* Service Type Filter */}
            <div>
              <label className="text-[11px] text-slate-400 block mb-1 font-medium">Loại dịch vụ:</label>
              <div className="flex flex-wrap gap-1">
                {['all', 'Audit', 'CFO', 'Consulting', 'Tax'].map((st) => (
                  <button
                    key={st}
                    onClick={() => onFilterChange({ serviceType: st })}
                    className={`px-2 py-0.5 text-[10px] rounded border transition-all ${
                      filterState.serviceType === st
                        ? 'bg-indigo-600 border-indigo-500 text-white font-bold'
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
          <span className="text-[11px] font-mono text-slate-400">14.8 / 50 GB</span>
        </div>

        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full w-[29.6%]" />
        </div>

        <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between">
          <span className="flex items-center space-x-1 text-emerald-400">
            <Sparkles className="w-3 h-3" />
            <span>Realtime Storage Active</span>
          </span>
          <span className="font-mono">29.6%</span>
        </div>
      </div>
    </aside>
  );
};
