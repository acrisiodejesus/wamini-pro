import apiClient, { setToken, clearToken, setStoredUser, getStoredUser } from '../client';
import type { LoginData, RegisterData, AuthResponse, UserProfile, RegisterResponse } from '../types';

export const authService = {
  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<RegisterResponse> {
    try {
      const response = await apiClient.post<RegisterResponse>('/users/register', data);
      return response.data;
    } catch (error: any) {
      console.error('Error during registration:', error);
      throw error;
    }
  },

  /**
   * Login user
   */
  async login(data: LoginData): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/users/login', data);
      const authData = response.data;

      if (authData.access_token) {
        setToken(authData.access_token);
        setStoredUser(authData.user);
      }

      return authData;
    } catch (error: any) {
      console.error('Error during login:', error);
      throw error;
    }
  },

  /**
   * Logout user
   */
  logout(): void {
    clearToken();
  },

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<UserProfile> {
    try {
      const response = await apiClient.get<UserProfile>('/users/profile');
      setStoredUser(response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching current user:', error);
      throw error;
    }
  },

  /**
   * Get stored user from localStorage
   */
  getStoredUser(): UserProfile | null {
    return getStoredUser();
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!getStoredUser();
  },
};
