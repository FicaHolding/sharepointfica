'use client';

import React, { useState, useEffect } from 'react';
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
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { UserProfile, UserRole } from '@/types/sharepoint';
import { sharepointService } from '@/services/sharepointService';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserProfile[];
  onAddUser: (newUser: Omit<UserProfile, 'id'>) => Promise<void> | void;
  onDeleteUser: (userId: string) => Promise<void> | void;
  currentUserRole: UserRole;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  users: initialUsers,
  onAddUser,
  onDeleteUser,
  currentUserRole,
}) => {
  const [dbUsers, setDbUsers] = useState<UserProfile[]>([]);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('Phòng Tư Vấn Tài Chính');
  const [role, setRole] = useState<UserRole>('staff');
  const [showAddForm, setShowAddForm] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Safe Dynamic Initials Helper
  const getInitials = (name?: string | null) => {
    if (!name || typeof name !== 'string') return 'U';
    const clean = name.trim();
    if (!clean) return 'U';
    const words = clean.split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }
    return clean.substring(0, 2).toUpperCase();
  };

  // Fetch real users from Supabase `profiles` table with 100% try-catch and null-safety
  const refreshUsers = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const profiles = await sharepointService.fetchProfiles();
      if (Array.isArray(profiles)) {
        setDbUsers(profiles);
      } else if (Array.isArray(initialUsers)) {
        setDbUsers(initialUsers);
      } else {
        setDbUsers([]);
      }
    } catch (err: any) {
      console.error('Fetch users error:', err);
      setErrorMsg('Không thể tải danh sách người dùng từ CSDL Supabase');
      setDbUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshUsers();

      let unsubscribe: (() => void) | undefined;
      try {
        unsubscribe = sharepointService.subscribeRealtime(() => {
          refreshUsers();
        });
      } catch (e) {
        console.warn('Realtime subscription notice:', e);
      }

      return () => {
        if (unsubscribe) {
          try {
            unsubscribe();
          } catch {
            // Ignore
          }
        }
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !fullName.trim()) {
      setErrorMsg('Vui lòng nhập đầy đủ Email và Họ tên người dùng.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      await onAddUser({
        email: email.trim(),
        full_name: fullName.trim(),
        role,
        department: department.trim(),
      });

      await refreshUsers();

      setEmail('');
      setFullName('');
      setShowAddForm(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi thêm người dùng!');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId: string) => {
    if (confirm('Bạn có chắc chắn muốn gỡ bỏ tài khoản này khỏi hệ thống RBAC?')) {
      setLoading(true);
      try {
        await onDeleteUser(userId);
        await refreshUsers();
      } catch {
        // Ignore
      } finally {
        setLoading(false);
      }
    }
  };

  const getRoleBadge = (r?: UserRole) => {
    switch (r) {
      case 'admin':
        return <span className="bg-purple-100 text-purple-800 border border-purple-300 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Admin (Toàn quyền)</span>;
      case 'manager':
        return <span className="bg-blue-100 text-blue-800 border border-blue-300 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Manager (Quản lý)</span>;
      case 'staff':
        return <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Staff (Chuyên viên)</span>;
      case 'client':
        return <span className="bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Client (Xem hồ sơ)</span>;
      default:
        return <span className="bg-slate-100 text-slate-800 border border-slate-300 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Staff (Chuyên viên)</span>;
    }
  };

  const safeUsers = Array.isArray(dbUsers) ? dbUsers : [];

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
              <p className="text-[11px] text-slate-400">Danh sách tài khoản Supabase `profiles` & Khởi tạo quyền Fica Holding</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={refreshUsers}
              title="Làm mới CSDL"
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-600">
              Tổng số tài khoản trong hệ thống CSDL: <strong className="text-blue-700 font-mono">{safeUsers.length}</strong>
            </div>

            {currentUserRole === 'admin' && (
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all shadow-xs"
              >
                <UserPlus className="w-4 h-4" />
                <span>{showAddForm ? 'Đóng form' : 'Thêm người dùng mới'}</span>
              </button>
            )}
          </div>

          {/* Add User Form Drawer */}
          {showAddForm && (
            <form onSubmit={handleCreateUser} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 animate-fade-in text-xs">
              <h4 className="font-bold text-slate-900 flex items-center space-x-1.5">
                <Shield className="w-4 h-4 text-blue-600" />
                <span>Mời người dùng mới vào hệ thống Supabase RBAC</span>
              </h4>

              {errorMsg && (
                <div className="p-2.5 bg-red-50 text-red-700 border border-red-200 rounded text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email công ty (*)</label>
                  <input
                    type="email"
                    placeholder="user@fica.vn"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2 rounded border border-slate-300 font-mono focus:outline-none focus:border-blue-600"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Họ và Tên (*)</label>
                  <input
                    type="text"
                    placeholder="VD: Trần Văn Bình"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full p-2 rounded border border-slate-300 focus:outline-none focus:border-blue-600"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phòng ban / Đơn vị</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full p-2 rounded border border-slate-300 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phân quyền Vai trò (RBAC)</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full p-2 rounded border border-slate-300 font-semibold focus:outline-none focus:border-blue-600 bg-white"
                  >
                    <option value="admin">ADMIN - Quyền Quản trị viên</option>
                    <option value="manager">MANAGER - Quyền Trưởng phòng</option>
                    <option value="staff">STAFF - Quyền Chuyên viên</option>
                    <option value="client">CLIENT - Quyền Xem hồ sơ</option>
                  </select>
                </div>
              </div>

              <div className="pt-1 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
                  <span>Xác nhận thêm User</span>
                </button>
              </div>
            </form>
          )}

          {/* User Table List */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 font-bold text-slate-700">
                  <th className="p-3">Họ và Tên Cán Bộ</th>
                  <th className="p-3">Email & Phòng ban</th>
                  <th className="p-3">Phân quyền RBAC</th>
                  <th className="p-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {safeUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-slate-500 text-xs">
                      {loading ? (
                        <div className="flex items-center justify-center space-x-2">
                          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                          <span>Đang tải danh sách từ CSDL Supabase...</span>
                        </div>
                      ) : (
                        <div>
                          <p className="font-semibold text-slate-700">Chưa có dữ liệu người dùng trong CSDL Supabase `profiles`</p>
                          <p className="text-[11px] text-slate-400 mt-1">Vui lòng nhấn nút "Thêm người dùng mới" để cấp quyền tài khoản!</p>
                        </div>
                      )}
                    </td>
                  </tr>
                ) : (
                  safeUsers.map((u) => {
                    const displayName = u?.full_name || u?.email?.split('@')[0] || 'Cán Bộ Fica';
                    const displayEmail = u?.email || 'user@fica.vn';
                    const displayDept = u?.department || 'Fica Holding';

                    return (
                      <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-semibold text-slate-900">
                          <div className="flex items-center space-x-2">
                            <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0">
                              {getInitials(displayName)}
                            </div>
                            <div>
                              <span>{displayName}</span>
                              {u?.phone && <p className="text-[10px] text-slate-500 font-mono">📞 {u.phone}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-mono text-slate-600 text-[11px]">{displayEmail}</div>
                          <div className="text-[10px] text-slate-400 font-medium">{displayDept}</div>
                        </td>
                        <td className="p-3">{getRoleBadge(u?.role)}</td>
                        <td className="p-3 text-right">
                          {currentUserRole === 'admin' && (
                            <button
                              onClick={() => handleDelete(u.id)}
                              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Gỡ bỏ tài khoản"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Đồng bộ dữ liệu thời gian thực với Supabase Realtime Engine</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-semibold transition-colors"
          >
            Đóng cửa sổ
          </button>
        </div>
      </div>
    </div>
  );
};
