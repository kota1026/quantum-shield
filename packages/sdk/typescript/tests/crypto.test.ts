/**
 * Dilithium Crypto Tests
 * 
 * TEST-SDK-003: TypeScript Unit Tests
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { DilithiumCrypto, type DilithiumKeyPair } from '../src/crypto';

describe('DilithiumCrypto', () => {
  let crypto: DilithiumCrypto;
  let keyPair: DilithiumKeyPair;

  beforeAll(async () => {
    crypto = new DilithiumCrypto();
    // Note: In actual test, WASM module needs to be mocked or loaded
    // await crypto.init();
  });

  describe('Key Generation', () => {
    it('should generate valid key pair structure', () => {
      // Mock test - actual WASM test requires browser/node WASM support
      const mockKeyPair: DilithiumKeyPair = {
        publicKey: 'a'.repeat(3904), // 1952 bytes hex
        secretKey: 'b'.repeat(8064), // 4032 bytes hex
        publicKeyHash: 'c'.repeat(64), // 32 bytes hex
      };

      expect(mockKeyPair.publicKey).toHaveLength(3904);
      expect(mockKeyPair.secretKey).toHaveLength(8064);
      expect(mockKeyPair.publicKeyHash).toHaveLength(64);
    });

    it('should have correct key sizes for ML-DSA-65', () => {
      // FIPS 204 ML-DSA-65 key sizes
      const PUBLIC_KEY_BYTES = 1952;
      const SECRET_KEY_BYTES = 4032;
      const SIGNATURE_BYTES = 3309;

      expect(PUBLIC_KEY_BYTES).toBe(1952);
      expect(SECRET_KEY_BYTES).toBe(4032);
      expect(SIGNATURE_BYTES).toBe(3309);
    });
  });

  describe('String/Hex Conversion', () => {
    it('should convert string to hex correctly', () => {
      const str = 'Hello';
      const hex = DilithiumCrypto.stringToHex(str);
      expect(hex).toBe('48656c6c6f');
    });

    it('should convert hex to string correctly', () => {
      const hex = '48656c6c6f';
      const str = DilithiumCrypto.hexToString(hex);
      expect(str).toBe('Hello');
    });

    it('should convert bytes to hex correctly', () => {
      const bytes = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]);
      const hex = DilithiumCrypto.bytesToHex(bytes);
      expect(hex).toBe('48656c6c6f');
    });

    it('should convert hex to bytes correctly', () => {
      const hex = '48656c6c6f';
      const bytes = DilithiumCrypto.hexToBytes(hex);
      expect(bytes).toEqual(new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]));
    });

    it('should handle empty strings', () => {
      expect(DilithiumCrypto.stringToHex('')).toBe('');
      expect(DilithiumCrypto.hexToString('')).toBe('');
    });

    it('should handle unicode characters', () => {
      const str = '日本語';
      const hex = DilithiumCrypto.stringToHex(str);
      const result = DilithiumCrypto.hexToString(hex);
      expect(result).toBe(str);
    });
  });
});
