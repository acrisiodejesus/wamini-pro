'use client';

import { useState, useEffect, useCallback } from 'react';
import { authService } from '@/lib/api/services/auth';
import type { User, LoginData, RegisterData } from '@/lib/api/types';
import { useAuthStore } from '@/stores/authStore';
import { getToken } from '@/lib/api/client';

interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { login: storeLogin, logout: storeLogout, updateUser: storeUpdateUser } = useAuthStore();

  // Initialize auth state from localStorage
  useEffect(() => {
    const storedUser = authService.getStoredUser();
    const token = getToken();
    if (storedUser) {
      setUser(storedUser);
      // Sync with global store if needed
      if (token && !useAuthStore.getState().isAuthenticated) {
        storeLogin(storedUser as any, token);
      }
    }
    setIsLoading(false);
  }, [storeLogin]);

  // Login
  const login = useCallback(async (data: LoginData) => {
    setIsLoading(true);
    setError(null);
    try {
      const authResponse = await authService.login(data);
      // Fetch full profile to get all fields
      const fullUser = await authService.getCurrentUser();
      
      // Update local and global states
      setUser(fullUser);
      storeLogin(fullUser as any, authResponse.access_token);
      
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Login failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Register
  const register = useCallback(async (data: RegisterData) => {
    setIsLoading(true);
    setError(null);
    try {
      await authService.register(data);
      // Register response only has user_id
      // User needs to login after registration
      // So we don't set user here, registration page should redirect to login
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Registration failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout
  const logout = useCallback(() => {
    authService.logout();
    storeLogout(); // Sync global store
    setUser(null);
  }, [storeLogout]);

  // Refresh user data
  const refreshUser = useCallback(async () => {
    if (!authService.isAuthenticated()) return;

    setIsLoading(true);
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      storeUpdateUser(currentUser as any); // Sync global store
    } catch (err: any) {
      console.error('Failed to refresh user:', err);
      // If refresh fails, logout
      logout();
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    register,
    logout,
    refreshUser,
  };
}
