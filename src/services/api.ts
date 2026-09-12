import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

const api = axios.create({
  baseURL: 'https://wamini-api.onrender.com/api', // Base URL from Postman docs
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 401 (Unauthorized) - Token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      // Here we would implement refresh token logic if the API supports it
      // For now, we might just logout or try to refresh if there's a refresh endpoint
      // const refreshToken = useAuthStore.getState().refreshToken;
      // if (refreshToken) { ... }
      
      // If refresh fails or not implemented:
      useAuthStore.getState().logout();
    }
    
    return Promise.reject(error);
  }
);

export default api;
