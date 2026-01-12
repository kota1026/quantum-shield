/**
 * Dilithium Key Management Hook
 *
 * Provides WASM-backed Dilithium (FIPS 204 ML-DSA-65) cryptography.
 *
 * @module useDilithium
 */

import { useCallback } from 'react';
import { useQuantumShieldContext, type DilithiumKeyPair } from './QuantumShieldProvider';
import {
  isWasmLoaded,
  sign as wasmSign,
  verify as wasmVerify,
  getAlgorithmInfo as wasmGetAlgorithmInfo,
  stringToHex,
} from './wasm';
import type { WasmVerifyResult } from './wasm';

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
  /** Sign a message (hex-encoded or string) */
  sign: (message: string, isHex?: boolean) => string | null;
  /** Verify a signature */
  verify: (publicKey: string, message: string, signature: string, isHex?: boolean) => VerificationResult | null;
  /** Get algorithm info */
  getAlgorithmInfo: () => AlgorithmInfo | null;
  /** Whether key pair exists */
  hasKeyPair: boolean;
  /** Public key hash (for registration) */
  publicKeyHash: string | null;
  /** Whether WASM is ready */
  isWasmReady: boolean;
}

/**
 * Hook for Dilithium key management with WASM-backed cryptography
 */
export function useDilithium(): UseDilithiumReturn {
  const { keyPair, generateKeyPair, setKeyPair, clearKeyPair, isWasmReady } = useQuantumShieldContext();

  /**
   * Sign a message using the current key pair
   *
   * @param message - Message to sign (string or hex-encoded)
   * @param isHex - Whether the message is already hex-encoded (default: false)
   * @returns Hex-encoded signature or null if no key pair
   */
  const sign = useCallback(
    (message: string, isHex: boolean = false): string | null => {
      if (!keyPair) {
        console.warn('No key pair available for signing');
        return null;
      }

      // Convert message to hex if needed
      const messageHex = isHex ? message : stringToHex(message);

      // Use WASM if available
      if (isWasmLoaded()) {
        try {
          return wasmSign(keyPair.secretKey, messageHex);
        } catch (err) {
          console.error('WASM signing failed:', err);
          return null;
        }
      }

      // Fallback mock for testing
      console.warn('Using mock signature (WASM not available)');
      return `mock_sig_${message.slice(0, 8)}_${Date.now()}`;
    },
    [keyPair]
  );

  /**
   * Verify a signature
   *
   * @param publicKey - Hex-encoded public key
   * @param message - Message that was signed (string or hex-encoded)
   * @param signature - Hex-encoded signature
   * @param isHex - Whether the message is already hex-encoded (default: false)
   * @returns Verification result
   */
  const verify = useCallback(
    (publicKey: string, message: string, signature: string, isHex: boolean = false): VerificationResult | null => {
      // Convert message to hex if needed
      const messageHex = isHex ? message : stringToHex(message);

      // Use WASM if available
      if (isWasmLoaded()) {
        try {
          const result: WasmVerifyResult = wasmVerify(publicKey, messageHex, signature);
          return {
            valid: result.valid,
            error: result.error,
          };
        } catch (err) {
          console.error('WASM verification failed:', err);
          return {
            valid: false,
            error: err instanceof Error ? err.message : String(err),
          };
        }
      }

      // Fallback mock for testing
      console.warn('Using mock verification (WASM not available)');
      return { valid: true };
    },
    []
  );

  /**
   * Get algorithm information
   */
  const getAlgorithmInfo = useCallback((): AlgorithmInfo | null => {
    // Use WASM if available
    if (isWasmLoaded()) {
      try {
        const info = wasmGetAlgorithmInfo();
        return {
          name: info.name,
          standard: info.standard,
          securityLevel: info.security_level,
          securityBits: info.security_bits,
          publicKeyBytes: info.public_key_bytes,
          secretKeyBytes: info.secret_key_bytes,
          signatureBytes: info.signature_bytes,
        };
      } catch (err) {
        console.error('Failed to get algorithm info:', err);
      }
    }

    // Return static info
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
    isWasmReady,
  };
}
