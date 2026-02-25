/**
 * Type definitions for quantum-shield-wasm package
 */

declare module 'quantum-shield-wasm' {
  export interface KeyPairResult {
    public_key: string;
    secret_key: string;
    public_key_hash: string;
  }

  export interface VerifyResult {
    valid: boolean;
    error?: string;
  }

  export interface AlgorithmInfo {
    name: string;
    standard: string;
    security_level: string;
    security_bits: number;
    public_key_bytes: number;
    secret_key_bytes: number;
    signature_bytes: number;
  }

  /**
   * Get algorithm information (ML-DSA-65 / FIPS 204)
   */
  export function get_algorithm_info(): AlgorithmInfo;

  /**
   * Get SHA3-256 hash of a public key
   * @param public_key_hex - Hex-encoded public key
   * @returns Hex-encoded SHA3-256 hash (32 bytes)
   */
  export function get_public_key_hash(public_key_hex: string): string;

  /**
   * Initialize WASM module (call once on load)
   */
  export function init(): void;

  /**
   * Generate a new ML-DSA-65 key pair
   * @returns Key pair with public key, secret key, and public key hash
   */
  export function keygen(): KeyPairResult;

  /**
   * Compute SHA3-256 hash
   * @param data_hex - Hex-encoded data to hash
   * @returns Hex-encoded SHA3-256 hash (32 bytes)
   */
  export function sha3_256(data_hex: string): string;

  /**
   * Sign a message using ML-DSA-65
   * @param secret_key_hex - Hex-encoded secret key (4032 bytes)
   * @param message_hex - Hex-encoded message to sign
   * @returns Hex-encoded signature (3309 bytes)
   */
  export function sign(secret_key_hex: string, message_hex: string): string;

  /**
   * Verify a signature using ML-DSA-65
   * @param public_key_hex - Hex-encoded public key (1952 bytes)
   * @param message_hex - Hex-encoded message that was signed
   * @param signature_hex - Hex-encoded signature to verify (3309 bytes)
   * @returns Verification result
   */
  export function verify(
    public_key_hex: string,
    message_hex: string,
    signature_hex: string
  ): VerifyResult;

  export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

  export interface InitOutput {
    readonly memory: WebAssembly.Memory;
  }

  export type SyncInitInput = BufferSource | WebAssembly.Module;

  /**
   * Instantiates the given module synchronously
   */
  export function initSync(
    module: { module: SyncInitInput } | SyncInitInput
  ): InitOutput;

  /**
   * Load and initialize the WASM module asynchronously
   */
  export default function init(
    module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>
  ): Promise<InitOutput>;
}
