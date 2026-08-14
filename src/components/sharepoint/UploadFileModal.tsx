'use client';

import React from 'react';
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
  const [progress, setProgress] = React.useState(0);

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
    }, 700);
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
              <h3 className="font-bold text-sm">Tải lên Tài liệu Mới</h3>
              <p className="text-[11px] text-slate-400 font-mono truncate max-w-[220px] sm:max-w-[280px]">
                Vào: {currentPathName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
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
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Mobile Friendly File Selector (Camera / Photo / Files) */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Chọn File tài liệu từ Máy tính hoặc Điện thoại:
            </label>
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:border-blue-500 transition-colors bg-slate-50 cursor-pointer relative">
              <input
                type="file"
                disabled={isReadOnly || uploading}
                onChange={handleFileChange}
                accept="image/*,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="hidden"
                id="file-upload-input"
              />
              <label htmlFor="file-upload-input" className="cursor-pointer block space-y-2">
                <UploadCloud className="w-10 h-10 mx-auto text-blue-600" />
                <p className="text-xs font-bold text-slate-800">
                  {selectedFile ? selectedFile.name : 'Nhấp vào đây để chọn File (PDF, Excel, Word, Ảnh)'}
                </p>
                <div className="flex items-center justify-center space-x-2 text-[11px] text-slate-500 pt-1">
                  <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-medium flex items-center space-x-1">
                    <FileUp className="w-3 h-3" />
                    <span>File Manager</span>
                  </span>
                  <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-medium flex items-center space-x-1">
                    <Camera className="w-3 h-3" />
                    <span>Camera / Thư viện</span>
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Dynamic Progress Bar */}
          {uploading && (
            <div className="space-y-1.5 p-3 bg-blue-50 border border-blue-200 rounded-xl animate-in fade-in">
              <div className="flex items-center justify-between text-xs text-blue-900 font-bold">
                <span>Đang tải file lên Supabase Storage...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">Tên tài liệu lưu trữ:</label>
            <input
              type="text"
              disabled={isReadOnly || uploading}
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="VD: Bao_cao_Kiem_toan_Taichinh_2025.pdf"
              className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-600 min-h-[44px]"
              required
            />
          </div>

          {/* Metadata Selections */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Năm tài chính:</label>
              <select
                value={fiscalYear}
                disabled={uploading}
                onChange={(e) => setFiscalYear(Number(e.target.value))}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-mono bg-white min-h-[44px]"
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
                disabled={uploading}
                onChange={(e) => setServiceType(e.target.value as ServiceType)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white min-h-[44px]"
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
                disabled={uploading}
                onChange={(e) => setStatus(e.target.value as FileStatus)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white min-h-[44px]"
              >
                <option value="Approved">Đã duyệt</option>
                <option value="Pending">Chờ duyệt</option>
                <option value="Draft">Bản nháp</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">Thẻ Tag (phân cách bằng dấu phẩy):</label>
            <input
              type="text"
              disabled={isReadOnly || uploading}
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="VD: Hợp đồng, Báo cáo, CFO"
              className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-600 min-h-[44px]"
            />
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors min-h-[44px]"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isReadOnly || uploading}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-md transition-colors disabled:opacity-50 min-h-[44px] flex items-center space-x-1.5"
            >
              <UploadCloud className="w-4 h-4" />
              <span>{uploading ? 'Đang Upload...' : 'Lưu & Upload File'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
