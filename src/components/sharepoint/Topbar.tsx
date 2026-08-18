'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { FicaLogo } from '@/components/sharepoint/FicaLogo';
import {
  Grid,
  Search,
  Bell,
  Settings,
  HelpCircle,
  Shield,
  UserCheck,
  ChevronDown,
  LogOut,
  User,
  Users,
  Building2,
  CheckCircle2,
  Menu,
  X,
} from 'lucide-react';
import { UserProfile, UserRole } from '@/types/sharepoint';
import { sharepointService } from '@/services/sharepointService';

interface TopbarProps {
  currentUser: UserProfile;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onRoleSwitch: (role: UserRole) => void;
  onOpenUserManagement?: () => void;
  onOpenProfile?: () => void;
  onOpenMobileMenu?: () => void;
  companyLogoUrl?: string | null;
  systemUsers?: UserProfile[];
  onRefreshUsers?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  currentUser,
  searchQuery,
  onSearchChange,
  onRoleSwitch,
  onOpenUserManagement,
  onOpenProfile,
  onOpenMobileMenu,
  companyLogoUrl,
  systemUsers = [],
  onRefreshUsers,
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showRoleSubMenu, setShowRoleSubMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const pendingUsers = systemUsers.filter((u) => u.status === 'pending');

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore
    }
    document.cookie = 'fica_demo_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    router.push('/login');
  };

  const getRoleBadgeColor = (role?: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-600 text-white';
      case 'manager':
        return 'bg-blue-600 text-white';
      case 'staff':
        return 'bg-emerald-600 text-white';
      case 'client':
        return 'bg-amber-600 text-white';
      default:
        return 'bg-slate-600 text-white';
    }
  };

  // Safe Dynamic Initials Helper
  const getInitials = (name?: string | null) => {
    if (!name || typeof name !== 'string') return 'FC';
    const clean = name.trim();
    if (!clean) return 'FC';
    const words = clean.split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }
    return clean.substring(0, 2).toUpperCase();
  };

  const userName = currentUser?.full_name || currentUser?.email || 'Quản trị viên Fica';
  const userRole = currentUser?.role || 'admin';
  const userEmail = currentUser?.email || 'admin@fica.vn';
  const userDept = currentUser?.department || 'Fica Holding';

  return (
    <header className="h-14 bg-[#0F172A] text-white flex items-center justify-between px-3 md:px-4 border-b border-slate-800 select-none z-30 sticky top-0 shadow-md">
      {/* Left: Mobile Menu Trigger & Custom Company Logo */}
      <div className="flex items-center space-x-2 md:space-x-3 shrink-0">
        {/* Mobile Hamburger Drawer Trigger */}
        <button
          onClick={onOpenMobileMenu}
          title="Mở Menu điều hướng"
          className="p-2 md:hidden hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <Menu className="w-5 h-5 text-blue-400" />
        </button>

        {/* Desktop App Launcher */}
        <button
          title="App Launcher"
          className="hidden md:flex p-2 hover:bg-slate-800 rounded-md text-slate-300 hover:text-white min-w-[44px] min-h-[44px] items-center justify-center"
        >
          <Grid className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2">
          {/* Fica Logo Component with Dynamic Custom Logo URL Support */}
          <FicaLogo className="w-7 h-7 md:w-8 md:h-8" logoUrl={companyLogoUrl} />
          <div>
            <div className="flex items-center space-x-1.5 font-bold tracking-wide text-xs md:text-sm text-slate-100">
              <span>FICA HOLDING</span>
              <span className="text-[10px] md:text-xs bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-mono border border-blue-400/30">
                SharePoint
              </span>
            </div>
            <p className="text-[9px] md:text-[10px] text-slate-400 font-medium hidden sm:block">
              Hệ thống Quản trị Tài liệu Tư vấn Financial
            </p>
          </div>
        </div>
      </div>

      {/* Middle: Search Bar (Desktop & Mobile) */}
      <div className="flex-1 max-w-xl mx-2 md:mx-6">
        {/* Desktop Search Bar */}
        <div className="relative group hidden sm:block">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-400">
            <Search className="w-4 h-4 transition-colors" />
          </div>
          <input
            type="text"
            value={searchQuery || ''}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm kiếm tài liệu, thư mục khách hàng, mã hợp đồng..."
            className="w-full bg-slate-800/80 text-xs text-white placeholder-slate-400 pl-10 pr-4 py-2 rounded-xl border border-slate-700/80 focus:outline-none focus:border-blue-500 focus:bg-slate-800 focus:ring-1 focus:ring-blue-500 transition-all font-sans"
          />
        </div>

        {/* Mobile Search Glass Button */}
        <div className="sm:hidden flex justify-end">
          <button
            onClick={() => setShowMobileSearch(!showMobileSearch)}
            className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 min-w-[44px] min-h-[44px] flex items-center justify-center"
            title="Tìm kiếm"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile Top Overlay Search Input */}
      {showMobileSearch && (
        <div className="absolute inset-x-0 top-0 h-14 bg-slate-900 border-b border-slate-800 px-3 flex items-center space-x-2 z-40 sm:hidden animate-fade-in">
          <Search className="w-5 h-5 text-blue-400 shrink-0" />
          <input
            type="text"
            value={searchQuery || ''}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm kiếm tài liệu..."
            autoFocus
            className="flex-1 bg-transparent text-sm text-white focus:outline-none"
          />
          <button
            onClick={() => setShowMobileSearch(false)}
            className="p-2 text-slate-400 hover:text-white rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Right Controls & User Profile Dropdown */}
      <div className="flex items-center space-x-1.5 md:space-x-2 shrink-0">
        {/* Notification Bell with Pending Account Activation Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
            title="Thông báo hệ thống"
            className="relative p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer"
          >
            <Bell className="w-5 h-5" />
            {pendingUsers.length > 0 ? (
              <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full ring-2 ring-[#0F172A] flex items-center justify-center px-1">
                {pendingUsers.length}
              </span>
            ) : (
              <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full ring-2 ring-[#0F172A]" />
            )}
          </button>

          {showNotificationDropdown && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-50 text-xs animate-in fade-in select-none">
              <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between font-bold text-slate-200">
                <span className="flex items-center space-x-2">
                  <Bell className="w-4 h-4 text-blue-400" />
                  <span>Thông Báo & Xác Nhận Tài Khoản</span>
                </span>
                <span className="bg-blue-600/30 text-blue-300 border border-blue-500/40 text-[10px] px-2 py-0.5 rounded-full font-mono">
                  {pendingUsers.length} cần xác nhận
                </span>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-800">
                {pendingUsers.length > 0 ? (
                  pendingUsers.map((pUser) => (
                    <div key={pUser.id} className="p-3 hover:bg-slate-800/60 transition-colors flex items-start justify-between space-x-2">
                      <div className="space-y-1 min-w-0 pr-2">
                        <div className="font-bold text-white flex items-center space-x-1.5">
                          <span className="truncate">{pUser.full_name || pUser.email}</span>
                          <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded uppercase font-mono">
                            {pUser.role || 'STAFF'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono truncate">{pUser.email}</p>
                        <p className="text-[10px] text-amber-400 font-medium">⚠️ Đang chờ xác nhận tài khoản</p>
                      </div>

                      {(userRole === 'admin' || userRole === 'manager') && (
                        <button
                          onClick={async () => {
                            await sharepointService.activateUserDirectly(pUser.id);
                            if (onRefreshUsers) onRefreshUsers();
                            setShowNotificationDropdown(false);
                          }}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] px-2.5 py-1.5 rounded-lg flex items-center space-x-1 shrink-0 transition-colors shadow-xs cursor-pointer"
                          title="Kích hoạt tài khoản ngay lập tức"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Kích hoạt ngay</span>
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-slate-400 space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                    <p className="font-medium text-slate-300">Không có thông báo mới</p>
                    <p className="text-[11px] text-slate-500">Tất cả tài khoản thành viên đều ở trạng thái Đang hoạt động.</p>
                  </div>
                )}
              </div>

              {userRole === 'admin' && onOpenUserManagement && (
                <div className="p-2.5 bg-slate-950 border-t border-slate-800 text-center">
                  <button
                    onClick={() => {
                      setShowNotificationDropdown(false);
                      onOpenUserManagement();
                    }}
                    className="text-blue-400 hover:text-blue-300 font-bold text-xs hover:underline cursor-pointer"
                  >
                    Xem tất cả người dùng trong Cài đặt hệ thống →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Hide Settings gear icon for STAFF and CLIENT roles */}
        {(userRole === 'admin' || userRole === 'manager') && onOpenUserManagement && (
          <button
            title="Cài đặt hệ thống"
            onClick={onOpenUserManagement}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors hidden sm:flex min-w-[44px] min-h-[44px] items-center justify-center cursor-pointer"
          >
            <Settings className="w-5 h-5" />
          </button>
        )}

        {/* User Profile Trigger Dropdown */}
        <div className="relative ml-1">
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center space-x-2 p-1.5 hover:bg-slate-800 rounded-xl transition-colors min-h-[44px]"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-xs font-mono">
              {getInitials(userName)}
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-xs font-semibold leading-none truncate max-w-[120px]">
                {userName}
              </div>
              <div className="text-[10px] text-slate-400 capitalize mt-0.5 font-mono">
                {userRole}
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
          </button>

          {/* User Profile Dropdown Menu */}
          {showUserDropdown && (
            <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 text-xs animate-fade-in">
              <div className="p-4 bg-slate-950 border-b border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-sm font-bold text-white shadow-sm font-mono">
                    {getInitials(userName)}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">{userName}</h4>
                    <p className="text-[11px] text-slate-400 font-mono">{userEmail}</p>
                    <div className="mt-1 flex items-center space-x-1.5">
                      <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full ${getRoleBadgeColor(userRole)}`}>
                        {userRole.toUpperCase()}
                      </span>
                      <span className="text-[10px] text-slate-400 truncate max-w-[110px]">{userDept}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-2 space-y-1">
                {onOpenProfile && (
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      onOpenProfile();
                    }}
                    className="w-full text-left px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg flex items-center space-x-2 min-h-[44px]"
                  >
                    <User className="w-4 h-4 text-blue-400" />
                    <span>Hồ sơ cá nhân (My Profile)</span>
                  </button>
                )}

                {userRole === 'admin' && onOpenUserManagement && (
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      onOpenUserManagement();
                    }}
                    className="w-full text-left px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg flex items-center space-x-2 min-h-[44px]"
                  >
                    <Users className="w-4 h-4 text-purple-400" />
                    <span>Quản lý Người dùng & RBAC</span>
                  </button>
                )}

                {/* Role Switching Submenu for Testing RBAC */}
                <div className="pt-2 border-t border-slate-800">
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-500 uppercase font-mono">
                    Thử nghiệm Phân quyền (RBAC Switcher)
                  </div>
                  {(['admin', 'manager', 'staff', 'client'] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        onRoleSwitch(r);
                        setShowUserDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs rounded-lg flex items-center justify-between min-h-[38px] ${
                        userRole === r
                          ? 'bg-blue-600/20 text-blue-400 font-bold'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <span className="capitalize">{r} Mode</span>
                      {userRole === r && <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />}
                    </button>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded-lg flex items-center space-x-2 min-h-[44px]"
                  >
                    <LogOut className="w-4 h-4 text-red-400" />
                    <span className="font-semibold">Đăng xuất (Logout)</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
