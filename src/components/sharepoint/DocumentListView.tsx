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
  Eye,
  Info,
  Edit3,
  X,
} from 'lucide-react';
import { ClientFolder, FolderItem, DocumentFile, FileStatus } from '@/types/sharepoint';
import { ContextMenuPosition } from './ContextMenu';

interface DocumentListViewProps {
  clients: ClientFolder[];
  subFolders: FolderItem[];
  files: DocumentFile[];
  currentClient: ClientFolder | null;
  currentSubFolder: FolderItem | null;
  selectedClientIds: string[];
  selectedFileIds: string[];
  onToggleSelectClient: (id: string) => void;
  onToggleSelectFile: (id: string) => void;
  onToggleSelectAll: () => void;
  onSelectClient: (client: ClientFolder) => void;
  onSelectSubFolder: (subFolder: FolderItem) => void;
  onPreviewFile: (file: DocumentFile) => void;
  onOpenVersionHistory: (file: DocumentFile) => void;
  onOpenDetailsPane: (item: { client?: ClientFolder; subFolder?: FolderItem; file?: DocumentFile }) => void;
  onDownloadFile: (file: DocumentFile) => void;
  onArchiveClient: (client: ClientFolder) => void;
  onRestoreClient: (client: ClientFolder) => void;
  onDeleteFile: (fileId: string) => void;
  onOpenContextMenu: (pos: ContextMenuPosition) => void;
  onRenameClientModal: (client: ClientFolder) => void;
  onDeleteClientModal: (client: ClientFolder) => void;
  isReadOnly: boolean;
}

