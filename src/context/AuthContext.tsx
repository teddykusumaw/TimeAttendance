'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
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
  login: (identifier: string, role?: Role) => boolean;
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
  // Default to Super Admin in memory, but state tracking whether an explicit session exists
  const [currentUser, setCurrentUser] = useState<User>(INITIAL_USERS[0]);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true); // Default true for initial render, updated in useEffect
  const [isAuthInitialized, setIsAuthInitialized] = useState<boolean>(false);

  useEffect(() => {
    try {
      const savedLoginState = localStorage.getItem('tier1_is_logged_in');
      const savedUserId = localStorage.getItem('tier1_current_user_id');

      if (savedLoginState === 'true' && savedUserId) {
        const found = INITIAL_USERS.find((u) => u.id === savedUserId);
        if (found) {
          setCurrentUser(found);
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(true);
        }
      } else if (savedLoginState === 'false') {
        setIsLoggedIn(false);
      } else if (!savedLoginState) {
        // First time access (e.g. from mobile or new browser on WiFi)
        // Check if there is a saved user id
        if (savedUserId) {
          const found = INITIAL_USERS.find((u) => u.id === savedUserId);
          if (found) {
            setCurrentUser(found);
            setIsLoggedIn(true);
          } else {
            setIsLoggedIn(false);
          }
        } else {
          // If brand new access, require login so employee goes to employee portal login
          setIsLoggedIn(false);
        }
      }
    } catch (e) {
      // Fallback
    } finally {
      setIsAuthInitialized(true);
    }
  }, []);

  const switchRole = (role: Role) => {
    const userForRole = INITIAL_USERS.find((u) => u.role === role) || INITIAL_USERS[0];
    setCurrentUser(userForRole);
    setIsLoggedIn(true);
    localStorage.setItem('tier1_is_logged_in', 'true');
    localStorage.setItem('tier1_current_user_id', userForRole.id);
  };

  const switchUser = (userId: string) => {
    const found = INITIAL_USERS.find((u) => u.id === userId);
    if (found) {
      setCurrentUser(found);
      setIsLoggedIn(true);
      localStorage.setItem('tier1_is_logged_in', 'true');
      localStorage.setItem('tier1_current_user_id', found.id);
    }
  };

  const login = (identifier: string, role?: Role): boolean => {
    const cleanId = identifier.trim().toLowerCase();
    const found = INITIAL_USERS.find(
      (u) =>
        u.email.toLowerCase() === cleanId ||
        u.employeeCode.toLowerCase() === cleanId ||
        u.id.toLowerCase() === cleanId ||
        u.fullName.toLowerCase().includes(cleanId)
    );

    if (found) {
      setCurrentUser(found);
      setIsLoggedIn(true);
      localStorage.setItem('tier1_is_logged_in', 'true');
      localStorage.setItem('tier1_current_user_id', found.id);
      return true;
    }

    if (role) {
      switchRole(role);
      return true;
    }

    return false;
  };

  const logout = () => {
    setIsLoggedIn(false);
    localStorage.setItem('tier1_is_logged_in', 'false');
    localStorage.removeItem('tier1_current_user_id');
    // Set default user to employee so employee portal or login preview has non-null user
    const defaultEmp = INITIAL_USERS.find((u) => u.role === 'EMPLOYEE') || INITIAL_USERS[3];
    setCurrentUser(defaultEmp);
  };

  const refreshUser = () => {
    const updated = attendanceRepo.getUserById(currentUser.id);
    if (updated) setCurrentUser(updated);
  };

  const bindCurrentDevice = (customName?: string): boolean => {
    const deviceId = getOrCreateDeviceId();
    const deviceName = customName || getDeviceModelName();
    const updated = attendanceRepo.bindUserDevice(currentUser.id, deviceId, deviceName);
    if (updated) {
      setCurrentUser(updated);
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
      }
      return true;
    }
    return false;
  };

  const registerUserFace = (facePhotoUrl: string): boolean => {
    const updated = attendanceRepo.updateUserFace(currentUser.id, facePhotoUrl);
    if (updated) {
      setCurrentUser(updated);
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
