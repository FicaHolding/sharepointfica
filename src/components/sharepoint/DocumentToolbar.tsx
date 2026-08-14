'use client';

import React from 'react';
import {
  FolderPlus,
  UploadCloud,
  List,
  LayoutGrid,
  Filter,
  RefreshCw,
  Search,
  Lock,
  Archive,
  RotateCcw,
  Plus,
} from 'lucide-react';
import { MetadataFilterState, UserRole } from '@/types/sharepoint';

interface DocumentToolbarProps {
  viewMode: 'list' | 'grid';
  onViewModeChange: (mode: 'list' | 'grid') => void;
  onOpenNewClientModal: () => void;
  onOpenUploadModal: () => void;
  onOpenFilterDrawer: () => void;
  filterState: MetadataFilterState;
  onSearchChange: (q: string) => void;
  isReadOnly: boolean;
  userRole: UserRole;
  selectedClientName?: string;
  onArchiveClient?: () => void;
  onRestoreClient?: () => void;
  clientStatus?: 'active' | 'archived';
  onRefresh: () => void;
}

export const DocumentToolbar: React.FC<DocumentToolbarProps> = ({
  viewMode,
  onViewModeChange,
  onOpenNewClientModal,
  onOpenUploadModal,
  onOpenFilterDrawer,
  filterState,
  onSearchChange,
  isReadOnly,
  userRole,
  selectedClientName,
  onArchiveClient,
  onRestoreClient,
  clientStatus,
  onRefresh,
}) => {
  const canModify = userRole === 'admin' || userRole === 'manager' || userRole === 'staff';

  const activeFilterCount =
    (filterState.fiscalYear !== 'all' ? 1 : 0) +
    (filterState.serviceType !== 'all' ? 1 : 0) +
    (filterState.status !== 'all' ? 1 : 0) +
    filterState.selectedTags.length;

  return (
    <div className="bg-white border-b border-slate-200 px-3 md:px-4 py-2 flex items-center justify-between gap-2 select-none overflow-x-auto">
      {/* Left: Action Buttons */}
      <div className="flex items-center space-x-1.5 shrink-0">
        {/* Create Client / Folder */}
        <button
          onClick={onOpenNewClientModal}
          disabled={!canModify}
          className="flex items-center space-x-1.5 bg-[#0078D4] hover:bg-[#106EBE] disabled:bg-slate-300 disabled:text-slate-500 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-xs transition-all min-h-[44px]"
        >
          <FolderPlus className="w-4 h-4" />
          <span className="hidden sm:inline">Tạo KH mới</span>
          <span className="sm:hidden">Tạo KH</span>
        </button>

        {/* Upload File */}
        <button
          onClick={onOpenUploadModal}
          disabled={isReadOnly || !canModify}
          title={isReadOnly ? 'Hồ sơ đã lưu trữ (Read-Only) - Không thể upload file' : 'Tải lên tài liệu mới'}
          className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-100 disabled:text-slate-400 text-slate-800 text-xs font-semibold px-3 py-2 rounded-lg border border-slate-300 transition-all min-h-[44px]"
        >
          {isReadOnly ? <Lock className="w-4 h-4 text-amber-600" /> : <UploadCloud className="w-4 h-4 text-blue-600" />}
          <span>Upload File</span>
        </button>

        {/* Archive / Restore actions for selected client */}
        {selectedClientName && (
          <div className="flex items-center space-x-1 border-l border-slate-200 pl-1.5">
            {clientStatus === 'active' ? (
              <button
                onClick={onArchiveClient}
                disabled={!canModify}
                className="flex items-center space-x-1 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-medium px-2.5 py-2 rounded-lg border border-amber-300 transition-all min-h-[44px]"
              >
                <Archive className="w-4 h-4 text-amber-600" />
                <span className="hidden sm:inline">Archive</span>
              </button>
            ) : (
              <button
                onClick={onRestoreClient}
                disabled={!canModify}
                className="flex items-center space-x-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-medium px-2.5 py-2 rounded-lg border border-emerald-300 transition-all min-h-[44px]"
              >
                <RotateCcw className="w-4 h-4 text-emerald-600" />
                <span className="hidden sm:inline">Restore</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Right: Filters & View Switcher */}
      <div className="flex items-center space-x-1.5 shrink-0">
        {/* Filter Drawer Toggle */}
        <button
          onClick={onOpenFilterDrawer}
          className={`flex items-center space-x-1.5 text-xs font-medium px-3 py-2 rounded-lg border transition-colors min-h-[44px] ${
            activeFilterCount > 0
              ? 'bg-blue-50 border-blue-300 text-blue-700 font-bold'
              : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Filter className="w-4 h-4 text-slate-500" />
          <span className="hidden sm:inline">Bộ lọc</span>
          {activeFilterCount > 0 && (
            <span className="bg-blue-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-mono">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* View Mode Switcher (List / Grid) */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => onViewModeChange('list')}
            title="Dạng danh sách"
            className={`p-2 rounded-md transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center ${
              viewMode === 'list' ? 'bg-white text-blue-600 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewModeChange('grid')}
            title="Dạng lưới thẻ"
            className={`p-2 rounded-md transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center ${
              viewMode === 'grid' ? 'bg-white text-blue-600 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