export const DocumentListView: React.FC<DocumentListViewProps> = ({
  clients,
  subFolders,
  files,
  currentClient,
  currentSubFolder,
  selectedClientIds,
  selectedFileIds,
  onToggleSelectClient,
  onToggleSelectFile,
  onToggleSelectAll,
  onSelectClient,
  onSelectSubFolder,
  onPreviewFile,
  onOpenVersionHistory,
  onOpenDetailsPane,
  onDownloadFile,
  onArchiveClient,
  onRestoreClient,
  onDeleteFile,
  onOpenContextMenu,
  onRenameClientModal,
  onDeleteClientModal,
  isReadOnly,
}) => {
  const [activeMenuId, setActiveMenuId] = React.useState<string | null>(null);
  const [mobileActionItem, setMobileActionItem] = React.useState<{
    client?: ClientFolder;
    subFolder?: FolderItem;
    file?: DocumentFile;
  } | null>(null);

  // Close active dropdown menu when clicking anywhere outside
  React.useEffect(() => {
    const handleGlobalClick = () => setActiveMenuId(null);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  const formatDateTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const hours = d.getHours().toString().padStart(2, '0');
      const minutes = d.getMinutes().toString().padStart(2, '0');
      const day = d.getDate().toString().padStart(2, '0');
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const year = d.getFullYear();
      return `${hours}:${minutes} ${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  const getFileIcon = (mimeType: string, name: string) => {
    if (name.endsWith('.pdf') || mimeType.includes('pdf')) {
      return <FileText className="w-6 h-6 text-red-500 shrink-0" />;
    }
    if (name.endsWith('.xlsx') || name.endsWith('.xls') || mimeType.includes('excel') || mimeType.includes('spreadsheet')) {
      return <FileSpreadsheet className="w-6 h-6 text-emerald-600 shrink-0" />;
    }
    if (name.endsWith('.docx') || name.endsWith('.doc') || mimeType.includes('word')) {
      return <FileText className="w-6 h-6 text-blue-600 shrink-0" />;
    }
    if (mimeType.includes('image')) {
      return <ImageIcon className="w-6 h-6 text-purple-500 shrink-0" />;
    }
    return <FileCode className="w-6 h-6 text-slate-500 shrink-0" />;
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

  const allCount = isFolderView ? clients.length : files.length;
  const selectedCount = isFolderView ? selectedClientIds.length : selectedFileIds.length;
  const isAllSelected = allCount > 0 && selectedCount === allCount;

  return (
    <div className="bg-white border-t border-slate-200 shadow-xs select-none overflow-visible pb-24">
      {/* MOBILE CARD VIEW FOR SMARTPHONES (< md) */}
      <div className="block md:hidden space-y-3 p-3 bg-slate-100 pb-20">
        {/* Render Mobile Client Cards */}
        {isFolderView &&
          clients.map((client) => {
            const isSelected = selectedClientIds.includes(client.id);
            return (
              <div
                key={client.id}
                onClick={() => onSelectClient(client)}
                className={`p-3.5 rounded-xl border bg-white shadow-xs active:bg-slate-50 cursor-pointer space-y-2 min-h-[44px] ${
                  isSelected ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-50/50' : 'border-slate-200'
                }`}
              >
                {/* Row 1: Folder Icon + Title + Action Button */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div className="p-2 rounded-lg bg-amber-100/80 border border-amber-200 text-amber-700 shrink-0">
                      <Folder className="w-6 h-6 fill-amber-400 text-amber-600" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-900 text-sm truncate" title={client.folder_name}>
                        {client.folder_name}
                      </h4>
                      <p className="text-[11px] text-slate-500 font-mono">Mã KH: {client.code}</p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMobileActionItem({ client });
                    }}
                    className="p-2 text-slate-500 hover:text-slate-900 rounded-lg border border-slate-200 shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>

                {/* Row 2: Badges */}
                <div className="flex items-center space-x-2">
                  {getStatusBadge(client.status)}
                </div>

                {/* Row 3: Meta Info */}
                <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
                  <span>Cập nhật: {formatDateTime(client.updated_at)}</span>
                  <span>Tạo bởi: {client.created_by_name || 'Admin'}</span>
                </div>
              </div>
            );
          })}

        {/* Render Mobile SubFolder Cards */}
        {isSubFolderView &&
          subFolders.map((subFolder) => (
            <div
              key={subFolder.id}
              onClick={() => onSelectSubFolder(subFolder)}
              className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-xs active:bg-slate-50 cursor-pointer flex items-center justify-between min-h-[52px]"
            >
              <div className="flex items-center space-x-3 min-w-0">
                <div className="p-2 rounded-lg bg-blue-100/80 border border-blue-200 text-blue-700 shrink-0">
                  <FolderOpen className="w-6 h-6 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-slate-900 text-sm truncate">{subFolder.name}</h4>
                  <p className="text-[11px] text-slate-500">Thư mục hệ thống Fica</p>
                </div>
              </div>
              <span className="text-xs text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded-md border border-blue-200">
                Mở →
              </span>
            </div>
          ))}

        {/* Render Mobile File Cards */}
        {isFileView &&
          files.map((file) => {
            const isSelected = selectedFileIds.includes(file.id);
            return (
              <div
                key={file.id}
                onClick={() => onPreviewFile(file)}
                className={`p-3.5 rounded-xl border bg-white shadow-xs active:bg-slate-50 cursor-pointer space-y-2.5 min-h-[44px] ${
                  isSelected ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-50/50' : 'border-slate-200'
                }`}
              >
                {/* Row 1: File Icon + File Name + Action Sheet Button */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div className="shrink-0">{getFileIcon(file.mime_type, file.name)}</div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-900 text-xs md:text-sm leading-snug truncate" title={file.name}>
                        {file.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {formatFileSize(file.file_size)} • v{file.current_version}.0
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMobileActionItem({ file });
                    }}
                    className="p-2 text-slate-500 hover:text-slate-900 rounded-lg border border-slate-200 shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>

                {/* Row 2: Status Badge & Date */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px] text-slate-500">
                  <span>Cập nhật: {formatDateTime(file.updated_at)}</span>
                  {getStatusBadge(file.status)}
                </div>

                {/* Row 3: Tag Chips */}
                {file.tags && file.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {file.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="text-[10px] bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.5 rounded flex items-center space-x-1"
                      >
                        <Tag className="w-2.5 h-2.5 text-slate-400" />
                        <span>{tag}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

        {/* Empty States on Mobile */}
        {isFolderView && clients.length === 0 && (
          <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
            <Folder className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-700 text-sm">Chưa có khách hàng nào</p>
          </div>
        )}

        {isFileView && files.length === 0 && (
          <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
            <FileText className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-700 text-sm">Thư mục trống</p>
            <p className="text-xs text-slate-400 mt-1">Bấm nút "Upload File" ở góc trên để tải lên tài liệu mới.</p>
          </div>
        )}
      </div>

      {/* DESKTOP MULTI-COLUMN TABLE VIEW (Hidden on Mobile < md) */}
      <table className="hidden md:table w-full text-left text-xs border-collapse table-fixed">
        {/* Table Header */}
        <thead>
          <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold select-none">
            <th className="p-3 w-10 text-center">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={onToggleSelectAll}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </th>
            <th className="p-3 w-auto min-w-[240px]">Tên Tài liệu / Thư mục</th>
            <th className="p-3 w-36">Cập nhật lần cuối</th>
            <th className="p-3 w-32">Người cập nhật</th>
            <th className="p-3 w-28">Trạng thái</th>
            <th className="p-3 w-40">Thẻ Tag</th>
            <th className="p-3 w-20 text-center">Thao tác</th>
          </tr>
        </thead>

        {/* Table Body */}
        <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
          {/* LEVEL 1: Render Root Client Folders */}
          {isFolderView &&
            clients.map((client, idx) => {
              const isSelected = selectedClientIds.includes(client.id);
              const isNearBottom = idx >= clients.length - 2 && clients.length >= 2;

              return (
                <tr
                  key={client.id}
                  onClick={() => onSelectClient(client)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    onOpenContextMenu({ x: e.clientX, y: e.clientY, client });
                  }}
                  className={`hover:bg-blue-50/60 cursor-pointer transition-colors ${
                    isSelected ? 'bg-blue-50/90 font-bold' : client.status === 'archived' ? 'bg-amber-50/30' : ''
                  }`}
                >
                  <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelectClient(client.id)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </td>
                  <td className="p-3 min-w-0">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="p-1.5 rounded-lg bg-amber-100/80 border border-amber-200 text-amber-700 shrink-0">
                        <Folder className="w-5 h-5 fill-amber-400 text-amber-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-slate-900 text-sm hover:text-blue-600 transition-colors flex items-center space-x-2 truncate" title={client.folder_name}>
                          <span className="truncate">{client.folder_name}</span>
                          {client.status === 'archived' && (
                            <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-mono font-normal shrink-0">
                              Read-Only
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 font-normal truncate">
                          Mã KH: {client.code} | {client.total_files_count || 4} thư mục con
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                    {formatDateTime(client.updated_at)}
                  </td>
                  <td className="p-3 text-slate-600 truncate">{client.created_by_name || 'Admin'}</td>
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
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(activeMenuId === client.id ? null : client.id);
                        }}
                        className="p-1 hover:bg-slate-200 rounded text-slate-600 min-w-[36px] min-h-[36px] flex items-center justify-center mx-auto"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {activeMenuId === client.id && (
                        <div
                          className={`absolute right-0 ${
                            isNearBottom ? 'bottom-full mb-1' : 'top-full mt-1'
                          } w-52 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 text-left`}
                        >
                          <button
                            onClick={() => {
                              onSelectClient(client);
                              setActiveMenuId(null);
                            }}
                            className="w-full px-3.5 py-2 text-xs text-slate-700 hover:bg-blue-50 flex items-center space-x-2.5 font-medium"
                          >
                            <FolderOpen className="w-4 h-4 text-blue-600" />
                            <span>Mở thư mục</span>
                          </button>
                          <button
                            onClick={() => {
                              onRenameClientModal(client);
                              setActiveMenuId(null);
                            }}
                            className="w-full px-3.5 py-2 text-xs text-slate-700 hover:bg-blue-50 flex items-center space-x-2.5 font-medium"
                          >
                            <Edit3 className="w-4 h-4 text-blue-600" />
                            <span>Đổi tên thư mục</span>
                          </button>
                          {client.status === 'active' ? (
                            <button
                              onClick={() => {
                                onArchiveClient(client);
                                setActiveMenuId(null);
                              }}
                              className="w-full px-3.5 py-2 text-xs text-amber-700 hover:bg-amber-50 flex items-center space-x-2.5 font-medium"
                            >
                              <Archive className="w-4 h-4 text-amber-600" />
                              <span>Chuyển vào Kho lưu trữ</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                onRestoreClient(client);
                                setActiveMenuId(null);
                              }}
                              className="w-full px-3.5 py-2 text-xs text-emerald-700 hover:bg-emerald-50 flex items-center space-x-2.5 font-medium"
                            >
                              <RotateCcw className="w-4 h-4 text-emerald-600" />
                              <span>Khôi phục thư mục</span>
                            </button>
                          )}
                          <button
                            onClick={() => {
                              onDeleteClientModal(client);
                              setActiveMenuId(null);
                            }}
                            className="w-full px-3.5 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center space-x-2.5 font-medium border-t border-slate-100 mt-1 pt-1.5"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                            <span>Xóa thư mục</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}

          {/* LEVEL 2: Render SubFolders */}
          {isSubFolderView &&
            subFolders.map((subFolder) => (
              <tr
                key={subFolder.id}
                onClick={() => onSelectSubFolder(subFolder)}
                className="hover:bg-blue-50/60 cursor-pointer transition-colors"
              >
                <td className="p-3 text-center">
                  <input type="checkbox" disabled className="rounded border-slate-300 opacity-50 cursor-not-allowed" />
                </td>
                <td className="p-3 min-w-0">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="p-1.5 rounded-lg bg-blue-100/80 border border-blue-200 text-blue-700 shrink-0">
                      <FolderOpen className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="font-bold text-slate-900 text-sm hover:text-blue-600 transition-colors truncate" title={subFolder.name}>
                      {subFolder.name}
                    </span>
                  </div>
                </td>
                <td className="p-3 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                  {formatDateTime(subFolder.updated_at)}
                </td>
                <td className="p-3 text-slate-600">Fica Engine</td>
                <td className="p-3">
                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                    <CheckCircle2 className="w-3 h-3 text-blue-600" />
                    <span>Mặc định</span>
                  </span>
                </td>
                <td className="p-3">
                  <span className="text-[10px] bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.5 rounded">
                    System Subfolder
                  </span>
                </td>
                <td className="p-3 text-center">
                  <button className="p-1 hover:bg-slate-200 rounded text-slate-400 cursor-not-allowed">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}

          {/* LEVEL 3: Render Document Files */}
          {isFileView &&
            files.map((file, idx) => {
              const isSelected = selectedFileIds.includes(file.id);
              const isNearBottom = idx >= 1 || files.length <= 3;

              return (
                <tr
                  key={file.id}
                  onClick={() => onPreviewFile(file)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    onOpenContextMenu({ x: e.clientX, y: e.clientY, file });
                  }}
                  className={`hover:bg-blue-50/60 cursor-pointer transition-colors ${
                    isSelected ? 'bg-blue-50/90 font-bold' : ''
                  }`}
                >
                  <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelectFile(file.id)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </td>
                  <td className="p-3 min-w-0">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="shrink-0">{getFileIcon(file.mime_type, file.name)}</div>
                      <div className="min-w-0 flex-1">
                        <div
                          className="font-bold text-slate-900 text-xs md:text-sm hover:text-blue-600 transition-colors truncate"
                          title={file.name}
                        >
                          {file.name}
                        </div>
                        <p className="text-[11px] text-slate-500 font-mono font-normal">
                          {formatFileSize(file.file_size)} • v{file.current_version}.0
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                    {formatDateTime(file.updated_at)}
                  </td>
                  <td className="p-3 text-slate-600 truncate">{file.created_by_name || 'Admin'}</td>
                  <td className="p-3">{getStatusBadge(file.status)}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {file.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="text-[10px] bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.5 rounded flex items-center space-x-1"
                        >
                          <Tag className="w-2.5 h-2.5 text-slate-400" />
                          <span>{tag}</span>
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(activeMenuId === file.id ? null : file.id);
                        }}
                        className="p-1 hover:bg-slate-200 rounded text-slate-600 min-w-[36px] min-h-[36px] flex items-center justify-center mx-auto"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {activeMenuId === file.id && (
                        <div
                          className={`absolute right-0 ${
                            isNearBottom ? 'bottom-full mb-1' : 'top-full mt-1'
                          } w-52 bg-white border border-slate-200 rounded-xl shadow-2xl py-1.5 z-50 text-left max-h-72 overflow-y-auto`}
                        >
                          <button
                            onClick={() => {
                              onPreviewFile(file);
                              setActiveMenuId(null);
                            }}
                            className="w-full px-3.5 py-2 text-xs text-slate-700 hover:bg-blue-50 flex items-center space-x-2.5 font-medium"
                          >
                            <Eye className="w-4 h-4 text-blue-600" />
                            <span>Xem trước file</span>
                          </button>
                          <button
                            onClick={() => {
                              onOpenDetailsPane({ file });
                              setActiveMenuId(null);
                            }}
                            className="w-full px-3.5 py-2 text-xs text-slate-700 hover:bg-blue-50 flex items-center space-x-2.5 font-medium"
                          >
                            <Info className="w-4 h-4 text-blue-600" />
                            <span>Xem chi tiết Metadata</span>
                          </button>
                          <button
                            onClick={() => {
                              onDownloadFile(file);
                              setActiveMenuId(null);
                            }}
                            className="w-full px-3.5 py-2 text-xs text-slate-700 hover:bg-blue-50 flex items-center space-x-2.5 font-medium"
                          >
                            <Download className="w-4 h-4 text-emerald-600" />
                            <span>Tải xuống file</span>
                          </button>
                          <button
                            onClick={() => {
                              onOpenVersionHistory(file);
                              setActiveMenuId(null);
                            }}
                            className="w-full px-3.5 py-2 text-xs text-slate-700 hover:bg-blue-50 flex items-center space-x-2.5 font-medium"
                          >
                            <History className="w-4 h-4 text-indigo-600" />
                            <span>Lịch sử phiên bản</span>
                          </button>
                          {!isReadOnly && (
                            <button
                              onClick={() => {
                                onDeleteFile(file.id);
                                setActiveMenuId(null);
                              }}
                              className="w-full px-3.5 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center space-x-2.5 font-medium border-t border-slate-100 mt-1 pt-1.5"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                              <span>Xóa file</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
};
