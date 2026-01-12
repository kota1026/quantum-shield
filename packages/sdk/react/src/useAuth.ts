/**
 * React Hook for Quantum Shield Authentication
 *
 * Provides reactive authentication state management with SIWE + JWT flow.
 *
 * @module useAuth
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuantumShieldContext } from './QuantumShieldProvider';

/**
 * SIWE Message structure (EIP-4361)
 */
export interface SIWEMessage {
  domain: string;
  address: string;
  statement: string;
  uri: string;
  version: string;
  chainId: number;
  nonce: string;
  issuedAt: string;
  expirationTime?: string;
  notBefore?: string;
  requestId?: string;
  resources?: string[];
}

/**
 * Authentication state
 */
export interface AuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  address: string | null;
}

/**
 * Token response from API
 */
interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Nonce response from API
 */
interface NonceResponse {
  nonce: string;
}

/**
 * Auth hook configuration
 */
export interface UseAuthConfig {
  /** API base URL (defaults to context apiUrl) */
  apiUrl?: string;
  /** Application domain for SIWE */
  domain?: string;
  /** Statement to display in SIWE message */
  statement?: string;
  /** Auto refresh tokens before expiry */
  autoRefresh?: boolean;
  /** Refresh tokens when this many seconds remain */
  refreshThreshold?: number;
  /** Request timeout in ms */
  timeout?: number;
}

/**
 * UseAuth return type
 */
export interface UseAuthReturn {
  /** Whether user is authenticated */
  isAuthenticated: boolean;
  /** Whether authentication is in progress */
  isAuthenticating: boolean;
  /** Authentication error */
  authError: Error | null;
  /** Authenticated address */
  address: string | null;
  /** JWT access token */
  accessToken: string | null;
  /** Token expiration timestamp (ms) */
  expiresAt: number | null;

  /** Sign in with connected wallet */
  signIn: () => Promise<void>;
  /** Sign out and clear tokens */
  signOut: () => void;
  /** Manually refresh tokens */
  refreshAuth: () => Promise<void>;
  /** Get authorization header value */
  getAuthorizationHeader: () => string | null;
}

/**
 * Storage keys
 */
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'qs_access_token',
  REFRESH_TOKEN: 'qs_refresh_token',
  EXPIRES_AT: 'qs_expires_at',
  ADDRESS: 'qs_address',
} as const;

/**
 * Default auth state
 */
const DEFAULT_AUTH_STATE: AuthState = {
  isAuthenticated: false,
  accessToken: null,
  refreshToken: null,
  expiresAt: null,
  address: null,
};

/**
 * Prepare SIWE message for signing (EIP-4361 format)
 */
function prepareSIWEMessage(message: SIWEMessage): string {
  const lines: string[] = [
    `${message.domain} wants you to sign in with your Ethereum account:`,
    message.address,
    '',
    message.statement,
    '',
    `URI: ${message.uri}`,
    `Version: ${message.version}`,
    `Chain ID: ${message.chainId}`,
    `Nonce: ${message.nonce}`,
    `Issued At: ${message.issuedAt}`,
  ];

  if (message.expirationTime) {
    lines.push(`Expiration Time: ${message.expirationTime}`);
  }

  if (message.notBefore) {
    lines.push(`Not Before: ${message.notBefore}`);
  }

  if (message.requestId) {
    lines.push(`Request ID: ${message.requestId}`);
  }

  if (message.resources && message.resources.length > 0) {
    lines.push('Resources:');
    for (const resource of message.resources) {
      lines.push(`- ${resource}`);
    }
  }

  return lines.join('\n');
}

