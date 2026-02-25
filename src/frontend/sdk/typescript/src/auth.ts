/**
 * Authentication Module for Quantum Shield SDK
 *
 * Implements SIWE (Sign-In with Ethereum) + JWT authentication flow.
 *
 * @module auth
 */

/**
 * SIWE Message structure (EIP-4361)
 */
export interface SIWEMessage {
  /** RFC 4501 dns authority */
  domain: string;
  /** Ethereum address performing the signing */
  address: string;
  /** Human-readable statement */
  statement: string;
  /** RFC 3986 URI */
  uri: string;
  /** Current version of the message */
  version: string;
  /** EIP-155 Chain ID */
  chainId: number;
  /** Randomized token for preventing replay attacks */
  nonce: string;
  /** ISO 8601 datetime string */
  issuedAt: string;
  /** ISO 8601 datetime string (optional) */
  expirationTime?: string;
  /** System-specific not-before time (optional) */
  notBefore?: string;
  /** System-specific request ID (optional) */
  requestId?: string;
  /** List of resources (optional) */
  resources?: string[];
}

/**
 * Authentication state
 */
export interface AuthState {
  /** Whether user is authenticated */
  isAuthenticated: boolean;
  /** JWT access token */
  accessToken: string | null;
  /** JWT refresh token */
  refreshToken: string | null;
  /** Access token expiration timestamp (ms) */
  expiresAt: number | null;
  /** Authenticated user's Ethereum address */
  address: string | null;
}

/**
 * Auth client configuration
 */
export interface AuthClientConfig {
  /** API base URL */
  apiUrl: string;
  /** Application domain for SIWE */
  domain?: string;
  /** Statement to display in SIWE message */
  statement?: string;
  /** Storage key prefix for tokens */
  storageKeyPrefix?: string;
  /** Token storage (localStorage, sessionStorage, or custom) */
  storage?: Storage | null;
  /** Auto refresh tokens before expiry (default: true) */
  autoRefresh?: boolean;
  /** Refresh tokens when this many seconds remain (default: 60) */
  refreshThreshold?: number;
  /** Request timeout in ms (default: 30000) */
  timeout?: number;
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
 * Storage keys
 */
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'qs_access_token',
  REFRESH_TOKEN: 'qs_refresh_token',
  EXPIRES_AT: 'qs_expires_at',
  ADDRESS: 'qs_address',
} as const;

/**
 * Authentication Client
 *
 * Handles SIWE authentication flow and JWT token management.
 *
 * @example
 * ```typescript
 * const authClient = new AuthClient({
 *   apiUrl: 'https://api.quantumshield.io',
 *   domain: 'app.quantumshield.io',
 * });
 *
 * // Create SIWE message
 * const message = await authClient.createSIWEMessage(address, chainId);
 *
 * // Sign message with wallet
 * const signature = await signer.signMessage(message.prepareMessage());
 *
 * // Authenticate
 * const authState = await authClient.authenticate(signature, message);
 * ```
 */
export class AuthClient {
  private config: Required<Omit<AuthClientConfig, 'storage'>> & { storage: Storage | null };
  private authState: AuthState;
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;
  private refreshPromise: Promise<AuthState> | null = null;

  constructor(config: AuthClientConfig) {
    this.config = {
      apiUrl: config.apiUrl,
      domain: config.domain ?? (typeof window !== 'undefined' ? window.location.host : 'localhost'),
      statement: config.statement ?? 'Sign in with Ethereum to Quantum Shield',
      storageKeyPrefix: config.storageKeyPrefix ?? '',
      storage: config.storage !== undefined ? config.storage : this.getDefaultStorage(),
      autoRefresh: config.autoRefresh ?? true,
      refreshThreshold: config.refreshThreshold ?? 60,
      timeout: config.timeout ?? 30000,
    };

    this.authState = this.loadAuthState();

    // Set up auto refresh if enabled
    if (this.config.autoRefresh && this.authState.isAuthenticated) {
      this.scheduleRefresh();
    }
  }

