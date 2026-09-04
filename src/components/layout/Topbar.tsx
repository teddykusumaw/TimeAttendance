'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Clock,
  Database,
  Bell,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  Briefcase,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLayout } from '@/context/LayoutContext';
import { Role } from '@/types';
import { attendanceRepo } from '@/lib/attendance-repository';

interface TopbarProps {
  onQuickPunchClick?: () => void;
}

export default function Topbar({ onQuickPunchClick }: TopbarProps) {
  const { sidebarCollapsed } = useLayout();
  const { currentUser, switchRole } = useAuth();

  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [todayRecord, setTodayRecord] = useState(attendanceRepo.getEmployeeTodayRecord(currentUser.id));

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
          weekday: 'long',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setTodayRecord(attendanceRepo.getEmployeeTodayRecord(currentUser.id));
  }, [currentUser]);

  const roles: { role: Role; label: string; icon: any }[] = [
    { role: 'SUPER_ADMIN', label: 'Super Admin', icon: ShieldCheck },
    { role: 'HR_ADMIN', label: 'HR Admin', icon: UserCheck },
    { role: 'MANAGER', label: 'Manager', icon: Briefcase },
    { role: 'EMPLOYEE', label: 'Employee', icon: UserIcon },
  ];

  return (
    <header
      className={`fixed top-0 right-0 z-30 h-16 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl transition-all duration-300 flex items-center justify-between px-4 sm:px-6 ${
        sidebarCollapsed ? 'left-20' : 'left-64'
      }`}
    >
      {/* Left: Real-time Live Clock & Date */}
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
          <Clock className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-slate-300 font-medium">{dateStr || 'Memuat...'}</span>
          <span className="w-1 h-1 rounded-full bg-slate-600"></span>
          <span className="font-mono font-bold text-white tracking-wider">{timeStr || '--:--:--'}</span>
          <span className="text-[10px] text-slate-400 font-medium uppercase">WIB</span>
        </div>

        {/* Database Status Indicator */}
        <Link
          href="/settings"
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 text-xs transition-colors group"
          title="Klik untuk konfigurasi dan diagnostik koneksi Neon PostgreSQL"
        >
          <Database className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
          <span className="hidden lg:inline text-slate-400 group-hover:text-slate-300 font-medium">
            Neon Postgres:
          </span>
          <span className="flex items-center gap-1.5 font-semibold text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Online</span>
          </span>
        </Link>
      </div>

      {/* Right: Fast Multi-Role Switcher & Quick Actions */}
      <div className="flex items-center gap-3">
        {/* Fast Role Switcher Pills for Rapid Review */}
        <div className="hidden lg:flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-0.5">
            Role:
          </span>
          {roles.map(({ role, label, icon: Icon }) => {
            const isSelected = currentUser.role === role;
            return (
              <button
                key={role}
                onClick={() => switchRole(role)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {/* Quick Punch In/Out Shortcut Button */}
        {onQuickPunchClick && (
          <button
            onClick={onQuickPunchClick}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/20 transition-all active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Kios Presensi</span>
          </button>
        )}

        {/* Notifications */}
        <button
          className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800/80 transition-colors"
          title="Notifikasi Sistem"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500"></span>
        </button>

        {/* User Mini Avatar & Direct Link to Multi-Login */}
        <Link
          href="/login"
          className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 text-xs transition-colors"
          title="Halaman Multi-Login & Akun"
        >
          <span className="hidden sm:inline font-medium text-slate-300">{currentUser.fullName.split(' ')[0]}</span>
          <img
            src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
            alt="Avatar"
            className="w-7 h-7 rounded-lg object-cover border border-slate-700"
          />
        </Link>
      </div>
    </header>
  );
}
