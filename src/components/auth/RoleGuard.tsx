'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft, Users, Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Role } from '@/types';

interface RoleGuardProps {
  allowedRoles: Role[];
  children: React.ReactNode;
}

export default function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { currentUser, switchRole } = useAuth();

  const isAllowed = allowedRoles.includes(currentUser.role);

  if (isAllowed) {
    return <>{children}</>;
  }

  const roleLabels: Record<Role, string> = {
    SUPER_ADMIN: 'Super Administrator',
    HR_ADMIN: 'HR Director / Administrator',
    MANAGER: 'Department Manager',
    EMPLOYEE: 'Employee / Staff',
  };

  return (
    <div className="py-12 px-4 max-w-2xl mx-auto text-center">
      <div className="enterprise-card rounded-2xl p-8 border-rose-500/30 relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
          403 Forbidden • Akses Dibatasi
        </span>

        <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-3 tracking-tight">
          Akses Menu Ditolak
        </h2>

        <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
          Akun Anda terdaftar sebagai{' '}
          <strong className="text-slate-200">{roleLabels[currentUser.role]}</strong> ({currentUser.fullName}).
          Halaman ini memerlukan hak akses tingkat khusus.
        </p>

        <div className="my-5 p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-left space-y-1.5">
          <div className="text-slate-500 font-medium">Peran yang diizinkan untuk mengakses modul ini:</div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {allowedRoles.map((r) => (
              <span
                key={r}
                className="px-2 py-0.5 rounded-md font-mono text-[11px] font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/20"
              >
                {roleLabels[r]}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-white flex items-center justify-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Dashboard</span>
          </Link>

          {/* Quick Demo Switcher if user is evaluating */}
          <button
            onClick={() => switchRole(allowedRoles[0])}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all active:scale-98"
          >
            <Users className="w-4 h-4" />
            <span>Beralih ke {roleLabels[allowedRoles[0]]} (Demo)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
