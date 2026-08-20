'use client';

import React, { useEffect, useRef } from 'react';
import {
  FolderOpen,
  Edit3,
  Archive,
  RotateCcw,
  Tag,
  Trash2,
  Info,
  Eye,
  Download,
  History,
} from 'lucide-react';
import { ClientFolder, FolderItem, DocumentFile, UserRole } from '@/types/sharepoint';

export interface ContextMenuPosition {
  x: number;
  y: number;
  client?: ClientFolder;
  subFolder?: FolderItem;
  file?: DocumentFile;
}

interface ContextMenuProps {
  menuState: ContextMenuPosition | null;
  onClose: () => void;
  onOpenClient: (client: ClientFolder) => void;
  onOpenSubFolder: (subFolder: FolderItem) => void;
  onRenameClient: (client: ClientFolder) => void;
  onArchiveClient: (client: ClientFolder) => void;
  onRestoreClient: (client: ClientFolder) => void;
  onDeleteClient: (client: ClientFolder) => void;
  onOpenDetails: (item: { client?: ClientFolder; subFolder?: FolderItem; file?: DocumentFile }) => void;
  onPreviewFile: (file: DocumentFile) => void;
  onOpenVersionHistory: (file: DocumentFile) => void;
  onDownloadFile: (file: DocumentFile) => void;
  onDeleteFile: (fileId: string) => void;
  onDownloadClientZip?: (client: ClientFolder) => void;
  userRole: UserRole;
  isReadOnly: boolean;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  menuState,
  onClose,
  onOpenClient,
  onOpenSubFolder,
  onRenameClient,
  onArchiveClient,
  onRestoreClient,
  onDeleteClient,
  onOpenDetails,
  onPreviewFile,
  onOpenVersionHistory,
  onDownloadFile,
  onDeleteFile,
  onDownloadClientZip,
  userRole,
  isReadOnly,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  if (!menuState) return null;

  const { x, y, client, subFolder, file } = menuState;

  // Prevent context menu overflowing window bounds
  const adjustedX = Math.min(x, window.innerWidth - 220);
  const adjustedY = Math.min(y, window.innerHeight - 260);

  const canModify = (userRole === 'admin' || userRole === 'manager') && !isReadOnly;

