/**
 * WASM Module Wrapper for Dilithium Cryptography
 *
 * Provides typed interface to the quantum-shield-wasm module
 * implementing FIPS 204 ML-DSA-65 (Dilithium-III).
 *
 * @module wasm
 */

// Type definitions for WASM module exports
export interface WasmKeyPairResult {
  public_key: string;
  secret_key: string;
  public_key_hash: string;
}

export interface WasmVerifyResult {
  valid: boolean;
  error?: string;
}

export interface WasmAlgorithmInfo {
  name: string;
  standard: string;
  security_level: string;
  security_bits: number;
  public_key_bytes: number;
  secret_key_bytes: number;
  signature_bytes: number;
}

// WASM module interface
interface WasmModule {
  init: () => void;
  keygen: () => WasmKeyPairResult;
  sign: (secretKeyHex: string, messageHex: string) => string;
  verify: (publicKeyHex: string, messageHex: string, signatureHex: string) => WasmVerifyResult;
  sha3_256: (dataHex: string) => string;
  get_public_key_hash: (publicKeyHex: string) => string;
  get_algorithm_info: () => WasmAlgorithmInfo;
}

// Module state
let wasmModule: WasmModule | null = null;
let initPromise: Promise<WasmModule> | null = null;

/**
 * Load and initialize the WASM module
 *
 * @param wasmUrl - URL to the WASM file (optional, uses default if not provided)
 * @returns Promise resolving to the initialized WASM module
 */
export async function loadWasm(wasmUrl?: string): Promise<WasmModule> {
  // Return existing module if already loaded
  if (wasmModule) {
    return wasmModule;
  }

  // Return existing promise if initialization is in progress
  if (initPromise) {
    return initPromise;
  }

  // Start initialization
  initPromise = initializeWasm(wasmUrl);
  return initPromise;
}

async function initializeWasm(wasmUrl?: string): Promise<WasmModule> {
  try {
    // Dynamic import of the WASM module
    // In production, this would import from a published package or bundled module
    const wasm = await import(
      /* webpackIgnore: true */
      /* @vite-ignore */
      wasmUrl || 'quantum-shield-wasm'
    );

    // Initialize the WASM module
    if (typeof wasm.default === 'function') {
      await wasm.default();
    }

    // Call init() if available
    if (typeof wasm.init === 'function') {
      wasm.init();
    }

    wasmModule = {
      init: wasm.init,
      keygen: wasm.keygen,
      sign: wasm.sign,
      verify: wasm.verify,
      sha3_256: wasm.sha3_256,
      get_public_key_hash: wasm.get_public_key_hash,
      get_algorithm_info: wasm.get_algorithm_info,
    };

    return wasmModule;
  } catch (error) {
    initPromise = null;
    throw new Error(`Failed to load WASM module: ${error}`);
  }
}

/**
 * Check if WASM module is loaded
 */
export function isWasmLoaded(): boolean {
  return wasmModule !== null;
}

/**
 * Get the loaded WASM module (throws if not loaded)
 */
export function getWasm(): WasmModule {
  if (!wasmModule) {
    throw new Error('WASM module not loaded. Call loadWasm() first.');
  }
  return wasmModule;
}

/**
 * Generate a new Dilithium key pair
 *
 * @returns Key pair with public key, secret key, and public key hash
 * @throws Error if WASM not loaded
 */
export function keygen(): WasmKeyPairResult {
  const wasm = getWasm();
  return wasm.keygen();
}

/**
 * Sign a message with Dilithium
 *
 * @param secretKeyHex - Hex-encoded secret key
 * @param messageHex - Hex-encoded message to sign
 * @returns Hex-encoded signature
 * @throws Error if WASM not loaded or signing fails
 */
export function sign(secretKeyHex: string, messageHex: string): string {
  const wasm = getWasm();
  return wasm.sign(secretKeyHex, messageHex);
}

/**
 * Verify a Dilithium signature
 *
 * @param publicKeyHex - Hex-encoded public key
 * @param messageHex - Hex-encoded message
 * @param signatureHex - Hex-encoded signature
 * @returns Verification result
 * @throws Error if WASM not loaded
 */
export function verify(
  publicKeyHex: string,
  messageHex: string,
  signatureHex: string
): WasmVerifyResult {
  const wasm = getWasm();
  return wasm.verify(publicKeyHex, messageHex, signatureHex);
}

/**
 * Compute SHA3-256 hash
 *
 * @param dataHex - Hex-encoded data to hash
 * @returns Hex-encoded hash
 * @throws Error if WASM not loaded
 */
export function sha3_256(dataHex: string): string {
  const wasm = getWasm();
  return wasm.sha3_256(dataHex);
}

/**
 * Get algorithm information
 *
 * @returns Algorithm info (ML-DSA-65 / FIPS 204)
 * @throws Error if WASM not loaded
 */
export function getAlgorithmInfo(): WasmAlgorithmInfo {
  const wasm = getWasm();
  return wasm.get_algorithm_info();
}

/**
 * Convert string to hex encoding
 */
export function stringToHex(str: string): string {
  return Array.from(new TextEncoder().encode(str))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Convert hex string to regular string
 */
export function hexToString(hex: string): string {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return new TextDecoder().decode(bytes);
}
