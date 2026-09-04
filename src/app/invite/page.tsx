'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Building2,
  Briefcase,
  Mail,
  Smartphone,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  Clock,
  Layers,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

function InviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { switchUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activationSuccess, setActivationSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setErrorMsg('Token undangan tidak ditemukan pada tautan.');
      setLoading(false);
      return;
    }

    fetch(`/api/invitations?token=${token}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((json) => {
        if (json.status === 'success' && json.data) {
          setInvitation(json.data);
          setFullName(json.data.fullName || '');
          setPhone(json.data.phone || '');
        } else {
          setErrorMsg(json.message || 'Tautan undangan tidak valid atau telah kedaluwarsa.');
        }
      })
      .catch((err) => {
        setErrorMsg('Gagal memverifikasi tautan undangan. Pastikan koneksi internet terhubung.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/invitations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ACCEPT',
          token,
          fullName: fullName.trim(),
          phone: phone.trim(),
        }),
      });

      const json = await res.json();
      if (res.ok && json.status === 'success' && json.data) {
        setActivationSuccess(true);

        // Auto-login user and redirect to employee portal
        const newUser = json.data;
        setTimeout(() => {
          switchUser(newUser.id);
          router.push('/');
        }, 1500);
      } else {
        setErrorMsg(json.message || 'Gagal mengaktivasi akun.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem saat aktivasi.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex flex-col items-center justify-center p-4 text-slate-400 text-xs gap-3">
        <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
          <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin" />
        </div>
        <span className="font-semibold text-slate-300">Memverifikasi Tautan Undangan...</span>
      </div>
    );
  }

  if (errorMsg && !invitation) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center p-4">
        <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900/80 border border-slate-800 text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white">Tautan Tidak Dapat Digunakan</h2>
          <p className="text-xs text-slate-400">{errorMsg}</p>
          <div className="pt-2">
            <button
              onClick={() => router.push('/login')}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
            >
              Kembali ke Halaman Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (activationSuccess) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center p-4">
        <div className="w-full max-w-md p-8 rounded-3xl bg-slate-900/90 border border-emerald-500/30 text-center space-y-4 shadow-2xl shadow-emerald-500/10 animate-in zoom-in-95 duration-300">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-white">Akun Berhasil Diaktivasi!</h2>
          <p className="text-xs text-slate-400">
            Selamat datang, <strong className="text-emerald-400">{fullName}</strong>. Anda sedang dialihkan langsung ke Portal Karyawan...
          </p>
          <div className="pt-2 flex justify-center">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-indigo-600/15 via-blue-600/10 to-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-lg relative z-10">
        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-400 flex items-center justify-center shadow-xl shadow-indigo-500/20 mb-3">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            TIME ATTENDANCE
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Undangan Resmi Onboarding & Aktivasi Akun Karyawan
          </p>
        </div>

        {/* Main Card */}
        <div className="enterprise-card rounded-3xl p-6 sm:p-8 bg-slate-900/90 border border-slate-800 shadow-2xl space-y-6">
          {/* Welcome Banner */}
          <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white block text-sm">
                Undangan dari {invitation.invitedByName || 'HR Operations'}
              </span>
              <span className="text-slate-300 mt-0.5 block">
                Anda diundang untuk bergabung dalam tim perusahaan dengan penugasan berikut:
              </span>
            </div>
          </div>

          {/* Invitation Assignment Details */}
          <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-xs">
            <div>
              <span className="text-[10px] text-slate-500 block font-medium">Posisi Pekerjaan:</span>
              <span className="font-bold text-white flex items-center gap-1 mt-0.5">
                <Briefcase className="w-3.5 h-3.5 text-blue-400" />
                <span>{invitation.jobTitle || 'Staff Karyawan'}</span>
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 block font-medium">Departemen / Divisi:</span>
              <span className="font-bold text-white flex items-center gap-1 mt-0.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>{invitation.departmentName || 'Divisi'}</span>
              </span>
            </div>

            <div className="pt-2 border-t border-slate-800">
              <span className="text-[10px] text-slate-500 block font-medium">Cabang Penugasan:</span>
              <span className="font-bold text-slate-200 flex items-center gap-1 mt-0.5">
                <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{invitation.branchName || 'Headquarter'}</span>
              </span>
            </div>

            <div className="pt-2 border-t border-slate-800">
              <span className="text-[10px] text-slate-500 block font-medium">Shift Kerja:</span>
              <span className="font-bold text-slate-200 flex items-center gap-1 mt-0.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>{invitation.shiftName || 'Standard Office'}</span>
              </span>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form Confirmation */}
          <form onSubmit={handleAccept} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Nama Lengkap Anda <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nama Lengkap Karyawan"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email Terdaftar
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  disabled
                  value={invitation.email}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-950/50 border border-slate-800 text-slate-400 text-xs cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Nomor WhatsApp / HP Aktif
              </label>
              <div className="relative">
                <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+62 812-3456-7890"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Akan digunakan untuk verifikasi perangkat HP saat presensi mandiri.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 disabled:opacity-50 transition-all active:scale-98"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Mengaktivasi Akun...</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" />
                    <span>Terima Undangan & Aktivasi Akun</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function InvitePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center text-slate-400 text-xs">
          Memuat halaman undangan...
        </div>
      }
    >
      <InviteContent />
    </Suspense>
  );
}
