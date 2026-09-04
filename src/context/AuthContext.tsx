'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Role } from '@/types';
import { INITIAL_USERS } from '@/lib/mock-data';
import { attendanceRepo } from '@/lib/attendance-repository';
import { getOrCreateDeviceId, getDeviceModelName } from '@/lib/device-utils';

interface AuthContextType {
  currentUser: User;
  isLoggedIn: boolean;
  isAuthInitialized: boolean;
  switchRole: (role: Role) => void;
  switchUser: (userId: string) => void;
  login: (identifier: string, password?: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  bindCurrentDevice: (customName?: string) => boolean;
  resetUserDevice: (userId: string) => boolean;
  registerUserFace: (facePhotoUrl: string) => boolean;
  refreshUser: () => void;
  allUsers: User[];
  permissions: {
    canUploadBulkExcel: boolean;
    canDownloadTemplate: boolean;
    canManageShifts: boolean;
    canApproveLeave: boolean;
    canViewAuditLogs: boolean;
    canAccessSettings: boolean;
    canEditAttendance: boolean;
    isSuperAdmin: boolean;
    isHRAdmin: boolean;
    isManager: boolean;
    isEmployee: boolean;
  };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Default user is the Super Administrator (Teddy Kusuma Wirawan)
  const [currentUser, setCurrentUser] = useState<User>(INITIAL_USERS[0]);
  // In production, session starts as unauthenticated (false) until explicitly validated
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isAuthInitialized, setIsAuthInitialized] = useState<boolean>(false);

  // Sync user state from storage and database
  const syncCurrentUserState = useCallback((targetUserId: string) => {
    // 1. Check direct cached user data in localStorage
    try {
      const cachedData = localStorage.getItem('tier1_current_user_data');
      if (cachedData) {
        const parsed = JSON.parse(cachedData) as User;
        if (parsed && (parsed.id === targetUserId || parsed.employeeCode === targetUserId)) {
          setCurrentUser(parsed);
        }
      }
    } catch (e) {
      // Ignore parse error
    }

    // 2. Check attendanceRepo in-memory users
    const repoUser = attendanceRepo.getUserById(targetUserId);
    if (repoUser) {
      setCurrentUser(repoUser);
      try {
        localStorage.setItem('tier1_current_user_data', JSON.stringify(repoUser));
      } catch (e) {}
    }

    // 3. Fetch latest ground-truth from Neon PostgreSQL
    if (typeof window !== 'undefined') {
      fetch('/api/users', { cache: 'no-store' })
        .then((res) => res.json())
        .then((json) => {
          if (json.status === 'success' && Array.isArray(json.data)) {
            const dbUser = json.data.find(
              (u: User) => u.id === targetUserId || u.employeeCode === targetUserId
            );
            if (dbUser) {
              setCurrentUser(dbUser);
              try {
                localStorage.setItem('tier1_current_user_data', JSON.stringify(dbUser));
              } catch (e) {}
            }
          }
        })
        .catch((err) => {
          console.warn('[AuthContext] Background DB user sync note:', err);
        });
    }
  }, []);

  // Initialize session on mount
  // Initialize session on mount
  useEffect(() => {
    try {
      const savedLoginState = localStorage.getItem('tier1_is_logged_in');
      const savedUserId = localStorage.getItem('tier1_current_user_id');
      const cachedData = localStorage.getItem('tier1_current_user_data');

      // Purge any legacy demo user from previous mock sessions
      if (
        savedUserId &&
        (savedUserId.startsWith('u-') ||
          (cachedData && (cachedData.includes('@enterprise.corp') || cachedData.includes('Alexander Bramantyo') || cachedData.includes('Dimas Anggara'))))
      ) {
        localStorage.removeItem('tier1_current_user_id');
        localStorage.removeItem('tier1_current_user_data');
        localStorage.setItem('tier1_is_logged_in', 'false');
        setIsLoggedIn(false);
        setCurrentUser(INITIAL_USERS[0]);
      } else if (savedLoginState === 'true' && savedUserId) {
        setIsLoggedIn(true);
        syncCurrentUserState(savedUserId);
      } else {
        setIsLoggedIn(false);
      }
    } catch (e) {
      setIsLoggedIn(false);
    } finally {
      setIsAuthInitialized(true);
    }
  }, [syncCurrentUserState]);

