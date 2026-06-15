import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

// ─── Per-tab session storage ───────────────────────────────────────────────
// sessionStorage is isolated per browser tab, so admin, warden and student
// can each be logged in simultaneously in separate tabs without overwriting
// each other's session. On reload, each tab restores its own session.
const session = {
  getToken: () => sessionStorage.getItem('token'),
  getUser:  () => { try { return JSON.parse(sessionStorage.getItem('user')); } catch { return null; } },
  set: (token, user) => {
    sessionStorage.setItem('token', token);
    sessionStorage.setItem('user', JSON.stringify(user));
  },
  clear: () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
  },
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => session.getUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = session.getToken();
    if (token) {
      api.get('/auth/me')
        .then(res => {
          setUser(res.data.user);
          session.set(token, res.data.user);
        })
        .catch(() => {
          session.clear();
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, user: userData } = res.data;
    session.set(token, userData);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    session.clear();
    setUser(null);
  };

  const updateUser = (updates) => {
    const updated = { ...user, ...updates };
    setUser(updated);
    session.set(session.getToken(), updated);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};