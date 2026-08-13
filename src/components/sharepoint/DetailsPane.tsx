'use client';

import React from 'react';
import {
  X,
  Info,
  Folder,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  Tag,
  Clock,
  User,
  Shield,
  HardDrive,
  Calendar,
  Briefcase,
  CheckCircle2,
  Lock,
  Download,
  History,
} from 'lucide-react';
import { ClientFolder, FolderItem, DocumentFile, UserRole } from '@/types/sharepoint';

interface DetailsPaneProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClient: ClientFolder | null;
  selectedSubFolder: FolderItem | null;
  selectedFile: DocumentFile | null;
  userRole: UserRole;
  onOpenVersionHistory?: (file: DocumentFile) => void;
  onDownloadFile?: (file: DocumentFile) => void;
}

export const DetailsPane: React.FC<DetailsPaneProps> = ({
  isOpen,
  onClose,
  selectedClient,
  selectedSubFolder,
  selectedFile,
  userRole,
  onOpenVersionHistory,
  onDownloadFile,
}) => {
  if (!isOpen) return null;

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string, name: string) => {
    if (name.endsWith('.pdf') || mimeType.includes('pdf')) {
      return <FileText className="w-12 h-12 text-red-500" />;
    }
    if (name.endsWith('.xlsx') || name.endsWith('.xls') || mimeType.includes('excel') || mimeType.includes('spreadsheet')) {
      return <FileSpreadsheet className="w-12 h-12 text-emerald-600" />;
    }
    if (mimeType.includes('image')) {
      return <ImageIcon className="w-12 h-12 text-purple-500" />;
    }
    return <FileText className="w-12 h-12 text-blue-600" />;
  };

  return (
    <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs flex justify-end select-none animate-fade-in">
      <div className="w-full max-w-sm bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col justify-between overflow-y-auto">
        {/* Header */}
        <div className="p-4 bg-[#0F172A] text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Info className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-sm">Thông tin Chi tiết (Details)</h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Details */}
        <div className="p-5 flex-1 space-y-6 text-xs text-slate-800">
          {/* FILE DETAILS */}
          {selectedFile ? (
            <div className="space-y-5">
              {/* Visual Thumbnail Card */}
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center shadow-xs relative">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center mb-3">
                  {getFileIcon(selectedFile.mime_type, selectedFile.name)}
                </div>
                <h4 className="font-bold text-slate-900 text-sm break-words">{selectedFile.name}</h4>
                <div className="mt-2 flex items-center justify-center space-x-2">
                  <span className="bg-blue-600 text-white font-mono text-[10px] px-2 py-0.5 rounded-full font-bold">
                    Version v{selectedFile.current_version}
                  </span>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {selectedFile.status}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                {onDownloadFile && (
                  <button
                    onClick={() => onDownloadFile(selectedFile)}
                    className="flex items-center justify-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Tải về</span>
                  </button>
                )}
                {onOpenVersionHistory && (
                  <button
                    onClick={() => onOpenVersionHistory(selectedFile)}
                    className="flex items-center justify-center space-x-1 bg-purple-100 hover:bg-purple-200 text-purple-900 font-semibold py-2 rounded-lg border border-purple-300 transition-colors"
                  >
                    <History className="w-3.5 h-3.5 text-purple-600" />
                    <span>Lịch sử v{selectedFile.current_version}</span>
                  </button>
                )}
              </div>

              {/* Attributes */}
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center space-x-1.5 font-medium">
                    <HardDrive className="w-3.5 h-3.5 text-slate-400" />
                    <span>Dung lượng file:</span>
                  </span>
                  <span className="font-mono font-bold text-slate-900">{formatFileSize(selectedFile.file_size)}</span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center space-x-1.5 font-medium">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                    <span>Loại dịch vụ:</span>
                  </span>
                  <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    {selectedFile.service_type}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center space-x-1.5 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Năm tài chính:</span>
                  </span>
                  <span className="font-mono font-bold text-slate-900">{selectedFile.fiscal_year}</span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center space-x-1.5 font-medium">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Tải lên bởi:</span>
                  </span>
                  <span className="font-semibold text-slate-800">{selectedFile.created_by_name}</span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center space-x-1.5 font-medium">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Ngày tạo:</span>
                  </span>
                  <span className="font-mono text-slate-700">
                    {new Date(selectedFile.created_at).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              </div>

              {/* Tags */}
              <div className="pt-3 border-t border-slate-200">
                <span className="font-bold text-slate-900 block mb-1.5 flex items-center space-x-1">
                  <Tag className="w-3.5 h-3.5 text-purple-600" />
                  <span>Thẻ Metadata Tags:</span>
                </span>
                <div className="flex flex-wrap gap-1">
                  {selectedFile.tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded text-[11px]"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : selectedSubFolder ? (
            /* SUBFOLDER DETAILS */
            <div className="space-y-4">
              <div className="p-6 bg-blue-50/70 border border-blue-200 rounded-2xl text-center">
                <Folder className="w-16 h-16 mx-auto fill-blue-400 text-blue-600 mb-2" />
                <h4 className="font-bold text-slate-900 text-sm">{selectedSubFolder.name}</h4>
                <p className="text-xs text-slate-500 mt-1">Thư mục phân loại hệ thống chuẩn</p>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-200">
                <div className="flex justify-between">
                  <span className="text-slate-500">Khách hàng thuộc về:</span>
                  <span className="font-bold text-slate-900">{selectedClient?.folder_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Ngày tạo:</span>
                  <span className="font-mono">{new Date(selectedSubFolder.created_at).toLocaleDateString('vi-VN')}</span>
                </div>
              </div>
            </div>
          ) : selectedClient ? (
            /* CLIENT DETAILS */
            <div className="space-y-4">
              <div className="p-6 bg-amber-50/70 border border-amber-200 rounded-2xl text-center">
                <Folder className="w-16 h-16 mx-auto fill-amber-400 text-amber-600 mb-2" />
                <h4 className="font-bold text-slate-900 text-sm">{selectedClient.folder_name}</h4>
                <div className="mt-2">
                  {selectedClient.status === 'archived' ? (
                    <span className="bg-amber-200 text-amber-900 text-[11px] font-bold px-2 py-0.5 rounded-full inline-flex items-center">
                      <Lock className="w-3 h-3 mr-1 text-amber-800" /> Hồ sơ Read-Only (Archived)
                    </span>
                  ) : (
                    <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-full">
                      Hoạt động (Active Client)
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-200">
                <div className="flex justify-between">
                  <span className="text-slate-500">Mã Khách hàng:</span>
                  <span className="font-mono font-bold text-slate-900">{selectedClient.code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Người đại diện khởi tạo:</span>
                  <span className="font-semibold text-slate-800">{selectedClient.created_by_name || 'Admin'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Ngày khởi tạo:</span>
                  <span className="font-mono">{new Date(selectedClient.created_at).toLocaleDateString('vi-VN')}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500">
              <Info className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="font-semibold text-slate-700">Chưa chọn mục nào</p>
              <p className="text-xs text-slate-400">Chọn 1 file hoặc folder trong danh sách để xem thông tin chi tiết.</p>
            </div>
          )}

          {/* RBAC Access Permissions Footer Section */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
            <span className="font-bold text-slate-900 block flex items-center space-x-1 text-[11px]">
              <Shield className="w-3.5 h-3.5 text-blue-600" />
              <span>Quyền hạn truy cập RBAC:</span>
            </span>

            <div className="text-[11px] space-y-1 text-slate-600">
              <div className="flex items-center justify-between">
                <span>Vai trò hiện tại:</span>
                <span className="font-bold uppercase text-purple-700">{userRole}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Quyền ghi (Write Access):</span>
                <span className="font-semibold text-emerald-700">
                  {selectedClient?.status === 'archived' ? 'Bị khóa (Read-Only)' : 'Được phép'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-center">
          <button
            onClick={onClose}
            className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs py-2 rounded-lg transition-colors"
          >
            Đóng Panel
          </button>
        </div>
      </div>
    </div>
  );
};
