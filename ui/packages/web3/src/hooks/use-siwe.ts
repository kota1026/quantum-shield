import * as React from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { SiweMessage } from 'siwe';

export interface SIWESession {
  address: string;
  chainId: number;
  issuedAt: string;
  expirationTime: string;
}

export type SessionStorageType = 'localStorage' | 'sessionStorage' | 'memory';

export interface UseSIWEOptions {
  /** API endpoint to fetch nonce */
  nonceEndpoint?: string;
  /** API endpoint to verify signature */
  verifyEndpoint?: string;
  /** Session storage key */
  storageKey?: string;
  /**
   * Storage type for session
   * - 'localStorage': Persists across tabs/windows, survives browser close (default for convenience)
   * - 'sessionStorage': Per-tab only, cleared on tab close (more secure)
   * - 'memory': In-memory only, cleared on page refresh (most secure)
   * 
   * Security note: localStorage is vulnerable to XSS. For production with high security
   * requirements, consider using httpOnly cookies via server-side session management.
   * 
   * Future enhancement: Dilithium-signed SIWE when browser support is available
   * (currently uses Ethereum ECDSA which is not quantum-resistant, but this is
   * acceptable as SIWE is for web session auth, not asset protection).
   */
  storageType?: SessionStorageType;
  /** Session duration in milliseconds (default: 7 days) */
  sessionDuration?: number;
}

// In-memory storage for 'memory' mode
const memoryStorage = new Map<string, string>();

function getStorage(type: SessionStorageType): {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
} {
  switch (type) {
    case 'sessionStorage':
      return {
        getItem: (key) => sessionStorage.getItem(key),
        setItem: (key, value) => sessionStorage.setItem(key, value),
        removeItem: (key) => sessionStorage.removeItem(key),
      };
    case 'memory':
      return {
        getItem: (key) => memoryStorage.get(key) ?? null,
        setItem: (key, value) => memoryStorage.set(key, value),
        removeItem: (key) => memoryStorage.delete(key),
      };
    case 'localStorage':
    default:
      return {
        getItem: (key) => localStorage.getItem(key),
        setItem: (key, value) => localStorage.setItem(key, value),
        removeItem: (key) => localStorage.removeItem(key),
      };
  }
}

export function useSIWE(options: UseSIWEOptions = {}) {
  const {
    nonceEndpoint = '/api/auth/siwe/nonce',
    verifyEndpoint = '/api/auth/siwe/verify',
    storageKey = 'qs_siwe_session',
    storageType = 'localStorage',
    sessionDuration = 7 * 24 * 60 * 60 * 1000, // 7 days
  } = options;

  const storage = React.useMemo(() => getStorage(storageType), [storageType]);

  const { address, chainId, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const [session, setSession] = React.useState<SIWESession | null>(null);
  const [isSigningIn, setIsSigningIn] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  // Load session from storage on mount
  React.useEffect(() => {
    const stored = storage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as SIWESession;
        // Check if session is expired
        if (new Date(parsed.expirationTime) > new Date()) {
          setSession(parsed);
        } else {
          storage.removeItem(storageKey);
        }
      } catch {
        storage.removeItem(storageKey);
      }
    }
  }, [storageKey, storage]);

  const signIn = React.useCallback(async () => {
    if (!address || !chainId) {
      throw new Error('Wallet not connected');
    }

    setIsSigningIn(true);
    setError(null);

    try {
      // Fetch nonce from server
      const nonceResponse = await fetch(nonceEndpoint);
      if (!nonceResponse.ok) {
        throw new Error('Failed to fetch nonce');
      }
      const { nonce } = await nonceResponse.json();

      const issuedAt = new Date().toISOString();
      const expirationTime = new Date(Date.now() + sessionDuration).toISOString();

      // Create SIWE message
      // Note: SIWE uses Ethereum ECDSA signature which is not quantum-resistant.
      // This is acceptable for web session authentication as it protects UI access,
      // not assets. Asset operations require Dilithium signatures on L1/L3.
      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: 'Sign in to Quantum Shield',
        uri: window.location.origin,
        version: '1',
        chainId,
        nonce,
        issuedAt,
        expirationTime,
      });

      // Sign message with wallet (ECDSA)
      const signature = await signMessageAsync({
        message: message.prepareMessage(),
      });

      // Verify signature with server
      const verifyResponse = await fetch(verifyEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message.toMessage(),
          signature,
        }),
      });

      if (!verifyResponse.ok) {
        throw new Error('Signature verification failed');
      }

      const newSession: SIWESession = {
        address,
        chainId,
        issuedAt,
        expirationTime,
      };

      setSession(newSession);
      storage.setItem(storageKey, JSON.stringify(newSession));

      return newSession;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Sign in failed');
      setError(error);
      throw error;
    } finally {
      setIsSigningIn(false);
    }
  }, [address, chainId, nonceEndpoint, verifyEndpoint, signMessageAsync, storageKey, storage, sessionDuration]);

  const signOut = React.useCallback(() => {
    setSession(null);
    storage.removeItem(storageKey);
  }, [storageKey, storage]);

  // Auto sign out if wallet disconnects or changes
  React.useEffect(() => {
    if (!isConnected || (session && session.address !== address)) {
      signOut();
    }
  }, [isConnected, address, session, signOut]);

  return {
    session,
    isSignedIn: !!session,
    isSigningIn,
    error,
    signIn,
    signOut,
    /** Currently using ECDSA (Ethereum standard). Dilithium SIWE planned for future. */
    signatureType: 'ECDSA' as const,
  };
}
