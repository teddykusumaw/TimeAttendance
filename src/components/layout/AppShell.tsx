'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import EmployeeHeader from '@/components/layout/EmployeeHeader';
import BulkUploadModal from '@/components/attendance/BulkUploadModal';
import { LayoutProvider, useLayout } from '@/context/LayoutContext';
import { useAuth } from '@/context/AuthContext';

function AppShellContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === '/login';
  const { sidebarCollapsed } = useLayout();
  const { currentUser, isLoggedIn, isAuthInitialized } = useAuth();
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  // Auto redirect and role-based route protection
  useEffect(() => {
    if (!isAuthInitialized) return;

    if (!isLoggedIn && !isLoginPage) {
      router.replace('/login');
      return;
    }

    if (isLoggedIn && isLoginPage) {
      router.replace('/');
      return;
    }

    // Role-based protection: Employees can ONLY access Employee Portal (/) and leave application (/leaves)
    if (isLoggedIn && currentUser.role === 'EMPLOYEE') {
      const restrictedAdminRoutes = [
        '/attendance',
        '/shifts',
        '/bulk-upload',
        '/audit-log',
        '/settings',
      ];
      if (
        restrictedAdminRoutes.some(
          (route) => pathname === route || pathname.startsWith(`${route}/`)
        )
      ) {
        router.replace('/');
      }
    }
  }, [isAuthInitialized, isLoggedIn, isLoginPage, currentUser.role, pathname, router]);

  if (isLoginPage) {
    return <main className="min-h-screen bg-slate-950 text-slate-100">{children}</main>;
  }

  // Loading state during auth initialization
  if (!isAuthInitialized) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex flex-col items-center justify-center text-slate-400 text-xs gap-3">
        <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <span className="font-medium text-slate-300">Memverifikasi sesi aman...</span>
      </div>
    );
  }

  // Block rendering unauthenticated content while redirecting to login
  if (!isLoggedIn) {
    return null;
  }

  // Dedicated Employee Portal Layout (Clean, mobile-first, no admin sidebar)
  if (currentUser.role === 'EMPLOYEE') {
    return (
      <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col">
        <EmployeeHeader />
        <main className="flex-1 p-3 sm:p-6 max-w-5xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    );
  }

  // Management / Admin Layout: Full sidebar + Topbar
  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Mainbar Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 min-w-0 ${
          sidebarCollapsed ? 'pl-20' : 'pl-64'
        }`}
      >
        {/* Top Control Bar */}
        <Topbar
          onQuickPunchClick={() => {
            const el = document.getElementById('live-punch-terminal');
            if (el) {
              el.scrollIntoView({ behavior: 'smooth' });
            } else {
              window.location.href = '/#live-punch-terminal';
            }
          }}
        />

        {/* Content Container (Fluid layout) */}
        <main className="flex-1 mt-16 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>

      {/* Global Bulk Upload Modal */}
      <BulkUploadModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onSuccess={() => {
          window.dispatchEvent(new CustomEvent('attendance_updated'));
        }}
      />
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <LayoutProvider>
      <AppShellContent>{children}</AppShellContent>
    </LayoutProvider>
  );
}
