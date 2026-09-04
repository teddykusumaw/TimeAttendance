'use client';

import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  X,
  Building2,
  Briefcase,
  Mail,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Clock,
  Shield,
  Layers,
  Save,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { attendanceRepo } from '@/lib/attendance-repository';
import { User, Role } from '@/types';

interface EditEmployeeModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditEmployeeModal({
  user,
  isOpen,
  onClose,
  onSuccess,
}: EditEmployeeModalProps) {
  const { currentUser } = useAuth();
  const branches = attendanceRepo.getBranches();
  const departments = attendanceRepo.getDepartments();
  const shifts = attendanceRepo.getShifts();

  const [fullName, setFullName] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<Role>('EMPLOYEE');
  const [branchId, setBranchId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [shiftId, setShiftId] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user && isOpen) {
      setFullName(user.fullName || '');
      setEmployeeCode(user.employeeCode || '');
      setJobTitle(user.jobTitle || '');
      setPhone(user.phone || '');
      setRole(user.role || 'EMPLOYEE');
      setBranchId(user.branchId || '');
      setDepartmentId(user.departmentId || '');
      setShiftId(user.shiftId || '');
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!fullName.trim()) {
      setErrorMsg('Nama lengkap karyawan wajib diisi.');
      return;
    }

    setLoading(true);
    try {
      const branchObj = branches.find((b) => b.id === branchId);
      const deptObj = departments.find((d) => d.id === departmentId);
      const shiftObj = shifts.find((s) => s.id === shiftId);

      await attendanceRepo.updateUser(user.id, {
        fullName: fullName.trim(),
        employeeCode: employeeCode.trim() || user.employeeCode,
        jobTitle: jobTitle.trim() || 'Staff Karyawan',
        phone: phone.trim() || null,
        role,
        branchId: branchId || null,
        branchName: branchObj?.name,
        departmentId: departmentId || null,
        departmentName: deptObj?.name,
        shiftId: shiftId || null,
        shiftName: shiftObj?.name,
      });

      setSuccessMsg(`Data karyawan ${fullName} berhasil diperbarui di database Neon.`);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 900);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memperbarui data karyawan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl enterprise-card rounded-2xl p-6 sm:p-7 overflow-hidden border-slate-700 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Lengkapi & Perbarui Data Karyawan</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Manual Editing
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Lengkapi cabang, departemen, shift, atau data kontak karyawan di Neon PostgreSQL.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Row 1: NIK & Full Name */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                NIK / Kode Karyawan
              </label>
              <input
                type="text"
                value={employeeCode}
                onChange={(e) => setEmployeeCode(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Nama Lengkap Karyawan <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>
          </div>

          {/* Row 2: Email (Readonly) & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email Terdaftar
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  disabled
                  value={user.email}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-400 text-xs cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Nomor WhatsApp / HP
              </label>
              <div className="relative">
                <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+62 812-3456-7890"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>
            </div>
          </div>

          {/* Row 3: Posisi & Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Posisi / Jabatan Pekerjaan
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="Contoh: Backend Engineer"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Hak Akses (Role)
              </label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                >
                  <option value="EMPLOYEE">Karyawan (Portal Mandiri)</option>
                  <option value="MANAGER">Manager Departemen</option>
                  <option value="HR_ADMIN">HR Director / Admin</option>
                  <option value="SUPER_ADMIN">Super Administrator</option>
                </select>
              </div>
            </div>
          </div>

          {/* Row 4: Cabang, Departemen, Shift */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Cabang Penugasan
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                >
                  <option value="">-- Belum Ditentukan --</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Departemen / Divisi
              </label>
              <div className="relative">
                <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                >
                  <option value="">-- Belum Ditentukan --</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Shift Kerja Default
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <select
                  value={shiftId}
                  onChange={(e) => setShiftId(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                >
                  <option value="">-- Belum Ditentukan --</option>
                  {shifts.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
