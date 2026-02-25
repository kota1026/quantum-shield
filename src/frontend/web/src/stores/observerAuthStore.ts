/**
 * Observer Portal Authentication Store
 *
 * Zustand store for managing observer authentication state with SIWE (Sign-In with Ethereum)
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { observerApi, type ObserverUserInfo } from '@/lib/api/observer/client';

interface ObserverAuthState {
  // State
  user: ObserverUserInfo | null;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  authenticateSiwe: (message: string, signature: string, publicKey: string) => Promise<void>;
  logout: () => void;
  refreshAccessToken: () => Promise<void>;
  clearError: () => void;
  checkAndRefreshToken: () => Promise<void>;
}

export const useObserverAuthStore = create<ObserverAuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // SIWE Authentication
      authenticateSiwe: async (message: string, signature: string, publicKey: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await observerApi.authenticateSiwe({
            message,
            signature,
            public_key: publicKey,
          });

          // Set token in API client
          observerApi.setAccessToken(response.access_token);
          observerApi.setRefreshToken(response.refresh_token);

          set({
            user: { address: response.address, created_at: new Date().toISOString() },
            accessToken: response.access_token,
            refreshToken: response.refresh_token,
            expiresAt: response.expires_at,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Authentication failed';
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            expiresAt: null,
            isAuthenticated: false,
            isLoading: false,
            error: message,
          });
          throw error;
        }
      },

      // Logout
      logout: () => {
        observerApi.setAccessToken(null);
        observerApi.setRefreshToken(null);

        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          expiresAt: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      },

      // Refresh access token
      refreshAccessToken: async () => {
        const { refreshToken } = get();

        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        try {
          const response = await observerApi.refreshAccessToken(refreshToken);

          observerApi.setAccessToken(response.access_token);

          set({
            accessToken: response.access_token,
            expiresAt: response.expires_at,
          });
        } catch (error) {
          // Clear auth state on refresh failure
          observerApi.setAccessToken(null);
          observerApi.setRefreshToken(null);

          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            expiresAt: null,
            isAuthenticated: false,
            error: 'Session expired. Please login again.',
          });
          throw error;
        }
      },

      // Check if token is about to expire and refresh if needed
      checkAndRefreshToken: async () => {
        const { expiresAt, refreshToken, refreshAccessToken } = get();

        if (!expiresAt || !refreshToken) return;

        // Refresh if token expires in less than 5 minutes
        const now = Math.floor(Date.now() / 1000);
        const fiveMinutes = 5 * 60;

        if (expiresAt - now < fiveMinutes) {
          await refreshAccessToken();
        }
      },

      // Clear error
      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'observer-auth',
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
        expiresAt: state.expiresAt,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // Restore tokens to API client after rehydration
        if (state?.accessToken) {
          observerApi.setAccessToken(state.accessToken);
        }
        if (state?.refreshToken) {
          observerApi.setRefreshToken(state.refreshToken);
        }
      },
    }
  )
);

// Setup unauthorized handler
if (typeof window !== 'undefined') {
  observerApi.setOnUnauthorized(() => {
    const { logout } = useObserverAuthStore.getState();
    logout();
  });
}

// Selector hooks for common use cases
export const useObserverUser = () => useObserverAuthStore((state) => state.user);
export const useIsObserverAuthenticated = () => useObserverAuthStore((state) => state.isAuthenticated);
export const useObserverAuthLoading = () => useObserverAuthStore((state) => state.isLoading);
export const useObserverAuthError = () => useObserverAuthStore((state) => state.error);
