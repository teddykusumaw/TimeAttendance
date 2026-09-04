'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Send,
  Search,
  Filter,
  Smartphone,
  Fingerprint,
  Building2,
  Briefcase,
  Mail,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCcw,
  Shield,
  Layers,
  Copy,
  Check,
  MessageCircle,
  XCircle,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { attendanceRepo } from '@/lib/attendance-repository';
import { User, Role, EmployeeInvitation } from '@/types';
import AddEmployeeModal from '@/components/employees/AddEmployeeModal';
import InviteEmployeeModal from '@/components/employees/InviteEmployeeModal';

export default function EmployeesPage() {
  const { currentUser, resetUserDevice, permissions } = useAuth();

  const [activeTab, setActiveTab] = useState<'EMPLOYEES' | 'INVITATIONS'>('EMPLOYEES');
  const [refreshKey, setRefreshKey] = useState(0);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [selectedRole, setSelectedRole] = useState('ALL');

  // Feedback states
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const branches = attendanceRepo.getBranches();
  const departments = attendanceRepo.getDepartments();

  // Load live data
  const allEmployees = useMemo(() => {
    return attendanceRepo.getUsers();
  }, [refreshKey]);

  const allInvitations = useMemo(() => {
    return attendanceRepo.getInvitations();
  }, [refreshKey]);

  // Listen for sync events
  useEffect(() => {
    const handleSync = () => setRefreshKey((k) => k + 1);
    window.addEventListener('users_synced', handleSync);
    window.addEventListener('invitations_synced', handleSync);
    return () => {
      window.removeEventListener('users_synced', handleSync);
      window.removeEventListener('invitations_synced', handleSync);
    };
  }, []);

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    return allEmployees.filter((emp) => {
      const matchSearch =
        searchQuery === '' ||
        emp.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.employeeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.jobTitle.toLowerCase().includes(searchQuery.toLowerCase());

      const matchDept = selectedDept === 'ALL' || emp.departmentId === selectedDept;
      const matchBranch = selectedBranch === 'ALL' || emp.branchId === selectedBranch;
      const matchRole = selectedRole === 'ALL' || emp.role === selectedRole;

      return matchSearch && matchDept && matchBranch && matchRole;
    });
  }, [allEmployees, searchQuery, selectedDept, selectedBranch, selectedRole]);

  // Statistics
  const stats = useMemo(() => {
    const total = allEmployees.length;
    const boundCount = allEmployees.filter((e) => e.boundDeviceId).length;
    const faceCount = allEmployees.filter((e) => e.facePhotoUrl).length;
    const pendingInvites = allInvitations.filter((i) => i.status === 'PENDING').length;
    return { total, boundCount, faceCount, pendingInvites };
  }, [allEmployees, allInvitations]);

  const handleResetDeviceBinding = (emp: User) => {
    const confirmReset = confirm(
      `Apakah Anda yakin ingin me-reset pengikatan HP untuk "${emp.fullName}" (${emp.employeeCode})?\n\nKaryawan akan diminta mengikatkan HP barunya saat presensi berikutnya.`
    );
    if (!confirmReset) return;

    const success = resetUserDevice(emp.id);
    if (success) {
      setRefreshKey((k) => k + 1);
      setNotification({
        type: 'success',
        text: `Pengikatan HP untuk ${emp.fullName} berhasil di-reset.`,
      });
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const handleRevokeInvitation = async (inv: EmployeeInvitation) => {
    const confirmRevoke = confirm(`Apakah Anda yakin ingin membatalkan undangan untuk "${inv.fullName}" (${inv.email})?`);
    if (!confirmRevoke) return;

    const success = await attendanceRepo.revokeInvitation(inv.id);
    if (success) {
      setRefreshKey((k) => k + 1);
      setNotification({
        type: 'success',
        text: `Undangan untuk ${inv.fullName} telah dibatalkan.`,
      });
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const handleCopyInviteLink = (token: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const url = `${origin}/invite?token=${token}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 3000);
    }
  };

  const handleShareWhatsApp = (inv: EmployeeInvitation) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const url = `${origin}/invite?token=${inv.token}`;
    const text = `Halo ${inv.fullName},\n\nAnda diundang untuk bergabung di Enterprise Time Attendance sebagai *${inv.jobTitle}*.\n\nSilakan klik tautan aktivasi akun Anda berikut:\n${url}\n\nTautan ini berlaku selama 7 hari.\nTerima kasih.`;
    const cleanPhone = inv.phone ? inv.phone.replace(/[^0-9]/g, '') : '';
    const waUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20">
            Super Admin
          </span>
        );
      case 'HR_ADMIN':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/20">
            HR Admin
          </span>
        );
      case 'MANAGER':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
            Manager
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            Karyawan
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Header */}
      <div className="enterprise-card rounded-2xl p-6 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold mb-3">
            <Users className="w-3.5 h-3.5" />
            <span>Manajemen SDM & Kontrol Biometrik • Neon PostgreSQL</span>
          </div>

          <h1 className="fluid-title font-extrabold text-white tracking-tight">
            Data Karyawan & Onboarding
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5 leading-relaxed">
            Kelola master data seluruh karyawan, kontrol pengikatan HP (*1 device policy*), status biometrik wajah, serta fasilitas penambahan karyawan manual atau undangan link.
          </p>
        </div>

        {/* Action Hub Buttons */}
        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-2 transition-all shadow-sm"
          >
            <Send className="w-4 h-4 text-indigo-400" />
            <span>Undang Karyawan</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all active:scale-98"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Tambah Manual</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center gap-2.5 border transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{notification.text}</span>
        </div>
      )}

      {/* Stats Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="enterprise-card rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Karyawan</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <div className="text-[10px] text-blue-400 font-medium mt-0.5">Terdaftar Aktif</div>
          </div>
        </div>

        <div className="enterprise-card rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>HP Terikat (Binding)</span>
            <Smartphone className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white">{stats.boundCount}</div>
            <div className="text-[10px] text-emerald-400 font-medium mt-0.5">Perangkat Terverifikasi</div>
          </div>
        </div>

        <div className="enterprise-card rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Wajah Terdaftar</span>
            <Fingerprint className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white">{stats.faceCount}</div>
            <div className="text-[10px] text-cyan-400 font-medium mt-0.5">Master Biometrik</div>
          </div>
        </div>

        <div className="enterprise-card rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Undangan Pending</span>
            <Send className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white">{stats.pendingInvites}</div>
            <div className="text-[10px] text-amber-400 font-medium mt-0.5">Menunggu Aktivasi</div>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="enterprise-card rounded-2xl p-5 sm:p-6 space-y-5">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('EMPLOYEES')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'EMPLOYEES'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Daftar Karyawan ({filteredEmployees.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('INVITATIONS')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'INVITATIONS'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Undangan Onboarding ({allInvitations.length})</span>
            </button>
          </div>
        </div>

        {activeTab === 'EMPLOYEES' ? (
          <>
            {/* Search & Filters Toolbar */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-2 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama, NIK, email, atau jabatan..."
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>

              <div>
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                >
                  <option value="ALL">Semua Departemen</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                >
                  <option value="ALL">Semua Cabang</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Employees Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Karyawan</th>
                    <th className="py-3 px-4">Posisi & Divisi</th>
                    <th className="py-3 px-4">Cabang & Shift</th>
                    <th className="py-3 px-4">HP Binding</th>
                    <th className="py-3 px-4">Wajah Master</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        Tidak ada karyawan yang sesuai kriteria pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((emp) => (
                      <tr key={emp.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={
                                emp.avatarUrl ||
                                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
                              }
                              alt={emp.fullName}
                              className="w-9 h-9 rounded-xl object-cover border border-slate-700 shrink-0"
                            />
                            <div>
                              <div className="font-bold text-white">{emp.fullName}</div>
                              <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2">
                                <span>{emp.employeeCode}</span>
                                <span>•</span>
                                <span className="text-slate-500">{emp.email}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-200">{emp.jobTitle}</div>
                          <div className="text-[11px] text-slate-400">{emp.departmentName || 'Engineering'}</div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="text-slate-200">{emp.branchName || 'Headquarter'}</div>
                          <div className="text-[11px] text-slate-400">{emp.shiftName || 'Standard Office'}</div>
                        </td>

                        <td className="py-3 px-4">
                          {emp.boundDeviceId ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <Smartphone className="w-3 h-3 text-emerald-400" />
                              <span>{emp.boundDeviceName || 'HP Terikat'}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              Belum Terikat
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          {emp.facePhotoUrl ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                              <Fingerprint className="w-3 h-3 text-cyan-400" />
                              <span>Terdaftar</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                              Belum Direkam
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4">{getRoleBadge(emp.role)}</td>

                        <td className="py-3 px-4 text-right">
                          {emp.boundDeviceId && (
                            <button
                              onClick={() => handleResetDeviceBinding(emp)}
                              className="px-2.5 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 text-[11px] font-semibold inline-flex items-center gap-1 transition-colors"
                              title="Reset HP agar karyawan dapat binding HP baru"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Reset HP</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          /* INVITATIONS TAB */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400">
                Daftar undangan aktif yang dapat disalin tautannya atau dikirimkan via WhatsApp.
              </p>
              <button
                onClick={() => setIsInviteModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>+ Buat Undangan Baru</span>
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Calon Karyawan</th>
                    <th className="py-3 px-4">Alokasi Posisi & Divisi</th>
                    <th className="py-3 px-4">Cabang</th>
                    <th className="py-3 px-4">Status Undangan</th>
                    <th className="py-3 px-4">Masa Berlaku</th>
                    <th className="py-3 px-4 text-right">Aksi Link</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {allInvitations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        Belum ada undangan yang dibuat. Klik tombol "+ Buat Undangan Baru".
                      </td>
                    </tr>
                  ) : (
                    allInvitations.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-white">{inv.fullName}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{inv.email}</div>
                          {inv.phone && <div className="text-[10px] text-slate-500">{inv.phone}</div>}
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-200">{inv.jobTitle}</div>
                          <div className="text-[11px] text-slate-400">{inv.departmentName || 'Divisi'}</div>
                        </td>

                        <td className="py-3 px-4 text-slate-300">
                          {inv.branchName || 'Headquarter'}
                        </td>

                        <td className="py-3 px-4">
                          {inv.status === 'PENDING' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              <Clock className="w-3 h-3" />
                              Menunggu Aktivasi
                            </span>
                          )}
                          {inv.status === 'ACCEPTED' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3" />
                              Sudah Aktif
                            </span>
                          )}
                          {inv.status === 'REVOKED' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                              Dibatalkan
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-[11px] text-slate-400">
                          Sampai {new Date(inv.expiresAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>

                        <td className="py-3 px-4 text-right">
                          {inv.status === 'PENDING' && (
                            <div className="inline-flex items-center gap-2">
                              <button
                                onClick={() => handleCopyInviteLink(inv.token)}
                                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors ${
                                  copiedToken === inv.token
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                                }`}
                                title="Salin tautan aktivasi"
                              >
                                {copiedToken === inv.token ? (
                                  <>
                                    <Check className="w-3 h-3" />
                                    <span>Tersalin</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Salin Link</span>
                                  </>
                                )}
                              </button>

                              <button
                                onClick={() => handleShareWhatsApp(inv)}
                                className="p-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/40 text-emerald-300 transition-colors"
                                title="Kirim via WhatsApp"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleRevokeInvitation(inv)}
                                className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/40 text-rose-300 transition-colors"
                                title="Batalkan undangan"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add Employee Modal */}
      <AddEmployeeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          setRefreshKey((k) => k + 1);
          setNotification({ type: 'success', text: 'Karyawan baru berhasil ditambahkan.' });
          setTimeout(() => setNotification(null), 4000);
        }}
      />

      {/* Invite Employee Modal */}
      <InviteEmployeeModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onSuccess={() => {
          setRefreshKey((k) => k + 1);
        }}
      />
    </div>
  );
}
