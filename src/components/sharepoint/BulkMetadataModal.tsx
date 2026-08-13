'use client';

import React, { useState } from 'react';
import { X, Tag, Sparkles, CheckCircle2 } from 'lucide-react';
import { ServiceType, FileStatus } from '@/types/sharepoint';

interface BulkMetadataModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  onApplyBulkMetadata: (data: {
    fiscalYear?: number;
    serviceType?: ServiceType;
    status?: FileStatus;
    addTags: string[];
  }) => void;
}

export const BulkMetadataModal: React.FC<BulkMetadataModalProps> = ({
  isOpen,
  onClose,
  selectedCount,
  onApplyBulkMetadata,
}) => {
  const [fiscalYear, setFiscalYear] = useState<number | ''>('');
  const [serviceType, setServiceType] = useState<ServiceType | ''>('');
  const [status, setStatus] = useState<FileStatus | ''>('');
  const [tagsInput, setTagsInput] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const addTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    onApplyBulkMetadata({
      fiscalYear: fiscalYear !== '' ? Number(fiscalYear) : undefined,
      serviceType: serviceType !== '' ? serviceType : undefined,
      status: status !== '' ? status : undefined,
      addTags,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in select-none">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="p-4 bg-[#0F172A] text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-400/30">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Gán Metadata Hàng Loạt</h3>
              <p className="text-[11px] text-slate-400">Cập nhật thông tin cho {selectedCount} mục đã chọn</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs text-slate-800">
          <div>
            <label className="block font-bold text-slate-800 mb-1">Đổi Năm tài chính hàng loạt:</label>
            <select
              value={fiscalYear}
              onChange={(e) => setFiscalYear(e.target.value ? Number(e.target.value) : '')}
              className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white font-mono"
            >
              <option value="">-- Giữ nguyên năm tài chính hiện tại --</option>
              <option value={2025}>Năm 2025</option>
              <option value={2024}>Năm 2024</option>
              <option value={2023}>Năm 2023</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">Đổi Loại dịch vụ hàng loạt:</label>
            <select
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value as ServiceType | '')}
              className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
            >
              <option value="">-- Giữ nguyên loại dịch vụ hiện tại --</option>
              <option value="Audit">Kiểm toán & Xác nhận</option>
              <option value="CFO">Tư vấn CFO & Tài chính</option>
              <option value="Consulting">Tư vấn Quản trị</option>
              <option value="Legal">Pháp lý & Hợp đồng</option>
              <option value="Tax">Tư vấn Thuế</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">Đổi Trạng thái duyệt hàng loạt:</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as FileStatus | '')}
              className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
            >
              <option value="">-- Giữ nguyên trạng thái hiện tại --</option>
              <option value="Approved">Đã duyệt (Approved)</option>
              <option value="Pending">Chờ duyệt (Pending)</option>
              <option value="Draft">Bản nháp (Draft)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">Bổ sung thẻ Tag (phân cách dấu phẩy):</label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="VD: Kiểm toán 2025, Hợp đồng Fica"
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-purple-600"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold py-2.5 rounded-lg transition-colors"
            >
              Hủy
            </button>

            <button
              type="submit"
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold py-2.5 rounded-lg transition-colors shadow-xs"
            >
              Cập nhật {selectedCount} mục
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
