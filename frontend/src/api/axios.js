import axios from 'axios';

const api = axios.create({
  baseURL: 'https://dormease-hostel-management-system.onrender.com/api',
  headers: { 'Content-Type': 'application/json' },
});

// Read token from localStorage (persists across browser restarts)
const getToken = () => localStorage.getItem('de_token');

// Attach JWT on every request
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally — token expired or invalid
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const onAuthPage = ['/login', '/register'].some(p =>
        window.location.pathname.startsWith(p)
      );
      if (!onAuthPage) {
        localStorage.removeItem('de_token');
        localStorage.removeItem('de_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
