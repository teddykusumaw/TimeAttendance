import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  X,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  RotateCcw,
  UserCheck,
  ScanLine,
  UserX,
  Fingerprint,
} from 'lucide-react';
import { compareFaces, FaceMatchResult } from '@/lib/face-matching-utils';

export interface FaceScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'ENROLL' | 'VERIFY';
  registeredFacePhotoUrl?: string;
  employeeName: string;
  punchType?: 'IN' | 'OUT' | null;
  onEnrollSuccess?: (photoBase64: string) => void;
  onVerifySuccess?: (photoBase64: string, similarityScore: number) => void;
  onVerificationRejected?: (reason: string, score?: number) => void;
}

export default function FaceScannerModal({
  isOpen,
  onClose,
  mode,
  registeredFacePhotoUrl,
  employeeName,
  punchType = 'IN',
  onEnrollSuccess,
  onVerifySuccess,
  onVerificationRejected,
}: FaceScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState<
    'INITIALIZING' | 'DETECTING' | 'ALIGNED' | 'CAPTURED' | 'ANALYZING'
  >('INITIALIZING');

  // Verification matching result
  const [matchResult, setMatchResult] = useState<FaceMatchResult | null>(null);
  const [isAnalyzingMatch, setIsAnalyzingMatch] = useState(false);

  // Start/stop camera based on modal visibility
  useEffect(() => {
    if (isOpen) {
      setCapturedImage(null);
      setCameraError(null);
      setMatchResult(null);
      setIsAnalyzingMatch(false);
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
          facingMode: 'user', // Front camera for mobile
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

      // Slight delay for facial alignment guide
      setTimeout(() => {
        setScanStep('ALIGNED');
      }, 1000);
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraActive(false);
      let msg = 'Tidak dapat mengakses kamera perangkat.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Izin kamera ditolak oleh browser. Harap izinkan akses kamera.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'Kamera depan tidak ditemukan pada perangkat ini.';
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

  const handleCapture = async () => {
    if (!videoRef.current) return;

    setIsScanning(true);

    setTimeout(async () => {
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
          ctx.font = 'bold 15px monospace';
          ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
          ctx.fillRect(10, canvas.height - 38, 380, 28);
          ctx.fillStyle = mode === 'ENROLL' ? '#38bdf8' : '#10b981';
          ctx.fillText(
            `${mode === 'ENROLL' ? 'ENROLLED FACE' : 'LIVE PROBE'} • ${new Date().toLocaleTimeString('id-ID')} WIB`,
            20,
            canvas.height - 20
          );

          const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
          setCapturedImage(dataUrl);
          setScanStep('CAPTURED');
          stopCamera();

          // If in VERIFY mode, automatically run biometric matching against registered face!
          if (mode === 'VERIFY' && registeredFacePhotoUrl) {
            await performBiometricMatching(registeredFacePhotoUrl, dataUrl);
          }
        }
      } catch (err) {
        console.error('Capture frame error:', err);
      } finally {
        setIsScanning(false);
      }
    }, 350);
  };

  // Perform face matching comparison
  const performBiometricMatching = async (registeredPhoto: string, livePhoto: string) => {
    setIsAnalyzingMatch(true);
    setScanStep('ANALYZING');

    // Simulate realistic AI neural comparison delay
    setTimeout(async () => {
      const result = await compareFaces(registeredPhoto, livePhoto, 75);
      setMatchResult(result);
      setIsAnalyzingMatch(false);
      setScanStep('CAPTURED');

      if (!result.matched && onVerificationRejected) {
        onVerificationRejected(result.message, result.similarityScore);
      }
    }, 800);
  };

  // Demo Fallback: Simulated Matching Face
  const handleUseSimulatedFace = async (forceMismatch: boolean = false) => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createLinearGradient(0, 0, 400, 400);
      if (forceMismatch) {
        // Reddish background for distinct imposter face
        grad.addColorStop(0, '#450a0a');
        grad.addColorStop(1, '#1c1917');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 400, 400);

        // Imposter face silhouette
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(200, 150, 85, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#f87171';
        ctx.beginPath();
        ctx.ellipse(200, 330, 140, 80, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fca5a5';
        ctx.font = 'bold 13px monospace';
        ctx.fillText('SIMULASI: WAJAH ORANG LAIN', 80, 375);
      } else {
        // Matching face
        grad.addColorStop(0, '#1e293b');
        grad.addColorStop(1, '#0f172a');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 400, 400);

        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.arc(200, 160, 70, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.ellipse(200, 320, 120, 90, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 13px monospace';
        ctx.fillText(`VERIFIED ID • ${employeeName}`, 50, 370);
      }

      const demoUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedImage(demoUrl);
      setScanStep('CAPTURED');
      setCameraError(null);
      stopCamera();

      if (mode === 'VERIFY' && registeredFacePhotoUrl) {
        if (forceMismatch) {
          // Explicit mismatch result for test scenario
          setIsAnalyzingMatch(true);
          setTimeout(() => {
            const mismatchRes: FaceMatchResult = {
              matched: false,
              similarityScore: 34,
              threshold: 75,
              status: 'MISMATCH',
              message: 'Wajah Tidak Cocok! Tingkat kemiripan hanya 34% (minimal 75%). Presensi ditolak!',
            };
            setMatchResult(mismatchRes);
            setIsAnalyzingMatch(false);
            if (onVerificationRejected) onVerificationRejected(mismatchRes.message, 34);
          }, 600);
        } else {
          // Explicit matching result for demo
          setIsAnalyzingMatch(true);
          setTimeout(() => {
            const matchRes: FaceMatchResult = {
              matched: true,
              similarityScore: 94,
              threshold: 75,
              status: 'MATCH',
              message: 'Wajah Cocok (Skor Kemiripan: 94%, batas minimal: 75%)',
            };
            setMatchResult(matchRes);
            setIsAnalyzingMatch(false);
          }, 600);
        }
      }
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setMatchResult(null);
    setIsAnalyzingMatch(false);
    setScanStep('DETECTING');
    startCamera();
  };

  const handleConfirmEnrollment = () => {
    if (capturedImage && onEnrollSuccess) {
      onEnrollSuccess(capturedImage);
      onClose();
    }
  };

  const handleConfirmVerification = () => {
    if (capturedImage && matchResult?.matched && onVerifySuccess) {
      onVerifySuccess(capturedImage, matchResult.similarityScore);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                mode === 'ENROLL'
                  ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                  : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
              }`}
            >
              {mode === 'ENROLL' ? <Fingerprint className="w-5 h-5" /> : <ScanLine className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-tight flex items-center gap-2">
                <span>
                  {mode === 'ENROLL'
                    ? 'Perekaman Wajah Master (Enrollment)'
                    : `Verifikasi Wajah (${punchType === 'IN' ? 'Check In' : 'Check Out'})`}
                </span>
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                    mode === 'ENROLL'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {mode === 'ENROLL' ? 'Langkah 1: Rekam' : 'Langkah 2: Cocokkan'}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                {mode === 'ENROLL'
                  ? 'Daftarkan foto wajah resmi Anda sebagai referensi absensi'
                  : 'Mencocokkan wajah live dengan data wajah terdaftar'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Reference Badge for Verification Mode */}
        {mode === 'VERIFY' && registeredFacePhotoUrl && (
          <div className="px-5 py-2.5 bg-slate-950/90 border-b border-slate-800/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Target Pencocokan:</span>
              <span className="font-semibold text-white">{employeeName}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400">Wajah Master:</span>
              <div className="w-7 h-7 rounded-full overflow-hidden border border-cyan-500/50 bg-slate-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={registeredFacePhotoUrl}
                  alt="Wajah Master Terdaftar"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        )}

        {/* Camera / Preview Viewport */}
        <div className="relative w-full aspect-square bg-slate-950 flex items-center justify-center overflow-hidden">
          <canvas ref={canvasRef} className="hidden" />

          {/* Captured Preview + Matching Analysis Display */}
          {capturedImage ? (
            <div className="relative w-full h-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={capturedImage}
                alt="Captured Face"
                className="w-full h-full object-cover"
              />

              {/* Overlay Status */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent flex flex-col justify-end p-4 space-y-2">
                {mode === 'ENROLL' ? (
                  <div className="flex items-center gap-2 text-xs font-semibold text-cyan-300 bg-cyan-950/90 border border-cyan-500/40 p-3 rounded-xl backdrop-blur-md">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <div>
                      <div>Foto Wajah Master Siap Didaftarkan</div>
                      <div className="text-[10px] text-cyan-400/80 font-normal">
                        Pastikan foto tampak depan, jelas, dan tanpa masker.
                      </div>
                    </div>
                  </div>
                ) : isAnalyzingMatch ? (
                  <div className="flex items-center gap-2.5 text-xs font-semibold text-blue-300 bg-slate-900/95 border border-blue-500/40 p-3 rounded-xl backdrop-blur-md">
                    <RefreshCw className="w-4 h-4 text-blue-400 animate-spin shrink-0" />
                    <span>Menganalisis kemiripan biometrik dengan wajah master...</span>
                  </div>
                ) : matchResult ? (
                  matchResult.matched ? (
                    <div className="flex items-start gap-2.5 text-xs font-semibold text-emerald-300 bg-emerald-950/90 border border-emerald-500/40 p-3 rounded-xl backdrop-blur-md animate-in fade-in">
                      <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span>Wajah Cocok Terverifikasi!</span>
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Skor: {matchResult.similarityScore}%
                          </span>
                        </div>
                        <div className="text-[11px] text-emerald-400/90 font-normal mt-0.5">
                          Identitas biometrik sah. Anda diizinkan untuk melanjutkan absensi.
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2.5 text-xs font-semibold text-rose-300 bg-rose-950/90 border border-rose-500/40 p-3 rounded-xl backdrop-blur-md animate-in shake">
                      <UserX className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-rose-200">Presensi DITOLAK: Wajah Tidak Cocok!</span>
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-500/30 text-rose-300 border border-rose-500/40">
                            Skor: {matchResult.similarityScore}%
                          </span>
                        </div>
                        <div className="text-[11px] text-rose-300/90 font-normal mt-0.5">
                          Wajah live tidak cocok dengan wajah master terdaftar (minimal {matchResult.threshold}%).
                        </div>
                      </div>
                    </div>
                  )
                ) : null}
              </div>
            </div>
          ) : cameraError ? (
            /* Camera Error View */
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

                {mode === 'ENROLL' ? (
                  <button
                    onClick={() => handleUseSimulatedFace(false)}
                    className="w-full py-2 px-3 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30 text-cyan-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Gunakan Demo Wajah Master</span>
                  </button>
                ) : (
                  <div className="space-y-1.5">
                    <button
                      onClick={() => handleUseSimulatedFace(false)}
                      className="w-full py-2 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Uji Demo Wajah Cocok (94%)</span>
                    </button>
                    <button
                      onClick={() => handleUseSimulatedFace(true)}
                      className="w-full py-2 px-3 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <UserX className="w-3.5 h-3.5" />
                      <span>Uji Demo Wajah Beda / Ditolak (34%)</span>
                    </button>
                  </div>
                )}
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
                <div
                  className={`relative w-64 h-80 rounded-[50%] border-2 transition-colors duration-500 ${
                    scanStep === 'ALIGNED'
                      ? 'border-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.4)]'
                      : 'border-cyan-400/80 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                  }`}
                >
                  <div className="absolute -top-3 -left-3 w-6 h-6 border-t-2 border-l-2 border-cyan-400"></div>
                  <div className="absolute -top-3 -right-3 w-6 h-6 border-t-2 border-r-2 border-cyan-400"></div>
                  <div className="absolute -bottom-3 -left-3 w-6 h-6 border-b-2 border-l-2 border-cyan-400"></div>
                  <div className="absolute -bottom-3 -right-3 w-6 h-6 border-b-2 border-r-2 border-cyan-400"></div>

                  {/* Scanning line animation */}
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
                        <span>
                          {mode === 'ENROLL'
                            ? 'Wajah Terfokus • Siap Rekam Master'
                            : 'Wajah Terfokus • Siap Pencocokan'}
                        </span>
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
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex flex-col gap-2">
          {capturedImage ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRetake}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Foto Ulang</span>
              </button>

              {mode === 'ENROLL' ? (
                <button
                  type="button"
                  onClick={handleConfirmEnrollment}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all active:scale-98"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Daftarkan Wajah Master Ini</span>
                </button>
              ) : isAnalyzingMatch ? (
                <button
                  type="button"
                  disabled
                  className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 text-slate-400 text-xs font-semibold flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                  <span>Mencocokkan Biometrik...</span>
                </button>
              ) : matchResult?.matched ? (
                <button
                  type="button"
                  onClick={handleConfirmVerification}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all active:scale-98"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    Konfirmasi Presensi {punchType === 'IN' ? 'Masuk' : 'Pulang'} (Cocok {matchResult.similarityScore}%)
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  className="flex-1 py-2.5 px-4 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center justify-center gap-2 cursor-not-allowed"
                >
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span>Presensi Ditolak (Wajah Berbeda)</span>
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
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
                    ? mode === 'ENROLL'
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-500/20 active:scale-98'
                      : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-blue-500/20 active:scale-98'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Camera className="w-4 h-4" />
                <span>
                  {isScanning
                    ? 'Memproses...'
                    : mode === 'ENROLL'
                    ? 'Rekam Foto Wajah Master'
                    : 'Pindai Wajah Sekarang'}
                </span>
              </button>
            </div>
          )}

          {/* Fallback Simulation Controls in development/demo */}
          {!capturedImage && cameraActive && (
            <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-500">
              <span>Mode Demo:</span>
              {mode === 'ENROLL' ? (
                <button
                  type="button"
                  onClick={() => handleUseSimulatedFace(false)}
                  className="text-cyan-400 hover:underline flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Gunakan Demo Wajah Master</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleUseSimulatedFace(false)}
                    className="text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    <span>Simulasi Cocok (94%)</span>
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => handleUseSimulatedFace(true)}
                    className="text-rose-400 hover:underline flex items-center gap-1"
                  >
                    <span>Simulasi Ditolak (34%)</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
