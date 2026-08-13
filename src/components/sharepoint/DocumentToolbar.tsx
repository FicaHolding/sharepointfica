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
    <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 select-none">
      {/* Left: Action Buttons */}
      <div className="flex items-center space-x-2">
        {/* Create Client / Folder */}
        <button
          onClick={onOpenNewClientModal}
          disabled={!canModify}
          className="flex items-center space-x-1.5 bg-[#0078D4] hover:bg-[#106EBE] disabled:bg-slate-300 disabled:text-slate-500 text-white text-xs font-semibold px-3 py-1.5 rounded-md shadow-xs transition-all"
        >
          <FolderPlus className="w-4 h-4" />
          <span>Tạo Khách hàng mới</span>
        </button>

        {/* Upload File */}
        <button
          onClick={onOpenUploadModal}
          disabled={isReadOnly || !canModify}
          title={isReadOnly ? 'Hồ sơ đã lưu trữ (Read-Only) - Không thể upload file' : 'Tải lên tài liệu mới'}
          className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-100 disabled:text-slate-400 text-slate-800 text-xs font-semibold px-3 py-1.5 rounded-md border border-slate-300 transition-all"
        >
          {isReadOnly ? <Lock className="w-3.5 h-3.5 text-amber-600" /> : <UploadCloud className="w-4 h-4 text-blue-600" />}
          <span>Tải lên File</span>
        </button>

        {/* Archive / Restore actions for selected client */}
        {selectedClientName && (
          <div className="flex items-center space-x-1 border-l border-slate-200 pl-2 ml-1">
            {clientStatus === 'active' ? (
              <button
                onClick={onArchiveClient}
                disabled={!canModify}
                className="flex items-center space-x-1 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-medium px-2.5 py-1.5 rounded border border-amber-300 transition-all"
              >
                <Archive className="w-3.5 h-3.5 text-amber-600" />
                <span>Archive Hồ sơ</span>
              </button>
            ) : (
              <button
                onClick={onRestoreClient}
                disabled={!canModify}
                className="flex items-center space-x-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-medium px-2.5 py-1.5 rounded border border-emerald-300 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                <span>Restore Khôi phục</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Right: Filters & View Switcher */}
      <div className="flex items-center space-x-2">
        {/* Filter Drawer Toggle */}
        <button
          onClick={onOpenFilterDrawer}
          className={`flex items-center space-x-1.5 text-xs font-medium px-2.5 py-1.5 rounded border transition-colors ${
            activeFilterCount > 0
              ? 'bg-blue-50 border-blue-300 text-blue-700'
              : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <span>Bộ lọc Metadata</span>
          {activeFilterCount > 0 && (
            <span className="bg-blue-600 text-white rounded-full text-[10px] w-4 h-4 flex items-center justify-center font-bold">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* View Switcher: List vs Grid */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-md border border-slate-300">
          <button
            onClick={() => onViewModeChange('list')}
            title="Chế độ Xem Danh sách (List View)"
            className={`p-1 rounded transition-colors ${
              viewMode === 'list' ? 'bg-white text-blue-600 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <List className="w-4 h-4" />
          </button>

          <button
            onClick={() => onViewModeChange('grid')}
            title="Chế độ Xem Lưới (Grid View)"
            className={`p-1 rounded transition-colors ${
              viewMode === 'grid' ? 'bg-white text-blue-600 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          title="Tải lại dữ liệu"
          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded border border-slate-300 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
