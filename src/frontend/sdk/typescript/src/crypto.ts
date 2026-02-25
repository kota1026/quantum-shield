/**
 * Dilithium Cryptography Module
 *
 * Wraps the WASM module for Dilithium operations.
 * FIPS 204 ML-DSA-65 compliant.
 *
 * @module crypto
 */

/**
 * Dilithium key pair
 */
export interface DilithiumKeyPair {
  /** Public key (hex encoded, 3904 chars) */
  publicKey: string;
  /** Secret key (hex encoded, 8064 chars) */
  secretKey: string;
  /** SHA3-256 hash of public key (hex encoded, 64 chars) */
  publicKeyHash: string;
}

/**
 * Signature verification result
 */
export interface VerificationResult {
  /** Whether signature is valid */
  valid: boolean;
  /** Error message if verification failed */
  error?: string;
}

/**
 * Algorithm information
 */
export interface AlgorithmInfo {
  /** Algorithm name */
  name: string;
  /** Standard (e.g., "FIPS 204") */
  standard: string;
  /** NIST security level */
  securityLevel: number;
  /** Public key size in bytes */
  publicKeyBytes: number;
  /** Secret key size in bytes */
  secretKeyBytes: number;
  /** Signature size in bytes */
  signatureBytes: number;
  /** Hash algorithm used */
  hashAlgorithm: string;
}

/**
 * WASM module interface (from @quantum-shield/wasm)
 */
interface WasmModule {
  keygen(): DilithiumKeyPairRaw;
  sign(secretKey: string, message: string): string;
  verify(publicKey: string, message: string, signature: string): VerificationResultRaw;
  sha3_256(data: string): string;
  get_public_key_hash(publicKey: string): string;
  get_algorithm_info(): AlgorithmInfoRaw;
  get_version(): string;
}

/** Raw key pair from WASM */
interface DilithiumKeyPairRaw {
  public_key: string;
  secret_key: string;
  public_key_hash: string;
}

/** Raw verification result from WASM */
interface VerificationResultRaw {
  valid: boolean;
  error: string | null;
}

/** Raw algorithm info from WASM */
interface AlgorithmInfoRaw {
  name: string;
  standard: string;
  security_level: number;
  public_key_bytes: number;
  secret_key_bytes: number;
  signature_bytes: number;
  hash_algorithm: string;
}

/**
 * Dilithium Cryptography class
 *
 * Provides FIPS 204 ML-DSA-65 cryptographic operations.
 * Secret keys are stored in memory and never sent to any server (CP-2 compliant).
 *
 * @example
 * ```typescript
 * const crypto = new DilithiumCrypto();
 * await crypto.init();
 *
 * // Generate key pair
 * const keyPair = crypto.generateKeyPair();
 *
 * // Sign message
 * const message = '0x...';
 * const signature = crypto.sign(keyPair.secretKey, message);
 *
 * // Verify signature
 * const result = crypto.verify(keyPair.publicKey, message, signature);
 * ```
 */
export class DilithiumCrypto {
  private wasm: WasmModule | null = null;
  private initialized = false;

  /**
   * Initialize the WASM module
   *
   * Must be called before any cryptographic operations.
   *
   * @param wasmModule - Pre-loaded WASM module (optional)
   */
  async init(wasmModule?: WasmModule): Promise<void> {
    if (this.initialized) {
      return;
    }

    if (wasmModule) {
      this.wasm = wasmModule;
    } else {
      // Dynamic import for browser/bundler compatibility
      try {
        // @ts-expect-error - Dynamic import
        const mod = await import('@quantum-shield/wasm');
        await mod.default?.();
        this.wasm = mod;
      } catch (error) {
        throw new Error(
          `Failed to load WASM module: ${error instanceof Error ? error.message : 'Unknown error'}. ` +
          'Make sure @quantum-shield/wasm is installed.'
        );
      }
    }

    this.initialized = true;
  }

  /**
   * Ensure WASM module is initialized
   */
  private ensureInitialized(): void {
    if (!this.initialized || !this.wasm) {
      throw new Error('DilithiumCrypto not initialized. Call init() first.');
    }
  }

  /**
   * Generate a new Dilithium key pair
   *
   * Performance target: <500ms
   *
   * @returns New key pair with public key, secret key, and public key hash
   */
  generateKeyPair(): DilithiumKeyPair {
    this.ensureInitialized();

    const raw = this.wasm!.keygen();
    return {
      publicKey: raw.public_key,
      secretKey: raw.secret_key,
      publicKeyHash: raw.public_key_hash,
    };
  }

  /**
   * Sign a message with Dilithium secret key
   *
   * Performance target: <100ms for 32-byte message
   *
   * @param secretKey - Hex-encoded secret key
   * @param message - Hex-encoded message to sign
   * @returns Hex-encoded signature
   */
  sign(secretKey: string, message: string): string {
    this.ensureInitialized();
    return this.wasm!.sign(secretKey, message);
  }

  /**
   * Verify a Dilithium signature
   *
   * Performance target: <50ms for 32-byte message
   *
   * @param publicKey - Hex-encoded public key
   * @param message - Hex-encoded message
   * @param signature - Hex-encoded signature
   * @returns Verification result
   */
  verify(publicKey: string, message: string, signature: string): VerificationResult {
    this.ensureInitialized();

    const raw = this.wasm!.verify(publicKey, message, signature);
    return {
      valid: raw.valid,
      error: raw.error ?? undefined,
    };
  }

  /**
   * Compute SHA3-256 hash (CP-1 compliant)
   *
   * @param data - Hex-encoded data
   * @returns Hex-encoded hash
   */
  sha3Hash(data: string): string {
    this.ensureInitialized();
    return this.wasm!.sha3_256(data);
  }

  /**
   * Get public key hash (SHA3-256)
   *
   * @param publicKey - Hex-encoded public key
   * @returns Hex-encoded hash
   */
  getPublicKeyHash(publicKey: string): string {
    this.ensureInitialized();
    return this.wasm!.get_public_key_hash(publicKey);
  }

  /**
   * Get algorithm information
   *
   * @returns Algorithm details
   */
  getAlgorithmInfo(): AlgorithmInfo {
    this.ensureInitialized();

    const raw = this.wasm!.get_algorithm_info();
    return {
      name: raw.name,
      standard: raw.standard,
      securityLevel: raw.security_level,
      publicKeyBytes: raw.public_key_bytes,
      secretKeyBytes: raw.secret_key_bytes,
      signatureBytes: raw.signature_bytes,
      hashAlgorithm: raw.hash_algorithm,
    };
  }

  /**
   * Get WASM module version
   *
   * @returns Version string
   */
  getVersion(): string {
    this.ensureInitialized();
    return this.wasm!.get_version();
  }

  /**
   * Convert string to hex
   */
  static stringToHex(str: string): string {
    return Buffer.from(str, 'utf-8').toString('hex');
  }

  /**
   * Convert hex to string
   */
  static hexToString(hex: string): string {
    return Buffer.from(hex, 'hex').toString('utf-8');
  }

  /**
   * Convert bytes to hex
   */
  static bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Convert hex to bytes
   */
  static hexToBytes(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
  }
}
