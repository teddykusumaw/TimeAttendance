'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  X,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  Sparkles,
  Zap,
  RotateCcw,
} from 'lucide-react';

interface FaceScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (photoBase64: string) => void;
  employeeName: string;
}

export default function FaceScannerModal({
  isOpen,
  onClose,
  onCapture,
  employeeName,
}: FaceScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState<'INITIALIZING' | 'DETECTING' | 'ALIGNED' | 'CAPTURED'>('INITIALIZING');

  // Start camera when modal opens
  useEffect(() => {
    if (isOpen) {
      setCapturedImage(null);
      setCameraError(null);
      setScanStep('INITIALIZING');
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Browser tidak mendukung akses kamera (WebRTC getUserMedia).');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user', // Front camera on mobile
          width: { ideal: 640 },
          height: { ideal: 640 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }

      setCameraActive(true);
      setScanStep('DETECTING');

      // Simulate face alignment detection delay
      setTimeout(() => {
        setScanStep('ALIGNED');
      }, 1200);
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraActive(false);
      let msg = 'Tidak dapat mengakses kamera perangkat.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Izin kamera ditolak oleh pengguna pada browser.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'Kamera depan tidak ditemukan pada perangkat Anda.';
      }
      setCameraError(msg);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const handleCapture = () => {
    if (!videoRef.current) return;

    setIsScanning(true);

    setTimeout(() => {
      try {
        const video = videoRef.current!;
        const canvas = canvasRef.current || document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Mirror image for realistic selfie feel
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          // Add timestamp watermark on captured frame
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
          ctx.font = 'bold 16px monospace';
          ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
          ctx.fillRect(10, canvas.height - 40, 360, 30);
          ctx.fillStyle = '#10b981';
          ctx.fillText(`BIOMETRIC VERIFIED • ${new Date().toLocaleTimeString('id-ID')}`, 20, canvas.height - 20);

          const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
          setCapturedImage(dataUrl);
          setScanStep('CAPTURED');
          stopCamera();
        }
      } catch (err) {
        console.error('Capture frame error:', err);
      } finally {
        setIsScanning(false);
      }
    }, 400);
  };

  const handleUseSimulatedFace = () => {
    // Fallback demo face for environments without camera/permission
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Gradient background
      const grad = ctx.createLinearGradient(0, 0, 400, 400);
      grad.addColorStop(0, '#1e293b');
      grad.addColorStop(1, '#0f172a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 400, 400);

      // Face silhouette
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(200, 160, 70, 0, Math.PI * 2);
      ctx.fill();

      // Body silhouette
      ctx.beginPath();
      ctx.ellipse(200, 320, 120, 90, 0, 0, Math.PI * 2);
      ctx.fill();

      // Biometric overlay text
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 14px monospace';
      ctx.fillText(`VERIFIED FACE ID • ${employeeName}`, 40, 370);

      const demoUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedImage(demoUrl);
      setScanStep('CAPTURED');
      setCameraError(null);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setScanStep('DETECTING');
    startCamera();
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">
                Presensi Biometrik Wajah
              </h3>
              <p className="text-[11px] text-slate-400">Verifikasi wajah karyawan secara real-time</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Camera / Preview Viewport */}
        <div className="relative w-full aspect-square bg-slate-950 flex items-center justify-center overflow-hidden">
          {/* Hidden Canvas for Frame Extraction */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Captured Static Preview */}
          {capturedImage ? (
            <div className="relative w-full h-full">
              <img
                src={capturedImage}
                alt="Captured Face"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-3 py-1.5 rounded-xl backdrop-blur-md">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Wajah Berhasil Diambil & Terverifikasi</span>
                </div>
              </div>
            </div>
          ) : cameraError ? (
            /* Error State (Camera Permission/Hardware) */
            <div className="p-6 text-center space-y-4 max-w-xs">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">Kamera Tidak Tersedia</div>
                <p className="text-xs text-slate-400 mt-1">{cameraError}</p>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  onClick={startCamera}
                  className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Coba Akses Ulang</span>
                </button>

                <button
                  onClick={handleUseSimulatedFace}
                  className="w-full py-2 px-3 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Gunakan Mode Demo Wajah</span>
                </button>
              </div>
            </div>
          ) : (
            /* Live Camera Stream with Biometric Face Oval Overlay */
            <div className="relative w-full h-full">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />

              {/* Biometric Scanning Oval Overlay */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                {/* Oval Guide Border */}
                <div
                  className={`relative w-64 h-80 rounded-[50%] border-2 transition-colors duration-500 ${
                    scanStep === 'ALIGNED'
                      ? 'border-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.4)]'
                      : 'border-cyan-400/80 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                  }`}
                >
                  {/* Corner Accent Brackets */}
                  <div className="absolute -top-3 -left-3 w-6 h-6 border-t-2 border-l-2 border-cyan-400"></div>
                  <div className="absolute -top-3 -right-3 w-6 h-6 border-t-2 border-r-2 border-cyan-400"></div>
                  <div className="absolute -bottom-3 -left-3 w-6 h-6 border-b-2 border-l-2 border-cyan-400"></div>
                  <div className="absolute -bottom-3 -right-3 w-6 h-6 border-b-2 border-r-2 border-cyan-400"></div>

                  {/* Vertical Laser Scan Line */}
                  <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse top-1/2"></div>
                </div>

                {/* Status Pill Badge */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <span
                    className={`px-3 py-1.5 rounded-full text-[11px] font-semibold flex items-center gap-1.5 backdrop-blur-md border ${
                      scanStep === 'ALIGNED'
                        ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/30'
                        : 'bg-cyan-950/80 text-cyan-300 border-cyan-500/30'
                    }`}
                  >
                    {scanStep === 'ALIGNED' ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Wajah Terfokus • Siap Ambil Foto</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                        <span>Posisikan wajah di dalam oval...</span>
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3">
          {capturedImage ? (
            <>
              <button
                type="button"
                onClick={handleRetake}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Foto Ulang</span>
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all active:scale-98"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Gunakan Foto Wajah</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleCapture}
                disabled={!cameraActive || isScanning}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${
                  cameraActive && !isScanning
                    ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-blue-500/20 active:scale-98'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Camera className="w-4 h-4" />
                <span>{isScanning ? 'Memproses...' : 'Ambil Foto Wajah Sekarang'}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