  /**
   * Get default storage (localStorage in browser, null in Node.js)
   */
  private getDefaultStorage(): Storage | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
    return null;
  }

  /**
   * Get storage key with prefix
   */
  private getStorageKey(key: string): string {
    return `${this.config.storageKeyPrefix}${key}`;
  }

  /**
   * Load auth state from storage
   */
  private loadAuthState(): AuthState {
    if (!this.config.storage) {
      return DEFAULT_AUTH_STATE;
    }

    try {
      const accessToken = this.config.storage.getItem(this.getStorageKey(STORAGE_KEYS.ACCESS_TOKEN));
      const refreshToken = this.config.storage.getItem(this.getStorageKey(STORAGE_KEYS.REFRESH_TOKEN));
      const expiresAtStr = this.config.storage.getItem(this.getStorageKey(STORAGE_KEYS.EXPIRES_AT));
      const address = this.config.storage.getItem(this.getStorageKey(STORAGE_KEYS.ADDRESS));

      const expiresAt = expiresAtStr ? parseInt(expiresAtStr, 10) : null;

      // Check if token is expired
      if (expiresAt && Date.now() >= expiresAt) {
        // Token expired, clear stored state
        this.clearStoredAuth();
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
   * Save auth state to storage
   */
  private saveAuthState(state: AuthState): void {
    if (!this.config.storage) {
      return;
    }

    try {
      if (state.isAuthenticated && state.accessToken && state.refreshToken && state.expiresAt && state.address) {
        this.config.storage.setItem(this.getStorageKey(STORAGE_KEYS.ACCESS_TOKEN), state.accessToken);
        this.config.storage.setItem(this.getStorageKey(STORAGE_KEYS.REFRESH_TOKEN), state.refreshToken);
        this.config.storage.setItem(this.getStorageKey(STORAGE_KEYS.EXPIRES_AT), state.expiresAt.toString());
        this.config.storage.setItem(this.getStorageKey(STORAGE_KEYS.ADDRESS), state.address);
      } else {
        this.clearStoredAuth();
      }
    } catch {
      // Storage access failed
    }
  }

  /**
   * Clear stored auth data
   */
  private clearStoredAuth(): void {
    if (!this.config.storage) {
      return;
    }

    try {
      this.config.storage.removeItem(this.getStorageKey(STORAGE_KEYS.ACCESS_TOKEN));
      this.config.storage.removeItem(this.getStorageKey(STORAGE_KEYS.REFRESH_TOKEN));
      this.config.storage.removeItem(this.getStorageKey(STORAGE_KEYS.EXPIRES_AT));
      this.config.storage.removeItem(this.getStorageKey(STORAGE_KEYS.ADDRESS));
    } catch {
      // Storage access failed
    }
  }

  /**
   * Make API request
   */
  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    headers?: Record<string, string>
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(`${this.config.apiUrl}${path}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
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
   * Get nonce from server
   */
  async getNonce(): Promise<string> {
    const response = await this.request<NonceResponse>('GET', '/v1/auth/nonce');
    return response.nonce;
  }

  /**
   * Create a SIWE message for the given address and chain
   *
   * @param address - Ethereum address
   * @param chainId - EIP-155 chain ID
   * @returns SIWE message ready for signing
   */
  async createSIWEMessage(address: string, chainId: number): Promise<SIWEMessage> {
    const nonce = await this.getNonce();
    const issuedAt = new Date().toISOString();

    return {
      domain: this.config.domain,
      address,
      statement: this.config.statement,
      uri: typeof window !== 'undefined' ? window.location.origin : `https://${this.config.domain}`,
      version: '1',
      chainId,
      nonce,
      issuedAt,
    };
  }

  /**
   * Prepare SIWE message for signing (EIP-4361 format)
   *
   * @param message - SIWE message object
   * @returns Formatted message string for wallet signing
   */
  prepareSIWEMessage(message: SIWEMessage): string {
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
   * Authenticate with SIWE signature
   *
   * @param signature - Signed SIWE message (hex)
   * @param message - Original SIWE message
   * @returns Updated auth state
   */
  async authenticate(signature: string, message: SIWEMessage): Promise<AuthState> {
    const response = await this.request<TokenResponse>('POST', '/v1/auth/siwe', {
      message: this.prepareSIWEMessage(message),
      signature,
    });

    const expiresAt = Date.now() + response.expiresIn * 1000;

    this.authState = {
      isAuthenticated: true,
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      expiresAt,
      address: message.address,
    };

    this.saveAuthState(this.authState);

    if (this.config.autoRefresh) {
      this.scheduleRefresh();
    }

    return this.authState;
  }

  /**
   * Refresh tokens using refresh token
   *
   * @returns Updated auth state
   */
  async refreshTokens(): Promise<AuthState> {
    // Deduplicate concurrent refresh calls
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    if (!this.authState.refreshToken) {
      throw new Error('No refresh token available');
    }

    this.refreshPromise = (async () => {
      try {
        const response = await this.request<TokenResponse>(
          'POST',
          '/v1/auth/refresh',
          { refreshToken: this.authState.refreshToken }
        );

        const expiresAt = Date.now() + response.expiresIn * 1000;

        this.authState = {
          ...this.authState,
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
          expiresAt,
        };

        this.saveAuthState(this.authState);

        if (this.config.autoRefresh) {
          this.scheduleRefresh();
        }

        return this.authState;
      } catch (error) {
        // Refresh failed, clear auth state
        this.logout();
        throw error;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  /**
   * Schedule automatic token refresh
   */
  private scheduleRefresh(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }

    if (!this.authState.expiresAt) {
      return;
    }

    const now = Date.now();
    const refreshTime = this.authState.expiresAt - this.config.refreshThreshold * 1000;
    const delay = Math.max(0, refreshTime - now);

    this.refreshTimer = setTimeout(async () => {
      try {
        await this.refreshTokens();
      } catch {
        // Refresh failed, user will be logged out
      }
    }, delay);
  }

  /**
   * Get current access token
   *
   * @returns Access token or null if not authenticated
   */
  getAccessToken(): string | null {
    return this.authState.accessToken;
  }

  /**
   * Get authorization header value
   *
   * @returns Bearer token header value or null
   */
  getAuthorizationHeader(): string | null {
    if (!this.authState.accessToken) {
      return null;
    }
    return `Bearer ${this.authState.accessToken}`;
  }

  /**
   * Get current auth state
   *
   * @returns Current authentication state
   */
  getAuthState(): AuthState {
    return { ...this.authState };
  }

  /**
   * Check if currently authenticated
   *
   * @returns Whether user is authenticated with valid token
   */
  isAuthenticated(): boolean {
    if (!this.authState.isAuthenticated || !this.authState.expiresAt) {
      return false;
    }
    return Date.now() < this.authState.expiresAt;
  }

  /**
   * Log out and clear tokens
   */
  logout(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }

    this.authState = DEFAULT_AUTH_STATE;
    this.clearStoredAuth();
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }
}
