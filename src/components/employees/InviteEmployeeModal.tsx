'use client';

import React, { useState } from 'react';
import {
  Send,
  X,
  Copy,
  Check,
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
  ExternalLink,
  MessageCircle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { attendanceRepo } from '@/lib/attendance-repository';
import { Role, EmployeeInvitation } from '@/types';

interface InviteEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function InviteEmployeeModal({
  isOpen,
  onClose,
  onSuccess,
}: InviteEmployeeModalProps) {
  const { currentUser } = useAuth();
  const branches = attendanceRepo.getBranches();
  const departments = attendanceRepo.getDepartments();
  const shifts = attendanceRepo.getShifts();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<Role>('EMPLOYEE');
  const [branchId, setBranchId] = useState(branches[0]?.id || '');
  const [departmentId, setDepartmentId] = useState(departments[0]?.id || '');
  const [shiftId, setShiftId] = useState(shifts[0]?.id || '');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createdInvitation, setCreatedInvitation] = useState<EmployeeInvitation | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fullName.trim() || !email.trim()) {
      setErrorMsg('Nama lengkap dan email calon karyawan wajib diisi.');
      return;
    }

    setLoading(true);
    try {
      const inv = await attendanceRepo.createInvitation({
        email: email.trim().toLowerCase(),
        fullName: fullName.trim(),
        jobTitle: jobTitle.trim() || 'Staff Karyawan',
        role,
        phone: phone.trim() || undefined,
        branchId,
        departmentId,
        shiftId: shiftId || undefined,
        invitedBy: currentUser.id,
        invitedByName: currentUser.fullName,
      });

      setCreatedInvitation(inv);
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal membuat tautan undangan.');
    } finally {
      setLoading(false);
    }
  };

  const getInviteUrl = () => {
    if (!createdInvitation) return '';
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/invite?token=${createdInvitation.token}`;
  };

  const handleCopyLink = () => {
    const url = getInviteUrl();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleShareWhatsApp = () => {
    const url = getInviteUrl();
    const text = `Halo ${fullName},\n\nAnda diundang untuk bergabung di Enterprise Time Attendance sebagai *${jobTitle || 'Staff Karyawan'}*.\n\nSilakan klik tautan berikut untuk melengkapi profil dan mengaktivasi akun Anda:\n${url}\n\nTautan ini berlaku selama 7 hari.\nTerima kasih.`;
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const waUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  const handleShareEmail = () => {
    const url = getInviteUrl();
    const subject = `Undangan Bergabung - Enterprise Time Attendance Platform`;
    const body = `Halo ${fullName},\n\nAnda diundang untuk bergabung dengan organisasi kami sebagai ${jobTitle || 'Staff Karyawan'}.\n\nSilakan klik tautan berikut untuk mengaktivasi akun Anda:\n${url}\n\nTautan undangan ini berlaku selama 7 hari.\n\nSalam,\n${currentUser.fullName}\nPeople Operations & HR Team`;
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleResetAndClose = () => {
    setCreatedInvitation(null);
    setFullName('');
    setEmail('');
    setJobTitle('');
    setPhone('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-[#0e1422] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Undang Karyawan Baru</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Link / Onboarding
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Buat tautan aktivasi mandiri untuk dikirimkan ke calon karyawan.
              </p>
            </div>
          </div>

          <button
            onClick={handleResetAndClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {!createdInvitation ? (
            /* Form input phase */
            <form onSubmit={handleCreateInvitation} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Nama Lengkap Calon Karyawan <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Contoh: Rian Pratama"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Email Calon Karyawan <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="rian.pratama@gmail.com"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                    />
                  </div>
                </div>
              </div>

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
                      placeholder="Contoh: Quality Assurance"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Nomor WhatsApp (Opsional)
                  </label>
                  <div className="relative">
                    <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+62 812-3456-7890"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-800">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Cabang
                  </label>
                  <select
                    value={branchId}
                    onChange={(e) => setBranchId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  >
                    <option value="">-- Belum Ditentukan (Diisi Nanti) --</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Departemen
                  </label>
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  >
                    <option value="">-- Belum Ditentukan (Diisi Nanti) --</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Shift Roster
                  </label>
                  <select
                    value={shiftId}
                    onChange={(e) => setShiftId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  >
                    <option value="">-- Belum Ditentukan (Diisi Nanti) --</option>
                    {shifts.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-500/20 disabled:opacity-50 transition-all"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Membuat Tautan...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Buat Tautan Undangan</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Success & Share phase */
            <div className="space-y-4 py-2 animate-in fade-in duration-300">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 shrink-0" />
                <div>
                  <div className="font-bold text-sm text-emerald-300">
                    Tautan Undangan Berhasil Dibuat!
                  </div>
                  <p className="text-[11px] text-emerald-400/80 mt-0.5">
                    Kirimkan tautan ini kepada <strong>{fullName}</strong> ({email}) untuk menyelesaikan onboarding dan aktivasi akun.
                  </p>
                </div>
              </div>

              {/* Shareable Link Box */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Tautan Aktivasi Mandiri (Berlaku 7 Hari):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={getInviteUrl()}
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-cyan-300 font-mono text-xs select-all focus:outline-none"
                  />
                  <button
                    onClick={handleCopyLink}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${
                      copied
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Salin Link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Quick Share Buttons */}
              <div className="pt-2">
                <label className="block text-xs font-semibold text-slate-400 mb-2">
                  Kirim Cepat via:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleShareWhatsApp}
                    className="px-4 py-2.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Kirim via WhatsApp</span>
                  </button>

                  <button
                    onClick={handleShareEmail}
                    className="px-4 py-2.5 rounded-xl bg-blue-950/60 hover:bg-blue-900/80 border border-blue-500/40 text-blue-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
                  >
                    <Mail className="w-4 h-4" />
                    <span>Kirim via Email</span>
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-end">
                <button
                  onClick={handleResetAndClose}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold transition-colors"
                >
                  Selesai & Tutup
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
