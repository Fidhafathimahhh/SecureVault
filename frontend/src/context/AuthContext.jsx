import React, { createContext, useContext, useEffect, useState } from 'react';
import API from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const checkAuth = async () => {
    try {
      const res = await API.get('/auth/me');
      setUser(res.data.user);
    } catch (err) {
      setUser(null);
      localStorage.removeItem('vault_token');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email, password) => {
    setError(null);
    try {
      const res = await API.post('/auth/login', { email, password });
      if (res.data.token) {
        localStorage.setItem('vault_token', res.data.token);
      }
      setUser(res.data.user);
      return res.data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const register = async (email, password, confirmPassword) => {
    setError(null);
    try {
      const res = await API.post('/auth/register', { email, password, confirmPassword });
      return res.data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await API.post('/auth/logout');
    } catch (e) {
      // Ignore logout errors
    } finally {
      localStorage.removeItem('vault_token');
      setUser(null);
    }
  };

  const logoutAll = async () => {
    try {
      await API.post('/auth/logout-all');
    } catch (e) {
      // Ignore
    } finally {
      localStorage.removeItem('vault_token');
      setUser(null);
    }
  };

  const updateUserSetting = (newSettings) => {
    setUser((prev) => (prev ? { ...prev, ...newSettings } : null));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        logoutAll,
        checkAuth,
        updateUserSetting,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
