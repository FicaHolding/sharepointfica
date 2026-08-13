'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Shield, Lock, Mail, ArrowRight, AlertCircle, Info, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('fica.holding@gmail.com');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [fullName, setFullName] = useState('Nguyễn Văn Nam');
  const router = useRouter();

  const supabase = createClient();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (isRegister) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: 'admin',
            },
          },
        });
        if (error) throw error;

        if (data.user && !data.session) {
          setSuccessMsg(
            'Đăng ký tài khoản thành công! Supabase đã gửi email xác nhận. Vui lòng mở hòm thư để bấm xác nhận, hoặc sử dụng tính năng "Trải nghiệm Nhanh Demo" bên dưới.'
          );
        } else {
          setSuccessMsg('Đăng ký tài khoản thành công! Bạn có thể đăng nhập ngay.');
        }
        setIsRegister(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.includes('Email not confirmed')) {
            setErrorMsg(
              'Tài khoản chưa được xác nhận Email! Vui lòng mở hòm thư Gmail để bấm xác nhận, hoặc nhấp nút "Trải nghiệm Nhanh Demo" để đăng nhập ngay.'
            );
          } else {
            setErrorMsg(`Đăng nhập thất bại: ${error.message}`);
          }
        } else {
          // Set demo session cookie as backup
          document.cookie = 'fica_demo_session=true; path=/; max-age=86400';
          router.push('/');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Có lỗi xảy ra trong quá trình xác thực.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = (roleEmail: string, roleName: string) => {
    document.cookie = 'fica_demo_session=true; path=/; max-age=86400';
    setEmail(roleEmail);
    setFullName(roleName);
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Dynamic Background Accents */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />

      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md relative z-10">
        {/* Header Branding */}
        <div className="p-8 text-center bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 p-0.5 shadow-lg shadow-blue-500/20 mb-4 flex items-center justify-center">
            <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center font-black text-xl text-white tracking-widest">
              FH
            </div>
          </div>

          <h1 className="text-xl font-bold text-slate-100 tracking-wide">FICA HOLDING</h1>
          <p className="text-xs text-blue-400 font-medium mt-1">Hệ Thống Quản Trị Tài Liệu Microsoft SharePoint</p>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 text-xs font-semibold">
          <button
            onClick={() => {
              setIsRegister(false);
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-3 text-center transition-colors ${
              !isRegister
                ? 'text-blue-400 border-b-2 border-blue-500 bg-slate-900/80'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Đăng nhập Hệ thống
          </button>

          <button
            onClick={() => {
              setIsRegister(true);
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-3 text-center transition-colors ${
              isRegister
                ? 'text-blue-400 border-b-2 border-blue-500 bg-slate-900/80'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Tạo Tài khoản Mới
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleAuth} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-950/80 border border-red-700 text-red-200 rounded-lg text-xs leading-relaxed flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>{errorMsg}</div>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-700 text-emerald-200 rounded-lg text-xs leading-relaxed flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>{successMsg}</div>
            </div>
          )}

          {isRegister && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Họ và Tên Cán bộ:</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="VD: Nguyễn Văn Nam"
                className="w-full text-xs bg-slate-950 border border-slate-700 text-slate-100 rounded-lg p-2.5 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Email Công ty Fica:</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="fica.holding@gmail.com"
                className="w-full text-xs bg-slate-950 border border-slate-700 text-slate-100 pl-9 pr-3 py-2.5 rounded-lg focus:outline-none focus:border-blue-500 font-mono"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Mật khẩu:</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs bg-slate-950 border border-slate-700 text-slate-100 pl-9 pr-3 py-2.5 rounded-lg focus:outline-none focus:border-blue-500 font-mono"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs py-3 rounded-lg shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center space-x-2"
          >
            <span>{loading ? 'Đang xác thực...' : isRegister ? 'Đăng ký Tài khoản' : 'Đăng nhập vào SharePoint Hub'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Access Credentials */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 text-xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center space-x-1">
            <Shield className="w-3.5 h-3.5 text-blue-400" />
            <span>Đăng nhập Nhanh Demo (Truy cập ngay):</span>
          </p>

          <div className="grid grid-cols-3 gap-1.5 mb-3">
            <button
              onClick={() => handleQuickDemoLogin('admin@fica.vn', 'Nguyễn Văn Nam (Admin)')}
              className="px-2 py-2 bg-purple-950/60 border border-purple-800 text-purple-300 rounded text-[11px] font-semibold hover:bg-purple-900 transition-colors text-center"
            >
              Admin Role
            </button>

            <button
              onClick={() => handleQuickDemoLogin('manager@fica.vn', 'Lê Hoàng Anh (Manager)')}
              className="px-2 py-2 bg-blue-950/60 border border-blue-800 text-blue-300 rounded text-[11px] font-semibold hover:bg-blue-900 transition-colors text-center"
            >
              Manager Role
            </button>

            <button
              onClick={() => handleQuickDemoLogin('staff@fica.vn', 'Phạm Thanh Sơn (Staff)')}
              className="px-2 py-2 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded text-[11px] font-semibold hover:bg-emerald-900 transition-colors text-center"
            >
              Staff Role
            </button>
          </div>

          <div className="p-2.5 bg-blue-950/30 border border-blue-900/50 rounded-lg text-[11px] text-slate-400 space-y-1">
            <p className="font-semibold text-blue-300 flex items-center space-x-1">
              <Info className="w-3.5 h-3.5" />
              <span>Lưu ý về Xác nhận Email Supabase:</span>
            </p>
            <p>
              Supabase mặc định yêu cầu xác thực email. Để bỏ qua xác thực email, bạn hãy bấm vào 1 trong 3 nút **Admin/Manager/Staff Role** ở trên để vào ngay hệ thống!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
