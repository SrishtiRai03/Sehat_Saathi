import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

/**
 * Dynamic API base URL:
 * - In dev (Vite proxy active): use '' so fetch('/api/...') goes through the proxy
 * - In production (Express serves both API + static): use '' (same origin)
 * - If you ever host frontend and backend separately, set VITE_API_BASE in .env
 */
const API_BASE = import.meta.env.VITE_API_BASE || '';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('ss_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetch(`${API_BASE}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(data => { setUser(data); setLoading(false); })
        .catch(() => { localStorage.removeItem('ss_token'); setToken(null); setUser(null); setLoading(false); });
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = useCallback(async (role, phone, otp) => {
    let res;
    if (role && !phone) {
      res = await fetch(`${API_BASE}/api/auth/demo-login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role }) });
    } else {
      if (otp) {
        res = await fetch(`${API_BASE}/api/auth/verify-otp`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone, otp }) });
      } else {
        res = await fetch(`${API_BASE}/api/auth/send-otp`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone }) });
        return res.json();
      }
    }
    const data = await res.json();
    if (data.token) {
      localStorage.setItem('ss_token', data.token);
      setToken(data.token);
      setUser(data.user);
    }
    return data;
  }, []);

  /**
   * Logout — only clears auth state. Does NOT navigate.
   * Each dashboard should call navigate('/') FIRST, then call logout()
   * to avoid the race condition with ProtectedRoute guards.
   */
  const logout = useCallback(() => {
    localStorage.removeItem('ss_token');
    setToken(null);
    setUser(null);
  }, []);

  const authFetch = useCallback(async (url, options = {}) => {
    const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url}`;
    const headers = { ...options.headers, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
    const res = await fetch(fullUrl, { ...options, headers });
    if (res.status === 401) { logout(); throw new Error('Unauthorized'); }
    return res.json();
  }, [token, logout]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, authFetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export { API_BASE };
export const useAuth = () => useContext(AuthContext);
