import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sync session on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('kd_token');
      const adminToken = localStorage.getItem('kd_admin_token');

      if (token) {
        try {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const res = await axios.get('/api/auth/me');
          setUser(res.data);
        } catch (error) {
          localStorage.removeItem('kd_token');
          delete axios.defaults.headers.common['Authorization'];
        }
      }

      if (adminToken) {
        try {
          const res = await axios.get('/api/admin/me', {
            headers: { Authorization: `Bearer ${adminToken}` }
          });
          setAdmin(res.data);
        } catch (error) {
          localStorage.removeItem('kd_admin_token');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const loginUser = async (email, password, code2fa) => {
    const res = await axios.post('/api/auth/login', { email, password, code2fa });
    if (res.data.token) {
      localStorage.setItem('kd_token', res.data.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      setUser(res.data.user);
    }
    return res.data;
  };

  const loginAdmin = async (email, password, code2fa) => {
    const res = await axios.post('/api/admin/login', { email, password, code2fa });
    if (res.data.token) {
      localStorage.setItem('kd_admin_token', res.data.token);
      setAdmin(res.data.admin);
    }
    return res.data;
  };

  const logoutUser = () => {
    localStorage.removeItem('kd_token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const logoutAdmin = () => {
    localStorage.removeItem('kd_admin_token');
    setAdmin(null);
  };

  const refreshProfile = async () => {
    try {
      const res = await axios.get('/api/auth/me');
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

export const useAuth = () => useContext(AuthContext);
