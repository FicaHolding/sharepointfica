'use client';

import React from 'react';
import {
  Folder,
  FileText,
  FileSpreadsheet,
  FileCode,
  Image as ImageIcon,
  MoreVertical,
  History,
  Download,
  Archive,
  RotateCcw,
  Trash2,
  Lock,
  Tag,
  CheckCircle2,
  Clock,
  AlertCircle,
  FolderOpen,
} from 'lucide-react';
import { ClientFolder, FolderItem, DocumentFile, FileStatus } from '@/types/sharepoint';

interface DocumentListViewProps {
  clients: ClientFolder[];
  subFolders: FolderItem[];
  files: DocumentFile[];
  currentClient: ClientFolder | null;
  currentSubFolder: FolderItem | null;
  onSelectClient: (client: ClientFolder) => void;
  onSelectSubFolder: (subFolder: FolderItem) => void;
  onOpenVersionHistory: (file: DocumentFile) => void;
  onDownloadFile: (file: DocumentFile) => void;
  onArchiveClient: (client: ClientFolder) => void;
  onRestoreClient: (client: ClientFolder) => void;
  onDeleteFile: (fileId: string) => void;
  isReadOnly: boolean;
}

export const DocumentListView: React.FC<DocumentListViewProps> = ({
  clients,
  subFolders,
  files,
  currentClient,
  currentSubFolder,
  onSelectClient,
  onSelectSubFolder,
  onOpenVersionHistory,
  onDownloadFile,
  onArchiveClient,
  onRestoreClient,
  onDeleteFile,
  isReadOnly,
}) => {
  const [activeMenuId, setActiveMenuId] = React.useState<string | null>(null);

  const getFileIcon = (mimeType: string, name: string) => {
    if (name.endsWith('.pdf') || mimeType.includes('pdf')) {
      return <FileText className="w-5 h-5 text-red-500" />;
    }
    if (name.endsWith('.xlsx') || name.endsWith('.xls') || mimeType.includes('excel') || mimeType.includes('spreadsheet')) {
      return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
    }
    if (name.endsWith('.docx') || name.endsWith('.doc') || mimeType.includes('word')) {
      return <FileText className="w-5 h-5 text-blue-600" />;
    }
    if (mimeType.includes('image')) {
      return <ImageIcon className="w-5 h-5 text-purple-500" />;
    }
    return <FileCode className="w-5 h-5 text-slate-500" />;
  };

  const getStatusBadge = (status: FileStatus | 'active' | 'archived') => {
    switch (status) {
      case 'Approved':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Đã duyệt</span>
          </span>
        );
      case 'Pending':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>Chờ duyệt</span>
          </span>
        );
      case 'Draft':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-300">
            <AlertCircle className="w-3 h-3 text-slate-500" />
            <span>Bản nháp</span>
          </span>
        );
      case 'archived':
      case 'Archived':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-100 text-amber-900 border border-amber-300">
            <Lock className="w-3 h-3 text-amber-700" />
            <span>Đã Lưu trữ</span>
          </span>
        );
      case 'active':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <CheckCircle2 className="w-3 h-3 text-blue-600" />
            <span>Hoạt động</span>
          </span>
        );
      default:
        return null;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const isFolderView = !currentClient;
  const isSubFolderView = currentClient && !currentSubFolder;
  const isFileView = currentClient && currentSubFolder;

  return (
    <div className="bg-white border-t border-slate-200 shadow-xs overflow-x-auto">
      <table className="w-full text-left text-xs border-collapse">
        {/* Table Header */}
        <thead>
          <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold select-none">
            <th className="p-3 w-10 text-center">
              <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
            </th>
            <th className="p-3 min-w-[280px]">Tên Tài liệu / Thư mục</th>
            <th className="p-3 min-w-[130px]">Phân loại / Năm</th>
            <th className="p-3 min-w-[130px]">Cập nhật lần cuối</th>
            <th className="p-3 min-w-[120px]">Người cập nhật</th>
            <th className="p-3 min-w-[110px]">Trạng thái</th>
            <th className="p-3 min-w-[150px]">Thẻ Tag</th>
            <th className="p-3 w-20 text-center">Thao tác</th>
          </tr>
        </thead>

        {/* Table Body */}
        <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
          {/* LEVEL 1: Render Root Client Folders */}
          {isFolderView &&
            clients.map((client) => (
              <tr
                key={client.id}
                onClick={() => onSelectClient(client)}
                className={`hover:bg-blue-50/60 cursor-pointer transition-colors ${
                  client.status === 'archived' ? 'bg-amber-50/30' : ''
                }`}
              >
                <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                  <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                </td>
                <td className="p-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-1.5 rounded-lg bg-amber-100/80 border border-amber-200 text-amber-700">
                      <Folder className="w-5 h-5 fill-amber-400 text-amber-600" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm hover:text-blue-600 transition-colors flex items-center space-x-2">
                        <span>{client.folder_name}</span>
                        {client.status === 'archived' && (
                          <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-mono font-normal">
                            Read-Only
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 font-normal">Mã KH: {client.code} | {client.total_files_count || 4} thư mục con</p>
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-mono border border-slate-200">
                    Khách hàng
                  </span>
                </td>
                <td className="p-3 text-slate-600 font-mono text-[11px]">
                  {new Date(client.updated_at).toLocaleDateString('vi-VN')}
                </td>
                <td className="p-3 text-slate-600">{client.created_by_name || 'Admin'}</td>
                <td className="p-3">{getStatusBadge(client.status)}</td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded">
                      Fica Client
                    </span>
                  </div>
                </td>
                <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                  <div className="relative">
                    <button
                      onClick={() => setActiveMenuId(activeMenuId === client.id ? null : client.id)}
                      className="p-1 hover:bg-slate-200 rounded text-slate-600"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {activeMenuId === client.id && (
                      <div className="absolute right-0 mt-1 w-44 bg-white border border-slate-200 rounded-md shadow-lg py-1 z-50 text-left">
                        <button
                          onClick={() => {
                            onSelectClient(client);
                            setActiveMenuId(null);
                          }}
                          className="w-full px-3 py-1.5 text-xs text-slate-700 hover:bg-blue-50 flex items-center space-x-2"
                        >
                          <FolderOpen className="w-3.5 h-3.5 text-blue-600" />
                          <span>Mở thư mục</span>
                        </button>
                        {client.status === 'active' ? (
                          <button
                            onClick={() => {
                              onArchiveClient(client);
                              setActiveMenuId(null);
                            }}
                            className="w-full px-3 py-1.5 text-xs text-amber-700 hover:bg-amber-50 flex items-center space-x-2"
                          >
                            <Archive className="w-3.5 h-3.5 text-amber-600" />
                            <span>Archive Hồ sơ</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              onRestoreClient(client);
                              setActiveMenuId(null);
                            }}
                            className="w-full px-3 py-1.5 text-xs text-emerald-700 hover:bg-emerald-50 flex items-center space-x-2"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Restore Hồ sơ</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}

          {/* LEVEL 2: Render Standard 4 Subfolders */}
          {isSubFolderView &&
            subFolders.map((sf) => (
              <tr
                key={sf.id}
                onClick={() => onSelectSubFolder(sf)}
                className="hover:bg-blue-50/60 cursor-pointer transition-colors"
              >
                <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                  <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                </td>
                <td className="p-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-1.5 rounded-lg bg-blue-100/80 border border-blue-200 text-blue-700">
                      <Folder className="w-5 h-5 fill-blue-400 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 hover:text-blue-600 transition-colors">
                        {sf.name}
                      </div>
                      <p className="text-[11px] text-slate-500 font-normal">Thư mục hệ thống chuẩn</p>
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[11px] border border-indigo-200">
                    Phân loại chuẩn
                  </span>
                </td>
                <td className="p-3 text-slate-600 font-mono text-[11px]">
                  {new Date(sf.updated_at).toLocaleDateString('vi-VN')}
                </td>
                <td className="p-3 text-slate-600">Fica System</td>
                <td className="p-3">{getStatusBadge(isReadOnly ? 'archived' : 'active')}</td>
                <td className="p-3">
                  <span className="text-[10px] bg-slate-100 text-slate-700 border border-slate-200 px-1.5 py-0.5 rounded">
                    Chính thức
                  </span>
                </td>
                <td className="p-3 text-center">
                  <button className="p-1 hover:bg-slate-200 rounded text-slate-600">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}

          {/* LEVEL 3: Render Document Files */}
          {(isFileView || (!isFolderView && !isSubFolderView)) &&
            files.map((file) => (
              <tr key={file.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-3 text-center">
                  <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                </td>
                <td className="p-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-1.5 rounded-lg bg-slate-100 border border-slate-200">
                      {getFileIcon(file.mime_type, file.name)}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 hover:text-blue-600 transition-colors flex items-center space-x-2">
                        <span>{file.name}</span>
                        <button
                          onClick={() => onOpenVersionHistory(file)}
                          className="bg-blue-100 text-blue-800 text-[10px] font-mono px-1.5 py-0.2 rounded hover:bg-blue-200 font-bold border border-blue-300"
                        >
                          v{file.current_version}
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono">{formatFileSize(file.file_size)}</p>
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex flex-col space-y-0.5">
                    <span className="text-[11px] font-bold text-slate-700">{file.service_type}</span>
                    <span className="text-[10px] text-slate-500 font-mono">Năm {file.fiscal_year}</span>
                  </div>
                </td>
                <td className="p-3 text-slate-600 font-mono text-[11px]">
                  {new Date(file.updated_at).toLocaleDateString('vi-VN')}
                </td>
                <td className="p-3 text-slate-600">{file.modified_by_name || file.created_by_name}</td>
                <td className="p-3">{getStatusBadge(isReadOnly ? 'Archived' : file.status)}</td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    {file.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] bg-slate-100 text-slate-700 border border-slate-200 px-1.5 py-0.5 rounded flex items-center space-x-1"
                      >
                        <Tag className="w-2.5 h-2.5 text-slate-400" />
                        <span>{tag}</span>
                      </span>
                    ))}
                  </div>
                </td>
                <td className="p-3 text-center">
                  <div className="relative">
                    <button
                      onClick={() => setActiveMenuId(activeMenuId === file.id ? null : file.id)}
                      className="p-1 hover:bg-slate-200 rounded text-slate-600"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {activeMenuId === file.id && (
                      <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded-md shadow-lg py-1 z-50 text-left">
                        <button
                          onClick={() => {
                            onDownloadFile(file);
                            setActiveMenuId(null);
                          }}
                          className="w-full px-3 py-1.5 text-xs text-slate-700 hover:bg-blue-50 flex items-center space-x-2"
                        >
                          <Download className="w-3.5 h-3.5 text-blue-600" />
                          <span>Tải xuống (Download)</span>
                        </button>

                        <button
                          onClick={() => {
                            onOpenVersionHistory(file);
                            setActiveMenuId(null);
                          }}
                          className="w-full px-3 py-1.5 text-xs text-slate-700 hover:bg-blue-50 flex items-center space-x-2"
                        >
                          <History className="w-3.5 h-3.5 text-purple-600" />
                          <span>Lịch sử phiên bản</span>
                        </button>

                        {!isReadOnly && (
                          <button
                            onClick={() => {
                              onDeleteFile(file.id);
                              setActiveMenuId(null);
                            }}
                            className="w-full px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 flex items-center space-x-2 border-t border-slate-100"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                            <span>Xóa tài liệu</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}

          {/* Empty state check */}
          {isFolderView && clients.length === 0 && (
            <tr>
              <td colSpan={8} className="p-8 text-center text-slate-500">
                <Folder className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="font-semibold text-slate-700">Chưa có khách hàng nào</p>
                <p className="text-xs text-slate-400">Bấm "Tạo Khách hàng mới" để khởi tạo folder chuẩn 4 thư mục con.</p>
              </td>
            </tr>
          )}

          {isFileView && files.length === 0 && (
            <tr>
              <td colSpan={8} className="p-8 text-center text-slate-500">
                <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="font-semibold text-slate-700">Thư mục trống</p>
                <p className="text-xs text-slate-400">Bấm "Tải lên File" để nạp tài liệu vào thư mục này.</p>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
