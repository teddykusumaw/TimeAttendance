'use client';

// This file is ALWAYS loaded via next/dynamic with ssr:false from GeofenceMap.tsx.
// We can safely import browser-only modules at the top level here because
// this module is NEVER evaluated on the server.

import React, { useEffect, useState, useCallback } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Circle, Marker, Polyline, Popup, Tooltip, useMap } from 'react-leaflet';
import { Maximize2, RefreshCw } from 'lucide-react';

interface InteractiveLeafletMapProps {
  deviceLat: number | null;
  deviceLon: number | null;
  branchLat: number;
  branchLon: number;
  branchRadius: number;
  branchName: string;
  distanceMeters: number;
  isInsideGeofence: boolean;
  accuracy?: number | null;
}

// --- Internal: auto-recenter map when coordinates change ---
function MapViewController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom() || 17);
  }, [center, map]);
  return null;
}

// --- Internal: fix map size after mount ---
function MapResizer() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize(), 300);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

// --- Internal: FitBounds button INSIDE MapContainer ---
function FitBoundsControl({
  branchLat,
  branchLon,
  deviceLat,
  deviceLon,
}: {
  branchLat: number;
  branchLon: number;
  deviceLat: number | null;
  deviceLon: number | null;
}) {
  const map = useMap();

  const handleFitBounds = useCallback(() => {
    if (deviceLat !== null && deviceLon !== null) {
      const bounds = L.latLngBounds(
        [branchLat, branchLon],
        [deviceLat, deviceLon]
      );
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 18 });
    } else {
      map.setView([branchLat, branchLon], 17);
    }
  }, [map, branchLat, branchLon, deviceLat, deviceLon]);

  return (
    <button
      type="button"
      onClick={handleFitBounds}
      className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
      title="Pusatkan Peta ke Posisi Anda & Kantor"
    >
      <Maximize2 className="w-3.5 h-3.5" />
    </button>
  );
}

// --- Tile URL configs ---
// All tiles routed through internal proxy to avoid CORS / API-key / ISP issues
const TILE_CONFIGS = {
  streets: {
    url: '/api/map/tile?theme=streets&z={z}&x={x}&y={y}',
    maxZoom: 19,
    darkCss: false,
  },
  satellite: {
    url: '/api/map/tile?theme=satellite&z={z}&x={x}&y={y}',
    maxZoom: 19,
    darkCss: false,
  },
  dark: {
    url: '/api/map/tile?theme=dark&z={z}&x={x}&y={y}',
    maxZoom: 19,
    darkCss: true, // CSS inversion on regular tiles
  },
};

type TileTheme = keyof typeof TILE_CONFIGS;

