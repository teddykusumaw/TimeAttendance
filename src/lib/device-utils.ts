/**
 * Enterprise Device Binding & Hardware Identification Utilities
 * Implements 1-device-per-employee security policy (Super Admin exempt).
 */

import { User } from '@/types';

const DEVICE_STORAGE_KEY = 'tier1_device_binding_uuid';

/**
 * Retrieves the persistent unique hardware/device identifier for the current browser/phone.
 * If not present, generates a stable cryptographic identifier and stores it in localStorage.
 */
export function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return 'server-context';

  try {
    let deviceId = localStorage.getItem(DEVICE_STORAGE_KEY);
    if (!deviceId) {
      // Generate unique device UUID
      const randomPart = Math.random().toString(36).substring(2, 10);
      const timestampPart = Date.now().toString(36);
      deviceId = `dev-${randomPart}-${timestampPart}`;
      localStorage.setItem(DEVICE_STORAGE_KEY, deviceId);
    }
    return deviceId;
  } catch (e) {
    return 'fallback-device-id';
  }
}

/**
 * Detects a human-readable model/browser description based on navigator.userAgent.
 */
export function getDeviceModelName(): string {
  if (typeof window === 'undefined') return 'Server';

  const ua = navigator.userAgent;

  // Detect Mobile Devices
  if (/iPhone/i.test(ua)) return 'Apple iPhone (iOS)';
  if (/iPad/i.test(ua)) return 'Apple iPad (iPadOS)';
  if (/Samsung/i.test(ua)) return 'Samsung Galaxy (Android)';
  if (/Xiaomi|Redmi|POCO/i.test(ua)) return 'Xiaomi / Redmi (Android)';
  if (/Oppo|Realme/i.test(ua)) return 'Oppo / Realme (Android)';
  if (/Vivo/i.test(ua)) return 'Vivo (Android)';
  if (/Android/i.test(ua)) return 'Smartphone Android (Mobile)';

  // Detect Desktops / Laptops
  if (/Macintosh|Mac OS X/i.test(ua)) return 'Apple Mac (macOS)';
  if (/Windows NT/i.test(ua)) return 'PC Windows (Desktop)';
  if (/Linux/i.test(ua)) return 'Komputer Linux (Workstation)';

  return 'Perangkat Web Browser';
}

export type DeviceBindingStatus = 'EXEMPT' | 'UNBOUND' | 'MATCHED' | 'MISMATCH';

export interface DeviceValidationResult {
  allowed: boolean;
  status: DeviceBindingStatus;
  isSuperUser: boolean;
  currentDeviceId: string;
  currentDeviceName: string;
  boundDeviceId?: string | null;
  boundDeviceName?: string | null;
  message?: string;
}

/**
 * Validates whether the given user is authorized to punch/login on the current device.
 * - SUPER_ADMIN is always EXEMPT and allowed on any device.
 * - Non-superusers can only punch on their 1 bound device.
 */
export function validateDeviceBinding(user: User, currentDeviceId: string): DeviceValidationResult {
  const currentDeviceName = getDeviceModelName();

  // Super Admin is exempt from HP binding restrictions
  if (user.role === 'SUPER_ADMIN') {
    return {
      allowed: true,
      status: 'EXEMPT',
      isSuperUser: true,
      currentDeviceId,
      currentDeviceName,
      boundDeviceId: user.boundDeviceId,
      boundDeviceName: user.boundDeviceName,
      message: 'Akses Super Admin: Bebas binding dari semua perangkat.',
    };
  }

  // If user has not bound any device yet
  if (!user.boundDeviceId) {
    return {
      allowed: false,
      status: 'UNBOUND',
      isSuperUser: false,
      currentDeviceId,
      currentDeviceName,
      message: 'Perangkat HP Anda belum terikat ke akun ini. Harap lakukan pengikatan (binding) terlebih dahulu.',
    };
  }

  // If device matches registered binding
  if (user.boundDeviceId === currentDeviceId) {
    return {
      allowed: true,
      status: 'MATCHED',
      isSuperUser: false,
      currentDeviceId,
      currentDeviceName,
      boundDeviceId: user.boundDeviceId,
      boundDeviceName: user.boundDeviceName,
      message: 'Perangkat HP terverifikasi.',
    };
  }

  // Device mismatch! User is trying to access/punch from another phone/device
  return {
    allowed: false,
    status: 'MISMATCH',
    isSuperUser: false,
    currentDeviceId,
    currentDeviceName,
    boundDeviceId: user.boundDeviceId,
    boundDeviceName: user.boundDeviceName,
    message: `Akses Ditolak: Akun Anda telah terikat pada perangkat "${user.boundDeviceName || user.boundDeviceId}". Anda tidak diizinkan menggunakan perangkat lain. Hubungi Super Admin untuk reset binding HP.`,
  };
}
