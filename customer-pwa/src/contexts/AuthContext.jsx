import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import authApi from '../services/authApi';

const AuthContext = createContext(null);

const DASHBOARD_URL = import.meta.env.VITE_DASHBOARD_URL || 'http://localhost:3001';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('pharmex_customer_token');
    if (token) {
      authApi.get('/user')
        .then((res) => setUser(res.data.data || res.data))
        .catch(() => localStorage.removeItem('pharmex_customer_token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (credentials) => {
    const res = await authApi.post('/login', credentials);
    const data = res.data;
    const token = data.token || data.data?.token;
    const userData = data.user || data.data?.user || data.data;
    const role = userData?.role;

    if (role === 'customer') {
      if (token) localStorage.setItem('pharmex_customer_token', token);
      setUser(userData);
      return { user: userData, token, role, redirect: 'pwa' };
    }

    if (token) {
      window.location.href = `${DASHBOARD_URL}?token=${encodeURIComponent(token)}`;
      return { user: userData, token, role, redirect: 'dashboard' };
    }

    throw new Error('No token received');
  };

  const register = async (payload) => {
    if (payload.role === 'owner') {
      const res = await authApi.post('/register', payload);
      const data = res.data;
      const token = data.token || data.data?.token;
      if (token) {
        window.location.href = `${DASHBOARD_URL}?token=${encodeURIComponent(token)}`;
        return { token, role: 'owner', redirect: 'dashboard' };
      }
      return data;
    }

    const res = await api.post('/register', payload);
    const data = res.data;
    const token = data.token || data.data?.token;
    if (token) localStorage.setItem('pharmex_customer_token', token);
    const userData = data.user || data.data?.user || data.data;
    setUser(userData);
    return { user: userData, token, role: 'customer', redirect: 'pwa' };
  };

  const logout = async () => {
    try {
      await authApi.post('/logout');
    } catch {
      // Continue with logout even if API call fails
    } finally {
      localStorage.removeItem('pharmex_customer_token');
      setUser(null);
    }
  };

  const updateUser = (userData) => setUser(userData);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
