'use client';

import React from 'react';
import {
  Folder,
  FileText,
  FileSpreadsheet,
  FileCode,
  Image as ImageIcon,
  History,
  Download,
  Lock,
  Tag,
  Eye,
  Info,
} from 'lucide-react';
import { ClientFolder, FolderItem, DocumentFile } from '@/types/sharepoint';

interface DocumentGridViewProps {
  clients: ClientFolder[];
  subFolders: FolderItem[];
  files: DocumentFile[];
  currentClient: ClientFolder | null;
  currentSubFolder: FolderItem | null;
  selectedClientIds: string[];
  selectedFileIds: string[];
  onToggleSelectClient: (id: string) => void;
  onToggleSelectFile: (id: string) => void;
  onSelectClient: (client: ClientFolder) => void;
  onSelectSubFolder: (subFolder: FolderItem) => void;
  onPreviewFile: (file: DocumentFile) => void;
  onOpenVersionHistory: (file: DocumentFile) => void;
  onOpenDetailsPane: (item: { client?: ClientFolder; subFolder?: FolderItem; file?: DocumentFile }) => void;
  onDownloadFile: (file: DocumentFile) => void;
  onArchiveClient: (client: ClientFolder) => void;
  onRestoreClient: (client: ClientFolder) => void;
  isReadOnly: boolean;
}

export const DocumentGridView: React.FC<DocumentGridViewProps> = ({
  clients,
  subFolders,
  files,
  currentClient,
  currentSubFolder,
  selectedClientIds,
  selectedFileIds,
  onToggleSelectClient,
  onToggleSelectFile,
  onSelectClient,
  onSelectSubFolder,
  onPreviewFile,
  onOpenVersionHistory,
  onOpenDetailsPane,
  onDownloadFile,
  onArchiveClient,
  onRestoreClient,
  isReadOnly,
}) => {
  const isFolderView = !currentClient;
  const isSubFolderView = currentClient && !currentSubFolder;

  const getFileIcon = (mimeType: string, name: string) => {
    if (name.endsWith('.pdf') || mimeType.includes('pdf')) {
      return <FileText className="w-10 h-10 text-red-500" />;
    }
    if (name.endsWith('.xlsx') || name.endsWith('.xls') || mimeType.includes('excel') || mimeType.includes('spreadsheet')) {
      return <FileSpreadsheet className="w-10 h-10 text-emerald-600" />;
    }
    if (name.endsWith('.docx') || name.endsWith('.doc') || mimeType.includes('word')) {
      return <FileText className="w-10 h-10 text-blue-600" />;
    }
    if (mimeType.includes('image')) {
      return <ImageIcon className="w-10 h-10 text-purple-500" />;
    }
    return <FileCode className="w-10 h-10 text-slate-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 select-none">
      {/* Root Client Folders in Grid */}
      {isFolderView &&
        clients.map((client) => {
          const isSelected = selectedClientIds.includes(client.id);
          return (
            <div
              key={client.id}
              onClick={() => onSelectClient(client)}
              className={`group bg-white border rounded-xl p-4 shadow-xs hover:shadow-md transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                isSelected
                  ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50/20'
                  : client.status === 'archived'
                  ? 'border-amber-300 bg-amber-50/20 hover:border-amber-400'
                  : 'border-slate-200 hover:border-blue-400'
              }`}
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => onToggleSelectClient(client.id)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <div className="p-2.5 rounded-xl bg-amber-100/90 border border-amber-200 text-amber-700 shadow-inner group-hover:scale-105 transition-transform">
                      <Folder className="w-8 h-8 fill-amber-400 text-amber-600" />
                    </div>
                  </div>
                  {client.status === 'archived' ? (
                    <span className="flex items-center space-x-1 text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300">
                      <Lock className="w-3 h-3 text-amber-700" />
                      <span>Read-Only</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                      Active
                    </span>
                  )}
                </div>

                <h4 className="font-bold text-slate-900 text-sm line-clamp-2 group-hover:text-blue-600 transition-colors">
                  {client.folder_name}
                </h4>
                <p className="text-xs text-slate-500 mt-1 font-mono">Mã KH: {client.code}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>{client.total_files_count || 4} thư mục con</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenDetailsPane({ client });
                  }}
                  className="p-1 hover:bg-slate-100 rounded text-slate-600"
                  title="Thông tin chi tiết"
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}

      {/* Standard 4 Subfolders in Grid */}
      {isSubFolderView &&
        subFolders.map((sf) => (
          <div
            key={sf.id}
            onClick={() => onSelectSubFolder(sf)}
            className="group bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:shadow-md hover:border-blue-400 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="p-2.5 rounded-xl bg-blue-100/90 border border-blue-200 text-blue-700 w-fit mb-3 group-hover:scale-105 transition-transform">
                <Folder className="w-8 h-8 fill-blue-400 text-blue-600" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm line-clamp-2 group-hover:text-blue-600 transition-colors">
                {sf.name}
              </h4>
              <p className="text-xs text-slate-500 mt-1">Thư mục hệ thống chuẩn</p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[10px]">Standard</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenDetailsPane({ subFolder: sf });
                }}
                className="p-1 hover:bg-slate-100 rounded text-slate-600"
              >
                <Info className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

      {/* Document Files in Grid (Double Click Preview) */}
      {!isFolderView &&
        !isSubFolderView &&
        files.map((file) => {
          const isSelected = selectedFileIds.includes(file.id);
          return (
            <div
              key={file.id}
              onDoubleClick={() => onPreviewFile(file)}
              className={`group bg-white border rounded-xl p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between cursor-pointer ${
                isSelected ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50/20' : 'border-slate-200 hover:border-blue-400'
              }`}
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => onToggleSelectFile(file.id)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                      {getFileIcon(file.mime_type, file.name)}
                    </div>
                  </div>

                  <div className="flex flex-col items-end space-y-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenVersionHistory(file);
                      }}
                      className="bg-blue-100 text-blue-800 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border border-blue-300 hover:bg-blue-200 transition-colors"
                    >
                      v{file.current_version}
                    </button>

                    <span className="text-[10px] font-medium bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                      {file.service_type}
                    </span>
                  </div>
                </div>

                <h4 className="font-semibold text-slate-900 text-sm line-clamp-2 group-hover:text-blue-600 transition-colors">
                  {file.name}
                </h4>

                <div className="mt-2 flex items-center space-x-2 text-xs text-slate-500">
                  <span className="font-mono text-[11px]">{formatFileSize(file.file_size)}</span>
                  <span>•</span>
                  <span className="font-mono text-[11px]">Năm {file.fiscal_year}</span>
                </div>

                {/* Tags */}
                <div className="mt-2 flex flex-wrap gap-1">
                  {file.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200 flex items-center space-x-0.5"
                    >
                      <Tag className="w-2.5 h-2.5 text-slate-400" />
                      <span>{tag}</span>
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-mono">
                  {new Date(file.updated_at).toLocaleDateString('vi-VN')}
                </span>

                <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onPreviewFile(file)}
                    title="Xem trước File"
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onOpenDetailsPane({ file })}
                    title="Thông tin chi tiết"
                    className="p-1.5 text-slate-600 hover:bg-slate-100 rounded transition-colors"
                  >
                    <Info className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onDownloadFile(file)}
                    title="Tải xuống"
                    className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
    </div>
  );
};
