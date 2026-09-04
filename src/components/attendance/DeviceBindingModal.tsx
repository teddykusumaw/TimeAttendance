import React, { useState } from 'react';
import {
  Smartphone,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  X,
  AlertTriangle,
  Lock,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getOrCreateDeviceId, getDeviceModelName } from '@/lib/device-utils';

interface DeviceBindingModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'BIND_PROMPT' | 'MISMATCH_BLOCK';
  boundDeviceName?: string | null;
  onSuccess?: () => void;
}

export default function DeviceBindingModal({
  isOpen,
  onClose,
  mode,
  boundDeviceName,
  onSuccess,
}: DeviceBindingModalProps) {
  const { currentUser, bindCurrentDevice, logout } = useAuth();
  const [isBinding, setIsBinding] = useState(false);
  const [customName, setCustomName] = useState('');

  const currentDeviceId = getOrCreateDeviceId();
  const currentDeviceModel = getDeviceModelName();

  const handleBind = () => {
    setIsBinding(true);
    setTimeout(() => {
      const finalName = customName.trim() || currentDeviceModel;
      const success = bindCurrentDevice(finalName);
      setIsBinding(false);
      if (success) {
        if (onSuccess) onSuccess();
        onClose();
      }
    }, 400);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden p-6 space-y-5">
        {mode === 'BIND_PROMPT' ? (
          /* PROMPT TO BIND CURRENT DEVICE */
          <>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white leading-tight">
                  Ikat HP Perangkat (Device Binding)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Kebijakan 1 HP per Karyawan (Enterprise Security)
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 text-xs">
              <div className="flex items-start gap-2.5 text-slate-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Akun <strong className="text-white">{currentUser.fullName}</strong> belum memiliki HP yang terikat. Demi keamanan, setiap karyawan hanya dapat presensi dari <strong>1 HP terdaftar</strong>.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/80 space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Model Perangkat Terdeteksi:</span>
                  <span className="font-bold text-white">{currentDeviceModel}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>ID Unik Perangkat:</span>
                  <span className="font-mono text-blue-400 text-[10px]">{currentDeviceId}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 text-xs font-medium mb-1.5">
                Nama / Label HP (Opsional)
              </label>
              <input
                type="text"
                placeholder={`Contoh: ${currentDeviceModel}`}
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Nanti Saja
              </button>

              <button
                type="button"
                onClick={handleBind}
                disabled={isBinding}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-all active:scale-98"
              >
                <Lock className="w-4 h-4" />
                <span>{isBinding ? 'Mengikat Perangkat...' : 'Ikat HP Ini Sekarang'}</span>
              </button>
            </div>
          </>
        ) : (
          /* MISMATCH: BLOCKED ON UNAUTHORIZED DEVICE */
          <>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white leading-tight">
                  Akses Ditolak: HP Tidak Terdaftar
                </h3>
                <p className="text-xs text-rose-400/90 mt-0.5">
                  Pelanggaran Binding Perangkat
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-3 text-xs text-rose-200">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Akun Anda telah terikat pada perangkat resmi:
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] space-y-1">
                <div className="text-slate-400">Perangkat Terdaftar:</div>
                <div className="text-sm font-bold text-white">
                  {boundDeviceName || 'Perangkat HP Karyawan'}
                </div>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                Anda hanya dapat melakukan presensi dari HP yang terdaftar. Jika Anda mengganti ponsel baru atau ponsel lama hilang, silakan hubungi <strong>Super Administrator</strong> atau HR untuk mereset binding perangkat.
              </p>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  logout();
                  window.location.href = '/login';
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Ganti Akun Lain
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors"
              >
                Mengerti
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
