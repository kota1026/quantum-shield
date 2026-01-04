/**
 * Time Lock Hook
 *
 * @module useTimeLock
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuantumShieldContext } from './QuantumShieldProvider';
import type { TimeLockRemaining, Lock } from '@quantum-shield/sdk';

export interface UseTimeLockReturn {
  /** Time remaining */
  timeRemaining: TimeLockRemaining | null;
  /** Lock data */
  lock: Lock | null;
  /** Refresh lock status */
  refresh: () => Promise<void>;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
  /** Whether timelock has expired */
  isExpired: boolean;
  /** Formatted time string (e.g., "2d 5h 30m 15s") */
  formattedTime: string;
}

/**
 * Hook for tracking time lock status
 *
 * @param lockId - Lock identifier to track
 * @param autoRefresh - Auto-refresh interval in ms (0 to disable)
 *
 * @example
 * ```tsx
 * function TimeLockDisplay({ lockId }: { lockId: string }) {
 *   const { timeRemaining, formattedTime, isExpired, isLoading } = useTimeLock(lockId, 1000);
 *
 *   if (isLoading) return <div>Loading...</div>;
 *
 *   return (
 *     <div>
 *       {isExpired ? (
 *         <span>Time lock expired - ready to release!</span>
 *       ) : (
 *         <span>Time remaining: {formattedTime}</span>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useTimeLock(lockId: string, autoRefresh: number = 0): UseTimeLockReturn {
  const { client, isInitialized } = useQuantumShieldContext();
  const [timeRemaining, setTimeRemaining] = useState<TimeLockRemaining | null>(null);
  const [lock, setLock] = useState<Lock | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!isInitialized || !client) return;

    try {
      setIsLoading(true);
      setError(null);

      const lockData = await client.getStatus(lockId);
      setLock(lockData);

      const remaining = await client.getTimeLockRemaining(lockId);
      setTimeRemaining(remaining);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch lock status'));
    } finally {
      setIsLoading(false);
    }
  }, [client, isInitialized, lockId]);

  // Initial fetch
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh <= 0) return;

    const interval = setInterval(() => {
      if (timeRemaining && !timeRemaining.expired) {
        // Update local countdown
        setTimeRemaining((prev) => {
          if (!prev || prev.expired) return prev;
          const newTotal = Math.max(0, prev.totalSeconds - Math.floor(autoRefresh / 1000));
          return {
            ...prev,
            totalSeconds: newTotal,
            days: Math.floor(newTotal / 86400),
            hours: Math.floor((newTotal % 86400) / 3600),
            minutes: Math.floor((newTotal % 3600) / 60),
            seconds: newTotal % 60,
            expired: newTotal === 0,
          };
        });
      }
    }, autoRefresh);

    return () => clearInterval(interval);
  }, [autoRefresh, timeRemaining]);

  // Format time string
  const formattedTime = timeRemaining
    ? [
        timeRemaining.days > 0 ? `${timeRemaining.days}d` : '',
        timeRemaining.hours > 0 ? `${timeRemaining.hours}h` : '',
        timeRemaining.minutes > 0 ? `${timeRemaining.minutes}m` : '',
        `${timeRemaining.seconds}s`,
      ]
        .filter(Boolean)
        .join(' ')
    : '';

  return {
    timeRemaining,
    lock,
    refresh,
    isLoading,
    error,
    isExpired: timeRemaining?.expired ?? false,
    formattedTime,
  };
}
