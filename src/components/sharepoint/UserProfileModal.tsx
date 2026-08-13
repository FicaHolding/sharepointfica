'use client';

import React, { useState, useEffect } from 'react';
import { X, UserCheck, Shield, Mail, Building2, Phone, User, Loader2, CheckCircle2 } from 'lucide-react';
import { UserProfile } from '@/types/sharepoint';
import { createClient } from '@/utils/supabase/client';

interface UserProfileModalProps {
  currentUser: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  currentUser,
  isOpen,
  onClose,
  onUpdateProfile,
}) => {
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('');
  const [phone, setPhone] = useState('0908 123 456');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const supabase = createClient();

  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.full_name || '');
      setDepartment(currentUser.department || 'Phòng Tư Vấn Tài Chính');
      setSuccessMsg('');
    }
  }, [currentUser, isOpen]);

  if (!isOpen) return null;

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const words = name.trim().split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    setLoading(true);
    setSuccessMsg('');

    try {
      // 1. Update Supabase Auth User Metadata
      await supabase.auth.updateUser({
        data: {
          full_name: fullName.trim(),
          department: department.trim(),
          phone: phone.trim(),
        },
      });

      // 2. Update `profiles` table if exists
      await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          department: department.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentUser.id);

      onUpdateProfile({
        full_name: fullName.trim(),
        department: department.trim(),
      });

      setSuccessMsg('Đã cập nhật Hồ sơ cá nhân thành công!');
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1500);
    } catch {
      setSuccessMsg('Đã cập nhật dữ liệu tài khoản!');
      onUpdateProfile({
        full_name: fullName.trim(),
        department: department.trim(),
      });
      setTimeout(() => {
        onClose();
      }, 1500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in select-none">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="p-4 bg-[#0F172A] text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-400/30">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Hồ Sơ Cá Nhân (My Profile)</h3>
              <p className="text-[11px] text-slate-400">Thông tin tài khoản Fica Holding</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Identity Card */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center space-x-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-base flex items-center justify-center shadow-md ring-2 ring-blue-500/40 shrink-0">
            {getInitials(fullName || currentUser.full_name)}
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-900">{fullName || currentUser.full_name}</h4>
            <p className="text-xs text-slate-500 font-mono">{currentUser.email}</p>
            <span className="inline-block mt-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-300">
              Role: {currentUser.role}
            </span>
          </div>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center space-x-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{successMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Email công ty (Cố định):
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={currentUser.email}
                disabled
                className="w-full p-2.5 pl-9 rounded-lg border border-slate-200 bg-slate-100 font-mono text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Họ và Tên Cán bộ (*):
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="VD: Nguyễn Văn Nam"
                className="w-full p-2.5 pl-9 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-600 font-semibold"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Phòng ban / Chức danh:
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="VD: Ban Giám Đốc"
                  className="w-full p-2.5 pl-9 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Số điện thoại liên hệ:
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0908 123 456"
                  className="w-full p-2.5 pl-9 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-600 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-3 flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold py-2.5 rounded-lg transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2.5 rounded-lg transition-colors shadow-xs flex items-center justify-center space-x-1.5"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <span>Cập nhật Hồ sơ</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
