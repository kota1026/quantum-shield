/**
 * Challenge Hook (SEQUENCES §4)
 *
 * Hook for Challenge + Slashing operations.
 *
 * ## SEQUENCES §4 Compliance
 * - §4.2: Submit challenge with bond
 * - §4.3: Bond = MAX(0.1 ETH, amount × 1%)
 * - §4.4: Defense period = 48 hours
 * - §4.5: Prover submits defense
 * - §4.6: Auto-resolve after deadline
 * - §4.7: Quadratic slashing: N² × 10%
 * - §4.8: Distribution: 60% Challenger, 20% Insurance, 20% Burn
 *
 * @module useChallenge
 */

import { useState, useCallback, useEffect } from 'react';
import { useQuantumShieldContext } from './QuantumShieldProvider';

// ============================================================================
// Types
// ============================================================================

export interface ChallengeRequest {
  /** Lock ID to challenge */
  lockId: string;
  /** Challenger address */
  challenger: string;
  /** Fraud proof data */
  fraudProof: string;
  /** Bond amount in wei */
  bond: string;
}

export interface ChallengeResponse {
  /** Unique challenge ID */
  challengeId: string;
  /** Associated lock ID */
  lockId: string;
  /** SHA3-256 hash of fraud proof */
  fraudProofHash: string;
  /** Bond amount */
  bond: string;
  /** Defense deadline (Unix timestamp) */
  defenseDeadline: number;
  /** Current status */
  status: ChallengeStatus;
}

export interface DefenseRequest {
  /** Prover ID submitting defense */
  proverId: string;
  /** Defense proof data */
  defenseProof: string;
}

export interface DefenseResponse {
  /** Challenge ID */
  challengeId: string;
  /** Lock ID */
  lockId: string;
  /** Defender (Prover ID) */
  defender: string;
  /** SHA3-256 hash of defense proof */
  defenseProofHash: string;
  /** Updated status */
  status: ChallengeStatus;
}

export interface ChallengeInfo {
  /** Challenge ID */
  challengeId: string;
  /** Lock ID */
  lockId: string;
  /** Challenger address */
  challenger: string;
  /** Fraud proof hash */
  fraudProofHash: string;
  /** Bond amount */
  bond: string;
  /** Challenge timestamp */
  challengedAt: number;
  /** Defense deadline */
  defenseDeadline: number;
  /** Current status */
  status: ChallengeStatus;
  /** Defender (if defense submitted) */
  defender?: string;
  /** Defense proof hash (if defense submitted) */
  defenseProofHash?: string;
}

export interface AutoResolveResponse {
  /** Challenge ID */
  challengeId: string;
  /** Lock ID */
  lockId: string;
  /** Whether challenge was valid */
  challengeValid: boolean;
  /** Amount slashed */
  slashAmount: string;
  /** Reward to challenger */
  challengerReward: string;
  /** Amount to insurance fund */
  insuranceAmount: string;
  /** Amount burned */
  burnAmount: string;
  /** Final status */
  status: ChallengeStatus;
}

export enum ChallengeStatus {
  None = 'none',
  Pending = 'pending',
  DefenseSubmitted = 'defense_submitted',
  ResolvedValid = 'resolved_valid',
  ResolvedInvalid = 'resolved_invalid',
}

export interface DefenseTimeRemaining {
  /** Total seconds remaining */
  totalSeconds: number;
  /** Days component */
  days: number;
  /** Hours component */
  hours: number;
  /** Minutes component */
  minutes: number;
  /** Seconds component */
  seconds: number;
  /** Whether deadline has passed */
  expired: boolean;
}

export interface UseChallengeReturn {
  /** Submit a challenge against a pending unlock */
  submitChallenge: (request: ChallengeRequest) => Promise<ChallengeResponse | null>;
  /** Submit defense as a Prover */
  submitDefense: (lockId: string, request: DefenseRequest) => Promise<DefenseResponse | null>;
  /** Get challenge info for a lock */
  getChallenge: (lockId: string) => Promise<ChallengeInfo | null>;
  /** Auto-resolve challenge after deadline */
  autoResolve: (lockId: string) => Promise<AutoResolveResponse | null>;
  /** Calculate required bond for amount */
  calculateRequiredBond: (amount: string) => string;
  /** Calculate slash amount for N provers */
  calculateSlashAmount: (n: number, amount: string) => string;
  /** Current challenge info */
  challenge: ChallengeInfo | null;
  /** Time remaining for defense */
  defenseTimeRemaining: DefenseTimeRemaining | null;
  /** Formatted defense time (e.g., "1d 23h 45m") */
  formattedDefenseTime: string;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
  /** Reset state */
  reset: () => void;
}

