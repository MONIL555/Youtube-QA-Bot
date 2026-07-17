'use client';
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sync window.__accessToken whenever accessToken state changes
  // This is needed because lib/api.js and direct fetch() calls read from window.__accessToken
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__accessToken = accessToken;
    }
  }, [accessToken]);

  const refreshTokens = useCallback(async () => {
    try {
      const { data } = await api.post('/auth/refresh');
      setAccessToken(data.accessToken);
      return data.accessToken;
    } catch {
      setUser(null);
      setAccessToken(null);
      return null;
    }
  }, []);

  const mounted = useRef(false);

  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;
    (async () => {
      const token = await refreshTokens();
      if (token) {
        try {
          const { data } = await api.get('/auth/me', {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUser(data.user);
        } catch { setUser(null); }
      }
      setLoading(false);
    })();
  }, [refreshTokens]);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    setAccessToken(data.accessToken);
    setUser(data.user);
    return data;
  };

  const register = async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    setAccessToken(data.accessToken);
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    setUser(null);
    setAccessToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, loading, login, register, logout, refreshTokens }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