/**
 * React hook for authentication with SIWE + JWT
 *
 * @example
 * ```tsx
 * function App() {
 *   const { isAuthenticated, signIn, signOut, address } = useAuth();
 *
 *   if (!isAuthenticated) {
 *     return <button onClick={signIn}>Sign In</button>;
 *   }
 *
 *   return (
 *     <div>
 *       <p>Connected: {address}</p>
 *       <button onClick={signOut}>Sign Out</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useAuth(config: UseAuthConfig = {}): UseAuthReturn {
  const context = useQuantumShieldContext();

  // Extract config from context
  const contextConfig = context.client as { config?: { apiUrl?: string } } | null;
  const apiUrl = config.apiUrl ?? contextConfig?.config?.apiUrl ?? '';
  const domain = config.domain ?? (typeof window !== 'undefined' ? window.location.host : 'localhost');
  const statement = config.statement ?? 'Sign in with Ethereum to Quantum Shield';
  const autoRefresh = config.autoRefresh ?? true;
  const refreshThreshold = config.refreshThreshold ?? 60;
  const timeout = config.timeout ?? 30000;

  const [authState, setAuthState] = useState<AuthState>(() => loadAuthState());
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<Error | null>(null);

  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshPromiseRef = useRef<Promise<void> | null>(null);

  /**
   * Load auth state from localStorage
   */
  function loadAuthState(): AuthState {
    if (typeof window === 'undefined') {
      return DEFAULT_AUTH_STATE;
    }

    try {
      const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      const expiresAtStr = localStorage.getItem(STORAGE_KEYS.EXPIRES_AT);
      const address = localStorage.getItem(STORAGE_KEYS.ADDRESS);

      const expiresAt = expiresAtStr ? parseInt(expiresAtStr, 10) : null;

      // Check if token is expired
      if (expiresAt && Date.now() >= expiresAt) {
        clearStoredAuth();
        return DEFAULT_AUTH_STATE;
      }

      if (accessToken && refreshToken && expiresAt && address) {
        return {
          isAuthenticated: true,
          accessToken,
          refreshToken,
          expiresAt,
          address,
        };
      }
    } catch {
      // Storage access failed
    }

    return DEFAULT_AUTH_STATE;
  }

  /**
   * Save auth state to localStorage
   */
  function saveAuthState(state: AuthState): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      if (state.isAuthenticated && state.accessToken && state.refreshToken && state.expiresAt && state.address) {
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, state.accessToken);
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, state.refreshToken);
        localStorage.setItem(STORAGE_KEYS.EXPIRES_AT, state.expiresAt.toString());
        localStorage.setItem(STORAGE_KEYS.ADDRESS, state.address);
      } else {
        clearStoredAuth();
      }
    } catch {
      // Storage access failed
    }
  }

  /**
   * Clear stored auth data
   */
  function clearStoredAuth(): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.EXPIRES_AT);
      localStorage.removeItem(STORAGE_KEYS.ADDRESS);
    } catch {
      // Storage access failed
    }
  }

  /**
   * Make API request
   */
  async function request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(`${apiUrl}${path}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      const json = await response.json() as { success: boolean; data?: T; error?: { message: string } };

      if (!response.ok || !json.success) {
        throw new Error(json.error?.message ?? `API error: ${response.status}`);
      }

      return json.data as T;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Schedule automatic token refresh
   */
  const scheduleRefresh = useCallback((expiresAt: number) => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }

    const now = Date.now();
    const refreshTime = expiresAt - refreshThreshold * 1000;
    const delay = Math.max(0, refreshTime - now);

    refreshTimerRef.current = setTimeout(() => {
      refreshAuth().catch(() => {
        // Refresh failed, will be handled by the function
      });
    }, delay);
  }, [refreshThreshold]);

  /**
   * Refresh authentication tokens
   */
  const refreshAuth = useCallback(async (): Promise<void> => {
    // Deduplicate concurrent refresh calls
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    if (!authState.refreshToken) {
      throw new Error('No refresh token available');
    }

    refreshPromiseRef.current = (async () => {
      try {
        const response = await request<TokenResponse>(
          'POST',
          '/v1/auth/refresh',
          { refreshToken: authState.refreshToken }
        );

        const expiresAt = Date.now() + response.expiresIn * 1000;

        const newState: AuthState = {
          ...authState,
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
          expiresAt,
        };

        setAuthState(newState);
        saveAuthState(newState);

        if (autoRefresh) {
          scheduleRefresh(expiresAt);
        }
      } catch (error) {
        // Refresh failed, sign out
        signOut();
        throw error;
      } finally {
        refreshPromiseRef.current = null;
      }
    })();

    return refreshPromiseRef.current;
  }, [authState, autoRefresh, scheduleRefresh]);

  /**
   * Sign in with connected wallet
   */
  const signIn = useCallback(async (): Promise<void> => {
    if (!context.walletState.connected || !context.walletState.address) {
      throw new Error('Wallet not connected. Connect wallet first.');
    }

    setIsAuthenticating(true);
    setAuthError(null);

    try {
      // Get nonce from server
      const { nonce } = await request<NonceResponse>('GET', '/v1/auth/nonce');

      // Create SIWE message
      const message: SIWEMessage = {
        domain,
        address: context.walletState.address,
        statement,
        uri: typeof window !== 'undefined' ? window.location.origin : `https://${domain}`,
        version: '1',
        chainId: context.walletState.chainId ?? 1,
        nonce,
        issuedAt: new Date().toISOString(),
      };

      const messageString = prepareSIWEMessage(message);

      // Sign message with wallet
      // Note: This requires wallet integration - using a placeholder for now
      // In production, this would use ethers.js or web3.js to sign
      const signer = context.walletState.signer as { signMessage?: (msg: string) => Promise<string> } | null;
      if (!signer?.signMessage) {
        throw new Error('Wallet signer not available');
      }

      const signature = await signer.signMessage(messageString);

      // Authenticate with server
      const response = await request<TokenResponse>('POST', '/v1/auth/siwe', {
        message: messageString,
        signature,
      });

      const expiresAt = Date.now() + response.expiresIn * 1000;

      const newState: AuthState = {
        isAuthenticated: true,
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        expiresAt,
        address: context.walletState.address,
      };

      setAuthState(newState);
      saveAuthState(newState);

      if (autoRefresh) {
        scheduleRefresh(expiresAt);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Authentication failed');
      setAuthError(err);
      throw err;
    } finally {
      setIsAuthenticating(false);
    }
  }, [context.walletState, domain, statement, autoRefresh, scheduleRefresh]);

  /**
   * Sign out and clear tokens
   */
  const signOut = useCallback((): void => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }

    setAuthState(DEFAULT_AUTH_STATE);
    clearStoredAuth();
    setAuthError(null);
  }, []);

  /**
   * Get authorization header value
   */
  const getAuthorizationHeader = useCallback((): string | null => {
    if (!authState.accessToken) {
      return null;
    }
    return `Bearer ${authState.accessToken}`;
  }, [authState.accessToken]);

  // Set up auto refresh on mount if authenticated
  useEffect(() => {
    if (autoRefresh && authState.isAuthenticated && authState.expiresAt) {
      scheduleRefresh(authState.expiresAt);
    }

    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [autoRefresh, authState.isAuthenticated, authState.expiresAt, scheduleRefresh]);

  // Sign out when wallet disconnects
  useEffect(() => {
    if (!context.walletState.connected && authState.isAuthenticated) {
      signOut();
    }
  }, [context.walletState.connected, authState.isAuthenticated, signOut]);

  return {
    isAuthenticated: authState.isAuthenticated,
    isAuthenticating,
    authError,
    address: authState.address,
    accessToken: authState.accessToken,
    expiresAt: authState.expiresAt,

    signIn,
    signOut,
    refreshAuth,
    getAuthorizationHeader,
  };
}
