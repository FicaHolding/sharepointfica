'use client';

import React, { useState } from 'react';
import {
  X,
  UserPlus,
  Users,
  Shield,
  Mail,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Building2,
  Trash2,
  Edit,
} from 'lucide-react';
import { UserProfile, UserRole } from '@/types/sharepoint';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserProfile[];
  onAddUser: (newUser: Omit<UserProfile, 'id'>) => void;
  onDeleteUser: (userId: string) => void;
  currentUserRole: UserRole;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  users,
  onAddUser,
  onDeleteUser,
  currentUserRole,
}) => {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('Phòng Tư Vấn Tài Chính');
  const [role, setRole] = useState<UserRole>('staff');
  const [showAddForm, setShowAddForm] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !fullName.trim()) {
      setErrorMsg('Vui lòng nhập đầy đủ Email và Họ tên người dùng.');
      return;
    }

    onAddUser({
      email: email.trim(),
      full_name: fullName.trim(),
      role,
      department: department.trim(),
    });

    setEmail('');
    setFullName('');
    setErrorMsg('');
    setShowAddForm(false);
  };

  const getRoleBadge = (r: UserRole) => {
    switch (r) {
      case 'admin':
        return <span className="bg-purple-100 text-purple-800 border border-purple-300 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Admin (Toàn quyền)</span>;
      case 'manager':
        return <span className="bg-blue-100 text-blue-800 border border-blue-300 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Manager (Quản lý)</span>;
      case 'staff':
        return <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Staff (Chuyên viên)</span>;
      case 'client':
        return <span className="bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Client (Xem hồ sơ)</span>;
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in select-none">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col justify-between max-h-[85vh]">
        {/* Header */}
        <div className="p-4 bg-[#0F172A] text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-400/30">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Quản lý Người dùng & Phân quyền RBAC</h3>
              <p className="text-[11px] text-slate-400">Danh sách tài khoản & Khởi tạo người dùng Fica Holding</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {/* Top Bar Action */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">
              Tổng số tài khoản: <span className="text-blue-600 font-mono">{users.length}</span>
            </span>

            {currentUserRole === 'admin' && (
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-3 py-1.5 rounded-lg shadow-xs transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                <span>{showAddForm ? 'Đóng form' : 'Thêm người dùng mới'}</span>
              </button>
            )}
          </div>

          {/* Add New User Form */}
          {showAddForm && (
            <form onSubmit={handleCreateUser} className="p-4 bg-blue-50/60 border border-blue-200 rounded-xl space-y-3 animate-fade-in text-xs">
              <h4 className="font-bold text-blue-900 flex items-center space-x-1">
                <UserPlus className="w-4 h-4 text-blue-600" />
                <span>Khởi tạo / Mời người dùng mới vào hệ thống:</span>
              </h4>

              {errorMsg && (
                <div className="p-2 bg-red-100 border border-red-300 text-red-700 rounded text-xs flex items-center space-x-1">
                  <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Email người dùng (*):</label>
                  <input
                    type="email"
                    placeholder="name@fica.vn"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-600 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Họ và Tên (*):</label>
                  <input
                    type="text"
                    placeholder="VD: Trần Thị Mai"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-600"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Phòng ban / Chức danh:</label>
                  <input
                    type="text"
                    placeholder="VD: Phòng Kiểm Toán & Thẩm Định"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Phân quyền (Role RBAC):</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white font-semibold"
                  >
                    <option value="admin">Admin (Toàn quyền quản trị)</option>
                    <option value="manager">Manager (Quản lý dự án / Đóng gói)</option>
                    <option value="staff">Staff (Chuyên viên Upload / Sửa)</option>
                    <option value="client">Client (Khách hàng Read-Only)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  Lưu & Cấp quyền
                </button>
              </div>
            </form>
          )}

          {/* User List Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <th className="p-3">Họ và Tên</th>
                  <th className="p-3">Email Fica</th>
                  <th className="p-3">Phòng ban</th>
                  <th className="p-3">Phân quyền</th>
                  <th className="p-3 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                          {u.full_name.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="font-bold text-slate-900">{u.full_name}</span>
                      </div>
                    </td>
                    <td className="p-3 font-mono text-slate-600">{u.email}</td>
                    <td className="p-3 text-slate-600">{u.department || 'Fica Holding'}</td>
                    <td className="p-3">{getRoleBadge(u.role)}</td>
                    <td className="p-3 text-center">
                      {currentUserRole === 'admin' && u.email !== 'admin@fica.vn' ? (
                        <button
                          onClick={() => onDeleteUser(u.id)}
                          className="p-1 hover:bg-red-50 text-red-600 rounded transition-colors"
                          title="Xóa tài khoản"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Protected</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
