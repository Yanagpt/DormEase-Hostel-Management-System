import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token from this tab's sessionStorage (isolated per tab)
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally — but DON'T redirect if already on login/register
// (that would cause the page reload you're seeing)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const onAuthPage = ['/login', '/register'].some(function(p) {
        return window.location.pathname.startsWith(p);
      });
      if (!onAuthPage) {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    // Always pass the error to the calling catch block
    return Promise.reject(error);
  }
);

export default api;