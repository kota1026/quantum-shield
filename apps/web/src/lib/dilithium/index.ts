/**
 * Dilithium (ML-DSA-65) WASM Module Wrapper
 *
 * Provides quantum-resistant signature generation and verification
 * using FIPS 204 ML-DSA-65 (Dilithium-III).
 *
 * Security Level: NIST Level 3 (192-bit)
 */

// Types for WASM module
interface KeyPairResult {
  public_key: string;
  secret_key: string;
  public_key_hash: string;
}

interface VerifyResult {
  valid: boolean;
  error?: string;
}

interface AlgorithmInfo {
  name: string;
  standard: string;
  security_level: string;
  security_bits: number;
  public_key_bytes: number;
  secret_key_bytes: number;
  signature_bytes: number;
}

// WASM module instance (loaded lazily)
let wasmModule: typeof import('quantum-shield-wasm') | null = null;
let initPromise: Promise<void> | null = null;

/**
 * Load and initialize the WASM module
 * Safe to call multiple times - will only load once
 */
export async function initDilithium(): Promise<void> {
  if (wasmModule) return;

  if (!initPromise) {
    initPromise = (async () => {
      // Dynamic import of WASM module
      const wasm = await import('quantum-shield-wasm');
      await wasm.default();
      wasm.init();
      wasmModule = wasm;
    })();
  }

  await initPromise;
}

/**
 * Ensure WASM is loaded, throw if not
 */
function ensureLoaded(): typeof import('quantum-shield-wasm') {
  if (!wasmModule) {
    throw new Error('Dilithium WASM not initialized. Call initDilithium() first.');
  }
  return wasmModule;
}

/**
 * Generate a new ML-DSA-65 key pair
 *
 * @returns Key pair with public key, secret key, and public key hash
 */
export async function generateKeyPair(): Promise<KeyPairResult> {
  await initDilithium();
  const wasm = ensureLoaded();
  return wasm.keygen() as KeyPairResult;
}

/**
 * Sign a message using ML-DSA-65
 *
 * @param secretKeyHex - Hex-encoded secret key (4032 bytes)
 * @param messageHex - Hex-encoded message to sign
 * @returns Hex-encoded signature (3309 bytes)
 */
export async function signMessage(
  secretKeyHex: string,
  messageHex: string
): Promise<string> {
  await initDilithium();
  const wasm = ensureLoaded();
  return wasm.sign(secretKeyHex, messageHex);
}

/**
 * Verify a signature using ML-DSA-65
 *
 * @param publicKeyHex - Hex-encoded public key (1952 bytes)
 * @param messageHex - Hex-encoded message
 * @param signatureHex - Hex-encoded signature (3309 bytes)
 * @returns Verification result
 */
export async function verifySignature(
  publicKeyHex: string,
  messageHex: string,
  signatureHex: string
): Promise<VerifyResult> {
  await initDilithium();
  const wasm = ensureLoaded();
  return wasm.verify(publicKeyHex, messageHex, signatureHex) as VerifyResult;
}

/**
 * Compute SHA3-256 hash
 *
 * @param dataHex - Hex-encoded data to hash
 * @returns Hex-encoded SHA3-256 hash (32 bytes)
 */
export async function sha3_256(dataHex: string): Promise<string> {
  await initDilithium();
  const wasm = ensureLoaded();
  return wasm.sha3_256(dataHex);
}

/**
 * Get SHA3-256 hash of a public key
 *
 * @param publicKeyHex - Hex-encoded public key
 * @returns Hex-encoded hash
 */
export async function getPublicKeyHash(publicKeyHex: string): Promise<string> {
  await initDilithium();
  const wasm = ensureLoaded();
  return wasm.get_public_key_hash(publicKeyHex);
}

/**
 * Get algorithm information
 */
export async function getAlgorithmInfo(): Promise<AlgorithmInfo> {
  await initDilithium();
  const wasm = ensureLoaded();
  return wasm.get_algorithm_info() as AlgorithmInfo;
}

/**
 * Convert string to hex
 */
export function stringToHex(str: string): string {
  return Array.from(new TextEncoder().encode(str))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Convert hex to string
 */
export function hexToString(hex: string): string {
  const bytes = new Uint8Array(
    hex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
  );
  return new TextDecoder().decode(bytes);
}

// Key storage constants
const DILITHIUM_PK_KEY = 'quantum_shield_dilithium_pk';
const DILITHIUM_SK_KEY = 'quantum_shield_dilithium_sk';

/**
 * Store Dilithium key pair in localStorage
 * WARNING: In production, secret key should be stored more securely
 */
export function storeKeyPair(publicKey: string, secretKey: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(DILITHIUM_PK_KEY, publicKey);
    localStorage.setItem(DILITHIUM_SK_KEY, secretKey);
  }
}

/**
 * Get stored Dilithium key pair from localStorage
 */
export function getStoredKeyPair(): { publicKey: string; secretKey: string } | null {
  if (typeof window === 'undefined') return null;

  const publicKey = localStorage.getItem(DILITHIUM_PK_KEY);
  const secretKey = localStorage.getItem(DILITHIUM_SK_KEY);

  if (!publicKey || !secretKey) return null;

  return { publicKey, secretKey };
}

/**
 * Clear stored Dilithium key pair
 */
export function clearKeyPair(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(DILITHIUM_PK_KEY);
    localStorage.removeItem(DILITHIUM_SK_KEY);
  }
}

/**
 * Check if Dilithium key pair exists
 */
export function hasKeyPair(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(localStorage.getItem(DILITHIUM_PK_KEY) && localStorage.getItem(DILITHIUM_SK_KEY));
}
