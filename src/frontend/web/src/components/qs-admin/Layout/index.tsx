'use client';

import { useEffect, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAdminAuthStore } from '@/stores/adminAuthStore';
import { adminApi } from '@/lib/api/admin/client';

interface QSAdminLayoutProps {
  children: React.ReactNode;
}

/**
 * Dev-mode auto-login for QS Admin.
 * In development, automatically authenticates with the dev admin wallet
 * so QS Admin pages can call protected API endpoints.
 * Returns true when auth is ready (logged in or non-dev environment).
 */
function useDevAutoLogin(): boolean {
  const { isAuthenticated, login } = useAdminAuthStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Already authenticated (e.g. from sessionStorage rehydration)
    if (isAuthenticated || adminApi.getAccessToken()) {
      setReady(true);
      return;
    }

    // Only auto-login in development
    if (process.env.NODE_ENV !== 'development') {
      setReady(true);
      return;
    }

    const DEV_WALLET = '0xe69bb031877cdf6c001bdaedc0a615b40484cdc3';
    login(DEV_WALLET, 'dev-signature', 'dev-login')
      .then(() => setReady(true))
      .catch((err) => {
        console.warn('[QSAdmin] Dev auto-login failed:', err);
        // Still render so error states are visible
        setReady(true);
      });
  }, [isAuthenticated, login]);

  return ready;
}

export function QSAdminLayout({ children }: QSAdminLayoutProps) {
  const ready = useDevAutoLogin();

  if (!ready) {
    return (
      <div className="flex h-screen bg-background items-center justify-center">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 border-2 border-hinomaru border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-foreground-secondary">Authenticating...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
