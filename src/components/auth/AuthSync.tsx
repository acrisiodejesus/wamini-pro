'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/lib/api/services/auth';
import { clearToken } from '@/lib/api/client';

export default function AuthSync() {
  useEffect(() => {
    async function syncAuth() {
      try {
        const profile = await authService.getCurrentUser();
        if (profile) {
          const { user, login } = useAuthStore.getState();
          if (!user || user.id !== profile.id?.toString()) {
            login(profile as any, 'auth0-session');
          }
        }
      } catch (err: any) {
        if (err?.response?.status === 401) {
          const { user, logout } = useAuthStore.getState();
          if (user) {
            logout();
            clearToken();
          }
        }
      }
    }

    syncAuth();
  }, []);

  return null;
}
