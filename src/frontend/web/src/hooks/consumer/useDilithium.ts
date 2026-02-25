/**
 * useDilithium Hook
 *
 * React hook for Dilithium (ML-DSA-65) cryptographic operations.
 * Handles key generation, signing, and key storage.
 */

import { useState, useCallback, useEffect } from 'react';
import {
  initDilithium,
  generateKeyPair,
  signMessage,
  getStoredKeyPair,
  storeKeyPair,
  hasKeyPair,
  clearKeyPair,
  stringToHex,
} from '@/lib/dilithium';

interface DilithiumState {
  isInitialized: boolean;
  isLoading: boolean;
  hasKeys: boolean;
  publicKey: string | null;
  error: string | null;
}

interface UseDilithiumReturn extends DilithiumState {
  /** Initialize WASM and load existing keys */
  initialize: () => Promise<void>;
  /** Generate new key pair (overwrites existing) */
  generateKeys: () => Promise<{ publicKey: string; secretKey: string }>;
  /** Sign a message with the stored secret key */
  sign: (message: string) => Promise<string>;
  /** Sign hex-encoded data */
  signHex: (messageHex: string) => Promise<string>;
  /** Sign raw bytes (Uint8Array) - for SEQUENCES.md compliant signing */
  signMessage: (message: Uint8Array) => Promise<string>;
  /** Clear stored keys */
  clearKeys: () => void;
}

/**
 * Hook for Dilithium cryptographic operations
 *
 * Usage:
 * ```tsx
 * const { initialize, generateKeys, sign, publicKey, isInitialized } = useDilithium();
 *
 * useEffect(() => {
 *   initialize();
 * }, [initialize]);
 *
 * const handleLock = async () => {
 *   if (!publicKey) {
 *     await generateKeys();
 *   }
 *   const signature = await sign(lockMessage);
 * };
 * ```
 */
export function useDilithium(): UseDilithiumReturn {
  const [state, setState] = useState<DilithiumState>({
    isInitialized: false,
    isLoading: false,
    hasKeys: false,
    publicKey: null,
    error: null,
  });

  // Initialize WASM and load existing keys
  const initialize = useCallback(async () => {
    if (state.isInitialized) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await initDilithium();

      // Load existing keys if available
      const existingKeys = getStoredKeyPair();

      setState({
        isInitialized: true,
        isLoading: false,
        hasKeys: !!existingKeys,
        publicKey: existingKeys?.publicKey || null,
        error: null,
      });
    } catch (err) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to initialize Dilithium',
      }));
    }
  }, [state.isInitialized]);

  // Generate new key pair
  const generateKeys = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      if (!state.isInitialized) {
        await initDilithium();
      }

      const keyPair = await generateKeyPair();
      storeKeyPair(keyPair.public_key, keyPair.secret_key);

      setState(prev => ({
        ...prev,
        isLoading: false,
        hasKeys: true,
        publicKey: keyPair.public_key,
      }));

      return {
        publicKey: keyPair.public_key,
        secretKey: keyPair.secret_key,
      };
    } catch (err) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to generate keys',
      }));
      throw err;
    }
  }, [state.isInitialized]);

  // Sign a string message
  const sign = useCallback(async (message: string): Promise<string> => {
    const keys = getStoredKeyPair();
    if (!keys) {
      throw new Error('No Dilithium keys available. Generate keys first.');
    }

    const messageHex = stringToHex(message);
    return signMessage(keys.secretKey, messageHex);
  }, []);

  // Sign hex-encoded data
  const signHex = useCallback(async (messageHex: string): Promise<string> => {
    const keys = getStoredKeyPair();
    if (!keys) {
      throw new Error('No Dilithium keys available. Generate keys first.');
    }

    return signMessage(keys.secretKey, messageHex);
  }, []);

  // Sign raw bytes (Uint8Array) - for SEQUENCES.md compliant signing
  const signMessageBytes = useCallback(async (message: Uint8Array): Promise<string> => {
    const keys = getStoredKeyPair();
    if (!keys) {
      throw new Error('No Dilithium keys available. Generate keys first.');
    }

    // Convert Uint8Array to hex string
    const messageHex = Array.from(message)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return signMessage(keys.secretKey, messageHex);
  }, []);

  // Clear stored keys
  const clearKeys = useCallback(() => {
    clearKeyPair();
    setState(prev => ({
      ...prev,
      hasKeys: false,
      publicKey: null,
    }));
  }, []);

  // Auto-initialize on mount
  useEffect(() => {
    if (!state.isInitialized && !state.isLoading) {
      initialize();
    }
  }, [initialize, state.isInitialized, state.isLoading]);

  return {
    ...state,
    initialize,
    generateKeys,
    sign,
    signHex,
    signMessage: signMessageBytes,
    clearKeys,
  };
}

/**
 * Create lock message for signing
 *
 * Backend format (Rust):
 * "QS_LOCK_V1" || chain_id (u64 big endian) || asset || amount || dest_addr || expiry (u64 big endian) || nonce (u64 big endian)
 *
 * Important: Backend uses raw bytes, not hex encoding for the message
 */
export function createLockMessage(params: {
  chainId: number;
  asset: string;
  amount: string;
  destAddr: string;
  expiry: number;
  nonce: number;
}): string {
  // Build message as bytes, then convert to hex for signing
  const encoder = new TextEncoder();
  const parts: Uint8Array[] = [];

  // "QS_LOCK_V1" as bytes
  parts.push(encoder.encode('QS_LOCK_V1'));

  // chain_id as u64 big endian (8 bytes) - backend uses u64
  const chainIdBuffer = new ArrayBuffer(8);
  const chainIdView = new DataView(chainIdBuffer);
  chainIdView.setUint32(0, Math.floor(params.chainId / 0x100000000), false); // high 32 bits
  chainIdView.setUint32(4, params.chainId >>> 0, false); // low 32 bits
  parts.push(new Uint8Array(chainIdBuffer));

  // asset as string bytes
  parts.push(encoder.encode(params.asset));

  // amount as string bytes
  parts.push(encoder.encode(params.amount));

  // dest_addr as string bytes
  parts.push(encoder.encode(params.destAddr));

  // expiry as u64 big endian (8 bytes)
  const expiryBuffer = new ArrayBuffer(8);
  const expiryView = new DataView(expiryBuffer);
  // JavaScript doesn't have native u64, so we need to write it in two parts
  expiryView.setUint32(0, Math.floor(params.expiry / 0x100000000), false); // high 32 bits
  expiryView.setUint32(4, params.expiry >>> 0, false); // low 32 bits
  parts.push(new Uint8Array(expiryBuffer));

  // nonce as u64 big endian (8 bytes)
  const nonceBuffer = new ArrayBuffer(8);
  const nonceView = new DataView(nonceBuffer);
  nonceView.setUint32(0, Math.floor(params.nonce / 0x100000000), false); // high 32 bits
  nonceView.setUint32(4, params.nonce >>> 0, false); // low 32 bits
  parts.push(new Uint8Array(nonceBuffer));

  // Concatenate all parts
  const totalLength = parts.reduce((sum, arr) => sum + arr.length, 0);
  const message = new Uint8Array(totalLength);
  let offset = 0;
  for (const part of parts) {
    message.set(part, offset);
    offset += part.length;
  }

  // Convert to hex string for WASM signing
  return Array.from(message)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export default useDilithium;
