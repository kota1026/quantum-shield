/**
 * QS Admin Authentication Store
 *
 * Zustand store for managing admin authentication state
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { adminApi } from '@/lib/api/admin/client';
import type { AdminUser, LoginResponse } from '@/lib/api/admin/types';

interface AdminAuthState {
  // State
  user: AdminUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (walletAddress: string, signature: string, message: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<void>;
  clearError: () => void;
  setUser: (user: AdminUser | null) => void;
}

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Login action
      login: async (walletAddress: string, signature: string, message: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await adminApi.post<LoginResponse>('/api/admin/auth/login', {
            walletAddress,
            signature,
            message,
          });

          // Set tokens in API client
          adminApi.setAccessToken(response.accessToken);
          adminApi.setRefreshToken(response.refreshToken);

          set({
            user: response.user,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Login failed';
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: message,
          });
          throw error;
        }
      },

      // Logout action
      logout: async () => {
        const { accessToken } = get();

        try {
          if (accessToken) {
            await adminApi.post('/api/admin/auth/logout');
          }
        } catch {
          // Ignore logout errors
        } finally {
          // Clear tokens from API client
          adminApi.setAccessToken(null);
          adminApi.setRefreshToken(null);

          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      // Refresh token action
      refreshAccessToken: async () => {
        const { refreshToken } = get();

        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        try {
          const response = await adminApi.post<{ accessToken: string; expiresIn: number }>(
            '/api/admin/auth/refresh',
            { refreshToken }
          );

          adminApi.setAccessToken(response.accessToken);

          set({
            accessToken: response.accessToken,
          });
        } catch (error) {
          // Clear auth state on refresh failure
          adminApi.setAccessToken(null);
          adminApi.setRefreshToken(null);

          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            error: 'Session expired. Please login again.',
          });
          throw error;
        }
      },

      // Clear error
      clearError: () => {
        set({ error: null });
      },

      // Set user (for profile updates)
      setUser: (user: AdminUser | null) => {
        set({ user });
      },
    }),
    {
      name: 'qs-admin-auth',
      storage: createJSONStorage(() => {
        // Use sessionStorage for better security
        if (typeof window !== 'undefined') {
          return sessionStorage;
        }
        // Return a no-op storage for SSR
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }),
      partialize: (state) => ({
        // Only persist these fields
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // Restore tokens to API client after rehydration
        if (state?.accessToken) {
          adminApi.setAccessToken(state.accessToken);
        }
        if (state?.refreshToken) {
          adminApi.setRefreshToken(state.refreshToken);
        }
      },
    }
  )
);

// Setup unauthorized handler
if (typeof window !== 'undefined') {
  adminApi.setOnUnauthorized(() => {
    const { logout } = useAdminAuthStore.getState();
    logout();
  });
}

// Selector hooks for common use cases
export const useAdminUser = () => useAdminAuthStore((state) => state.user);
export const useIsAdminAuthenticated = () => useAdminAuthStore((state) => state.isAuthenticated);
export const useAdminAuthLoading = () => useAdminAuthStore((state) => state.isLoading);
export const useAdminAuthError = () => useAdminAuthStore((state) => state.error);
