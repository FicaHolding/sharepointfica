'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Loader2,
  Image as ImageIcon,
  Check,
  Database,
  Lock,
  ShieldCheck,
  Send,
  Key,
} from 'lucide-react';
import { UserProfile, UserRole, DocumentFile, ClientFolder } from '@/types/sharepoint';
import { sharepointService } from '@/services/sharepointService';
import { FicaLogo } from '@/components/sharepoint/FicaLogo';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserProfile[];
  onAddUser: (newUser: Omit<UserProfile, 'id'>) => Promise<void> | void;
  onDeleteUser: (userId: string) => Promise<void> | void;
  currentUserRole: UserRole;
  currentUserEmail?: string;
  companyLogoUrl?: string | null;
  onUpdateLogo?: (newUrl: string | null) => void;
  allFiles?: DocumentFile[];
  onRefreshFiles?: () => void;
  allClients?: ClientFolder[];
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  users: initialUsers,
  onAddUser,
  onDeleteUser,
  currentUserRole,
  currentUserEmail,
  companyLogoUrl,
  onUpdateLogo,
  allFiles = [],
  onRefreshFiles,
  allClients = [],
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

  // Client Assignment State
  const [selectedUserForAssignment, setSelectedUserForAssignment] = useState<UserProfile | null>(null);
  const [userAssignedClientIds, setUserAssignedClientIds] = useState<string[]>([]);
  const [savingAssignments, setSavingAssignments] = useState(false);

  // Logo upload state
  const [logoPreview, setLogoPreview] = useState<string | null>(companyLogoUrl || null);
  const [logoError, setLogoError] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Health check & Audit state
  const [healthStatus, setHealthStatus] = useState<{
    checking: boolean;
    exists: boolean;
    message: string;
  }>({
    checking: false,
    exists: true,
    message: 'Storage Bucket Engine Ready',
  });

  const [auditing, setAuditing] = useState(false);
  const [auditReport, setAuditReport] = useState<{
    total: number;
    verifiedCount: number;
    phantomCount: number;
    phantomFiles: DocumentFile[];
  }>({
    total: 0,
    verifiedCount: 0,
    phantomCount: 0,
    phantomFiles: [],
  });

  const [uploadingPhantomId, setUploadingPhantomId] = useState<string | null>(null);

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
      if (Array.isArray(profiles) && profiles.length > 0) {
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

  const handleRunPhantomAudit = async () => {
    setAuditing(true);
    try {
      const currentFiles = allFiles.length > 0 ? allFiles : await sharepointService.fetchFiles();
      const res = await sharepointService.auditSystemPhantomFiles(currentFiles);
      setAuditReport(res);
    } catch (err) {
      console.error('Audit exception:', err);
    } finally {
      setAuditing(false);
    }
  };

  const handleReplacePhantomFile = async (e: React.ChangeEvent<HTMLInputElement>, fileItem: DocumentFile) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setUploadingPhantomId(fileItem.id);

      const res = await sharepointService.replacePhantomFile(
        selectedFile,
        fileItem.id,
        fileItem.storage_path,
        'Admin'
      );
      setUploadingPhantomId(null);

      if (res.success) {
        onRefreshFiles?.();
        handleRunPhantomAudit();
      } else {
        alert(res.error || 'Lỗi bổ sung file vật lý!');
      }
    }
  };

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (isOpen) {
      refreshUsers();
      const unsubscribe = sharepointService.subscribeRealtime(() => {
        refreshUsers();
      });

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onCloseRef.current?.();
        }
      };
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
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

  const isSuperAdmin =
    currentUserRole === 'admin' ||
    (currentUserEmail || '').toLowerCase() === 'fica.holding@gmail.com';

  const safeUsers =
    Array.isArray(dbUsers) && dbUsers.length > 0
      ? dbUsers
      : Array.isArray(initialUsers)
      ? initialUsers
      : [];

  // SMART MEMBER INVITE & VALIDATION HANDLER
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName.trim();

    // 1. Client-side Email Format Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setErrorMsg('Định dạng Email không hợp lệ! Vui lòng nhập địa chỉ Email công ty thật (VD: name@company.com).');
      return;
    }

    // 2. Mandatory Full Name Validation
    if (!cleanName) {
      setErrorMsg('Họ và Tên thành viên là bắt buộc, không được để trống!');
      return;
    }

    // 3. Duplicate Email Check
    const duplicate = safeUsers.find((u) => u.email && u.email.toLowerCase() === cleanEmail);
    if (duplicate) {
      setErrorMsg(`Email "${cleanEmail}" đã là thành viên trong hệ thống với vai trò [${(duplicate.role || 'staff').toUpperCase()}]!`);
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await sharepointService.createProfile({
        email: cleanEmail,
        full_name: cleanName,
        department: department.trim() || 'Fica Holding',
        role,
      });

      if (!res.success) {
        setErrorMsg(res.error || 'Lỗi thêm người dùng');
        return;
      }

      if (res.profile) {
        await onAddUser(res.profile);
      }

      setEmail('');
      setFullName('');
      setShowAddForm(false);
      await refreshUsers();
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi gửi lời mời thành viên.');
    } finally {
      setLoading(false);
    }
  };

  // REMOVE USER WITH ROOT ADMIN PROTECTION
  const handleRemoveUser = async (userId: string) => {
    const target = safeUsers.find((u) => u.id === userId);
    if (target?.email.toLowerCase() === 'fica.holding@gmail.com') {
      alert('Tài khoản fica.holding@gmail.com là Root Admin gốc hệ thống và không thể bị xóa!');
      return;
    }

    if (!isSuperAdmin) {
      alert('Chỉ tài khoản ADMIN mới có quyền gỡ bỏ thành viên.');
      return;
    }

    if (confirm(`Bạn có chắc chắn muốn xóa tài khoản ${target?.full_name} (${target?.email}) khỏi hệ thống RBAC?`)) {
      setLoading(true);
      try {
        await onDeleteUser(userId);
        await sharepointService.deleteProfile(userId);
        await refreshUsers();
      } catch {
        setErrorMsg('Không thể xóa người dùng.');
      } finally {
        setLoading(false);
      }
    }
  };

  // TOGGLE LOCK STATUS WITH ROOT ADMIN PROTECTION
  const handleToggleLock = async (userId: string, currentStatus?: string) => {
    const target = safeUsers.find((u) => u.id === userId);
    if (target?.email.toLowerCase() === 'fica.holding@gmail.com') {
      alert('Tài khoản fica.holding@gmail.com là Root Admin gốc hệ thống và không thể bị khóa!');
      return;
    }

    setLoading(true);
    await sharepointService.toggleUserLockStatus(userId, currentStatus);
    await refreshUsers();
    setLoading(false);
  };

  // CHANGE ROLE WITH ROOT ADMIN PROTECTION
  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    const target = safeUsers.find((u) => u.id === userId);
    if (target?.email.toLowerCase() === 'fica.holding@gmail.com') {
      alert('Tài khoản fica.holding@gmail.com là Root Admin gốc hệ thống và không thể bị hạ quyền!');
      return;
    }

    setLoading(true);
    await sharepointService.updateUserRole(userId, newRole);
    await refreshUsers();
    setLoading(false);
  };

  // RESEND INVITE
  const handleResendInvite = async (userEmail: string) => {
    setLoading(true);
    await sharepointService.resendUserInvite(userEmail);
    setLoading(false);
    alert(`Đã gửi lại email kích hoạt tới: ${userEmail}`);
  };

  // OPEN CLIENT ASSIGNMENT DRAWER
  const handleOpenClientAssignment = async (user: UserProfile) => {
    setSelectedUserForAssignment(user);
    const assigned = await sharepointService.fetchUserClientAssignments(user.id);
    setUserAssignedClientIds(assigned);
  };

  const handleToggleAssignClient = (clientId: string) => {
    setUserAssignedClientIds((prev) =>
      prev.includes(clientId) ? prev.filter((id) => id !== clientId) : [...prev, clientId]
    );
  };

  const handleSaveAssignments = async () => {
    if (!selectedUserForAssignment) return;
    setSavingAssignments(true);
    await sharepointService.saveUserClientAssignments(selectedUserForAssignment.id, userAssignedClientIds);
    setSavingAssignments(false);
    setSelectedUserForAssignment(null);
    alert(`Đã lưu gán phụ trách Khách hàng cho ${selectedUserForAssignment.full_name}!`);
  };

  const handleLogoFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (currentUserRole !== 'admin') {
      setLogoError('Chỉ tài khoản ADMIN mới có quyền thay đổi Logo Thương hiệu.');
      return;
    }

    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
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

  const getStatusBadge = (s?: string) => {
    switch (s) {
      case 'pending':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">Đang chờ xác nhận</span>;
      case 'disabled':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 border border-red-300">Đã khóa</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">Đang hoạt động</span>;
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in select-none"
    >
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col h-[85vh]">
        {/* Modal Header */}
        <div className="p-4 bg-[#0F172A] text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-400/30">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Cài Đặt Hệ Thống & Quản Lý RBAC</h3>
              <p className="text-[11px] text-slate-400 font-mono">Smart Member Invite & Client Scope RBAC Engine</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white rounded-xl transition-all text-xs font-bold flex items-center space-x-1.5 min-h-[40px] cursor-pointer"
            title="Thoát cửa sổ (hoặc bấm phím ESC)"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Đóng [ESC]</span>
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
              handleRunPhantomAudit();
            }}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-t border-x flex items-center space-x-2 shrink-0 min-h-[40px] ${
              activeSettingsTab === 'health'
                ? 'bg-white text-blue-600 border-slate-200 border-b-transparent shadow-xs'
                : 'bg-slate-200/70 text-slate-600 border-transparent hover:bg-slate-200'
            }`}
          >
            <Database className="w-4 h-4 text-emerald-600" />
            <span>Kiểm Tra Storage & Rà Soát File</span>
          </button>
        </div>

        {/* Body Content Tab 1: User Management */}
        {activeSettingsTab === 'users' && (
          <div className="p-5 overflow-y-auto space-y-4 flex-1">
            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-600">
                Tổng số thành viên trong hệ thống: <strong className="text-blue-700 font-mono">{safeUsers.length}</strong>
              </div>

              {isSuperAdmin && (
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center space-x-1.5 transition-all shadow-xs min-h-[44px]"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{showAddForm ? 'Đóng form' : 'Mời người dùng mới'}</span>
                </button>
              )}
            </div>

            {/* Add User Form Drawer */}
            {showAddForm && (
              <form onSubmit={handleCreateUser} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 animate-fade-in text-xs">
                <h4 className="font-bold text-slate-900 flex items-center space-x-1.5">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span>Mời người dùng mới qua Email thực (Smart Member Invite)</span>
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
                      placeholder="user@company.com"
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
                      placeholder="VD: Nguyễn Văn Bình"
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
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
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
                    <th className="p-3">Trạng thái</th>
                    <th className="p-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {safeUsers.map((u) => {
                    if (!u || !u.id) return null;
                    const userEmail = (u.email || '').toLowerCase();
                    const userFullName = u.full_name || u.email || 'Thành viên Fica';
                    const isRootAdmin = userEmail === 'fica.holding@gmail.com';
                    return (
                      <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center space-x-2.5">
                            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center font-mono text-xs shadow-xs">
                              {getInitials(userFullName)}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 flex items-center space-x-1">
                                <span>{userFullName}</span>
                                {isRootAdmin && <span title="Root Admin Gốc"><ShieldCheck className="w-3.5 h-3.5 text-purple-600" /></span>}
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono">{userEmail || 'no-email'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 font-medium text-slate-600">{u.department || 'Fica Holding'}</td>
                        <td className="p-3">{getRoleBadge(u.role || 'staff')}</td>
                        <td className="p-3">{getStatusBadge(u.status || 'active')}</td>
                        <td className="p-3 text-right">
                          {isRootAdmin ? (
                            <div className="flex items-center justify-end space-x-1 text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-1 rounded border border-purple-200">
                              <ShieldCheck className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                              <span>Root Admin Gốc (Bảo vệ)</span>
                            </div>
                          ) : isSuperAdmin ? (
                            <div className="flex items-center justify-end space-x-1">
                              {/* Change Role Dropdown */}
                              <select
                                value={u.role}
                                onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                                className="text-[11px] font-bold bg-slate-100 border border-slate-300 rounded px-1.5 py-1 focus:outline-none focus:border-blue-500"
                                title="Đổi vai trò RBAC"
                              >
                                <option value="admin">ADMIN</option>
                                <option value="manager">MANAGER</option>
                                <option value="staff">STAFF</option>
                                <option value="client">CLIENT</option>
                              </select>

                              {/* Client Assignment Button for Manager & Staff */}
                              {(u.role === 'manager' || u.role === 'staff') && (
                                <button
                                  onClick={() => handleOpenClientAssignment(u)}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center"
                                  title="Gán Khách hàng phụ trách"
                                >
                                  <Building2 className="w-4 h-4" />
                                </button>
                              )}

                              {/* Resend Invite */}
                              {u.status === 'pending' && (
                                <button
                                  onClick={() => handleResendInvite(u.email)}
                                  className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center"
                                  title="Gửi lại email kích hoạt"
                                >
                                  <Mail className="w-4 h-4" />
                                </button>
                              )}

                              {/* Toggle Lock / Unlock */}
                              <button
                                onClick={() => handleToggleLock(u.id, u.status)}
                                className={`p-1.5 rounded-lg transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center ${
                                  u.status === 'disabled'
                                    ? 'text-emerald-600 hover:bg-emerald-50'
                                    : 'text-amber-600 hover:bg-amber-50'
                                }`}
                                title={u.status === 'disabled' ? 'Mở khóa tài khoản' : 'Tạm khóa tài khoản'}
                              >
                                {u.status === 'disabled' ? <UserCheck className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                              </button>

                              {/* Delete User */}
                              <button
                                onClick={() => handleRemoveUser(u.id)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center"
                                title="Xóa khỏi hệ thống"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Chỉ xem</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Client Assignment Sub-Drawer Modal */}
            {selectedUserForAssignment && (
              <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-xl space-y-3 animate-fade-in text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-blue-900 flex items-center space-x-1.5">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <span>Phân công Khách hàng phụ trách cho: <strong>{selectedUserForAssignment.full_name}</strong> ({selectedUserForAssignment.role.toUpperCase()})</span>
                  </h4>
                  <button
                    onClick={() => setSelectedUserForAssignment(null)}
                    className="p-1 text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-[11px] text-blue-800">
                  Tích chọn các Khách hàng mà thành viên này được phép truy cập và xử lý tài liệu:
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 bg-white rounded-lg border border-blue-200">
                  {allClients.map((c) => {
                    const isChecked = userAssignedClientIds.includes(c.id);
                    return (
                      <label key={c.id} className="flex items-center space-x-2 cursor-pointer p-1.5 hover:bg-slate-50 rounded">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleAssignClient(c.id)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="truncate font-semibold text-slate-800" title={c.folder_name}>
                          {c.folder_name}
                        </span>
                      </label>
                    );
                  })}
                </div>

                <div className="flex justify-end space-x-2 pt-1">
                  <button
                    onClick={() => setSelectedUserForAssignment(null)}
                    className="px-3 py-1.5 bg-slate-200 text-slate-700 font-semibold rounded"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleSaveAssignments}
                    disabled={savingAssignments}
                    className="px-4 py-1.5 bg-blue-600 text-white font-bold rounded flex items-center space-x-1"
                  >
                    {savingAssignments ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    <span>Lưu gán Khách hàng</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Body Content Tab 2: Company Logo Upload */}
        {activeSettingsTab === 'logo' && (
          <div className="p-5 overflow-y-auto space-y-6 flex-1 text-xs text-slate-800">
            <div>
              <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <ImageIcon className="w-5 h-5 text-purple-600" />
                <span>Logo Thương Hiệu Công Ty (Company Logo Settings)</span>
              </h4>
              <p className="text-slate-500 text-xs mt-1">
                Tải lên Logo mới để áp dụng đồng bộ trên toàn bộ hệ thống SharePoint Fica Holding (Header, Sidebar, Báo cáo & Mobile).
              </p>
            </div>

            {logoError && (
              <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs flex items-center space-x-2 animate-fade-in">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{logoError}</span>
              </div>
            )}

            {!isSuperAdmin && (
              <div className="p-3 bg-amber-50 text-amber-900 border border-amber-300 rounded-xl text-xs flex items-center space-x-2">
                <Shield className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Chế độ Chỉ xem (Read-Only). Bạn đang đăng nhập với vai trò [<strong>{currentUserRole.toUpperCase()}</strong>]. Chỉ tài khoản <strong>ADMIN</strong> mới có quyền tải lên hoặc xóa Logo công ty.</span>
              </div>
            )}

            <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
              <div className="w-28 h-28 bg-[#0F172A] rounded-2xl border-2 border-slate-800 flex items-center justify-center p-3 shadow-md relative shrink-0">
                <FicaLogo className="w-16 h-16" logoUrl={logoPreview} />
                {logoPreview && (
                  <span className="absolute bottom-1 right-1 bg-emerald-500 text-white rounded-full p-1 shadow-xs" title="Logo Tùy chỉnh Active">
                    <Check className="w-3 h-3" />
                  </span>
                )}
              </div>

              <div className="space-y-3 flex-1 text-center sm:text-left">
                <div>
                  <h5 className="font-bold text-slate-900 text-sm">Tải lên Logo tùy chỉnh mới</h5>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Định dạng hỗ trợ: PNG, JPG, WEBP, SVG (Dung lượng tối đa 2MB).
                  </p>
                </div>

                {isSuperAdmin && (
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                    <label className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer transition-all shadow-xs flex items-center space-x-2 min-h-[44px]">
                      {uploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                      <span>{uploadingLogo ? 'Đang tải...' : 'Chọn file ảnh Logo mới'}</span>
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/webp, image/svg+xml"
                        onChange={handleLogoFileSelect}
                        disabled={uploadingLogo}
                        className="hidden"
                      />
                    </label>

                    {logoPreview && (
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="bg-slate-200 hover:bg-red-100 text-slate-700 hover:text-red-700 font-semibold text-xs px-3 py-2.5 rounded-xl transition-all border border-slate-300 hover:border-red-300 flex items-center space-x-1.5 min-h-[44px]"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Xóa Logo (Khôi phục mặc định)</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Body Content Tab 3: Health & Phantom Audit */}
        {activeSettingsTab === 'health' && (
          <div className="p-5 overflow-y-auto space-y-5 flex-1 text-xs text-slate-800">
            <div>
              <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <Database className="w-5 h-5 text-emerald-600" />
                <span>Kiểm Tra Storage & Rà Soát File Phantom</span>
              </h4>
              <p className="text-slate-500 text-xs mt-1">
                Công cụ tự động đối soát tệp vật lý giữa CSDL Supabase Database và Supabase Storage Bucket.
              </p>
            </div>

            {/* Health Status Box */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Trạng thái Supabase Storage Bucket:</span>
                <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${healthStatus.exists ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                  {healthStatus.checking ? 'Đang kiểm tra...' : healthStatus.exists ? 'Hoạt động an toàn' : 'Cần kiểm tra'}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 font-mono">{healthStatus.message}</p>
            </div>

            {/* Audit Summary Box */}
            <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-bold text-blue-900">Báo cáo Rà soát File Phantom (Phantom File Audit)</h5>
                  <p className="text-[11px] text-blue-700">Tổng tài liệu kiểm tra: <strong>{auditReport.total}</strong></p>
                </div>

                <button
                  onClick={handleRunPhantomAudit}
                  disabled={auditing}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1.5 disabled:opacity-50 min-h-[44px]"
                >
                  {auditing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                  <span>{auditing ? 'Đang quét...' : 'Quét lại hệ thống'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-3 bg-white border border-emerald-200 rounded-lg text-emerald-800">
                  <div className="text-[11px] font-semibold">Tài liệu An toàn (Có File Vật lý):</div>
                  <div className="text-lg font-extrabold mt-0.5">{auditReport.verifiedCount} file</div>
                </div>

                <div className="p-3 bg-white border border-red-200 rounded-lg text-red-800">
                  <div className="text-[11px] font-semibold">Tài liệu Phantom (Thiếu File Vật lý):</div>
                  <div className="text-lg font-extrabold mt-0.5">{auditReport.phantomCount} file</div>
                </div>
              </div>
            </div>

            {/* Phantom Files List & Replace Options */}
            {auditReport.phantomFiles.length > 0 && (
              <div className="space-y-3">
                <h5 className="font-bold text-slate-900 flex items-center space-x-1.5 text-xs">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span>Danh sách File Phantom cần bổ sung File thực tế:</span>
                </h5>

                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">Tên Tài Liệu</th>
                        <th className="p-2.5">Path Storage</th>
                        <th className="p-2.5 text-right">Bổ sung File Thực</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {auditReport.phantomFiles.map((pf) => (
                        <tr key={pf.id} className="hover:bg-slate-50">
                          <td className="p-2.5 font-bold text-slate-900">{pf.name}</td>
                          <td className="p-2.5 font-mono text-[11px] text-slate-500">{pf.storage_path}</td>
                          <td className="p-2.5 text-right">
                            <label className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] px-2.5 py-1.5 rounded cursor-pointer inline-flex items-center space-x-1 min-h-[36px]">
                              {uploadingPhantomId === pf.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserPlus className="w-3 h-3" />}
                              <span>{uploadingPhantomId === pf.id ? 'Đang tải...' : 'Upload File'}</span>
                              <input
                                type="file"
                                onChange={(e) => handleReplacePhantomFile(e, pf)}
                                disabled={uploadingPhantomId === pf.id}
                                className="hidden"
                              />
                            </label>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sticky Modal Footer for One-Click Return */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between shrink-0 text-xs">
          <div className="flex items-center space-x-2 text-slate-600 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="hidden sm:inline">Cấu hình Cài đặt & Phân quyền RBAC đã được tự động lưu.</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center space-x-2 min-h-[44px] cursor-pointer"
          >
            <X className="w-4 h-4 text-slate-300" />
            <span>Hoàn tất & Quay về Trang chủ</span>
          </button>
        </div>
      </div>
    </div>
  );
};