  return (
    <div
      ref={menuRef}
      style={{ top: `${adjustedY}px`, left: `${adjustedX}px` }}
      className="fixed z-50 w-52 bg-white border border-slate-200 rounded-xl shadow-2xl py-1.5 text-xs text-slate-800 animate-fade-in select-none divide-y divide-slate-100"
    >
      {/* ITEM HEADER TITLE */}
      <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 truncate">
        {client ? client.folder_name : subFolder ? subFolder.name : file ? file.name : 'Context Menu'}
      </div>

      {/* CLIENT FOLDER ACTIONS */}
      {client && (
        <div className="py-1">
          <button
            onClick={() => {
              onOpenClient(client);
              onClose();
            }}
            className="w-full px-3 py-1.5 text-left flex items-center space-x-2 text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors font-medium"
          >
            <FolderOpen className="w-3.5 h-3.5 text-blue-600" />
            <span>📁 Mở thư mục (Open)</span>
          </button>

          <button
            onClick={() => {
              onDownloadClientZip?.(client);
              onClose();
            }}
            className="w-full px-3 py-1.5 text-left flex items-center space-x-2 text-blue-700 hover:bg-blue-50 transition-colors font-semibold"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>📦 Tải ZIP toàn bộ thư mục</span>
          </button>

          <button
            onClick={() => {
              onRenameClient(client);
              onClose();
            }}
            className="w-full px-3 py-1.5 text-left flex items-center space-x-2 text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors font-medium"
          >
            <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
            <span>✏️ Đổi tên (Rename)</span>
          </button>

          <button
            onClick={() => {
              onOpenDetails({ client });
              onClose();
            }}
            className="w-full px-3 py-1.5 text-left flex items-center space-x-2 text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors font-medium"
          >
            <Info className="w-3.5 h-3.5 text-blue-600" />
            <span>🏷️ Metadata & Details</span>
          </button>

          {client.status === 'active' ? (
            <button
              onClick={() => {
                onArchiveClient(client);
                onClose();
              }}
              className="w-full px-3 py-1.5 text-left flex items-center space-x-2 text-amber-800 hover:bg-amber-50 transition-colors font-medium"
            >
              <Archive className="w-3.5 h-3.5 text-amber-600" />
              <span>📦 Archive (Khóa Read-Only)</span>
            </button>
          ) : (
            <button
              onClick={() => {
                onRestoreClient(client);
                onClose();
              }}
              className="w-full px-3 py-1.5 text-left flex items-center space-x-2 text-emerald-800 hover:bg-emerald-50 transition-colors font-medium"
            >
              <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
              <span>📦 Restore (Mở lại Active)</span>
            </button>
          )}

          <button
            onClick={() => {
              onDeleteClient(client);
              onClose();
            }}
            className="w-full px-3 py-1.5 text-left flex items-center space-x-2 text-red-600 hover:bg-red-50 transition-colors font-medium border-t border-slate-100"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-500" />
            <span>🗑️ Xóa thư mục (Delete)</span>
          </button>
        </div>
      )}

      {/* FILE ACTIONS */}
      {file && (
        <div className="py-1">
          <button
            onClick={() => {
              onPreviewFile(file);
              onClose();
            }}
            className="w-full px-3 py-1.5 text-left flex items-center space-x-2 text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors font-medium"
          >
            <Eye className="w-3.5 h-3.5 text-blue-600" />
            <span>🔍 Xem trước (Preview)</span>
          </button>

          <button
            onClick={() => {
              onDownloadFile(file);
              onClose();
            }}
            className="w-full px-3 py-1.5 text-left flex items-center space-x-2 text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors font-medium"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>📥 Tải xuống (Download)</span>
          </button>

          <button
            onClick={() => {
              onOpenVersionHistory(file);
              onClose();
            }}
            className="w-full px-3 py-1.5 text-left flex items-center space-x-2 text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors font-medium"
          >
            <History className="w-3.5 h-3.5 text-purple-600" />
            <span>📜 Lịch sử phiên bản</span>
          </button>

          <button
            onClick={() => {
              onOpenDetails({ file });
              onClose();
            }}
            className="w-full px-3 py-1.5 text-left flex items-center space-x-2 text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors font-medium"
          >
            <Info className="w-3.5 h-3.5 text-blue-600" />
            <span>ℹ️ Thông tin Chi tiết</span>
          </button>

          {!isReadOnly && (
            <button
              onClick={() => {
                onDeleteFile(file.id);
                onClose();
              }}
              className="w-full px-3 py-1.5 text-left flex items-center space-x-2 text-red-600 hover:bg-red-50 transition-colors font-medium border-t border-slate-100"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-500" />
              <span>🗑️ Xóa file</span>
            </button>
          )}
        </div>
      )}

      {/* SUBFOLDER ACTIONS */}
      {subFolder && (
        <div className="py-1">
          <button
            onClick={() => {
              onOpenSubFolder(subFolder);
              onClose();
            }}
            className="w-full px-3 py-1.5 text-left flex items-center space-x-2 text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors font-medium"
          >
            <FolderOpen className="w-3.5 h-3.5 text-blue-600" />
            <span>📁 Mở thư mục</span>
          </button>

          <button
            onClick={() => {
              onOpenDetails({ subFolder });
              onClose();
            }}
            className="w-full px-3 py-1.5 text-left flex items-center space-x-2 text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors font-medium"
          >
            <Info className="w-3.5 h-3.5 text-blue-600" />
            <span>ℹ️ Thông tin thư mục</span>
          </button>
        </div>
      )}
    </div>
  );
};
