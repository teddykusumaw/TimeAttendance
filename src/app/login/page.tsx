'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  ShieldCheck,
  UserCheck,
  Briefcase,
  User as UserIcon,
  ArrowRight,
  Lock,
  Mail,
  CheckCircle2,
  Building2,
  Smartphone,
  Layers,
  MapPin,
  Clock,
  KeyRound,
  Search,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Role, User } from '@/types';

export default function LoginPage() {
  const router = useRouter();
  const { allUsers, login, switchUser, switchRole } = useAuth();

  // Active portal tab: 'EMPLOYEE' (Portal Karyawan) or 'MANAGEMENT' (Admin/HR/Manager)
  const [activeTab, setActiveTab] = useState<'EMPLOYEE' | 'MANAGEMENT'>('EMPLOYEE');

  // Form states
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Filter employees for quick select
  const employeeUsers = allUsers.filter((u) => u.role === 'EMPLOYEE');

  // Management users
  const managementUsers: {
    role: Role;
    title: string;
    name: string;
    email: string;
    desc: string;
    icon: any;
    color: string;
    badgeBg: string;
    badgeText: string;
  }[] = [
    {
      role: 'SUPER_ADMIN',
      title: 'Super Administrator',
      name: 'Alexander Bramantyo',
      email: 'superadmin@enterprise.corp',
      desc: 'Akses penuh seluruh cabang, audit trail, & DB config',
      icon: ShieldCheck,
      color: 'border-purple-500/30 hover:border-purple-500/60',
      badgeBg: 'bg-purple-950/60',
      badgeText: 'text-purple-300',
    },
    {
      role: 'HR_ADMIN',
      title: 'HR Director / Admin',
      name: 'Clarissa Maharani',
      email: 'hr.admin@enterprise.corp',
      desc: 'Bulk Excel import, shift roster, & kelola presensi',
      icon: UserCheck,
      color: 'border-blue-500/30 hover:border-blue-500/60',
      badgeBg: 'bg-blue-950/60',
      badgeText: 'text-blue-300',
    },
    {
      role: 'MANAGER',
      title: 'Department Manager',
      name: 'Reza Pratama Kusuma',
      email: 'manager.eng@enterprise.corp',
      desc: 'Monitoring presensi tim divisi & persetujuan cuti',
      icon: Briefcase,
      color: 'border-emerald-500/30 hover:border-emerald-500/60',
      badgeBg: 'bg-emerald-950/60',
      badgeText: 'text-emerald-300',
    },
  ];

  const handleQuickEmployeeLogin = (user: User) => {
    switchUser(user.id);
    router.push('/');
  };

  const handleQuickManagementLogin = (role: Role) => {
    switchRole(role);
    router.push('/');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!identifier.trim()) {
      setErrorMsg(
        activeTab === 'EMPLOYEE'
          ? 'Masukkan NIK atau Email Karyawan.'
          : 'Masukkan Email Akun Manajemen.'
      );
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const success = login(identifier);
      if (success) {
        router.push('/');
      } else {
        setLoading(false);
        setErrorMsg(
          activeTab === 'EMPLOYEE'
            ? `Karyawan dengan NIK / Email "${identifier}" tidak ditemukan. Contoh: EMP-0004`
            : `Akun manajemen "${identifier}" tidak ditemukan. Pastikan email terdaftar.`
        );
      }
    }, 350);
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[650px] h-[650px] bg-gradient-to-tr from-blue-600/10 via-indigo-600/10 to-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header Logo */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-xl shadow-indigo-500/20 mb-3">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          TIME ATTENDANCE
        </h1>
        <p className="mt-1 text-xs text-slate-400 font-medium">
          Enterprise Presence Engine • Multi-Portal Access
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl relative z-10 space-y-4">
        {/* Dual Portal Switcher Tabs */}
        <div className="p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center gap-1 shadow-lg">
          <button
            type="button"
            onClick={() => {
              setActiveTab('EMPLOYEE');
              setErrorMsg(null);
            }}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'EMPLOYEE'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Portal Karyawan (Presensi)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('MANAGEMENT');
              setErrorMsg(null);
            }}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'MANAGEMENT'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Portal Manajemen (Admin/HR)</span>
          </button>
        </div>

        {/* TAB 1: PORTAL KARYAWAN */}
        {activeTab === 'EMPLOYEE' && (
          <div className="space-y-4">
            {/* Quick 1-Click Employee Cards */}
            <div className="enterprise-card rounded-2xl p-5 sm:p-6 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-blue-400" />
                    Pilih Akun Karyawan (1-Klik)
                  </h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Langsung masuk ke portal presensi mandiri tanpa ketik password
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Karyawan Aktif
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {employeeUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleQuickEmployeeLogin(user)}
                    className="p-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-blue-500/40 text-left transition-all hover:scale-[1.02] flex flex-col justify-between group shadow-sm"
                  >
                    <div>
                      <div className="flex items-center gap-2.5">
                        <img
                          src={user.avatarUrl}
                          alt={user.fullName}
                          className="w-9 h-9 rounded-xl object-cover border border-slate-700 group-hover:border-blue-500/50"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white group-hover:text-blue-400 truncate">
                            {user.fullName}
                          </div>
                          <span className="text-[10px] font-mono font-bold text-blue-400">
                            {user.employeeCode}
                          </span>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-400 mt-2 truncate">
                        {user.jobTitle}
                      </p>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 group-hover:text-blue-400 font-semibold">
                      <span>Masuk Portal</span>
                      <ArrowRight className="w-3 h-3 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Input NIK / Email Manual */}
            <form onSubmit={handleSubmit} className="enterprise-card rounded-2xl p-5 sm:p-6 space-y-4">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Atau Masuk dengan NIK / Email
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Gunakan Nomor Induk Karyawan yang terdaftar pada sistem (contoh: <code className="text-blue-400">EMP-0004</code>)
                </p>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                  {errorMsg}
                </div>
              )}

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    NIK / Email Karyawan
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Masukkan NIK (EMP-0004) atau Email..."
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 outline-none focus:border-blue-500 text-xs"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
              >
                <span>{loading ? 'Mengautentikasi...' : 'Masuk ke Portal Presensi'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: PORTAL MANAJEMEN */}
        {activeTab === 'MANAGEMENT' && (
          <div className="space-y-4">
            {/* Quick 1-Click Management Login */}
            <div className="enterprise-card rounded-2xl p-5 sm:p-6 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-purple-400" />
                    Login Cepat Eksekutif & HR
                  </h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Pilih peran manajemen untuk mengakses seluruh dashboard
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  Management
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {managementUsers.map((card) => {
                  const Icon = card.icon;
                  return (
                    <button
                      key={card.role}
                      onClick={() => handleQuickManagementLogin(card.role)}
                      className={`p-3.5 rounded-xl bg-slate-900/80 border ${card.color} text-left transition-all hover:scale-[1.02] flex flex-col justify-between group shadow-sm`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${card.badgeBg} ${card.badgeText}`}>
                            {card.title}
                          </span>
                          <Icon className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                        </div>
                        <div className="text-xs font-bold text-white mt-2 group-hover:text-purple-400 transition-colors">
                          {card.name}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                          {card.desc}
                        </p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-purple-400 font-semibold">
                        <span>Masuk Dashboard</span>
                        <ArrowRight className="w-3 h-3 transform group-hover:translate-x-1 transition-transform" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Email / Password Management Form */}
            <form onSubmit={handleSubmit} className="enterprise-card rounded-2xl p-5 sm:p-6 space-y-4">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Masuk dengan Kredensial Manajemen
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Khusus Super Admin, HR Director, dan Department Manager
                </p>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                  {errorMsg}
                </div>
              )}

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Email Manajemen
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      placeholder="superadmin@enterprise.corp"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 outline-none focus:border-purple-500 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 outline-none focus:border-purple-500 text-xs"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-500/20 transition-all flex items-center justify-center gap-2"
              >
                <span>{loading ? 'Mengautentikasi...' : 'Masuk ke Dashboard Manajemen'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
