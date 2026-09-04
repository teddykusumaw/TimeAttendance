/**
 * Enterprise Geofencing & Geolocation Utilities
 * Implements the Haversine formula to compute geodesic distance in meters.
 */

export interface GeoLocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  loading: boolean;
  error: string | null;
  permissionGranted: boolean;
}

export interface GeofenceCheckResult {
  isInside: boolean;
  distanceMeters: number;
  allowedRadiusMeters: number;
  branchName: string;
}

const EARTH_RADIUS_METERS = 6371000;

/**
 * Calculates geodesic distance between two latitude/longitude points in meters using Haversine formula.
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(EARTH_RADIUS_METERS * c);
}

/**
 * Verifies whether device coordinates fall within the branch geofence boundary.
 */
export function evaluateGeofence(
  deviceLat: number,
  deviceLon: number,
  branchLat: number,
  branchLon: number,
  radiusMeters: number,
  branchName: string
): GeofenceCheckResult {
  const distanceMeters = calculateDistanceMeters(deviceLat, deviceLon, branchLat, branchLon);

  return {
    isInside: distanceMeters <= radiusMeters,
    distanceMeters,
    allowedRadiusMeters: radiusMeters,
    branchName,
  };
}

/**
 * Requests device GPS position via browser HTML5 Geolocation API.
 * - Forces a completely fresh reading (maximumAge: 0) — no cached data.
 * - Falls back to network-based geolocation if high-accuracy GPS times out.
 */
export function getDeviceGeolocation(): Promise<{
  latitude: number;
  longitude: number;
  accuracy: number;
}> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Deteksi lokasi hanya dapat dijalankan di browser.'));
      return;
    }

    if (!window.isSecureContext && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      reject(
        new Error(
          'Akses GPS diblokir oleh browser karena koneksi HTTP (non-HTTPS). Agar GPS aktif di HP via WiFi, jalankan: npm run dev:https atau buka chrome://flags/#unsafely-treat-insecure-origin-as-secure di Chrome HP.'
        )
      );
      return;
    }

    if (!navigator.geolocation) {
      reject(new Error('Browser Anda tidak mendukung deteksi lokasi (Geolocation API).'));
      return;
    }

    const onSuccess = (position: GeolocationPosition) => {
      resolve({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: Math.round(position.coords.accuracy),
      });
    };

    const onError = (err: GeolocationPositionError) => {
      let message = 'Gagal mendeteksi lokasi perangkat.';
      switch (err.code) {
        case err.PERMISSION_DENIED:
          message = 'Izin akses lokasi GPS ditolak oleh pengguna pada browser.';
          break;
        case err.POSITION_UNAVAILABLE:
          message = 'Informasi sinyal GPS perangkat tidak tersedia.';
          break;
        case err.TIMEOUT:
          message = 'Waktu permintaan deteksi lokasi GPS habis (timeout).';
          break;
      }
      reject(new Error(message));
    };

    // First attempt: high-accuracy GPS (real hardware GPS)
    navigator.geolocation.getCurrentPosition(
      onSuccess,
      (highAccErr) => {
        // If high-accuracy fails (usually timeout on desktop), fall back to
        // network-based geolocation which is faster but less precise
        if (highAccErr.code === highAccErr.TIMEOUT) {
          console.warn('High-accuracy GPS timed out, falling back to network geolocation...');
          navigator.geolocation.getCurrentPosition(
            onSuccess,
            onError,
            {
              enableHighAccuracy: false,
              timeout: 10000,
              maximumAge: 0,
            }
          );
        } else {
          onError(highAccErr);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0, // CRITICAL: Always get fresh position, never use cache
      }
    );
  });
}

export interface GeocodeAddress {
  displayName: string;
  primaryLocation?: string;
  secondaryLocation?: string;
  road?: string;
  suburb?: string;
  city?: string;
  state?: string;
  country?: string;
  postcode?: string;
}

/**
 * Reverse geocodes latitude & longitude into a human-readable street address.
 * Uses local API route proxy (/api/geocode/reverse) with server caching and Nominatim fallback.
 */
export async function reverseGeocode(lat: number, lon: number): Promise<GeocodeAddress> {
  try {
    // Try internal proxy route first (prevents CORS and rate-limit blocks)
    const proxyRes = await fetch(`/api/geocode/reverse?lat=${lat}&lon=${lon}`);
    if (proxyRes.ok) {
      const data = await proxyRes.json();
      return {
        displayName: data.displayName || `${lat.toFixed(5)}, ${lon.toFixed(5)}`,
        primaryLocation: data.primaryLocation,
        secondaryLocation: data.secondaryLocation,
        road: data.details?.road || data.details?.building || 'Jalan Sekitar Lokasi',
        suburb: data.details?.suburb,
        city: data.details?.city || 'Indonesia',
        state: data.details?.state,
        country: data.details?.country || 'Indonesia',
        postcode: data.details?.postcode,
      };
    }
  } catch (err) {
    // Fallback to direct fetch if proxy unavailable
  }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`,
      {
        headers: {
          'Accept-Language': 'id,en',
        },
      }
    );
    if (!res.ok) throw new Error('Gagal mengambil alamat');
    const data = await res.json();
    const addr = data.address || {};

    const road = addr.road || addr.building || data.name || 'Jalan Sekitar Lokasi';
    const suburb = addr.suburb || addr.neighbourhood || addr.village || addr.quarter;
    const city = addr.city || addr.town || addr.city_district || addr.county || 'Kota';
    const state = addr.state || 'Provinsi';

    return {
      displayName: data.display_name || `${lat.toFixed(5)}, ${lon.toFixed(5)}`,
      primaryLocation: `${road}${suburb ? `, ${suburb}` : ''}`,
      secondaryLocation: `${city}, ${state}`,
      road,
      suburb,
      city,
      state,
      country: addr.country || 'Indonesia',
      postcode: addr.postcode,
    };
  } catch (err) {
    return {
      displayName: `Titik Koordinat (${lat.toFixed(5)}, ${lon.toFixed(5)})`,
      primaryLocation: `Koordinat GPS: ${lat.toFixed(5)}, ${lon.toFixed(5)}`,
      secondaryLocation: 'Lokasi Perangkat Terdeteksi',
      road: 'Titik Koordinat Terdeteksi',
      city: 'Indonesia',
      country: 'Indonesia',
    };
  }
}


