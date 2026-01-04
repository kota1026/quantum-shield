/**
 * Dilithium Key Management Hook
 *
 * @module useDilithium
 */

import { useCallback } from 'react';
import { useQuantumShieldContext, type DilithiumKeyPair } from './QuantumShieldProvider';

export interface VerificationResult {
  valid: boolean;
  error?: string;
}

export interface AlgorithmInfo {
  name: string;
  standard: string;
  securityLevel: string;
  securityBits: number;
  publicKeyBytes: number;
  secretKeyBytes: number;
  signatureBytes: number;
}

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
 */
export function useDilithium(): UseDilithiumReturn {
  const { keyPair, generateKeyPair, setKeyPair, clearKeyPair } = useQuantumShieldContext();

  const sign = useCallback(
    (message: string): string | null => {
      if (!keyPair) return null;
      // Placeholder - in production would use WASM
      return `sig_${message.slice(0, 8)}_${Date.now()}`;
    },
    [keyPair]
  );

  const verify = useCallback(
    (_publicKey: string, _message: string, _signature: string): VerificationResult | null => {
      // Placeholder - in production would use WASM
      return { valid: true };
    },
    []
  );

  const getAlgorithmInfo = useCallback((): AlgorithmInfo | null => {
    return {
      name: 'ML-DSA-65',
      standard: 'FIPS 204',
      securityLevel: 'NIST Level 3',
      securityBits: 192,
      publicKeyBytes: 1952,
      secretKeyBytes: 4032,
      signatureBytes: 3309,
    };
  }, []);

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