// --- Main Component ---
export default function InteractiveLeafletMap({
  deviceLat,
  deviceLon,
  branchLat,
  branchLon,
  branchRadius,
  branchName,
  distanceMeters,
  isInsideGeofence,
  accuracy,
}: InteractiveLeafletMapProps) {
  const [activeTileTheme, setActiveTileTheme] = useState<TileTheme>('dark');
  const [mapReady, setMapReady] = useState(false);

  const activeLat = deviceLat ?? branchLat;
  const activeLon = deviceLon ?? branchLon;
  const center: [number, number] = [activeLat, activeLon];
  const currentTile = TILE_CONFIGS[activeTileTheme];
  const circleColor = isInsideGeofence ? '#10b981' : '#f59e0b';

  const showConnectionLine =
    deviceLat !== null &&
    deviceLon !== null &&
    (Math.abs(deviceLat - branchLat) > 0.00005 ||
      Math.abs(deviceLon - branchLon) > 0.00005);

  // Custom div icons
  const officeIcon = L.divIcon({
    className: '',
    html: `
      <div style="position:relative;display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-100%);">
        <div style="background:#0284c7;color:white;padding:4px 8px;border-radius:8px;font-size:11px;font-weight:700;white-space:nowrap;box-shadow:0 4px 12px rgba(0,0,0,.4);border:2px solid white;display:flex;align-items:center;gap:4px;">
          <span>🏢</span><span>${branchName}</span>
        </div>
        <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:8px solid white;"></div>
      </div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });

  const deviceColor = isInsideGeofence ? '#10b981' : '#f59e0b';
  const deviceIcon = L.divIcon({
    className: '',
    html: `
      <div style="position:relative;display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-100%);">
        <div style="background:${deviceColor};color:white;padding:4px 8px;border-radius:8px;font-size:11px;font-weight:700;white-space:nowrap;box-shadow:0 4px 14px rgba(0,0,0,.5);border:2px solid white;display:flex;align-items:center;gap:4px;">
          <span>📍</span><span>Posisi Anda (${distanceMeters}m)</span>
        </div>
        <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:8px solid white;"></div>
        <div style="width:12px;height:12px;background:${deviceColor};border-radius:50%;border:2px solid white;margin-top:-4px;box-shadow:0 0 10px ${deviceColor};"></div>
      </div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });

  return (
    <div className={`relative w-full h-80 sm:h-96 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 ${currentTile.darkCss ? 'dark-map-tiles' : ''}`}>
      <MapContainer
        center={center}
        zoom={17}
        zoomControl={true}
        attributionControl={false}
        style={{ width: '100%', height: '100%', background: '#090d16' }}
        whenReady={() => setMapReady(true)}
      >
        {/* Tile layer — key forces remount on theme switch */}
        <TileLayer
          key={activeTileTheme}
          url={currentTile.url}
          maxZoom={currentTile.maxZoom}
        />

        <MapViewController center={center} />
        <MapResizer />

        {/* Geofence circle */}
        <Circle
          center={[branchLat, branchLon]}
          radius={branchRadius}
          pathOptions={{
            color: circleColor,
            weight: 2,
            dashArray: '5, 6',
            fillColor: circleColor,
            fillOpacity: 0.15,
          }}
        >
          <Popup>
            <div style={{ fontFamily: 'system-ui', fontSize: 12, color: '#0f172a', padding: 4 }}>
              <strong style={{ color: '#0284c7', fontSize: 13 }}>{branchName}</strong><br />
              Batas Radius: <strong>{branchRadius} Meter</strong><br />
              <span style={{ color: '#64748b' }}>({branchLat.toFixed(5)}, {branchLon.toFixed(5)})</span>
            </div>
          </Popup>
        </Circle>

        {/* Office marker */}
        <Marker position={[branchLat, branchLon]} icon={officeIcon}>
          <Popup><b>{branchName}</b><br />Titik Acuan Presensi Cabang</Popup>
        </Marker>

        {/* Device marker + accuracy + connection */}
        {deviceLat !== null && deviceLon !== null && (
          <>
            <Marker position={[deviceLat, deviceLon]} icon={deviceIcon}>
              <Popup>
                <div style={{ fontFamily: 'system-ui', fontSize: 12, color: '#0f172a', padding: 4 }}>
                  <strong style={{ color: deviceColor }}>Posisi Perangkat Anda</strong><br />
                  Jarak: <strong>{distanceMeters} Meter</strong><br />
                  Status: <strong>{isInsideGeofence ? 'Dalam Radius' : 'Di Luar Radius'}</strong>
                </div>
              </Popup>
            </Marker>

            {accuracy && accuracy > 5 && accuracy < 500 && (
              <Circle
                center={[deviceLat, deviceLon]}
                radius={accuracy}
                pathOptions={{ color: '#38bdf8', weight: 1, fillColor: '#38bdf8', fillOpacity: 0.1, dashArray: '3, 4' }}
              />
            )}

            {showConnectionLine && (
              <Polyline
                positions={[[deviceLat, deviceLon], [branchLat, branchLon]]}
                pathOptions={{ color: circleColor, weight: 2, dashArray: '4, 6', opacity: 0.8 }}
              >
                <Tooltip sticky>Jarak: {distanceMeters} m</Tooltip>
              </Polyline>
            )}
          </>
        )}

        {/* ── Floating controls INSIDE MapContainer (useMap works here) ── */}
        {mapReady && (
          <div className="leaflet-top leaflet-right" style={{ pointerEvents: 'auto' }}>
            <div className="leaflet-control" style={{ pointerEvents: 'auto' }}>
              <div className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-700 shadow-xl text-xs mt-2 mr-2">
                {(['dark', 'streets', 'satellite'] as TileTheme[]).map((theme) => (
                  <button
                    key={theme}
                    type="button"
                    onClick={() => setActiveTileTheme(theme)}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                      activeTileTheme === theme
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {theme === 'dark' ? 'Gelap' : theme === 'streets' ? 'Jalan' : 'Satelit'}
                  </button>
                ))}
                <div className="w-px h-4 bg-slate-700 mx-0.5" />
                <FitBoundsControl
                  branchLat={branchLat}
                  branchLon={branchLon}
                  deviceLat={deviceLat}
                  deviceLon={deviceLon}
                />
              </div>
            </div>
          </div>
        )}
      </MapContainer>

      {/* Loading overlay */}
      {!mapReady && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-slate-950/80 backdrop-blur-sm text-slate-400">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />
          <span className="text-xs">Menyiapkan peta lokasi...</span>
        </div>
      )}

      {/* Legend (no useMap needed, stays outside MapContainer) */}
      {mapReady && (
        <div className="absolute bottom-3 left-3 z-[1000] px-3 py-2 rounded-xl bg-slate-950/90 backdrop-blur-md border border-slate-800 text-[11px] space-y-1.5 shadow-2xl pointer-events-none">
          <div className="flex items-center gap-2 text-slate-200">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 border border-white" />
            <span>🏢 {branchName} (Pusat Kantor)</span>
          </div>
          <div className="flex items-center gap-2 text-slate-200">
            <span className={`w-2.5 h-2.5 rounded-full border border-white ${isInsideGeofence ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <span>📍 Posisi Perangkat Anda ({distanceMeters}m)</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <span className={`w-3.5 h-1 border-t-2 border-dashed ${isInsideGeofence ? 'border-emerald-400' : 'border-amber-400'}`} />
            <span>Radius Toleransi Geofence ({branchRadius}m)</span>
          </div>
        </div>
      )}
    </div>
  );
}
