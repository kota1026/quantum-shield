/**
 * React Hooks Tests
 * 
 * TEST-SDK-004: React Hooks Tests
 */

import { describe, it, expect } from 'vitest';

// Note: Full React testing requires @testing-library/react setup
// These are structure/type tests

describe('React Hooks Structure', () => {
  describe('useQuantumShield', () => {
    it('should export from index', async () => {
      // Import test - verifies module structure
      const module = await import('../src/index');
      expect(module.useQuantumShield).toBeDefined();
    });
  });

  describe('useLock', () => {
    it('should export from index', async () => {
      const module = await import('../src/index');
      expect(module.useLock).toBeDefined();
    });
  });

  describe('useUnlock', () => {
    it('should export from index', async () => {
      const module = await import('../src/index');
      expect(module.useUnlock).toBeDefined();
    });
  });

  describe('useDilithium', () => {
    it('should export from index', async () => {
      const module = await import('../src/index');
      expect(module.useDilithium).toBeDefined();
    });
  });

  describe('useWallet', () => {
    it('should export from index', async () => {
      const module = await import('../src/index');
      expect(module.useWallet).toBeDefined();
    });
  });

  describe('useTimeLock', () => {
    it('should export from index', async () => {
      const module = await import('../src/index');
      expect(module.useTimeLock).toBeDefined();
    });
  });

  describe('QuantumShieldProvider', () => {
    it('should export from index', async () => {
      const module = await import('../src/index');
      expect(module.QuantumShieldProvider).toBeDefined();
    });
  });
});
