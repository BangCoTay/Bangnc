import axios from 'axios';
import { tokenStorage } from './tokenStorage';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await tokenStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {}
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired — try refresh
      try {
        const refreshToken = await tokenStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE}/auth/refresh`, {
            refresh_token: refreshToken,
          });
          
          if (response.data.success) {
            const { access_token, refresh_token } = response.data.data;
            await tokenStorage.setItem('access_token', access_token);
            await tokenStorage.setItem('refresh_token', refresh_token);
            
            // Retry original request
            error.config.headers.Authorization = `Bearer ${access_token}`;
            return api(error.config);
          }
        }
      } catch {
        // Refresh failed — user needs to re-login
        await tokenStorage.removeItem('access_token');
        await tokenStorage.removeItem('refresh_token');
      }
    }
    return Promise.reject(error);
  }
);
