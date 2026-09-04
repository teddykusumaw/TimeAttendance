'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarCheck,
  FileSpreadsheet,
  Clock,
  CalendarOff,
  ShieldCheck,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Building2,
  Users,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLayout } from '@/context/LayoutContext';
import { Role } from '@/types';

export default function Sidebar() {
  const { sidebarCollapsed: collapsed, setSidebarCollapsed: setCollapsed } = useLayout();
  const pathname = usePathname();

  const { currentUser, switchRole, permissions, logout } = useAuth();
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const navItems = [
    {
      label: currentUser.role === 'EMPLOYEE' ? 'Portal Presensi' : 'Dashboard',
      href: '/',
      icon: LayoutDashboard,
      roles: ['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER', 'EMPLOYEE'] as Role[],
    },
    {
      label: 'Presensi & Ledger',
      href: '/attendance',
      icon: CalendarCheck,
      roles: ['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER', 'EMPLOYEE'] as Role[],
    },
    {
      label: 'Bulk Excel Hub',
      href: '/bulk-upload',
      icon: FileSpreadsheet,
      badge: 'Excel',
      roles: ['SUPER_ADMIN', 'HR_ADMIN'] as Role[],
    },
    {
      label: 'Shift & Jadwal',
      href: '/shifts',
      icon: Clock,
      roles: ['SUPER_ADMIN', 'HR_ADMIN'] as Role[],
    },

    {
      label: 'Cuti & Lembur',
      href: '/leaves',
      icon: CalendarOff,
      roles: ['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER', 'EMPLOYEE'] as Role[],
    },
    {
      label: 'Audit Trail',
      href: '/audit-log',
      icon: ShieldCheck,
      badge: 'Tier 1',
      roles: ['SUPER_ADMIN', 'HR_ADMIN'] as Role[],
    },
    {
      label: 'Pengaturan & DB',
      href: '/settings',
      icon: Settings,
      roles: ['SUPER_ADMIN'] as Role[],
    },
  ];

  const filteredNav = navItems.filter((item) => item.roles.includes(currentUser.role));

  const roleColors: Record<Role, { bg: string; text: string; border: string }> = {
    SUPER_ADMIN: { bg: 'bg-purple-950/60', text: 'text-purple-300', border: 'border-purple-500/40' },
    HR_ADMIN: { bg: 'bg-blue-950/60', text: 'text-blue-300', border: 'border-blue-500/40' },
    MANAGER: { bg: 'bg-emerald-950/60', text: 'text-emerald-300', border: 'border-emerald-500/40' },
    EMPLOYEE: { bg: 'bg-amber-950/60', text: 'text-amber-300', border: 'border-amber-500/40' },
  };

  const roleDisplayNames: Record<Role, string> = {
    SUPER_ADMIN: 'Super Admin',
    HR_ADMIN: 'HR Director / Admin',
    MANAGER: 'Dept Manager',
    EMPLOYEE: 'Employee / Staff',
  };

  return (
    <aside
      className={`fixed left-0 top-0 bottom-0 z-40 flex flex-col transition-all duration-300 ease-in-out border-r border-slate-800/80 bg-slate-950/95 backdrop-blur-xl ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 text-white animate-pulse-subtle" />
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                <span>TIME ATTENDANCE</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  T1
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Enterprise Suite</p>
            </div>
          </div>
        )}

        {collapsed && (
          <div className="w-9 h-9 mx-auto rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
        )}

        {/* Toggle Collapse Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ${
            collapsed ? 'hidden' : 'block'
          }`}
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Branch & Multi-Branch Selector Info */}
      {!collapsed && (
        <div className="px-3 pt-3 pb-1">
          <div className="px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-800/60 flex items-center gap-2 text-xs text-slate-300">
            <Building2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="truncate font-medium">HQ - Sudirman (JKT)</span>
            <span className="ml-auto w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>
        </div>
      )}

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        {filteredNav.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm shadow-blue-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
              } ${collapsed ? 'justify-center px-2' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <Icon
                className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-105 ${
                  isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-300'
                }`}
              />

              {!collapsed && (
                <>
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </div>

      {/* Bottom Profile & Role Switcher Section */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950">
        {!collapsed ? (
          <div className="relative">
            <div
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all flex items-center gap-3"
            >
              <img
                src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                alt={currentUser.fullName}
                className="w-9 h-9 rounded-lg object-cover border border-slate-700"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{currentUser.fullName}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-medium border ${
                      roleColors[currentUser.role].bg
                    } ${roleColors[currentUser.role].text} ${roleColors[currentUser.role].border}`}
                  >
                    {roleDisplayNames[currentUser.role]}
                  </span>
                </div>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform ${roleDropdownOpen ? 'rotate-180' : ''}`}
              />
            </div>

            {/* Role Switcher Dropdown for Instant Demo Testing */}
            {roleDropdownOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 p-2 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl z-50 space-y-1">
                <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Switch Role (Demo)</span>
                  <Users className="w-3 h-3" />
                </div>
                {(['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER', 'EMPLOYEE'] as Role[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      switchRole(r);
                      setRoleDropdownOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                      currentUser.role === r
                        ? 'bg-blue-600/20 text-blue-400 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>{roleDisplayNames[r]}</span>
                    {currentUser.role === r && <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>}
                  </button>
                ))}
                <div className="pt-1 mt-1 border-t border-slate-800">
                  <button
                    onClick={() => {
                      logout();
                      window.location.href = '/login';
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-950/40 flex items-center gap-2 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Keluar ke Portal Login</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => setCollapsed(false)}
            className="w-full flex justify-center py-2 text-slate-400 hover:text-white"
            title="Expand Profile & Role"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </aside>
  );
}
