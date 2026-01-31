/**
 * QuantumShieldClient Tests
 * 
 * TEST-SDK-003: TypeScript Unit Tests
 */

import { describe, it, expect } from 'vitest';
import { SECURITY_CONSTANTS } from '../src/types';

describe('Security Constants', () => {
  describe('Time Lock Values', () => {
    it('should have correct normal timelock (24 hours)', () => {
      expect(SECURITY_CONSTANTS.NORMAL_TIMELOCK).toBe(24 * 60 * 60);
      expect(SECURITY_CONSTANTS.NORMAL_TIMELOCK).toBe(86400);
    });

    it('should have correct emergency timelock (7 days)', () => {
      expect(SECURITY_CONSTANTS.EMERGENCY_TIMELOCK).toBe(7 * 24 * 60 * 60);
      expect(SECURITY_CONSTANTS.EMERGENCY_TIMELOCK).toBe(604800);
    });

    it('should have correct emergency timeout (72 hours)', () => {
      expect(SECURITY_CONSTANTS.EMERGENCY_TIMEOUT).toBe(72 * 60 * 60);
      expect(SECURITY_CONSTANTS.EMERGENCY_TIMEOUT).toBe(259200);
    });

    it('should have correct max pause duration (72 hours)', () => {
      expect(SECURITY_CONSTANTS.MAX_PAUSE_DURATION).toBe(72 * 60 * 60);
      expect(SECURITY_CONSTANTS.MAX_PAUSE_DURATION).toBe(259200);
    });

    it('should have correct defense period (48 hours)', () => {
      expect(SECURITY_CONSTANTS.DEFENSE_PERIOD).toBe(48 * 60 * 60);
      expect(SECURITY_CONSTANTS.DEFENSE_PERIOD).toBe(172800);
    });
  });

  describe('Bond Values', () => {
    it('should have correct minimum emergency bond (0.5 ETH)', () => {
      expect(SECURITY_CONSTANTS.MIN_EMERGENCY_BOND).toBe(BigInt('500000000000000000'));
    });

    it('should have correct emergency bond percentage (5%)', () => {
      expect(SECURITY_CONSTANTS.EMERGENCY_BOND_PERCENTAGE).toBe(5);
    });

    it('should have correct minimum challenge bond (0.1 ETH)', () => {
      expect(SECURITY_CONSTANTS.MIN_CHALLENGE_BOND).toBe(BigInt('100000000000000000'));
    });

    it('should have correct challenge bond percentage (1%)', () => {
      expect(SECURITY_CONSTANTS.CHALLENGE_BOND_PERCENTAGE).toBe(1);
    });
  });
});

