import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

// ── Persistent storage helpers (localStorage survives browser close/reopen) ──
const store = {
  getToken: ()      => localStorage.getItem('de_token'),
  getUser:  ()      => { try { return JSON.parse(localStorage.getItem('de_user')); } catch { return null; } },
  set: (token, user) => {
    localStorage.setItem('de_token', token);
    localStorage.setItem('de_user', JSON.stringify(user));
  },
  clear: () => {
    localStorage.removeItem('de_token');
    localStorage.removeItem('de_user');
    // Also clear old sessionStorage keys in case they exist from previous version
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
  },
};

export const AuthProvider = ({ children }) => {
  // Seed state from localStorage immediately — avoids flash of unauthenticated UI
  const [user, setUser]       = useState(() => store.getUser());
  const [loading, setLoading] = useState(true);

  // On mount: verify token is still valid with the server
  useEffect(() => {
    const token = store.getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    api.get('/auth/me')
      .then(res => {
        const freshUser = res.data.user;
        setUser(freshUser);
        store.set(token, freshUser); // refresh cached user data
      })
      .catch(() => {
        // Token invalid or expired — clear everything
        store.clear();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  // Called by LoginPage after any successful authentication step
  const setSession = useCallback((token, userData) => {
    store.set(token, userData);
    setUser(userData);
  }, []);

  // Direct password login (used by admin, or as utility)
  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, user: userData } = res.data;
    store.set(token, userData);
    setUser(userData);
    return userData;
  }, []);

  // Clear everything and return to landing page
  const logout = useCallback(() => {
    store.clear();
    setUser(null);
  }, []);

  // Patch local user data (e.g. after profile update) without re-fetching
  const updateUser = useCallback((updates) => {
    setUser(prev => {
      const updated = { ...prev, ...updates };
      store.set(store.getToken(), updated);
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setSession, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
