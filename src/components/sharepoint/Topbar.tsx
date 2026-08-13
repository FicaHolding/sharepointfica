'use client';

import React from 'react';
import { Grid, Search, Bell, Settings, HelpCircle, Shield, UserCheck, ChevronDown, Building2 } from 'lucide-react';
import { UserProfile } from '@/types/sharepoint';

interface TopbarProps {
  currentUser: UserProfile;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onRoleSwitch: (role: UserProfile['role']) => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  currentUser,
  searchQuery,
  onSearchChange,
  onRoleSwitch,
}) => {
  const [showRoleMenu, setShowRoleMenu] = React.useState(false);

  const getRoleBadgeColor = (role: UserProfile['role']) => {
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

  return (
    <header className="h-14 bg-[#0F172A] text-white flex items-center justify-between px-4 border-b border-slate-800 select-none z-30 sticky top-0 shadow-md">
      {/* Left: App Launcher & Logo */}
      <div className="flex items-center space-x-3 min-w-[260px]">
        <button
          title="App Launcher"
          className="p-2 hover:bg-slate-800 rounded-md transition-colors text-slate-300 hover:text-white"
        >
          <Grid className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-inner font-bold text-white text-sm tracking-wider border border-blue-400/30">
            FH
          </div>
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

        <button
          title="Cài đặt hệ thống"
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
        >
          <Settings className="w-4 h-4" />
        </button>

        <div className="h-5 w-[1px] bg-slate-700 mx-1" />

        {/* User Role Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center space-x-2 p-1.5 hover:bg-slate-800 rounded-md transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 text-white font-semibold text-xs flex items-center justify-center shadow">
              {currentUser.full_name.substring(0, 2).toUpperCase()}
            </div>
            <div className="text-left hidden lg:block">
              <div className="text-xs font-semibold text-slate-200 leading-tight flex items-center space-x-1">
                <span>{currentUser.full_name}</span>
                <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${getRoleBadgeColor(currentUser.role)}`}>
                  {currentUser.role}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 truncate max-w-[130px]">{currentUser.email}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-lg shadow-xl py-2 z-50 animate-fade-in text-slate-200">
              <div className="px-3 py-2 border-b border-slate-800">
                <p className="text-xs font-semibold text-slate-300">Giả lập Phân quyền RBAC:</p>
                <p className="text-[11px] text-slate-400">Chọn vai trò để trải nghiệm RLS R&W/Read-Only</p>
              </div>

              <div className="py-1">
                {(['admin', 'manager', 'staff', 'client'] as UserProfile['role'][]).map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      onRoleSwitch(r);
                      setShowRoleMenu(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-slate-800 transition-colors ${
                      currentUser.role === r ? 'bg-blue-900/40 text-blue-300 font-semibold' : 'text-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2 capitalize">
                      <Shield className="w-3.5 h-3.5 text-slate-400" />
                      <span>{r}</span>
                    </div>
                    {currentUser.role === r && <UserCheck className="w-3.5 h-3.5 text-blue-400" />}
                  </button>
                ))}
              </div>

              <div className="px-3 py-1.5 border-t border-slate-800 mt-1">
                <span className="text-[11px] text-slate-400">Đơn vị: <strong>Fica Holding JSC</strong></span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