describe('Bond Calculations', () => {
  // Test the bond calculation formulas
  
  describe('Emergency Bond: MAX(0.5 ETH, amount × 5%)', () => {
    const MIN_BOND = BigInt('500000000000000000'); // 0.5 ETH
    const PERCENTAGE = 5;

    const calculateEmergencyBond = (amount: bigint): bigint => {
      const percentageBond = (amount * BigInt(PERCENTAGE)) / BigInt(100);
      return percentageBond > MIN_BOND ? percentageBond : MIN_BOND;
    };

    it('should return minimum bond for small amounts', () => {
      const amount = BigInt('1000000000000000000'); // 1 ETH
      const bond = calculateEmergencyBond(amount);
      // 5% of 1 ETH = 0.05 ETH < 0.5 ETH minimum
      expect(bond).toBe(MIN_BOND);
    });

    it('should return 5% for amounts >= 10 ETH', () => {
      const amount = BigInt('10000000000000000000'); // 10 ETH
      const bond = calculateEmergencyBond(amount);
      // 5% of 10 ETH = 0.5 ETH = minimum
      expect(bond).toBe(BigInt('500000000000000000'));
    });

    it('should return 5% for large amounts', () => {
      const amount = BigInt('100000000000000000000'); // 100 ETH
      const bond = calculateEmergencyBond(amount);
      // 5% of 100 ETH = 5 ETH
      expect(bond).toBe(BigInt('5000000000000000000'));
    });
  });

  describe('Challenge Bond: MAX(0.1 ETH, amount × 1%)', () => {
    const MIN_BOND = BigInt('100000000000000000'); // 0.1 ETH
    const PERCENTAGE = 1;

    const calculateChallengeBond = (amount: bigint): bigint => {
      const percentageBond = (amount * BigInt(PERCENTAGE)) / BigInt(100);
      return percentageBond > MIN_BOND ? percentageBond : MIN_BOND;
    };

    it('should return minimum bond for small amounts', () => {
      const amount = BigInt('1000000000000000000'); // 1 ETH
      const bond = calculateChallengeBond(amount);
      // 1% of 1 ETH = 0.01 ETH < 0.1 ETH minimum
      expect(bond).toBe(MIN_BOND);
    });

    it('should return 1% for amounts >= 10 ETH', () => {
      const amount = BigInt('10000000000000000000'); // 10 ETH
      const bond = calculateChallengeBond(amount);
      // 1% of 10 ETH = 0.1 ETH = minimum
      expect(bond).toBe(BigInt('100000000000000000'));
    });

    it('should return 1% for large amounts', () => {
      const amount = BigInt('100000000000000000000'); // 100 ETH
      const bond = calculateChallengeBond(amount);
      // 1% of 100 ETH = 1 ETH
      expect(bond).toBe(BigInt('1000000000000000000'));
    });
  });
});

describe('Slashing Calculations', () => {
  describe('Quadratic Slashing: N² × 10%', () => {
    const calculateSlashingRate = (consecutiveFailures: number): number => {
      const rate = consecutiveFailures * consecutiveFailures * 10;
      return Math.min(rate, 100);
    };

    it('should return 10% for 1 failure', () => {
      expect(calculateSlashingRate(1)).toBe(10);
    });

    it('should return 40% for 2 failures', () => {
      expect(calculateSlashingRate(2)).toBe(40);
    });

    it('should return 90% for 3 failures', () => {
      expect(calculateSlashingRate(3)).toBe(90);
    });

    it('should cap at 100% for 4+ failures', () => {
      expect(calculateSlashingRate(4)).toBe(100);
      expect(calculateSlashingRate(5)).toBe(100);
      expect(calculateSlashingRate(10)).toBe(100);
    });

    it('should return 0% for 0 failures', () => {
      expect(calculateSlashingRate(0)).toBe(0);
    });
  });
});

describe('Time Remaining Calculations', () => {
  const formatTimeRemaining = (totalSeconds: number) => {
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return {
      totalSeconds,
      days,
      hours,
      minutes,
      seconds,
      expired: totalSeconds === 0,
    };
  };

  it('should format 24 hours correctly', () => {
    const result = formatTimeRemaining(86400);
    expect(result.days).toBe(1);
    expect(result.hours).toBe(0);
    expect(result.minutes).toBe(0);
    expect(result.seconds).toBe(0);
  });

  it('should format 7 days correctly', () => {
    const result = formatTimeRemaining(604800);
    expect(result.days).toBe(7);
    expect(result.hours).toBe(0);
    expect(result.minutes).toBe(0);
    expect(result.seconds).toBe(0);
  });

  it('should format mixed time correctly', () => {
    const result = formatTimeRemaining(90061); // 1d 1h 1m 1s
    expect(result.days).toBe(1);
    expect(result.hours).toBe(1);
    expect(result.minutes).toBe(1);
    expect(result.seconds).toBe(1);
  });

  it('should handle zero seconds (expired)', () => {
    const result = formatTimeRemaining(0);
    expect(result.expired).toBe(true);
  });

  it('should handle non-expired times', () => {
    const result = formatTimeRemaining(1);
    expect(result.expired).toBe(false);
  });
});
