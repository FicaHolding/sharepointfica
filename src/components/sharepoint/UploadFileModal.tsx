'use client';

import React, { useState, useEffect } from 'react';
import { X, UploadCloud, FileText, Lock, Sparkles, CheckCircle2, Camera, Image, FileUp } from 'lucide-react';
import { ServiceType, FileStatus } from '@/types/sharepoint';

interface UploadFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (data: {
    name: string;
    file: File | null;
    fiscalYear: number;
    serviceType: ServiceType;
    status: FileStatus;
    tags: string[];
  }) => void;
  isReadOnly: boolean;
  currentPathName: string;
  defaultServiceType?: ServiceType;
}

export const UploadFileModal: React.FC<UploadFileModalProps> = ({
  isOpen,
  onClose,
  onUpload,
  isReadOnly,
  currentPathName,
  defaultServiceType = 'CFO',
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [fiscalYear, setFiscalYear] = useState<number>(2025);
  const [serviceType, setServiceType] = useState<ServiceType>(defaultServiceType);
  const [status, setStatus] = useState<FileStatus>('Approved');
  const [tagsInput, setTagsInput] = useState('Hợp đồng, Báo cáo');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setServiceType(defaultServiceType || 'CFO');
    }
  }, [isOpen, defaultServiceType]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!fileName) {
        setFileName(file.name);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;

    setUploading(true);
    setProgress(20);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 25;
      });
    }, 150);

    setTimeout(() => {
      clearInterval(interval);
      setProgress(100);

      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      onUpload({
        name: fileName || selectedFile?.name || 'Tai_lieu_moi.pdf',
        file: selectedFile,
        fiscalYear,
        serviceType,
        status,
        tags,
      });

      setUploading(false);
      setProgress(0);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-50 p-3 md:p-4 animate-fade-in select-none">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 my-auto">
        {/* Header */}
        <div className="p-4 bg-[#0F172A] text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-400/30">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Tải lên File Tài liệu Mới</h3>
              <p className="text-[11px] text-slate-400 font-mono truncate max-w-xs">{currentPathName}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Path Context Banner */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileUp className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="font-semibold text-[11px]">Vị trí lưu: <strong className="text-blue-800 font-mono">{currentPathName}</strong></span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-200 text-blue-800 uppercase font-mono">
              {serviceType}
            </span>
          </div>

          {/* File Picker */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">Chọn File từ Máy tính (*)</label>
            <input
              type="file"
              onChange={handleFileChange}
              className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border border-slate-300 rounded-xl cursor-pointer min-h-[44px] flex items-center"
            />
          </div>

          {/* File Name */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Tên Hiển thị Tài liệu (*)</label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="VD: HDDV07_CFO_FICA-SHK.pdf"
              className="w-full p-2.5 rounded-xl border border-slate-300 font-medium focus:outline-none focus:border-blue-600 min-h-[44px]"
              required
            />
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Phân loại Dịch vụ</label>
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value as ServiceType)}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-bold bg-white focus:outline-none focus:border-blue-600 min-h-[44px]"
              >
                <option value="Audit">Audit (Kiểm toán)</option>
                <option value="CFO">CFO (Tư vấn CFO)</option>
                <option value="Consulting">Consulting (Tư vấn ĐT)</option>
                <option value="Tax">Tax (Tư vấn Thuế)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Trạng thái Phê duyệt</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as FileStatus)}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold bg-white focus:outline-none focus:border-blue-600 min-h-[44px]"
              >
                <option value="Approved">Approved (Đã duyệt)</option>
                <option value="Pending">Pending (Chờ duyệt)</option>
                <option value="Draft">Draft (Bản nháp)</option>
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Thẻ Tag Metadata (phân cách bằng dấu phẩy)</label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="VD: Hợp đồng, Audit, 2025"
              className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-600 min-h-[44px]"
            />
          </div>

          {/* Upload Progress Bar */}
          {uploading && (
            <div className="space-y-1.5 animate-fade-in">
              <div className="flex justify-between text-[11px] font-bold text-blue-700">
                <span>Đang tải lên Supabase Private Storage & ghi CSDL...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                <div
                  className="bg-blue-600 h-full transition-all duration-200 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="pt-2 flex justify-end space-x-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors min-h-[44px]"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={uploading || isReadOnly}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center space-x-2 shadow-md transition-all disabled:opacity-50 min-h-[44px]"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Tải lên File Ngay</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
