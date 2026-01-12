/**
 * Unlock Hook
 *
 * @module useUnlock
 */

import { useState, useCallback } from 'react';
import { useQuantumShieldContext } from './QuantumShieldProvider';

export type UnlockType = 'normal' | 'emergency';

export interface UnlockRequestData {
  lockId: string;
  type: UnlockType;
  recipient: string;
  signature: string;
}

export interface UnlockResponse {
  unlockId: string;
  txHash: string;
  timelockExpiry: number;
  status: string;
}

export interface UseUnlockReturn {
  /** Execute unlock operation */
  unlock: (request: UnlockRequestData) => Promise<UnlockResponse | null>;
  /** Create and sign unlock request */
  createSignedUnlock: (
    lockId: string,
    type: UnlockType,
    recipient: string,
    nonce: number
  ) => UnlockRequestData | null;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
  /** Last unlock response */
  lastUnlock: UnlockResponse | null;
  /** Reset state */
  reset: () => void;
}

/**
 * Hook for unlock operations
 */
export function useUnlock(): UseUnlockReturn {
  const { keyPair, isInitialized } = useQuantumShieldContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUnlock, setLastUnlock] = useState<UnlockResponse | null>(null);

  const createSignedUnlock = useCallback(
    (
      lockId: string,
      type: UnlockType,
      recipient: string,
      _nonce: number
    ): UnlockRequestData | null => {
      if (!keyPair) {
        return null;
      }

      // Placeholder - in production would sign with Dilithium
      return {
        lockId,
        type,
        recipient,
        signature: `sig_${lockId}_${Date.now()}`,
      };
    },
    [keyPair]
  );

  const unlock = useCallback(
    async (request: UnlockRequestData): Promise<UnlockResponse | null> => {
      if (!isInitialized) {
        setError(new Error('SDK not initialized'));
        return null;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Placeholder implementation
        const response: UnlockResponse = {
          unlockId: `unlock_${Date.now()}`,
          txHash: `0x${Math.random().toString(16).slice(2)}`,
          timelockExpiry: Date.now() + 24 * 60 * 60 * 1000, // 24h
          status: 'pending',
        };
        setLastUnlock(response);
        return response;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unlock failed');
        setError(error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [isInitialized]
  );

  const reset = useCallback(() => {
    setError(null);
    setLastUnlock(null);
  }, []);

  return { unlock, createSignedUnlock, isLoading, error, lastUnlock, reset };
}
