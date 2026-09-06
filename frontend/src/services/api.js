import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});

// Attach token from localStorage on every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('tw_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Global response error handler
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || 'Something went wrong';
    const code = error.response?.data?.code;
    const status = error.response?.status;

    // Handle token expiry — redirect to login
    if (status === 401 && (code === 'TOKEN_EXPIRED' || message.includes('expired'))) {
      localStorage.removeItem('tw_token');
      localStorage.removeItem('tw_user');
      window.location.href = '/login';
      toast.error('⏰ Session expired. Please login again.');
      return Promise.reject(error);
    }

    // Don't toast for 401 on auth routes (let the slice handle it)
    if (status === 401) return Promise.reject(error);

    return Promise.reject(error);
  }
);

export default api;
