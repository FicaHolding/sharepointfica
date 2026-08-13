'use client';

import React from 'react';
import { X, Trash2, AlertTriangle, ShieldAlert, Archive, CheckCircle2 } from 'lucide-react';
import { ClientFolder, UserRole } from '@/types/sharepoint';

interface DeleteClientModalProps {
  client: ClientFolder | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: (clientId: string, mode: 'recycle' | 'permanent') => void;
  userRole: UserRole;
}

export const DeleteClientModal: React.FC<DeleteClientModalProps> = ({
  client,
  isOpen,
  onClose,
  onConfirmDelete,
  userRole,
}) => {
  if (!isOpen || !client) return null;

  const canDelete = userRole === 'admin' || userRole === 'manager';

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in select-none">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="p-4 bg-red-950 text-white flex items-center justify-between border-b border-red-900">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-red-500/20 text-red-300 border border-red-400/30">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-red-100">Xác nhận Xóa Thư mục Khách hàng</h3>
              <p className="text-[11px] text-red-300">Cảnh báo nguy hiểm dữ liệu tài chính</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-red-300 hover:text-white hover:bg-red-900 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-4 text-xs text-slate-800">
          {!canDelete ? (
            <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl space-y-2">
              <div className="flex items-center space-x-2 font-bold">
                <ShieldAlert className="w-5 h-5 text-amber-600" />
                <span>Không có quyền thực hiện!</span>
              </div>
              <p className="text-slate-700 leading-relaxed">
                Chỉ tài khoản có phân quyền <strong>ADMIN</strong> hoặc <strong>MANAGER</strong> mới được phép xóa thư mục khách hàng. Vai trò hiện tại của bạn là <span className="uppercase font-bold text-amber-800">{userRole}</span>.
              </p>
            </div>
          ) : (
            <>
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-2">
                <p className="font-bold text-red-900 text-sm">
                  Bạn có chắc chắn muốn xóa khách hàng:
                </p>
                <p className="font-mono font-bold text-red-800 bg-red-100 p-2 rounded text-xs border border-red-300">
                  {client.folder_name}
                </p>
                <p className="text-red-700 leading-relaxed text-[11px]">
                  * Hành động này sẽ ảnh hưởng đến toàn bộ {client.total_files_count || 4} thư mục con và tất cả các file hợp đồng, báo cáo tài chính bên trong.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <p className="font-bold text-slate-900">Vui lòng lựa chọn phương thức xóa:</p>

                {/* Option 1: Move to Recycle Bin (Recommended) */}
                <button
                  onClick={() => {
                    onConfirmDelete(client.id, 'recycle');
                    onClose();
                  }}
                  className="w-full p-3 bg-slate-50 hover:bg-amber-50 border border-slate-300 hover:border-amber-400 rounded-xl text-left transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-amber-100 text-amber-800">
                      <Archive className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 group-hover:text-amber-900">
                        Chuyển vào Thùng rác / Archive (Khuyên dùng)
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Khóa hồ sơ Read-Only, có thể khôi phục lại bất kỳ lúc nào.
                      </p>
                    </div>
                  </div>
                </button>

                {/* Option 2: Hard Permanent Delete */}
                <button
                  onClick={() => {
                    onConfirmDelete(client.id, 'permanent');
                    onClose();
                  }}
                  className="w-full p-3 bg-slate-50 hover:bg-red-50 border border-slate-300 hover:border-red-400 rounded-xl text-left transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-red-100 text-red-800">
                      <Trash2 className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 group-hover:text-red-900">
                        Xóa vĩnh viễn (Permanent Delete)
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Xóa hoàn toàn khỏi Supabase Database & Storage. KHÔNG thể khôi phục!
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-center">
          <button
            onClick={onClose}
            className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs py-2 rounded-lg transition-colors"
          >
            Hủy thao tác
          </button>
        </div>
      </div>
    </div>
  );
};
