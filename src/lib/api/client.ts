import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

// Em server-side (SSR) o axios precisa de URL absoluta.
// Em client-side, /api/v1 é suficiente (relativo ao origin).
function getBaseURL(): string {
  if (typeof window !== 'undefined') {
    // Forçar path relativo para que o Browser use o mesmo origin (wamini.co.mz)
    // Eliminando totalmente os erros ERR_SSL_VERSION_OR_CIPHER_MISMATCH
    return '/api/v1';
  }

  // 2. Em SSR (Node.js), precisa de URL absoluta (localhost)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT || 3000}`;
  return `${appUrl}/api/v1`;
}

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor - attach JWT token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Garantir que a App usa a baseURL gerada em runtime no client
    if (typeof window !== 'undefined' && !config.baseURL?.startsWith('/api/v1')) {
      config.baseURL = '/api/v1';
    }
    
    const token = getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      clearToken();
      
      // Do not redirect on profile fetch to allow anonymous access to public pages
      if (originalRequest.url !== '/users/profile' && typeof window !== 'undefined') {
        window.location.href = '/pt/auth/login';
      }
    }

    return Promise.reject(error);
  }
);

// ─── Token management ─────────────────────────────────────────────────────────
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('wamini_token');
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('wamini_token', token);
}

export function clearToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('wamini_token');
  localStorage.removeItem('wamini_user');
}

export function getStoredUser(): any | null {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('wamini_user');
  if (!userStr || userStr === 'undefined' || userStr === 'null') return null;
  
  try {
    return JSON.parse(userStr);
  } catch (err) {
    console.error('Error parsing stored user:', err);
    return null;
  }
}

export function setStoredUser(user: any): void {
  if (typeof window === 'undefined') return;
  if (user === undefined || user === null) {
    localStorage.removeItem('wamini_user');
  } else {
    localStorage.setItem('wamini_user', JSON.stringify(user));
  }
}

export default apiClient;