  // Listen to custom window events for live synchronization across components
  useEffect(() => {
    const handleUserUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<User>;
      if (customEvent.detail && customEvent.detail.id === currentUser.id) {
        setCurrentUser(customEvent.detail);
        try {
          localStorage.setItem('tier1_current_user_data', JSON.stringify(customEvent.detail));
        } catch (err) {}
      }
    };

    const handleUsersSynced = (e: Event) => {
      const customEvent = e as CustomEvent<User[]>;
      if (Array.isArray(customEvent.detail)) {
        const matching = customEvent.detail.find(
          (u) => u.id === currentUser.id || u.employeeCode === currentUser.employeeCode
        );
        if (matching) {
          setCurrentUser(matching);
          try {
            localStorage.setItem('tier1_current_user_data', JSON.stringify(matching));
          } catch (err) {}
        }
      }
    };

    window.addEventListener('user_updated', handleUserUpdated);
    window.addEventListener('users_synced', handleUsersSynced);

    return () => {
      window.removeEventListener('user_updated', handleUserUpdated);
      window.removeEventListener('users_synced', handleUsersSynced);
    };
  }, [currentUser.id, currentUser.employeeCode]);

  const switchRole = (role: Role) => {
    const all = attendanceRepo.getUsers();
    const userForRole =
      all.find((u) => u.role === role) ||
      INITIAL_USERS.find((u) => u.role === role) ||
      INITIAL_USERS[0];

    setCurrentUser(userForRole);
    setIsLoggedIn(true);
    try {
      localStorage.setItem('tier1_is_logged_in', 'true');
      localStorage.setItem('tier1_current_user_id', userForRole.id);
      localStorage.setItem('tier1_current_user_data', JSON.stringify(userForRole));
    } catch (e) {}
  };

  const switchUser = (userId: string) => {
    const all = attendanceRepo.getUsers();
    const found =
      all.find((u) => u.id === userId || u.employeeCode === userId) ||
      INITIAL_USERS.find((u) => u.id === userId || u.employeeCode === userId);

    if (found) {
      setCurrentUser(found);
      setIsLoggedIn(true);
      try {
        localStorage.setItem('tier1_is_logged_in', 'true');
        localStorage.setItem('tier1_current_user_id', found.id);
        localStorage.setItem('tier1_current_user_data', JSON.stringify(found));
      } catch (e) {}
    }
  };

  const login = async (
    identifier: string,
    password?: string
  ): Promise<{ success: boolean; message?: string }> => {
    const cleanId = identifier.trim();
    if (!cleanId) {
      return { success: false, message: 'Email atau NIK wajib diisi.' };
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: cleanId, password }),
      });
      const json = await res.json();
      if (res.ok && json.status === 'success' && json.data) {
        const foundUser: User = json.data;
        setCurrentUser(foundUser);
        setIsLoggedIn(true);
        try {
          localStorage.setItem('tier1_is_logged_in', 'true');
          localStorage.setItem('tier1_current_user_id', foundUser.id);
          localStorage.setItem('tier1_current_user_data', JSON.stringify(foundUser));
        } catch (e) {}
        return { success: true };
      }
      return { success: false, message: json.message || 'Kredensial login tidak valid.' };
    } catch (e: any) {
      // Offline fallback for superuser
      const cleanLower = cleanId.toLowerCase();
      if (cleanLower === 'teddykusumawirawan81@gmail.com' && password === '12345678!') {
        const foundUser = INITIAL_USERS[0];
        setCurrentUser(foundUser);
        setIsLoggedIn(true);
        try {
          localStorage.setItem('tier1_is_logged_in', 'true');
          localStorage.setItem('tier1_current_user_id', foundUser.id);
          localStorage.setItem('tier1_current_user_data', JSON.stringify(foundUser));
        } catch (err) {}
        return { success: true };
      }
      return { success: false, message: e.message || 'Gagal terhubung ke server autentikasi.' };
    }
  };

  const logout = () => {
    setIsLoggedIn(false);
    try {
      localStorage.setItem('tier1_is_logged_in', 'false');
      localStorage.removeItem('tier1_current_user_id');
      localStorage.removeItem('tier1_current_user_data');
    } catch (e) {}
    // Reset to fallback superuser
    setCurrentUser(INITIAL_USERS[0]);
  };

  const refreshUser = () => {
    syncCurrentUserState(currentUser.id);
  };

  const bindCurrentDevice = (customName?: string): boolean => {
    const deviceId = getOrCreateDeviceId();
    const deviceName = customName || getDeviceModelName();
    const updated = attendanceRepo.bindUserDevice(currentUser.id, deviceId, deviceName);
    if (updated) {
      setCurrentUser(updated);
      try {
        localStorage.setItem('tier1_current_user_data', JSON.stringify(updated));
      } catch (e) {}
      return true;
    }
    return false;
  };

  const resetUserDevice = (userId: string): boolean => {
    const updated = attendanceRepo.resetUserDevice(userId, {
      id: currentUser.id,
      name: currentUser.fullName,
      role: currentUser.role,
    });
    if (updated) {
      if (currentUser.id === userId) {
        setCurrentUser(updated);
        try {
          localStorage.setItem('tier1_current_user_data', JSON.stringify(updated));
        } catch (e) {}
      }
      return true;
    }
    return false;
  };

  const registerUserFace = (facePhotoUrl: string): boolean => {
    const updated = attendanceRepo.updateUserFace(currentUser.id, facePhotoUrl);
    if (updated) {
      setCurrentUser(updated);
      try {
        localStorage.setItem('tier1_current_user_data', JSON.stringify(updated));
      } catch (e) {}
      return true;
    }
    return false;
  };

  const role = currentUser.role;
  const isSuperAdmin = role === 'SUPER_ADMIN';
  const isHRAdmin = role === 'HR_ADMIN';
  const isManager = role === 'MANAGER';
  const isEmployee = role === 'EMPLOYEE';

  const permissions = {
    canUploadBulkExcel: isSuperAdmin || isHRAdmin,
    canDownloadTemplate: true,
    canManageShifts: isSuperAdmin || isHRAdmin,
    canApproveLeave: isSuperAdmin || isHRAdmin || isManager,
    canViewAuditLogs: isSuperAdmin || isHRAdmin,
    canAccessSettings: isSuperAdmin,
    canEditAttendance: isSuperAdmin || isHRAdmin,
    isSuperAdmin,
    isHRAdmin,
    isManager,
    isEmployee,
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isLoggedIn,
        isAuthInitialized,
        switchRole,
        switchUser,
        login,
        logout,
        bindCurrentDevice,
        resetUserDevice,
        registerUserFace,
        refreshUser,
        allUsers: attendanceRepo.getUsers(),
        permissions,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
