'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="enterprise-card rounded-2xl p-8 max-w-md w-full border-blue-500/20 space-y-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
          <Compass className="w-7 h-7" />
        </div>

        <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
          404 Not Found
        </span>

        <h2 className="text-xl font-bold text-white tracking-tight">Halaman Tidak Ditemukan</h2>

        <p className="text-xs text-slate-400 leading-relaxed">
          Tautan yang Anda tuju tidak tersedia atau telah dipindahkan ke menu lain dalam sistem presensi.
        </p>

        <div className="pt-2">
          <Link
            href="/"
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
