'use client';

import React, { useState, useEffect } from 'react';
import {
  UserPlus,
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
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { attendanceRepo } from '@/lib/attendance-repository';
import { Role } from '@/types';

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddEmployeeModal({
  isOpen,
  onClose,
  onSuccess,
}: AddEmployeeModalProps) {
  const { currentUser } = useAuth();
  const branches = attendanceRepo.getBranches();
  const departments = attendanceRepo.getDepartments();
  const shifts = attendanceRepo.getShifts();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<Role>('EMPLOYEE');
  const [branchId, setBranchId] = useState(branches[0]?.id || '');
  const [departmentId, setDepartmentId] = useState(departments[0]?.id || '');
  const [shiftId, setShiftId] = useState(shifts[0]?.id || '');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Auto-generate employee code suggestion on modal open
  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setSuccessMsg(null);
      const existing = attendanceRepo.getUsers();
      const nextNum = existing.length + 1;
      setEmployeeCode(`EMP-${String(nextNum).padStart(4, '0')}`);
      if (branches.length > 0 && !branchId) setBranchId(branches[0].id);
      if (departments.length > 0 && !departmentId) setDepartmentId(departments[0].id);
      if (shifts.length > 0 && !shiftId) setShiftId(shifts[0].id);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!fullName.trim() || !email.trim() || !employeeCode.trim()) {
      setErrorMsg('Nama lengkap, email, dan NIK wajib diisi.');
      return;
    }

    setLoading(true);
    try {
      await attendanceRepo.createEmployee({
        employeeCode: employeeCode.trim(),
        email: email.trim().toLowerCase(),
        fullName: fullName.trim(),
        role,
        jobTitle: jobTitle.trim() || 'Staff Karyawan',
        phone: phone.trim() || undefined,
        branchId,
        departmentId,
        shiftId: shiftId || undefined,
        actor: {
          id: currentUser.id,
          name: currentUser.fullName,
          role: currentUser.role,
        },
      });

      setSuccessMsg(`Karyawan ${fullName} (${employeeCode}) berhasil ditambahkan.`);
      setTimeout(() => {
        onSuccess();
        onClose();
        // Reset form
        setFullName('');
        setEmail('');
        setJobTitle('');
        setPhone('');
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menambahkan karyawan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#0e1422] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Tambah Karyawan Baru</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Manual Entry
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Daftarkan akun karyawan secara langsung ke database Neon PostgreSQL.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
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
                NIK / Kode Karyawan <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={employeeCode}
                onChange={(e) => setEmployeeCode(e.target.value)}
                placeholder="EMP-0009"
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
                placeholder="Contoh: Eko Prasetyo"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>
          </div>

          {/* Row 2: Email & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email Perusahaan <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="eko.prasetyo@enterprise.corp"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/40"
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

          {/* Row 3: Posisi / Job Title & Role */}
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
                Cabang Penugasan <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                >
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
                Departemen / Divisi <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                >
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
                  {shifts.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-blue-500/5 border border-blue-500/10 text-slate-400 text-xs flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <span>
              Karyawan baru akan langsung dapat login menggunakan NIK atau Email yang didaftarkan. Pengikatan HP dan perekaman biometrik wajah akan dilakukan secara mandiri saat presensi pertama.
            </span>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-end gap-3">
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
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Daftarkan Karyawan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
