'use client';

import React from 'react';
import {
  Activity,
  UploadCloud,
  Download,
  Archive,
  RotateCcw,
  Trash2,
  Tag,
  ShieldAlert,
  Clock,
  User,
  Filter,
  Sparkles,
} from 'lucide-react';
import { AuditLog, AuditActionType } from '@/types/sharepoint';

interface AuditLogTabProps {
  logs: AuditLog[];
}

export const AuditLogTab: React.FC<AuditLogTabProps> = ({ logs }) => {
  const [filterAction, setFilterAction] = React.useState<string>('all');

  const getActionBadge = (type: AuditActionType) => {
    switch (type) {
      case 'UPLOAD_FILE':
        return (
          <span className="bg-blue-100 text-blue-800 border border-blue-300 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center space-x-1">
            <UploadCloud className="w-3 h-3 text-blue-600" />
            <span>Tải lên File</span>
          </span>
        );
      case 'DOWNLOAD_FILE':
        return (
          <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center space-x-1">
            <Download className="w-3 h-3 text-emerald-600" />
            <span>Tải xuống File</span>
          </span>
        );
      case 'ARCHIVE_CLIENT':
        return (
          <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center space-x-1">
            <Archive className="w-3 h-3 text-amber-700" />
            <span>Archive Hồ sơ</span>
          </span>
        );
      case 'RESTORE_CLIENT':
        return (
          <span className="bg-purple-100 text-purple-900 border border-purple-300 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center space-x-1">
            <RotateCcw className="w-3 h-3 text-purple-600" />
            <span>Restore Active</span>
          </span>
        );
      case 'DELETE_FILE':
        return (
          <span className="bg-red-100 text-red-800 border border-red-300 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center space-x-1">
            <Trash2 className="w-3 h-3 text-red-600" />
            <span>Xóa File</span>
          </span>
        );
      case 'UPDATE_METADATA':
        return (
          <span className="bg-indigo-100 text-indigo-800 border border-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center space-x-1">
            <Tag className="w-3 h-3 text-indigo-600" />
            <span>Sửa Metadata</span>
          </span>
        );
      default:
        return (
          <span className="bg-slate-100 text-slate-800 border border-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
            Hoạt động khác
          </span>
        );
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (filterAction !== 'all' && log.action_type !== filterAction) return false;
    return true;
  });

  return (
    <div className="bg-white border-t border-slate-200 p-5 shadow-xs select-none">
      {/* Header & Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-200">
        <div>
          <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
            <Activity className="w-4 h-4 text-blue-600" />
            <span>Nhật ký Hoạt động (Audit Trail & Activity Stream)</span>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-300 flex items-center space-x-1">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              <span>Realtime Live Feed</span>
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Ghi vết lịch sử thao tác phục vụ công tác kiểm toán tài chính & tuân thủ pháp lý
          </p>
        </div>

        {/* Filter dropdown */}
        <div className="flex items-center space-x-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg p-1.5 font-medium text-slate-700 focus:outline-none focus:border-blue-600"
          >
            <option value="all">Tất cả hoạt động</option>
            <option value="UPLOAD_FILE">Tải lên File</option>
            <option value="DOWNLOAD_FILE">Tải xuống File</option>
            <option value="ARCHIVE_CLIENT">Archive Hồ sơ</option>
            <option value="RESTORE_CLIENT">Restore Active</option>
            <option value="DELETE_FILE">Xóa File</option>
            <option value="UPDATE_METADATA">Sửa Metadata</option>
          </select>
        </div>
      </div>

      {/* Timeline Stream Feed */}
      <div className="space-y-3">
        {filteredLogs.map((log) => (
          <div
            key={log.id}
            className="p-3.5 bg-slate-50 hover:bg-blue-50/40 rounded-xl border border-slate-200/90 transition-all flex items-start justify-between"
          >
            <div className="flex items-start space-x-3">
              {/* User Avatar */}
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0 mt-0.5">
                {log.performed_by_name.substring(0, 2).toUpperCase()}
              </div>

              <div>
                <div className="flex items-center space-x-2 text-xs font-semibold text-slate-900">
                  <span>{log.performed_by_name}</span>
                  <span className="text-[10px] font-mono text-purple-700 bg-purple-50 px-1.5 rounded uppercase border border-purple-200">
                    {log.performed_by_role}
                  </span>
                  <span>•</span>
                  {getActionBadge(log.action_type)}
                </div>

                <p className="text-xs text-slate-700 mt-1 font-medium leading-relaxed">{log.action_details}</p>

                {log.file_name && (
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">Tài liệu: {log.file_name}</p>
                )}
              </div>
            </div>

            {/* Timestamp */}
            <div className="text-right shrink-0 pl-3">
              <span className="text-[11px] font-mono text-slate-500 flex items-center space-x-1">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>{new Date(log.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {new Date(log.created_at).toLocaleDateString('vi-VN')}
              </span>
            </div>
          </div>
        ))}

        {filteredLogs.length === 0 && (
          <div className="p-8 text-center text-slate-500">
            <Activity className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-700">Chưa có nhật ký hoạt động nào</p>
          </div>
        )}
      </div>
    </div>
  );
};
