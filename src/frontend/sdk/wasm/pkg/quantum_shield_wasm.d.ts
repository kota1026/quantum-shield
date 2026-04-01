/* tslint:disable */
/* eslint-disable */

/**
 * Get algorithm information
 *
 * # Returns
 * JSON with algorithm details (ML-DSA-65 / FIPS 204)
 */
export function get_algorithm_info(): any;

/**
 * Get SHA3-256 hash of a public key
 *
 * # Arguments
 * * `public_key_hex` - Hex-encoded public key
 *
 * # Returns
 * Hex-encoded SHA3-256 hash (32 bytes)
 */
export function get_public_key_hash(public_key_hex: string): string;

/**
 * Initialize WASM module (call once on load)
 */
export function init(): void;

/**
 * Generate a new ML-DSA-65 key pair
 *
 * Returns JSON with:
 * - public_key: hex-encoded public key (1952 bytes)
 * - secret_key: hex-encoded secret key (4032 bytes)
 * - public_key_hash: SHA3-256 hash of public key (32 bytes)
 *
 * # FIPS 204 Compliance
 * Uses ML-DSA-65 (Dilithium-III) with NIST Level 3 security
 */
export function keygen(): any;

/**
 * Compute SHA3-256 hash
 *
 * # Arguments
 * * `data_hex` - Hex-encoded data to hash
 *
 * # Returns
 * Hex-encoded SHA3-256 hash (32 bytes)
 *
 * # CP-1 Compliance
 * Uses SHA3-256 (NOT SHA-256 or keccak256)
 */
export function sha3_256(data_hex: string): string;

/**
 * Sign a message using ML-DSA-65
 *
 * # Arguments
 * * `secret_key_hex` - Hex-encoded secret key (4032 bytes)
 * * `message_hex` - Hex-encoded message to sign
 *
 * # Returns
 * Hex-encoded signature (3309 bytes)
 *
 * # FIPS 204 Compliance
 * Uses deterministic signing as per ML-DSA-65 specification
 */
export function sign(secret_key_hex: string, message_hex: string): string;

/**
 * Verify a signature using ML-DSA-65
 *
 * # Arguments
 * * `public_key_hex` - Hex-encoded public key (1952 bytes)
 * * `message_hex` - Hex-encoded message that was signed
 * * `signature_hex` - Hex-encoded signature to verify (3309 bytes)
 *
 * # Returns
 * JSON with:
 * - valid: boolean indicating if signature is valid
 * - error: optional error message if verification failed
 *
 * # FIPS 204 Compliance
 * Uses ML-DSA-65 verification as per NIST specification
 */
export function verify(public_key_hex: string, message_hex: string, signature_hex: string): any;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly get_algorithm_info: () => [number, number, number];
    readonly get_public_key_hash: (a: number, b: number) => [number, number, number, number];
    readonly init: () => void;
    readonly keygen: () => [number, number, number];
    readonly sha3_256: (a: number, b: number) => [number, number, number, number];
    readonly sign: (a: number, b: number, c: number, d: number) => [number, number, number, number];
    readonly verify: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number, number];
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_exn_store: (a: number) => void;
    readonly __externref_table_alloc: () => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __externref_table_dealloc: (a: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
