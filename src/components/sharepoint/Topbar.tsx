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

interface TopbarProps {
  currentUser: UserProfile;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onRoleSwitch: (role: UserRole) => void;
  onOpenUserManagement?: () => void;
  onOpenProfile?: () => void;
  onOpenMobileMenu?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  currentUser,
  searchQuery,
  onSearchChange,
  onRoleSwitch,
  onOpenUserManagement,
  onOpenProfile,
  onOpenMobileMenu,
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showRoleSubMenu, setShowRoleSubMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const router = useRouter();
  const supabase = createClient();

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
      {/* Left: Mobile Menu Trigger & Logo */}
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
          <FicaLogo className="w-7 h-7 md:w-8 md:h-8" />
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
            placeholder="Tìm nhanh KH, File, Thẻ Tag..."
            className="w-full bg-slate-900/90 text-xs md:text-sm text-slate-100 placeholder-slate-400 pl-10 pr-8 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all min-h-[44px]"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Right: Actions & User Menu */}
      <div className="flex items-center space-x-1 md:space-x-2 shrink-0">
        {/* Mobile Search Glass Button */}
        <button
          onClick={() => setShowMobileSearch(!showMobileSearch)}
          title="Tìm kiếm"
          className="sm:hidden p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <Search className="w-5 h-5 text-blue-400" />
        </button>

        <button
          title="Thông báo hệ thống"
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg relative min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full ring-2 ring-[#0F172A]" />
        </button>

        {userRole === 'admin' && onOpenUserManagement && (
          <button
            onClick={onOpenUserManagement}
            title="Quản lý Người dùng"
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <Users className="w-4 h-4 text-blue-400" />
          </button>
        )}

        <div className="h-5 w-[1px] bg-slate-700 mx-0.5 md:mx-1 hidden xs:block" />

        {/* User Profile Avatar & Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center space-x-2 p-1 hover:bg-slate-800 rounded-lg transition-colors border border-slate-800 min-w-[44px] min-h-[44px] justify-center"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-inner ring-2 ring-blue-500/40">
              {getInitials(userName)}
            </div>
            <div className="text-left hidden lg:block">
              <div className="text-xs font-bold text-slate-100 leading-tight flex items-center space-x-1.5">
                <span className="truncate max-w-[120px]">{userName}</span>
                <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${getRoleBadgeColor(userRole)}`}>
                  {userRole}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono truncate max-w-[130px]">{userEmail}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
          </button>

          {/* Dropdown Menu */}
          {showUserDropdown && (
            <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 text-xs">
              <div className="px-3.5 py-2.5 border-b border-slate-800 bg-slate-950/50">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                    {getInitials(userName)}
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-bold text-white truncate text-xs">{userName}</p>
                    <p className="text-[10px] text-slate-400 font-mono truncate">{userEmail}</p>
                    <span className={`inline-block text-[9px] uppercase font-bold px-1.5 py-0.5 rounded mt-1 ${getRoleBadgeColor(userRole)}`}>
                      Quyền: {userRole}
                    </span>
                  </div>
                </div>
              </div>

              <div className="py-1">
                {onOpenProfile && (
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      onOpenProfile();
                    }}
                    className="w-full text-left px-3.5 py-2.5 text-slate-300 hover:bg-slate-800 hover:text-white flex items-center space-x-2 min-h-[44px]"
                  >
                    <User className="w-4 h-4 text-blue-400" />
                    <span>Hồ sơ cá nhân (My Profile)</span>
                  </button>
                )}

                <div className="relative">
                  <button
                    onClick={() => setShowRoleSubMenu(!showRoleSubMenu)}
                    className="w-full text-left px-3.5 py-2.5 text-slate-300 hover:bg-slate-800 hover:text-white flex items-center justify-between min-h-[44px]"
                  >
                    <div className="flex items-center space-x-2">
                      <UserCheck className="w-4 h-4 text-purple-400" />
                      <span>Đổi Vai trò (Switch Role)</span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                  </button>

                  {showRoleSubMenu && (
                    <div className="bg-slate-950 px-3 py-2 space-y-1.5 border-y border-slate-800">
                      {[
                        { r: 'admin' as UserRole, label: 'Quản trị viên (Admin)' },
                        { r: 'manager' as UserRole, label: 'Trưởng phòng (Manager)' },
                        { r: 'staff' as UserRole, label: 'Chuyên viên (Staff)' },
                        { r: 'client' as UserRole, label: 'Khách hàng (Client Read-Only)' },
                      ].map((item) => (
                        <button
                          key={item.r}
                          onClick={() => {
                            onRoleSwitch(item.r);
                            setShowRoleSubMenu(false);
                            setShowUserDropdown(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded text-[11px] flex items-center justify-between min-h-[36px] ${
                            userRole === item.r ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800'
                          }`}
                        >
                          <span>{item.label}</span>
                          {userRole === item.r && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-800 pt-1">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3.5 py-2.5 text-red-400 hover:bg-red-500/10 flex items-center space-x-2 font-medium min-h-[44px]"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Đăng xuất tài khoản</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Search Popover Overlay */}
      {showMobileSearch && (
        <div className="absolute top-14 left-0 right-0 bg-[#0F172A] border-b border-slate-800 p-3 z-40 sm:hidden animate-in slide-in-from-top-2 shadow-xl">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-blue-400" />
            <input
              type="text"
              autoFocus
              value={searchQuery || ''}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Nhập tên KH, Mã KH, Tên file hoặc Thẻ Tag..."
              className="w-full bg-slate-900 text-slate-100 text-sm pl-9 pr-9 py-2.5 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500 min-h-[44px]"
            />
            <button
              onClick={() => {
                setShowMobileSearch(false);
                onSearchChange('');
              }}
              className="absolute right-2.5 top-2.5 p-1 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
