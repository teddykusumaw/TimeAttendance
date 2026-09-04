'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import {
  MapPin,
  Navigation,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Compass,
  Building2,
  RefreshCw,
  Eye,
  EyeOff,
  Map,
  CheckCircle2,
} from 'lucide-react';
import { GeocodeAddress, reverseGeocode } from '@/lib/geo-utils';

// Dynamic import with SSR disabled - Leaflet requires browser globals (window, document)
const InteractiveLeafletMap = dynamic(
  () => import('./InteractiveLeafletMap'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-80 sm:h-96 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center gap-2 text-slate-400">
        <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />
        <span className="text-xs">Memuat komponen peta...</span>
      </div>
    ),
  }
);

interface GeofenceMapProps {
  deviceLat: number | null;
  deviceLon: number | null;
  branchLat: number;
  branchLon: number;
  branchRadius: number;
  branchName: string;
  distanceMeters: number;
  isInsideGeofence: boolean;
  accuracy?: number | null;
  onRefreshLocation?: () => void;
}

export default function GeofenceMap({
  deviceLat,
  deviceLon,
  branchLat,
  branchLon,
  branchRadius,
  branchName,
  distanceMeters,
  isInsideGeofence,
  accuracy,
  onRefreshLocation,
}: GeofenceMapProps) {
  const [address, setAddress] = useState<GeocodeAddress | null>(null);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [showFullMap, setShowFullMap] = useState(true);

  const activeLat = deviceLat ?? branchLat;
  const activeLon = deviceLon ?? branchLon;

  // Reverse Geocoding effect
  useEffect(() => {
    if (activeLat && activeLon) {
      setLoadingAddress(true);
      reverseGeocode(activeLat, activeLon)
        .then((addr) => setAddress(addr))
        .catch(() => setAddress(null))
        .finally(() => setLoadingAddress(false));
    }
  }, [activeLat, activeLon]);

  const googleMapsUrl = `https://www.google.com/maps?q=${activeLat},${activeLon}`;
  const osmFullUrl = `https://www.openstreetmap.org/?mlat=${activeLat}&mlon=${activeLon}#map=18/${activeLat}/${activeLon}`;

  return (
    <div className="enterprise-card rounded-2xl p-5 border-slate-800 space-y-4">
      {/* Header with Title & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Peta Lokasi & Geofence Presensi</span>
              {isInsideGeofence ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Dalam Radius Kantor
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" /> Di Luar Radius Kantor
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400">
              Identifikasi nama lokasi fisik dari koordinat GPS serta visualisasi peta radius presensi.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onRefreshLocation && (
            <button
              onClick={onRefreshLocation}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors"
              title="Perbarui koordinat GPS & Alamat"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => setShowFullMap(!showFullMap)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            {showFullMap ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{showFullMap ? 'Sembunyikan Peta' : 'Buka Peta'}</span>
          </button>
        </div>
      </div>

      {/* Reverse Geocoding Address Card */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/90 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Street & Landmark */}
        <div className="md:col-span-2 space-y-1.5">
          <div className="flex items-center gap-2 text-[11px] font-semibold text-blue-400 uppercase tracking-wider">
            <MapPin className="w-3.5 h-3.5" />
            <span>Alamat Fisik Terdeteksi (Reverse Geocoding)</span>
          </div>

          {loadingAddress ? (
            <div className="text-xs text-slate-400 flex items-center gap-2 py-2">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
              <span>Mengidentifikasi nama gedung, jalan, dan kelurahan dari koordinat GPS...</span>
            </div>
          ) : address ? (
            <div className="space-y-1">
              {/* Primary Location (Building / Road) */}
              <p className="text-base font-bold text-white leading-snug">
                {address.primaryLocation || address.road}
              </p>

              {/* District & City */}
              <p className="text-xs text-slate-300">
                {address.secondaryLocation || `${address.city}, ${address.state}`}
                {address.postcode && <span className="text-slate-500"> • Kode Pos: {address.postcode}</span>}
              </p>

              {/* Exact Coordinate Badge */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono text-[11px] border border-slate-700">
                  <span>GPS:</span>
                  <strong className="text-white">{activeLat.toFixed(5)}, {activeLon.toFixed(5)}</strong>
                </span>
                {accuracy && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800/60 text-slate-400 font-mono text-[11px] border border-slate-800">
                    Akurasi: &plusmn;{accuracy}m
                  </span>
                )}
              </div>

              {/* Full Address Description */}
              <p className="text-[11px] text-slate-500 mt-1 font-mono line-clamp-1">
                {address.displayName}
              </p>
            </div>
          ) : (
            <div className="text-xs text-slate-400 py-1">
              <p className="font-semibold text-white">Koordinat: {activeLat.toFixed(5)}, {activeLon.toFixed(5)}</p>
              <p className="text-slate-500 text-[11px]">Sedang menyinkronkan data peta wilayah...</p>
            </div>
          )}
        </div>

        {/* Geofence Distance Meter */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-col justify-between text-xs space-y-2">
          <div>
            <span className="text-slate-400 font-medium">Jarak ke Pusat Kantor:</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span
                className={`text-2xl font-extrabold font-mono ${
                  isInsideGeofence ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {distanceMeters}
              </span>
              <span className="text-xs font-semibold text-slate-400">Meter</span>
            </div>

            <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isInsideGeofence ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
                style={{
                  width: `${Math.min(100, Math.max(10, (branchRadius / (distanceMeters || 1)) * 100))}%`,
                }}
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80 space-y-1 text-[11px]">
            <div className="flex items-center justify-between text-slate-400">
              <span>Batas Radius:</span>
              <strong className="text-slate-200">{branchRadius} Meter</strong>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Titik Cabang:</span>
              <strong className="text-slate-200 truncate max-w-[120px]">{branchName}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Map View */}
      {showFullMap && (
        <div className="space-y-2">
          <InteractiveLeafletMap
            deviceLat={deviceLat}
            deviceLon={deviceLon}
            branchLat={branchLat}
            branchLon={branchLon}
            branchRadius={branchRadius}
            branchName={branchName}
            distanceMeters={distanceMeters}
            isInsideGeofence={isInsideGeofence}
            accuracy={accuracy}
          />

          {/* Quick External Map Links */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 pt-1">
            <span>Peta interaktif dilengkapi layer Satelit, Jalan, dan Mode Gelap.</span>
            <div className="flex items-center gap-3">
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 font-medium"
              >
                <span>Buka di Google Maps</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <span>•</span>
              <a
                href={osmFullUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 font-medium"
              >
                <span>Buka di OpenStreetMap</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
