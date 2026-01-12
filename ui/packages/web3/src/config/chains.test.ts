import { describe, it, expect } from 'vitest';
import { 
  CHAIN_IDS, 
  getChainConfig, 
  isChainSupported,
  sepolia,
  aegisL3,
  SUPPORTED_CHAINS 
} from './chains';

/**
 * Chain configuration tests
 * 
 * Design spec (CURRENT_STATE.md):
 * - Network: L1 Sepolia (11155111) ↔ L3 Aegis (3311155111)
 */

describe('CHAIN_IDS', () => {
  it('should have correct Sepolia chain ID', () => {
    expect(CHAIN_IDS.SEPOLIA).toBe(11155111);
  });

  it('should have correct Aegis L3 chain ID', () => {
    expect(CHAIN_IDS.AEGIS_L3).toBe(3311155111);
  });
});

describe('Chain configs', () => {
  it('should have valid sepolia config', () => {
    expect(sepolia.id).toBe(CHAIN_IDS.SEPOLIA);
    expect(sepolia.name).toBe('Sepolia');
    expect(sepolia.testnet).toBe(true);
  });

  it('should have valid aegisL3 config', () => {
    expect(aegisL3.id).toBe(CHAIN_IDS.AEGIS_L3);
    expect(aegisL3.name).toBe('Aegis L3');
    expect(aegisL3.testnet).toBe(true);
  });
});

describe('SUPPORTED_CHAINS', () => {
  it('should include both chains', () => {
    expect(SUPPORTED_CHAINS).toHaveLength(2);
  });

  it('should include Sepolia (L1)', () => {
    const sepoliaChain = SUPPORTED_CHAINS.find(c => c.id === CHAIN_IDS.SEPOLIA);
    expect(sepoliaChain).toBeDefined();
    expect(sepoliaChain?.name).toBe('Sepolia');
  });

  it('should include Aegis L3', () => {
    const aegisChain = SUPPORTED_CHAINS.find(c => c.id === CHAIN_IDS.AEGIS_L3);
    expect(aegisChain).toBeDefined();
    expect(aegisChain?.name).toBe('Aegis L3');
  });
});

describe('getChainConfig', () => {
  it('should return sepolia config for sepolia chain ID', () => {
    const config = getChainConfig(CHAIN_IDS.SEPOLIA);
    expect(config?.id).toBe(CHAIN_IDS.SEPOLIA);
    expect(config?.name).toBe('Sepolia');
  });

  it('should return aegisL3 config for aegis chain ID', () => {
    const config = getChainConfig(CHAIN_IDS.AEGIS_L3);
    expect(config?.id).toBe(CHAIN_IDS.AEGIS_L3);
    expect(config?.name).toBe('Aegis L3');
  });

  it('should return undefined for unknown chain ID', () => {
    const config = getChainConfig(999999);
    expect(config).toBeUndefined();
  });
});

describe('isChainSupported', () => {
  it('should return true for Sepolia', () => {
    expect(isChainSupported(CHAIN_IDS.SEPOLIA)).toBe(true);
  });

  it('should return true for Aegis L3', () => {
    expect(isChainSupported(CHAIN_IDS.AEGIS_L3)).toBe(true);
  });

  it('should return false for Ethereum mainnet', () => {
    expect(isChainSupported(1)).toBe(false);
  });

  it('should return false for unknown chain', () => {
    expect(isChainSupported(999999)).toBe(false);
  });
});
