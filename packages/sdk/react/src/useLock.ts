/**
 * Lock Hook
 *
 * @module useLock
 */

import { useState, useCallback } from 'react';
import { useQuantumShieldContext } from './QuantumShieldProvider';
import type { LockRequest, LockResponse } from '@quantum-shield/sdk';

export interface UseLockReturn {
  /** Execute lock operation */
  lock: (request: LockRequest) => Promise<LockResponse | null>;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
  /** Last lock response */
  lastLock: LockResponse | null;
  /** Reset state */
  reset: () => void;
}

/**
 * Hook for lock operations
 *
 * @example
 * ```tsx
 * function LockComponent() {
 *   const { lock, isLoading, error } = useLock();
 *   const { keyPair } = useQuantumShield();
 *
 *   const handleLock = async () => {
 *     if (!keyPair) return;
 *
 *     await lock({
 *       amount: BigInt('1000000000000000000'), // 1 ETH
 *       tokenAddress: '0x0000000000000000000000000000000000000000',
 *       dilithiumPubKeyHash: keyPair.publicKeyHash,
 *     });
 *   };
 *
 *   return (
 *     <button onClick={handleLock} disabled={isLoading}>
 *       {isLoading ? 'Locking...' : 'Lock 1 ETH'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useLock(): UseLockReturn {
  const { client, isInitialized } = useQuantumShieldContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastLock, setLastLock] = useState<LockResponse | null>(null);

  const lock = useCallback(
    async (request: LockRequest): Promise<LockResponse | null> => {
      if (!isInitialized || !client) {
        setError(new Error('SDK not initialized'));
        return null;
      }

      try {
        setIsLoading(true);
        setError(null);

        const response = await client.lock(request);
        setLastLock(response);
        return response;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Lock failed');
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
    setLastLock(null);
  }, []);

  return { lock, isLoading, error, lastLock, reset };
}
