/**
 * Types Tests
 * 
 * TEST-SDK-003: TypeScript Unit Tests
 */

import { describe, it, expect } from 'vitest';
import { UnlockType, LockStatus, Network, SECURITY_CONSTANTS } from '../src/types';

describe('Enums', () => {
  describe('UnlockType', () => {
    it('should have correct values', () => {
      expect(UnlockType.Normal).toBe('normal');
      expect(UnlockType.Emergency).toBe('emergency');
    });
  });

  describe('LockStatus', () => {
    it('should have all expected statuses', () => {
      expect(LockStatus.Active).toBe('active');
      expect(LockStatus.Pending).toBe('pending');
      expect(LockStatus.Released).toBe('released');
      expect(LockStatus.Challenged).toBe('challenged');
      expect(LockStatus.Slashed).toBe('slashed');
    });
  });

  describe('Network', () => {
    it('should have correct network values', () => {
      expect(Network.Mainnet).toBe('mainnet');
      expect(Network.Sepolia).toBe('sepolia');
      expect(Network.Local).toBe('local');
    });
  });
});

describe('Security Constants Compliance', () => {
  it('should comply with SPEC_STRATEGY_BRIDGE §5 requirements', () => {
    // 24h Time Lock (Normal) - SEQ#2
    expect(SECURITY_CONSTANTS.NORMAL_TIMELOCK).toBe(24 * 60 * 60);
    
    // 7d Time Lock (Emergency) - SEQ#3
    expect(SECURITY_CONSTANTS.EMERGENCY_TIMELOCK).toBe(7 * 24 * 60 * 60);
    
    // Emergency Bond: MAX(0.5 ETH, amount × 5%) - SEQ#3
    expect(SECURITY_CONSTANTS.MIN_EMERGENCY_BOND).toBe(BigInt('500000000000000000'));
    expect(SECURITY_CONSTANTS.EMERGENCY_BOND_PERCENTAGE).toBe(5);
    
    // 72h Emergency Timeout - SEQ#3
    expect(SECURITY_CONSTANTS.EMERGENCY_TIMEOUT).toBe(72 * 60 * 60);
    
    // 72h Pause上限 - SEQ#8
    expect(SECURITY_CONSTANTS.MAX_PAUSE_DURATION).toBe(72 * 60 * 60);
    
    // Defense Period (48h)
    expect(SECURITY_CONSTANTS.DEFENSE_PERIOD).toBe(48 * 60 * 60);
  });
});
