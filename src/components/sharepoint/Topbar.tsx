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
} from 'lucide-react';
import { UserProfile, UserRole } from '@/types/sharepoint';

interface TopbarProps {
  currentUser: UserProfile;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onRoleSwitch: (role: UserRole) => void;
  onOpenUserManagement?: () => void;
  onOpenProfile?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  currentUser,
  searchQuery,
  onSearchChange,
  onRoleSwitch,
  onOpenUserManagement,
  onOpenProfile,
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showRoleSubMenu, setShowRoleSubMenu] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore
    }
    // Delete demo session cookie
    document.cookie = 'fica_demo_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    router.push('/login');
  };

  const getRoleBadgeColor = (role: UserRole) => {
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

  // Dynamic Initials Helper
  const getInitials = (name: string) => {
    if (!name) return 'U';
    const words = name.trim().split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <header className="h-14 bg-[#0F172A] text-white flex items-center justify-between px-4 border-b border-slate-800 select-none z-30 sticky top-0 shadow-md">
      {/* Left: App Launcher & FICA Logo */}
      <div className="flex items-center space-x-3 min-w-[280px]">
        <button
          title="App Launcher"
          className="p-2 hover:bg-slate-800 rounded-md transition-colors text-slate-300 hover:text-white"
        >
          <Grid className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2.5">
          {/* Official Fica Holding Symbol Component */}
          <FicaLogo className="w-8 h-8" />

          <div>
            <div className="flex items-center space-x-1.5 font-bold tracking-wide text-sm text-slate-100">
              <span>FICA HOLDING</span>
              <span className="text-xs bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-mono border border-blue-400/30">
                SharePoint
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Hệ thống Quản trị Tài liệu Tư vấn Financial</p>
          </div>
        </div>
      </div>

      {/* Middle: Global Search */}
      <div className="flex-1 max-w-2xl mx-6">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-400">
            <Search className="w-4 h-4 transition-colors" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm kiếm nhanh theo Tên KH, Mã KH, Tên file hoặc Thẻ Tag... (Alt+/)"
            className="w-full bg-slate-900/90 text-sm text-slate-100 placeholder-slate-400 pl-10 pr-12 py-1.5 rounded-md border border-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-500 font-mono pointer-events-none">
            Ctrl+K
          </div>
        </div>
      </div>

      {/* Right: Actions & User Menu */}
      <div className="flex items-center space-x-2">
        <button
          title="Thông báo hệ thống"
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-md relative transition-colors"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full ring-2 ring-[#0F172A]" />
        </button>

        <button
          title="Trợ giúp & Hướng dẫn"
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {currentUser.role === 'admin' && onOpenUserManagement && (
          <button
            onClick={onOpenUserManagement}
            title="Quản lý Người dùng & Phân quyền"
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
          >
            <Users className="w-4 h-4 text-blue-400" />
          </button>
        )}

        <div className="h-5 w-[1px] bg-slate-700 mx-1" />

        {/* User Profile Badge & Dropdown Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center space-x-2 p-1.5 hover:bg-slate-800 rounded-md transition-colors border border-slate-800 hover:border-slate-700"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-inner ring-2 ring-blue-500/40">
              {getInitials(currentUser.full_name)}
            </div>
            <div className="text-left hidden lg:block">
              <div className="text-xs font-bold text-slate-100 leading-tight flex items-center space-x-1.5">
                <span>{currentUser.full_name}</span>
                <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${getRoleBadgeColor(currentUser.role)}`}>
                  {currentUser.role}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono truncate max-w-[130px]">{currentUser.email}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* POPUP DROPDOWN MENU */}
          {showUserDropdown && (
            <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-2 z-50 animate-fade-in text-slate-200 divide-y divide-slate-800">
              {/* User Identity Section */}
              <div className="px-4 py-3 bg-slate-950/60">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shadow">
                    {getInitials(currentUser.full_name)}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-100">{currentUser.full_name}</h4>
                    <p className="text-xs text-slate-400 font-mono">{currentUser.email}</p>
                    <div className="mt-1 flex items-center space-x-1">
                      <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${getRoleBadgeColor(currentUser.role)}`}>
                        {currentUser.role}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">{currentUser.department || 'Fica Holding'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Actions */}
              <div className="py-1">
                <button
                  onClick={() => {
                    if (onOpenProfile) onOpenProfile();
                    setShowUserDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs flex items-center space-x-2 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  <User className="w-4 h-4 text-blue-400" />
                  <span>Hồ sơ cá nhân (My Profile)</span>
                </button>

                {currentUser.role === 'admin' && onOpenUserManagement && (
                  <button
                    onClick={() => {
                      onOpenUserManagement();
                      setShowUserDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs flex items-center space-x-2 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                  >
                    <Users className="w-4 h-4 text-purple-400" />
                    <span>Quản lý Người dùng & RBAC</span>
                  </button>
                )}

                {/* Submenu toggle for Role Switcher */}
                <button
                  onClick={() => setShowRoleSubMenu(!showRoleSubMenu)}
                  className="w-full text-left px-4 py-2 text-xs flex items-center justify-between text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-amber-400" />
                    <span>Giả lập Chuyển đổi Vai trò</span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {showRoleSubMenu && (
                  <div className="bg-slate-950/80 my-1 py-1 px-2 border-y border-slate-800">
                    {(['admin', 'manager', 'staff', 'client'] as UserRole[]).map((r) => (
                      <button
                        key={r}
                        onClick={() => {
                          onRoleSwitch(r);
                          setShowRoleSubMenu(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 text-[11px] flex items-center justify-between hover:bg-slate-800 rounded transition-colors uppercase font-mono ${
                          currentUser.role === r ? 'text-blue-400 font-bold' : 'text-slate-400'
                        }`}
                      >
                        <span>{r}</span>
                        {currentUser.role === r && <UserCheck className="w-3.5 h-3.5 text-blue-400" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* LOGOUT BUTTON */}
              <div className="p-1">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-xs flex items-center space-x-2 text-red-400 hover:bg-red-950/50 hover:text-red-300 rounded transition-colors font-bold"
                >
                  <LogOut className="w-4 h-4 text-red-400" />
                  <span>Đăng xuất (Sign Out)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
