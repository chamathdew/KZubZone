'use client';

import React, { createContext, useState, useEffect } from 'react';
import apiClient from '@/services/api/apiClient';
import { tokenService } from '@/services/api/tokenService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sync session on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = tokenService.getUserToken();
      const adminToken = tokenService.getAdminToken();

      if (token) {
        try {
          const res = await apiClient.get('/api/auth/me');
          setUser(res.data);
        } catch (error) {
          tokenService.removeUserToken();
        }
      }

      if (adminToken) {
        try {
          const res = await apiClient.get('/api/admin/me');
          setAdmin(res.data);
        } catch (error) {
          tokenService.removeAdminToken();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // Listen for global auth expiration events from Axios interceptor
  useEffect(() => {
    const handleUserExpire = () => {
      setUser(null);
    };
    const handleAdminExpire = () => {
      setAdmin(null);
    };
    window.addEventListener('user-session-expired', handleUserExpire);
    window.addEventListener('admin-session-expired', handleAdminExpire);
    return () => {
      window.removeEventListener('user-session-expired', handleUserExpire);
      window.removeEventListener('admin-session-expired', handleAdminExpire);
    };
  }, []);

  const loginUser = async (email, password, code2fa) => {
    // Clear admin session to prevent concurrent mixed roles in single browser
    tokenService.removeAdminToken();
    setAdmin(null);

    const res = await apiClient.post('/api/auth/login', { email, password, code2fa });
    if (res.data.token) {
      tokenService.setUserToken(res.data.token);
      setUser(res.data.user);
    }
    return res.data;
  };

  const loginAdmin = async (email, password, code2fa) => {
    // Clear user session to prevent concurrent mixed roles in single browser
    tokenService.removeUserToken();
    setUser(null);

    const res = await apiClient.post('/api/admin/login', { email, password, code2fa });
    if (res.data.token) {
      tokenService.setAdminToken(res.data.token);
      setAdmin(res.data.admin);
    }
    return res.data;
  };

  const logoutUser = () => {
    tokenService.removeUserToken();
    setUser(null);
  };

  const logoutAdmin = () => {
    tokenService.removeAdminToken();
    setAdmin(null);
  };

  const refreshProfile = async () => {
    try {
      const res = await apiClient.get('/api/auth/me');
      setUser(res.data);
    } catch (err) {
      console.error('Refresh profile error:', err);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      admin,
      loading,
      loginUser,
      loginAdmin,
      logoutUser,
      logoutAdmin,
      refreshProfile,
      setUser,
      setAdmin
    }}>
      {children}
    </AuthContext.Provider>
  );
};
