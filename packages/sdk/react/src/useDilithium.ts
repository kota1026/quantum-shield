/**
 * Dilithium Key Management Hook
 *
 * @module useDilithium
 */

import { useState, useCallback, useEffect } from 'react';
import { useQuantumShieldContext } from './QuantumShieldProvider';
import type { DilithiumKeyPair, VerificationResult, AlgorithmInfo } from '@quantum-shield/sdk';

export interface UseDilithiumReturn {
  /** Current key pair */
  keyPair: DilithiumKeyPair | null;
  /** Generate new key pair */
  generateKeyPair: () => DilithiumKeyPair | null;
  /** Import key pair */
  importKeyPair: (keyPair: DilithiumKeyPair) => void;
  /** Clear key pair from memory */
  clearKeyPair: () => void;
  /** Sign a message */
  sign: (message: string) => string | null;
  /** Verify a signature */
  verify: (publicKey: string, message: string, signature: string) => VerificationResult | null;
  /** Get algorithm info */
  getAlgorithmInfo: () => AlgorithmInfo | null;
  /** Whether key pair exists */
  hasKeyPair: boolean;
  /** Public key hash (for registration) */
  publicKeyHash: string | null;
}

/**
 * Hook for Dilithium key management
 *
 * @example
 * ```tsx
 * function KeyManagement() {
 *   const {
 *     keyPair,
 *     generateKeyPair,
 *     clearKeyPair,
 *     hasKeyPair,
 *     publicKeyHash,
 *   } = useDilithium();
 *
 *   return (
 *     <div>
 *       {hasKeyPair ? (
 *         <>
 *           <p>Public Key Hash: {publicKeyHash}</p>
 *           <button onClick={clearKeyPair}>Clear Key</button>
 *         </>
 *       ) : (
 *         <button onClick={generateKeyPair}>Generate Key Pair</button>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useDilithium(): UseDilithiumReturn {
  const { crypto, keyPair, generateKeyPair, setKeyPair, clearKeyPair } = useQuantumShieldContext();

  const sign = useCallback(
    (message: string): string | null => {
      if (!crypto || !keyPair) return null;
      return crypto.sign(keyPair.secretKey, message);
    },
    [crypto, keyPair]
  );

  const verify = useCallback(
    (publicKey: string, message: string, signature: string): VerificationResult | null => {
      if (!crypto) return null;
      return crypto.verify(publicKey, message, signature);
    },
    [crypto]
  );

  const getAlgorithmInfo = useCallback((): AlgorithmInfo | null => {
    if (!crypto) return null;
    return crypto.getAlgorithmInfo();
  }, [crypto]);

  return {
    keyPair,
    generateKeyPair,
    importKeyPair: setKeyPair,
    clearKeyPair,
    sign,
    verify,
    getAlgorithmInfo,
    hasKeyPair: keyPair !== null,
    publicKeyHash: keyPair?.publicKeyHash ?? null,
  };
}
