import * as React from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { SiweMessage } from 'siwe';

export interface SIWESession {
  address: string;
  chainId: number;
  issuedAt: string;
  expirationTime: string;
}

export interface UseSIWEOptions {
  /** API endpoint to fetch nonce */
  nonceEndpoint?: string;
  /** API endpoint to verify signature */
  verifyEndpoint?: string;
  /** Session storage key */
  storageKey?: string;
}

export function useSIWE(options: UseSIWEOptions = {}) {
  const {
    nonceEndpoint = '/api/auth/siwe/nonce',
    verifyEndpoint = '/api/auth/siwe/verify',
    storageKey = 'qs_siwe_session',
  } = options;

  const { address, chainId, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const [session, setSession] = React.useState<SIWESession | null>(null);
  const [isSigningIn, setIsSigningIn] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  // Load session from storage on mount
  React.useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as SIWESession;
        // Check if session is expired
        if (new Date(parsed.expirationTime) > new Date()) {
          setSession(parsed);
        } else {
          localStorage.removeItem(storageKey);
        }
      } catch {
        localStorage.removeItem(storageKey);
      }
    }
  }, [storageKey]);

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

      // Create SIWE message
      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: 'Sign in to Quantum Shield',
        uri: window.location.origin,
        version: '1',
        chainId,
        nonce,
        issuedAt: new Date().toISOString(),
        expirationTime: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
        ).toISOString(),
      });

      // Sign message
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
        issuedAt: message.issuedAt!,
        expirationTime: message.expirationTime!,
      };

      setSession(newSession);
      localStorage.setItem(storageKey, JSON.stringify(newSession));

      return newSession;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Sign in failed');
      setError(error);
      throw error;
    } finally {
      setIsSigningIn(false);
    }
  }, [address, chainId, nonceEndpoint, verifyEndpoint, signMessageAsync, storageKey]);

  const signOut = React.useCallback(() => {
    setSession(null);
    localStorage.removeItem(storageKey);
  }, [storageKey]);

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
  };
}
