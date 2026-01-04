/**
 * Unlock Hook
 *
 * @module useUnlock
 */

import { useState, useCallback } from 'react';
import { useQuantumShieldContext } from './QuantumShieldProvider';
import type { UnlockRequestData, UnlockResponse, UnlockType } from '@quantum-shield/sdk';

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
 *
 * @example
 * ```tsx
 * function UnlockComponent({ lockId }: { lockId: string }) {
 *   const { unlock, createSignedUnlock, isLoading, error } = useUnlock();
 *   const { keyPair, walletState } = useQuantumShield();
 *
 *   const handleUnlock = async () => {
 *     if (!keyPair || !walletState.address) return;
 *
 *     const request = createSignedUnlock(
 *       lockId,
 *       'normal',
 *       walletState.address,
 *       Date.now()
 *     );
 *
 *     if (request) {
 *       await unlock(request);
 *     }
 *   };
 *
 *   return (
 *     <button onClick={handleUnlock} disabled={isLoading}>
 *       {isLoading ? 'Unlocking...' : 'Unlock'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useUnlock(): UseUnlockReturn {
  const { client, crypto, keyPair, isInitialized } = useQuantumShieldContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUnlock, setLastUnlock] = useState<UnlockResponse | null>(null);

  const createSignedUnlock = useCallback(
    (
      lockId: string,
      type: UnlockType,
      recipient: string,
      nonce: number
    ): UnlockRequestData | null => {
      if (!client || !keyPair) {
        return null;
      }

      const signature = client.signUnlockMessage(
        keyPair.secretKey,
        lockId,
        recipient,
        nonce
      );

      return {
        lockId,
        type,
        recipient,
        signature,
      };
    },
    [client, keyPair]
  );

  const unlock = useCallback(
    async (request: UnlockRequestData): Promise<UnlockResponse | null> => {
      if (!isInitialized || !client) {
        setError(new Error('SDK not initialized'));
        return null;
      }

      try {
        setIsLoading(true);
        setError(null);

        const response = await client.unlock(request);
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
    [client, isInitialized]
  );

  const reset = useCallback(() => {
    setError(null);
    setLastUnlock(null);
  }, []);

  return { unlock, createSignedUnlock, isLoading, error, lastUnlock, reset };
}
