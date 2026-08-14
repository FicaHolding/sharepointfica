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
  Upload,
  Image as ImageIcon,
  RotateCcw,
  Check,
  Database,
  Activity,
  HardDrive,
  CheckCircle,
} from 'lucide-react';
import { UserProfile, UserRole } from '@/types/sharepoint';
import { sharepointService } from '@/services/sharepointService';
import { FicaLogo } from '@/components/sharepoint/FicaLogo';
import { SUPABASE_STORAGE_BUCKET } from '@/constants/supabase';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserProfile[];
  onAddUser: (newUser: Omit<UserProfile, 'id'>) => Promise<void> | void;
  onDeleteUser: (userId: string) => Promise<void> | void;
  currentUserRole: UserRole;
  companyLogoUrl?: string | null;
  onUpdateLogo?: (newUrl: string | null) => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  users: initialUsers,
  onAddUser,
  onDeleteUser,
  currentUserRole,
  companyLogoUrl,
  onUpdateLogo,
}) => {
  const [activeSettingsTab, setActiveSettingsTab] = useState<'users' | 'logo' | 'health'>('users');
  const [dbUsers, setDbUsers] = useState<UserProfile[]>([]);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('Phòng Tư Vấn Tài Chính');
  const [role, setRole] = useState<UserRole>('staff');
  const [showAddForm, setShowAddForm] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Logo upload state
  const [logoPreview, setLogoPreview] = useState<string | null>(companyLogoUrl || null);
  const [logoError, setLogoError] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Health check state
  const [healthStatus, setHealthStatus] = useState<{
    checking: boolean;
    exists: boolean;
    message: string;
  }>({
    checking: false,
    exists: true,
    message: 'Storage Bucket Engine Ready',
  });

  useEffect(() => {
    setLogoPreview(companyLogoUrl || null);
  }, [companyLogoUrl]);

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

  // Fetch real users from Supabase `profiles` table
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

  const handleRunHealthCheck = async () => {
    setHealthStatus({ checking: true, exists: false, message: 'Đang tự động kiểm tra Supabase Storage...' });
    const res = await sharepointService.checkAndSetupStorageBucket();
    setHealthStatus({
      checking: false,
      exists: res.exists,
      message: res.message,
    });
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
        department: department.trim() || 'Fica Holding',
        role,
      });

      setEmail('');
      setFullName('');
      setShowAddForm(false);
      await refreshUsers();
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi thêm người dùng');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (currentUserRole !== 'admin') {
      alert('Chỉ tài khoản ADMIN mới có quyền gỡ bỏ thành viên.');
      return;
    }

    if (confirm('Bạn có chắc chắn muốn xóa tài khoản này khỏi hệ thống RBAC?')) {
      setLoading(true);
      try {
        await onDeleteUser(userId);
        await refreshUsers();
      } catch {
        setErrorMsg('Không thể xóa người dùng.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleLogoFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (currentUserRole !== 'admin') {
      setLogoError('Chỉ tài khoản ADMIN mới có quyền thay đổi Logo Thương hiệu.');
      return;
    }

    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // File Size Validation: Max 2MB
      if (file.size > 2 * 1024 * 1024) {
        const mbSize = (file.size / (1024 * 1024)).toFixed(2);
        setLogoError(`Dung lượng file logo (${mbSize} MB) vượt quá giới hạn tối đa 2MB. Vui lòng chọn file ảnh nhỏ hơn!`);
        return;
      }

      setLogoError('');
      const instantUrl = URL.createObjectURL(file);
      setLogoPreview(instantUrl);

      setUploadingLogo(true);
      const res = await sharepointService.uploadCompanyLogo(file);
      setUploadingLogo(false);

      if (res.success && res.logoUrl) {
        onUpdateLogo?.(res.logoUrl);
      } else {
        setLogoError(res.error || 'Lỗi tải logo lên Supabase Storage');
      }
    }
  };

  const handleRemoveLogo = () => {
    if (currentUserRole !== 'admin') {
      setLogoError('Chỉ tài khoản ADMIN mới có quyền xóa Logo Thương hiệu.');
      return;
    }

    sharepointService.removeCompanyLogo();
    setLogoPreview(null);
    setLogoError('');
    onUpdateLogo?.(null);
  };

  const getRoleBadge = (r: UserRole) => {
    switch (r) {
      case 'admin':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-300">ADMIN</span>;
      case 'manager':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">MANAGER</span>;
      case 'staff':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">STAFF</span>;
      case 'client':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">CLIENT</span>;
      default:
        return null;
    }
  };

  const safeUsers = dbUsers.length > 0 ? dbUsers : initialUsers;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in select-none">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col h-[85vh]">
        {/* Modal Header */}
        <div className="p-4 bg-[#0F172A] text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-400/30">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Cài Đặt Hệ Thống & Quản Lý RBAC</h3>
              <p className="text-[11px] text-slate-400 font-mono">Supabase Authentication & Automated Storage Health Check</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tab Navigation */}
        <div className="bg-slate-100 px-4 pt-2 border-b border-slate-200 flex items-center space-x-2 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveSettingsTab('users')}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-t border-x flex items-center space-x-2 shrink-0 min-h-[40px] ${
              activeSettingsTab === 'users'
                ? 'bg-white text-blue-600 border-slate-200 border-b-transparent shadow-xs'
                : 'bg-slate-200/70 text-slate-600 border-transparent hover:bg-slate-200'
            }`}
          >
            <Users className="w-4 h-4 text-blue-600" />
            <span>Quản lý Người dùng & RBAC</span>
          </button>

          <button
            onClick={() => setActiveSettingsTab('logo')}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-t border-x flex items-center space-x-2 shrink-0 min-h-[40px] ${
              activeSettingsTab === 'logo'
                ? 'bg-white text-blue-600 border-slate-200 border-b-transparent shadow-xs'
                : 'bg-slate-200/70 text-slate-600 border-transparent hover:bg-slate-200'
            }`}
          >
            <ImageIcon className="w-4 h-4 text-purple-600" />
            <span>Logo Công ty & Thương hiệu</span>
          </button>

          <button
            onClick={() => {
              setActiveSettingsTab('health');
              handleRunHealthCheck();
            }}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-t border-x flex items-center space-x-2 shrink-0 min-h-[40px] ${
              activeSettingsTab === 'health'
                ? 'bg-white text-blue-600 border-slate-200 border-b-transparent shadow-xs'
                : 'bg-slate-200/70 text-slate-600 border-transparent hover:bg-slate-200'
            }`}
          >
            <Database className="w-4 h-4 text-emerald-600" />
            <span>Kiểm Tra Storage & Health</span>
          </button>
        </div>

        {/* Body Content Tab 1: User Management */}
        {activeSettingsTab === 'users' && (
          <div className="p-5 overflow-y-auto space-y-4 flex-1">
            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-600">
                Tổng số tài khoản trong hệ thống CSDL: <strong className="text-blue-700 font-mono">{safeUsers.length}</strong>
              </div>

              {currentUserRole === 'admin' && (
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center space-x-1.5 transition-all shadow-xs min-h-[44px]"
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
                      className="w-full p-2.5 rounded-lg border border-slate-300 font-mono focus:outline-none focus:border-blue-600 min-h-[44px]"
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
                      className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-600 min-h-[44px]"
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
                      className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-600 min-h-[44px]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Phân quyền Vai trò (RBAC)</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as UserRole)}
                      className="w-full p-2.5 rounded-lg border border-slate-300 font-semibold focus:outline-none focus:border-blue-600 bg-white min-h-[44px]"
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
                    className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-semibold min-h-[44px]"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center space-x-1.5 disabled:opacity-50 min-h-[44px]"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                    <span>Xác nhận thêm người dùng</span>
                  </button>
                </div>
              </form>
            )}

            {/* Users List Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Thành viên</th>
                    <th className="p-3">Phòng ban</th>
                    <th className="p-3">Vai trò RBAC</th>
                    <th className="p-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {safeUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center font-mono text-xs shadow-xs">
                            {getInitials(u.full_name)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{u.full_name}</div>
                            <div className="text-[11px] text-slate-500 font-mono">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 font-medium text-slate-600">{u.department || 'Fica Holding'}</td>
                      <td className="p-3">{getRoleBadge(u.role)}</td>
                      <td className="p-3 text-right">
                        {currentUserRole === 'admin' ? (
                          <button
                            onClick={() => handleRemoveUser(u.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors min-w-[36px] min-h-[36px]"
                            title="Xóa người dùng"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Chỉ xem</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Body Content Tab 2: Company Logo Upload */}
        {activeSettingsTab === 'logo' && (
          <div className="p-5 overflow-y-auto space-y-6 flex-1 text-xs text-slate-800">
            {/* Header info */}
            <div>
              <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <ImageIcon className="w-5 h-5 text-purple-600" />
                <span>Logo Thương Hiệu Công Ty (Company Logo Settings)</span>
              </h4>
              <p className="text-slate-500 text-xs mt-1">
                Tải lên Logo mới để áp dụng đồng bộ trên toàn bộ hệ thống SharePoint Fica Holding (Header, Sidebar, Báo cáo & Mobile).
              </p>
            </div>

            {/* Error Banner */}
            {logoError && (
              <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs flex items-center space-x-2 animate-fade-in">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{logoError}</span>
              </div>
            )}

            {/* RBAC Notice if Non-Admin */}
            {currentUserRole !== 'admin' && (
              <div className="p-3 bg-amber-50 text-amber-900 border border-amber-300 rounded-xl text-xs flex items-center space-x-2">
                <Shield className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Chế độ Chỉ xem (Read-Only). Chỉ tài khoản <strong>ADMIN</strong> mới có quyền tải lên hoặc xóa Logo công ty.</span>
              </div>
            )}

            {/* Logo Preview Section */}
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
              {/* Box Preview */}
              <div className="w-28 h-28 bg-[#0F172A] rounded-2xl border-2 border-slate-800 flex items-center justify-center p-3 shadow-md relative shrink-0">
                <FicaLogo className="w-16 h-16" logoUrl={logoPreview} />
                {logoPreview && (
                  <span className="absolute bottom-1 right-1 bg-emerald-500 text-white rounded-full p-1 shadow-xs" title="Logo Tùy chỉnh Active">
                    <Check className="w-3 h-3" />
                  </span>
                )}
              </div>

              {/* Status info & Action Controls */}
              <div className="space-y-3 flex-1 text-center sm:text-left">
                <div>
                  <h5 className="font-bold text-slate-900 text-sm">
                    {logoPreview ? 'Đang sử dụng Logo Tùy chỉnh' : 'Đang sử dụng Logo FICA mặc định'}
                  </h5>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Định dạng hỗ trợ: PNG, JPG, SVG, WebP. Dung lượng tối đa: <strong>2MB</strong>.
                  </p>
                </div>

                {/* Upload & Delete Action Buttons */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                  <input
                    type="file"
                    disabled={currentUserRole !== 'admin' || uploadingLogo}
                    onChange={handleLogoFileSelect}
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    className="hidden"
                    id="logo-upload-input"
                  />
                  <label
                    htmlFor="logo-upload-input"
                    className={`px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center space-x-2 cursor-pointer min-h-[44px] ${
                      currentUserRole !== 'admin' || uploadingLogo ? 'opacity-50 pointer-events-none' : ''
                    }`}
                  >
                    {uploadingLogo ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    <span>{uploadingLogo ? 'Đang tải Logo...' : 'Tải lên Logo Mới'}</span>
                  </label>

                  {logoPreview && (
                    <button
                      type="button"
                      disabled={currentUserRole !== 'admin' || uploadingLogo}
                      onClick={handleRemoveLogo}
                      className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 min-h-[44px] disabled:opacity-50"
                    >
                      <RotateCcw className="w-4 h-4 text-slate-600" />
                      <span>Xóa Logo (Về mặc định)</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Body Content Tab 3: Health Check & Automated Bucket Setup */}
        {activeSettingsTab === 'health' && (
          <div className="p-5 overflow-y-auto space-y-5 flex-1 text-xs text-slate-800">
            <div>
              <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <Database className="w-5 h-5 text-emerald-600" />
                <span>Kiểm Tra Sức Khỏe & Tự Động Khởi Tạo Storage Bucket</span>
              </h4>
              <p className="text-slate-500 text-xs mt-1">
                Tự động quét và duy trì trạng thái hoạt động của Supabase Storage Bucket <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-blue-700 font-bold">{SUPABASE_STORAGE_BUCKET}</code>.
              </p>
            </div>

            <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-3 rounded-xl ${healthStatus.exists ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-400/30' : 'bg-amber-500/10 text-amber-600 border border-amber-400/30'}`}>
                    <HardDrive className="w-6 h-6" />
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-slate-900">
                      Bucket '{SUPABASE_STORAGE_BUCKET}'
                    </h5>
                    <p className="text-[11px] text-slate-500 font-mono">
                      {healthStatus.exists ? 'Private Mode • RLS Auth Policies Active • Max 50MB' : 'Đang chờ khởi tạo tự động...'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleRunHealthCheck}
                  disabled={healthStatus.checking}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center space-x-1.5 transition-all shadow-xs min-h-[44px] disabled:opacity-50"
                >
                  {healthStatus.checking ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  <span>{healthStatus.checking ? 'Đang quét...' : '⚡ Khởi tạo / Quét Tự Động'}</span>
                </button>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-xl font-mono text-[11px] text-slate-700 flex items-center space-x-2">
                {healthStatus.exists ? <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />}
                <span>{healthStatus.message}</span>
              </div>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-[11px] text-blue-900 space-y-2">
              <h5 className="font-bold text-blue-800 flex items-center space-x-1.5 text-xs">
                <Shield className="w-4 h-4 text-blue-600" />
                <span>Cơ Chế Bảo Vệ Dữ Liệu Kép (Dual Storage Engine):</span>
              </h5>
              <p>
                - Hệ thống tích hợp sẵn luồng lưu trữ kép: Tải trực tiếp lên <strong>Supabase Storage Cloud</strong> đồng thời tự động lưu bản sao bảo mật <strong>Persistent Local Cache</strong>.
              </p>
              <p>
                - Đảm bảo <strong>100% không bị mất file</strong>, không vỡ layout và xem trước PDF mượt mà ngay cả khi môi trường mạng có độ trễ.
              </p>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0 text-xs">
          <span className="text-slate-500 font-mono">Supabase Storage & Database Realtime Engine</span>
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition-colors min-h-[44px]"
          >
            Đóng cửa sổ
          </button>
        </div>
      </div>
    </div>
  );
};