// ============================================================================
// Constants (SEQUENCES §4)
// ============================================================================

/** Minimum bond: 0.1 ETH in wei */
const MIN_BOND_WEI = BigInt('100000000000000000');

/** Bond percentage: 1% */
const BOND_PERCENTAGE = 1n;

/** Defense period: 48 hours in seconds */
const DEFENSE_PERIOD_SECONDS = 48 * 60 * 60;

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook for Challenge + Slashing operations
 *
 * @param lockId - Optional lock ID to track
 * @param autoRefresh - Auto-refresh interval in ms (default: 1000 for countdown)
 */
export function useChallenge(lockId?: string, autoRefresh: number = 1000): UseChallengeReturn {
  const { isInitialized, apiUrl } = useQuantumShieldContext();
  const [challenge, setChallenge] = useState<ChallengeInfo | null>(null);
  const [defenseTimeRemaining, setDefenseTimeRemaining] = useState<DefenseTimeRemaining | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // ============================================================================
  // Helper Functions
  // ============================================================================

  /**
   * Calculate required bond: MAX(0.1 ETH, amount × 1%)
   * SEQUENCES §4.3
   */
  const calculateRequiredBond = useCallback((amount: string): string => {
    const amountBigInt = BigInt(amount || '0');
    const percentBond = (amountBigInt * BOND_PERCENTAGE) / 100n;
    const requiredBond = percentBond > MIN_BOND_WEI ? percentBond : MIN_BOND_WEI;
    return requiredBond.toString();
  }, []);

  /**
   * Calculate quadratic slash: N² × 10%
   * SEQUENCES §4.7
   */
  const calculateSlashAmount = useCallback((n: number, amount: string): string => {
    const amountBigInt = BigInt(amount || '0');
    let slashPercent = BigInt(n * n * 10);
    if (slashPercent > 100n) {
      slashPercent = 100n; // Cap at 100%
    }
    const slashAmount = (amountBigInt * slashPercent) / 100n;
    return slashAmount.toString();
  }, []);

  /**
   * Calculate time remaining from deadline
   */
  const calculateTimeRemaining = useCallback((deadline: number): DefenseTimeRemaining => {
    const now = Math.floor(Date.now() / 1000);
    const totalSeconds = Math.max(0, deadline - now);
    return {
      totalSeconds,
      days: Math.floor(totalSeconds / 86400),
      hours: Math.floor((totalSeconds % 86400) / 3600),
      minutes: Math.floor((totalSeconds % 3600) / 60),
      seconds: totalSeconds % 60,
      expired: totalSeconds === 0,
    };
  }, []);

  // ============================================================================
  // API Functions
  // ============================================================================

  /**
   * Submit a challenge against a pending unlock
   * SEQUENCES §4.2
   */
  const submitChallenge = useCallback(
    async (request: ChallengeRequest): Promise<ChallengeResponse | null> => {
      if (!isInitialized) {
        setError(new Error('SDK not initialized'));
        return null;
      }

      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`${apiUrl}/v1/challenge`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lock_id: request.lockId,
            challenger: request.challenger,
            fraud_proof: request.fraudProof,
            bond: request.bond,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to submit challenge');
        }

        const data = await response.json();
        const challengeResponse: ChallengeResponse = {
          challengeId: data.challenge_id,
          lockId: data.lock_id,
          fraudProofHash: data.fraud_proof_hash,
          bond: data.bond,
          defenseDeadline: data.defense_deadline,
          status: data.status as ChallengeStatus,
        };

        // Update local state
        setChallenge({
          challengeId: challengeResponse.challengeId,
          lockId: challengeResponse.lockId,
          challenger: request.challenger,
          fraudProofHash: challengeResponse.fraudProofHash,
          bond: challengeResponse.bond,
          challengedAt: Math.floor(Date.now() / 1000),
          defenseDeadline: challengeResponse.defenseDeadline,
          status: challengeResponse.status,
        });
        setDefenseTimeRemaining(calculateTimeRemaining(challengeResponse.defenseDeadline));

        return challengeResponse;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to submit challenge');
        setError(error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [isInitialized, apiUrl, calculateTimeRemaining]
  );

  /**
   * Submit defense as a Prover
   * SEQUENCES §4.5
   */
  const submitDefense = useCallback(
    async (lockId: string, request: DefenseRequest): Promise<DefenseResponse | null> => {
      if (!isInitialized) {
        setError(new Error('SDK not initialized'));
        return null;
      }

      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`${apiUrl}/v1/challenge/${lockId}/defense`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prover_id: request.proverId,
            defense_proof: request.defenseProof,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to submit defense');
        }

        const data = await response.json();
        const defenseResponse: DefenseResponse = {
          challengeId: data.challenge_id,
          lockId: data.lock_id,
          defender: data.defender,
          defenseProofHash: data.defense_proof_hash,
          status: data.status as ChallengeStatus,
        };

        // Update local state
        if (challenge) {
          setChallenge({
            ...challenge,
            defender: defenseResponse.defender,
            defenseProofHash: defenseResponse.defenseProofHash,
            status: defenseResponse.status,
          });
        }

        return defenseResponse;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to submit defense');
        setError(error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [isInitialized, apiUrl, challenge]
  );

  /**
   * Get challenge info for a lock
   */
  const getChallenge = useCallback(
    async (lockId: string): Promise<ChallengeInfo | null> => {
      if (!isInitialized) {
        setError(new Error('SDK not initialized'));
        return null;
      }

      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`${apiUrl}/v1/challenge/${lockId}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          if (response.status === 404) {
            return null; // No challenge exists
          }
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to get challenge');
        }

        const data = await response.json();
        const challengeInfo: ChallengeInfo = {
          challengeId: data.challenge_id,
          lockId: data.lock_id,
          challenger: data.challenger,
          fraudProofHash: data.fraud_proof_hash,
          bond: data.bond,
          challengedAt: data.challenged_at,
          defenseDeadline: data.defense_deadline,
          status: data.status as ChallengeStatus,
          defender: data.defender,
          defenseProofHash: data.defense_proof_hash,
        };

        setChallenge(challengeInfo);
        setDefenseTimeRemaining(calculateTimeRemaining(challengeInfo.defenseDeadline));

        return challengeInfo;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to get challenge');
        setError(error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [isInitialized, apiUrl, calculateTimeRemaining]
  );

  /**
   * Auto-resolve challenge after defense deadline
   * SEQUENCES §4.6
   */
  const autoResolve = useCallback(
    async (lockId: string): Promise<AutoResolveResponse | null> => {
      if (!isInitialized) {
        setError(new Error('SDK not initialized'));
        return null;
      }

      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`${apiUrl}/v1/challenge/${lockId}/auto-resolve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to auto-resolve challenge');
        }

        const data = await response.json();
        const resolveResponse: AutoResolveResponse = {
          challengeId: data.challenge_id,
          lockId: data.lock_id,
          challengeValid: data.challenge_valid,
          slashAmount: data.slash_amount,
          challengerReward: data.challenger_reward,
          insuranceAmount: data.insurance_amount,
          burnAmount: data.burn_amount,
          status: data.status as ChallengeStatus,
        };

        // Update local state
        if (challenge) {
          setChallenge({
            ...challenge,
            status: resolveResponse.status,
          });
        }

        return resolveResponse;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to auto-resolve challenge');
        setError(error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [isInitialized, apiUrl, challenge]
  );

  // ============================================================================
  // Effects
  // ============================================================================

  // Fetch challenge on mount if lockId provided
  useEffect(() => {
    if (lockId && isInitialized) {
      getChallenge(lockId);
    }
  }, [lockId, isInitialized, getChallenge]);

  // Auto-refresh countdown
  useEffect(() => {
    if (autoRefresh <= 0 || !defenseTimeRemaining || defenseTimeRemaining.expired) {
      return;
    }

    const interval = setInterval(() => {
      setDefenseTimeRemaining((prev) => {
        if (!prev || prev.expired) return prev;
        const newTotal = Math.max(0, prev.totalSeconds - 1);
        return {
          totalSeconds: newTotal,
          days: Math.floor(newTotal / 86400),
          hours: Math.floor((newTotal % 86400) / 3600),
          minutes: Math.floor((newTotal % 3600) / 60),
          seconds: newTotal % 60,
          expired: newTotal === 0,
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, defenseTimeRemaining]);

  // Format time string
  const formattedDefenseTime = defenseTimeRemaining
    ? [
        defenseTimeRemaining.days > 0 ? `${defenseTimeRemaining.days}d` : '',
        defenseTimeRemaining.hours > 0 ? `${defenseTimeRemaining.hours}h` : '',
        defenseTimeRemaining.minutes > 0 ? `${defenseTimeRemaining.minutes}m` : '',
        `${defenseTimeRemaining.seconds}s`,
      ]
        .filter(Boolean)
        .join(' ')
    : '';

  // Reset state
  const reset = useCallback(() => {
    setChallenge(null);
    setDefenseTimeRemaining(null);
    setError(null);
  }, []);

  return {
    submitChallenge,
    submitDefense,
    getChallenge,
    autoResolve,
    calculateRequiredBond,
    calculateSlashAmount,
    challenge,
    defenseTimeRemaining,
    formattedDefenseTime,
    isLoading,
    error,
    reset,
  };
}
