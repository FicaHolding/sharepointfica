'use client';

import React from 'react';
import { X, Filter, RotateCcw, Check, Calendar, Briefcase, ShieldCheck, Tag } from 'lucide-react';
import { MetadataFilterState } from '@/types/sharepoint';

interface MetadataFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filterState: MetadataFilterState;
  onFilterChange: (filters: Partial<MetadataFilterState>) => void;
  onResetFilters: () => void;
}

export const MetadataFilterDrawer: React.FC<MetadataFilterDrawerProps> = ({
  isOpen,
  onClose,
  filterState,
  onFilterChange,
  onResetFilters,
}) => {
  if (!isOpen) return null;

  const availableTags = ['Hợp đồng', 'Pháp lý', 'Báo cáo tài chính', 'Kiểm toán', 'Nghiệm thu', 'Dự án CFO'];

  const toggleTag = (tag: string) => {
    const exists = filterState.selectedTags.includes(tag);
    if (exists) {
      onFilterChange({ selectedTags: filterState.selectedTags.filter((t) => t !== tag) });
    } else {
      onFilterChange({ selectedTags: [...filterState.selectedTags, tag] });
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex justify-end z-50 animate-fade-in select-none">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between border-l border-slate-200">
        {/* Header */}
        <div className="p-4 bg-[#0F172A] text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-sm">Bộ lọc Metadata Đa chiều</h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-6 text-xs text-slate-800">
          {/* Fiscal Year */}
          <div>
            <label className="font-bold text-slate-900 mb-2 flex items-center space-x-1.5 text-xs">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>Năm tài chính (Fiscal Year)</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {['all', '2025', '2024', '2023', '2022'].map((yr) => (
                <button
                  key={yr}
                  onClick={() => onFilterChange({ fiscalYear: yr })}
                  className={`py-2 rounded-lg border font-mono text-center font-medium transition-all ${
                    filterState.fiscalYear === yr
                      ? 'bg-blue-600 border-blue-600 text-white font-bold shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {yr === 'all' ? 'Tất cả' : yr}
                </button>
              ))}
            </div>
          </div>

          {/* Service Type */}
          <div>
            <label className="font-bold text-slate-900 mb-2 flex items-center space-x-1.5 text-xs">
              <Briefcase className="w-4 h-4 text-indigo-600" />
              <span>Loại dịch vụ (Service Type)</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'all', label: 'Tất cả dịch vụ' },
                { id: 'Audit', label: 'Kiểm toán & Xát nhận' },
                { id: 'CFO', label: 'Tư vấn CFO & Tài chính' },
                { id: 'Consulting', label: 'Tư vấn Quản trị' },
                { id: 'Legal', label: 'Pháp lý & Hợp đồng' },
                { id: 'Tax', label: 'Tư vấn Thuế' },
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => onFilterChange({ serviceType: st.id })}
                  className={`px-3 py-2 rounded-lg border text-left font-medium transition-all flex items-center justify-between ${
                    filterState.serviceType === st.id
                      ? 'bg-indigo-600 border-indigo-600 text-white font-bold shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>{st.label}</span>
                  {filterState.serviceType === st.id && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="font-bold text-slate-900 mb-2 flex items-center space-x-1.5 text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Trạng thái Phê duyệt</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'all', label: 'Tất cả trạng thái' },
                { id: 'Approved', label: 'Đã duyệt (Approved)' },
                { id: 'Pending', label: 'Chờ duyệt (Pending)' },
                { id: 'Draft', label: 'Bản nháp (Draft)' },
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => onFilterChange({ status: st.id })}
                  className={`px-3 py-2 rounded-lg border text-left font-medium transition-all flex items-center justify-between ${
                    filterState.status === st.id
                      ? 'bg-emerald-600 border-emerald-600 text-white font-bold shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>{st.label}</span>
                  {filterState.status === st.id && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="font-bold text-slate-900 mb-2 flex items-center space-x-1.5 text-xs">
              <Tag className="w-4 h-4 text-purple-600" />
              <span>Thẻ Phân loại (Tags)</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {availableTags.map((tag) => {
                const selected = filterState.selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-2.5 py-1 rounded-full text-xs border transition-all ${
                      selected
                        ? 'bg-purple-600 border-purple-600 text-white font-semibold'
                        : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    #{tag}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center space-x-3">
          <button
            onClick={onResetFilters}
            className="flex-1 flex items-center justify-center space-x-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs py-2 rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Đặt lại bộ lọc</span>
          </button>

          <button
            onClick={onClose}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2 rounded-lg transition-colors"
          >
            Áp dụng
          </button>
        </div>
      </div>
    </div>
  );
};
