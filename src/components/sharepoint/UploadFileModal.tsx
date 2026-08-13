'use client';

import React from 'react';
import { X, UploadCloud, FileText, Lock, Sparkles, CheckCircle2 } from 'lucide-react';
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
}

export const UploadFileModal: React.FC<UploadFileModalProps> = ({
  isOpen,
  onClose,
  onUpload,
  isReadOnly,
  currentPathName,
}) => {
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [fileName, setFileName] = React.useState('');
  const [fiscalYear, setFiscalYear] = React.useState<number>(2025);
  const [serviceType, setServiceType] = React.useState<ServiceType>('Audit');
  const [status, setStatus] = React.useState<FileStatus>('Approved');
  const [tagsInput, setTagsInput] = React.useState('Hợp đồng, Báo cáo');
  const [uploading, setUploading] = React.useState(false);

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
    setTimeout(() => {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      onUpload({
        name: fileName || selectedFile?.name || 'Tài_liệu_mới.pdf',
        file: selectedFile,
        fiscalYear,
        serviceType,
        status,
        tags,
      });

      setUploading(false);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in select-none">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="p-4 bg-[#0F172A] text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-400/30">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Tải lên Tài liệu Mới</h3>
              <p className="text-[11px] text-slate-400 font-mono truncate max-w-[280px]">Vào: {currentPathName}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Read-Only Warning */}
        {isReadOnly && (
          <div className="p-3 bg-amber-100 border-b border-amber-300 text-amber-900 text-xs flex items-center space-x-2">
            <Lock className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Thư mục thuộc Khách hàng đã Archive (Read-Only). Không thể thêm file mới.</span>
          </div>
        )}

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* File Picker Dropzone */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">Chọn File tài liệu từ máy tính:</label>
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:border-blue-500 transition-colors bg-slate-50 cursor-pointer">
              <input
                type="file"
                disabled={isReadOnly}
                onChange={handleFileChange}
                className="hidden"
                id="file-upload-input"
              />
              <label htmlFor="file-upload-input" className="cursor-pointer block">
                <UploadCloud className="w-8 h-8 mx-auto text-blue-600 mb-1" />
                <p className="text-xs font-semibold text-slate-700">
                  {selectedFile ? selectedFile.name : 'Nhấp vào đây để chọn File (PDF, Excel, Word, Image)'}
                </p>
                <p className="text-[11px] text-slate-400">Dung lượng tối đa: 50MB</p>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">Tên tài liệu lưu trữ:</label>
            <input
              type="text"
              disabled={isReadOnly}
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="VD: Bao_cao_Kiem_toan_Taichinh_2025.pdf"
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              required
            />
          </div>

          {/* Metadata Selections */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Năm tài chính:</label>
              <select
                value={fiscalYear}
                onChange={(e) => setFiscalYear(Number(e.target.value))}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 font-mono bg-white"
              >
                <option value={2025}>2025</option>
                <option value={2024}>2024</option>
                <option value={2023}>2023</option>
                <option value={2022}>2022</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Loại dịch vụ:</label>
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value as ServiceType)}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
              >
                <option value="Audit">Kiểm toán</option>
                <option value="CFO">Tư vấn CFO</option>
                <option value="Consulting">Tư vấn Quản trị</option>
                <option value="Legal">Pháp lý</option>
                <option value="Tax">Tư vấn Thuế</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Trạng thái:</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as FileStatus)}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
              >
                <option value="Approved">Đã duyệt</option>
                <option value="Pending">Chờ duyệt</option>
                <option value="Draft">Bản nháp</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">Thẻ Tag (phân cách bởi dấu phẩy):</label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="VD: Hợp đồng, Báo cáo, Kiểm toán"
              className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-600"
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
              disabled={isReadOnly || uploading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs font-semibold py-2.5 rounded-lg transition-colors shadow-xs"
            >
              {uploading ? 'Đang tải lên Supabase Storage...' : 'Tải lên Tài liệu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
