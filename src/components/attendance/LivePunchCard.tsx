'use client';

import React, { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Camera,
  LogIn,
  LogOut,
  Calendar,
  Sparkles,
  RefreshCw,
  Navigation,
  ShieldCheck,
  ShieldAlert,
  HelpCircle,
  Smartphone,
  Lock,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { attendanceRepo } from '@/lib/attendance-repository';
import { AttendanceRecord, Branch } from '@/types';
import {
  getDeviceGeolocation,
  evaluateGeofence,
  GeofenceCheckResult,
} from '@/lib/geo-utils';
import { getOrCreateDeviceId, validateDeviceBinding } from '@/lib/device-utils';
import GeofenceMap from './GeofenceMap';
import FaceScannerModal from './FaceScannerModal';
import DeviceBindingModal from './DeviceBindingModal';

interface LivePunchCardProps {
  onAttendanceUpdated?: () => void;
}

export default function LivePunchCard({ onAttendanceUpdated }: LivePunchCardProps) {
  const { currentUser, refreshUser } = useAuth();
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [notes, setNotes] = useState('');
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | undefined>(undefined);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);
  const [isPunching, setIsPunching] = useState(false);

  // Face Recognition Modal State
  const [isFaceModalOpen, setIsFaceModalOpen] = useState(false);
  const [capturedFacePhoto, setCapturedFacePhoto] = useState<string | null>(null);
  const [pendingPunchType, setPendingPunchType] = useState<'IN' | 'OUT' | null>(null);

  // Device Binding Modal State
  const [isBindingModalOpen, setIsBindingModalOpen] = useState(false);
  const [bindingModalMode, setBindingModalMode] = useState<'BIND_PROMPT' | 'MISMATCH_BLOCK'>('BIND_PROMPT');

  // Real Device Geolocation & Geofencing State
  const [deviceCoords, setDeviceCoords] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [simulateOffice, setSimulateOffice] = useState(false);

  // Active Branch coordinates
  const branches = attendanceRepo.getBranches();
  const userBranch: Branch =
    branches.find((b) => b.id === currentUser.branchId) ||
    branches[0] || {
      id: 'b-default',
      code: 'HQ-JKT',
      name: 'Headquarter Sudirman',
      city: 'Jakarta',
      timezone: 'Asia/Jakarta',
      latitude: -6.2146,
      longitude: 106.8214,
      radiusMeters: 150,
    };

  const branchLat = userBranch.latitude || -6.2146;
  const branchLon = userBranch.longitude || 106.8214;
  const branchRadius = userBranch.radiusMeters || 150;

  // Real-time clock
  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    refreshRecord();
    handleDetectLocation();
  }, [currentUser]);

  const refreshRecord = () => {
    const record = attendanceRepo.getEmployeeTodayRecord(currentUser.id);
    setTodayRecord(record);
  };

  // Detect real device GPS — forces fresh reading (no cached position)
  const handleDetectLocation = async () => {
    setIsDetectingLocation(true);
    setGeoError(null);
    // Clear previous coords so UI shows loading state during re-detection
    setDeviceCoords(null);

    try {
      const position = await getDeviceGeolocation();
      console.info(
        `[GPS] Fresh position: lat=${position.latitude}, lon=${position.longitude}, accuracy=±${position.accuracy}m`
      );
      setDeviceCoords(position);

      // Warn if accuracy is very poor (likely WiFi/IP-based, not real GPS)
      if (position.accuracy > 500) {
        setGeoError(
          `Akurasi GPS rendah (±${position.accuracy}m). Hasil mungkin melenceng. Gunakan perangkat dengan GPS hardware atau buka di luar ruangan.`
        );
      }
    } catch (err: any) {
      console.warn('Geolocation detection error:', err.message);
      setGeoError(err.message || 'Tidak dapat mendeteksi GPS perangkat.');
    } finally {
      setIsDetectingLocation(false);
    }
  };

  // Effective coordinates (real device or simulated for testing)
  const activeLat = simulateOffice ? branchLat : deviceCoords?.latitude ?? null;
  const activeLon = simulateOffice ? branchLon : deviceCoords?.longitude ?? null;

  // Evaluate Geofence boundary
  const geofenceResult: GeofenceCheckResult | null =
    activeLat !== null && activeLon !== null
      ? evaluateGeofence(activeLat, activeLon, branchLat, branchLon, branchRadius, userBranch.name)
      : null;

  const verifyDeviceBinding = (): boolean => {
    const currentDeviceId = getOrCreateDeviceId();
    const result = validateDeviceBinding(currentUser, currentDeviceId);

    if (result.allowed) return true;

    if (result.status === 'UNBOUND') {
      setBindingModalMode('BIND_PROMPT');
      setIsBindingModalOpen(true);
      return false;
    }

    if (result.status === 'MISMATCH') {
      setBindingModalMode('MISMATCH_BLOCK');
      setIsBindingModalOpen(true);
      return false;
    }

    return false;
  };

  const handleCheckIn = (facePhoto?: string) => {
    if (!verifyDeviceBinding()) return;

    // Check Geofence constraint
    if (geofenceResult && !geofenceResult.isInside && !simulateOffice) {
      const proceed = confirm(
        `PERINGATAN GEOFENCE:\nAnda berada di luar radius kantor (${geofenceResult.distanceMeters} meter dari titik cabang ${userBranch.name}, batas: ${branchRadius}m).\n\nTetap lakukan presensi dengan catatan luar radius?`
      );
      if (!proceed) return;
    }

    setIsPunching(true);
    setFeedback(null);

    setTimeout(() => {
      const locationNote = geofenceResult?.isInside
        ? `Presensi Geofence Terverifikasi (${geofenceResult.distanceMeters}m)`
        : geofenceResult
        ? `Presensi Di Luar Geofence (${geofenceResult.distanceMeters}m)`
        : 'Presensi GPS Standar';

      const photoToUse = typeof facePhoto === 'string' ? facePhoto : capturedFacePhoto;
      const combinedNotes = notes ? `${notes} • ${locationNote}` : locationNote;

      const res = attendanceRepo.punchIn(currentUser, {
        notes: combinedNotes,
        method: photoToUse ? 'FACIAL_RECOG' : 'MOBILE_GEO',
        photoUrl: photoToUse || undefined,
        latitude: activeLat ?? undefined,
        longitude: activeLon ?? undefined,
      });

      if (res.success) {
        setFeedback({
          type: res.record.status === 'LATE' ? 'warning' : 'success',
          message: `${res.message}${photoToUse ? ' • Verifikasi Wajah Tersimpan' : ''}`,
        });
        refreshRecord();
        setNotes('');
        setCapturedFacePhoto(null);
        if (onAttendanceUpdated) onAttendanceUpdated();
      } else {
        setFeedback({ type: 'error', message: res.message });
      }
      setIsPunching(false);
    }, 400);
  };

  const handleCheckOut = (facePhoto?: string) => {
    if (!verifyDeviceBinding()) return;

    setIsPunching(true);
    setFeedback(null);

    setTimeout(() => {
      const photoToUse = typeof facePhoto === 'string' ? facePhoto : capturedFacePhoto;
      const res = attendanceRepo.punchOut(currentUser, {
        notes: notes || undefined,
        photoUrl: photoToUse || undefined,
      });

      if (res.success) {
        setFeedback({
          type: 'success',
          message: `${res.message}${photoToUse ? ' • Verifikasi Wajah Tersimpan' : ''}`,
        });
        refreshRecord();
        setNotes('');
        setCapturedFacePhoto(null);
        if (onAttendanceUpdated) onAttendanceUpdated();
      } else {
        setFeedback({ type: 'error', message: res.message });
      }
      setIsPunching(false);
    }, 400);
  };

  const handleStartFacePunch = (type: 'IN' | 'OUT') => {
    if (!verifyDeviceBinding()) return;
    setPendingPunchType(type);
    setIsFaceModalOpen(true);
  };

  const handleFaceCaptured = (photoBase64: string) => {
    setCapturedFacePhoto(photoBase64);
    if (pendingPunchType === 'IN') {
      handleCheckIn(photoBase64);
    } else if (pendingPunchType === 'OUT') {
      handleCheckOut(photoBase64);
    }
  };

  const formattedTime = currentTime
    ? currentTime.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      })
    : '--:--:--';

  const formattedDate = currentTime
    ? currentTime.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '...';

  const hasCheckedIn = Boolean(todayRecord && todayRecord.checkIn);
  const hasCheckedOut = Boolean(todayRecord && todayRecord.checkOut);

  return (
    <div className="enterprise-card rounded-2xl p-6 relative overflow-hidden space-y-6">
      {/* Background ambient lighting */}
      <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none"></div>

      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 relative z-10">
        {/* Left: Real-time Digital Clock & Shift info */}
        <div className="flex-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Kios Presensi Mandiri (GPS Geofence Verified)</span>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-4xl sm:text-5xl font-extrabold font-mono text-white tracking-tight">
              {formattedTime}
            </span>
            <span className="text-xs font-semibold text-slate-400 px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700">
              WIB
            </span>
          </div>

          <p className="text-sm text-slate-400 mt-1 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span>{formattedDate}</span>
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-300">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>Shift: {currentUser.shiftName || 'Standard Office (08:00 - 17:00)'}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-300">
              <MapPin className="w-3.5 h-3.5 text-blue-400" />
              <span>Titik Kantor: {userBranch.name} ({branchRadius}m Radius)</span>
            </div>
          </div>
        </div>

        {/* Right: Punch Actions & Form */}
        <div className="flex flex-col gap-3 min-w-[280px] sm:min-w-[340px]">
          {/* Device Binding Status Pill */}
          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Smartphone className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              {currentUser.role === 'SUPER_ADMIN' ? (
                <span className="text-[11px] text-purple-300 font-medium">
                  Super Admin (Bebas Binding HP)
                </span>
              ) : currentUser.boundDeviceId ? (
                <span className="text-[11px] text-slate-300 truncate max-w-[200px]">
                  HP Terikat: <strong className="text-emerald-400">{currentUser.boundDeviceName || 'Perangkat Terdaftar'}</strong>
                </span>
              ) : (
                <span className="text-[11px] text-amber-400 flex items-center gap-1 font-medium">
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                  <span>HP Belum Terikat</span>
                </span>
              )}
            </div>

            {currentUser.role !== 'SUPER_ADMIN' && !currentUser.boundDeviceId && (
              <button
                type="button"
                onClick={() => {
                  setBindingModalMode('BIND_PROMPT');
                  setIsBindingModalOpen(true);
                }}
                className="px-2 py-0.5 rounded-md bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-[10px] font-bold transition-colors"
              >
                Ikat HP
              </button>
            )}
          </div>

          {/* Today's Punch Status Banner */}
          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Status Hari Ini:</span>
            {!hasCheckedIn ? (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                Belum Presensi Masuk
              </span>
            ) : !hasCheckedOut ? (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping-subtle"></span>
                Sedang Bekerja (In: {todayRecord?.checkIn?.split('T')[1]?.slice(0, 5)})
              </span>
            ) : (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                Selesai Kerja ({todayRecord?.effectiveWorkHours} Jam)
              </span>
            )}
          </div>

          {/* Optional Notes Input */}
          <input
            type="text"
            placeholder="Catatan / agenda kerja hari ini (opsional)..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={hasCheckedOut}
            className="w-full text-xs px-3 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white placeholder-slate-500 outline-none transition-all disabled:opacity-50"
          />

          {/* Primary Biometric Face Punch Button */}
          {!hasCheckedOut && (
            <button
              type="button"
              onClick={() => handleStartFacePunch(!hasCheckedIn ? 'IN' : 'OUT')}
              disabled={isPunching}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-bold shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all active:scale-98"
            >
              <Camera className="w-4 h-4" />
              <span>
                {!hasCheckedIn
                  ? 'Presensi Masuk dengan Wajah (Face Biometric)'
                  : 'Presensi Pulang dengan Wajah'}
              </span>
            </button>
          )}

          {/* Action Buttons (Standard GPS Punch) */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => handleCheckIn()}
              disabled={hasCheckedIn || isPunching}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm ${
                hasCheckedIn
                  ? 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
                  : geofenceResult?.isInside || simulateOffice
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20 active:scale-98'
                  : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-500/20 active:scale-98'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>{hasCheckedIn ? 'Sudah Check In' : 'Check In Biasa'}</span>
            </button>

            <button
              onClick={() => handleCheckOut()}
              disabled={!hasCheckedIn || hasCheckedOut || isPunching}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm ${
                !hasCheckedIn || hasCheckedOut
                  ? 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20 active:scale-98'
              }`}
            >
              <LogOut className="w-4 h-4" />
              <span>{hasCheckedOut ? 'Sudah Check Out' : 'Check Out Biasa'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Geofencing & Real-Time Device Location Radar Panel */}
      <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/90 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              geofenceResult?.isInside || simulateOffice
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            }`}
          >
            <Navigation className={`w-5 h-5 ${isDetectingLocation ? 'animate-spin' : ''}`} />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-white">Deteksi Geofencing GPS Perangkat</span>
              {geofenceResult?.isInside || simulateOffice ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Dalam Radius Kantor
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" /> Di Luar Radius Kantor
                </span>
              )}
            </div>

            <div className="text-[11px] text-slate-400 mt-1 space-x-2 font-mono">
              {activeLat !== null && activeLon !== null ? (
                <>
                  <span>
                    Lat: <strong className="text-slate-200">{activeLat.toFixed(5)}</strong>, Long:{' '}
                    <strong className="text-slate-200">{activeLon.toFixed(5)}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Jarak ke Titik Presensi:{' '}
                    <strong
                      className={
                        geofenceResult?.isInside || simulateOffice
                          ? 'text-emerald-400 font-bold'
                          : 'text-amber-400 font-bold'
                      }
                    >
                      {geofenceResult?.distanceMeters ?? 0} Meter
                    </strong>{' '}
                    (Batas: {branchRadius}m)
                  </span>
                  {deviceCoords?.accuracy && !simulateOffice && (
                    <>
                      <span>•</span>
                      <span className="text-slate-500">Akurasi GPS: &plusmn;{deviceCoords.accuracy}m</span>
                    </>
                  )}
                </>
              ) : (
                <span className="text-amber-400">
                  {isDetectingLocation
                    ? 'Sedang meminta izin dan sinyal GPS perangkat...'
                    : geoError || 'Lokasi belum terdeteksi. Silakan klik tombol deteksi GPS.'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls for Geofence Testing & Refresh */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          {/* Dev/Demo Simulation Toggle */}
          <button
            onClick={() => setSimulateOffice(!simulateOffice)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              simulateOffice
                ? 'bg-blue-600/20 text-blue-300 border-blue-500/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border-slate-700'
            }`}
            title="Gunakan koordinat kantor untuk pengujian di komputer desktop"
          >
            {simulateOffice ? '✓ GPS Kantor Aktif (Simulasi)' : 'Simulasikan di Kantor'}
          </button>

          {/* Refresh Real GPS */}
          <button
            onClick={handleDetectLocation}
            disabled={isDetectingLocation}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${isDetectingLocation ? 'animate-spin' : ''}`} />
            <span>Deteksi Ulang GPS</span>
          </button>
        </div>
      </div>

      {/* Interactive Geofence Map with Reverse Geocoded Address */}
      <GeofenceMap
        deviceLat={activeLat}
        deviceLon={activeLon}
        branchLat={branchLat}
        branchLon={branchLon}
        branchRadius={branchRadius}
        branchName={userBranch.name}
        distanceMeters={geofenceResult?.distanceMeters ?? 0}
        isInsideGeofence={geofenceResult?.isInside ?? true}
        accuracy={deviceCoords?.accuracy}
        onRefreshLocation={handleDetectLocation}
      />

      {/* Feedback Toast */}

      {feedback && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center gap-2.5 ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : feedback.type === 'warning'
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Biometric Face Scanner Modal */}
      <FaceScannerModal
        isOpen={isFaceModalOpen}
        onClose={() => setIsFaceModalOpen(false)}
        onCapture={handleFaceCaptured}
        employeeName={currentUser.fullName}
      />

      {/* Device Binding & Mismatch Modal */}
      <DeviceBindingModal
        isOpen={isBindingModalOpen}
        onClose={() => setIsBindingModalOpen(false)}
        mode={bindingModalMode}
        boundDeviceName={currentUser.boundDeviceName}
        onSuccess={() => {
          refreshRecord();
          if (refreshUser) refreshUser();
        }}
      />
    </div>
  );
}
