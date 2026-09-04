'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Clock,
  LogOut,
  CalendarOff,
  Home,
  User,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function EmployeeHeader() {
  const router = useRouter();
  const { currentUser, logout } = useAuth();
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
      setDateStr(
        now.toLocaleDateString('id-ID', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-xl">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Left: Brand & Portal Badge */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-white tracking-tight">
                TIME ATTENDANCE
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                PORTAL KARYAWAN
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Kios Presensi Mandiri & Geofencing GPS
            </p>
          </div>
        </div>

        {/* Center: Live Clock (Desktop & Tablet) */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
          <Clock className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-slate-300 font-medium">{dateStr}</span>
          <span className="w-1 h-1 rounded-full bg-slate-600"></span>
          <span className="font-mono font-bold text-white tracking-wider">{timeStr}</span>
          <span className="text-[10px] text-slate-400 uppercase">WIB</span>
        </div>

        {/* Right: Quick Links, Profile & Logout */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/leaves"
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors"
            title="Pengajuan Cuti / Izin"
          >
            <CalendarOff className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Cuti & Izin</span>
          </Link>

          <div className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-slate-800">
            <img
              src={
                currentUser.avatarUrl ||
                'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100'
              }
              alt={currentUser.fullName}
              className="w-8 h-8 rounded-xl object-cover border border-slate-700"
            />
            <div className="hidden lg:block text-left text-xs">
              <div className="font-bold text-white leading-tight">
                {currentUser.fullName.split(' ')[0]}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                {currentUser.employeeCode || 'EMP'}
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-500/30 transition-colors"
              title="Keluar / Ganti Akun"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
