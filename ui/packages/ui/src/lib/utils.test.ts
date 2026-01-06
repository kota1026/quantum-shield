import { describe, it, expect } from 'vitest';
import { cn, formatAddress, formatAmount, formatDuration, weiToEth } from './utils';

describe('cn (class name merge)', () => {
  it('should merge multiple class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('should handle conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
  });

  it('should merge conflicting tailwind classes (last wins)', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });

  it('should handle undefined and null', () => {
    expect(cn('foo', undefined, null, 'bar')).toBe('foo bar');
  });
});

describe('formatAddress', () => {
  const fullAddress = '0x1234567890abcdef1234567890abcdef12345678';

  it('should truncate standard 42-char Ethereum address', () => {
    expect(formatAddress(fullAddress)).toBe('0x1234...5678');
  });

  it('should respect custom chars parameter', () => {
    expect(formatAddress(fullAddress, 6)).toBe('0x123456...345678');
  });

  it('should return empty string for empty input', () => {
    expect(formatAddress('')).toBe('');
  });

  it('should return short addresses unchanged (too short to truncate meaningfully)', () => {
    // "0x1234" is 6 chars, minLength = 2+4+3+4 = 13, so 6 < 13 → return as-is
    expect(formatAddress('0x1234')).toBe('0x1234');
  });

  it('should handle edge case: exact minimum length', () => {
    // With chars=4: minLength = 13, address of length 13 should return as-is
    const addr = '0x1234567890a'; // 13 chars
    expect(formatAddress(addr)).toBe(addr);
  });
});

describe('formatAmount', () => {
  it('should format number with default 4 decimals', () => {
    expect(formatAmount(1.23456789)).toBe('1.2346');
  });

  it('should format string input', () => {
    expect(formatAmount('1.5')).toBe('1.5000');
  });

  it('should respect custom decimal places', () => {
    expect(formatAmount(1.23456789, 2)).toBe('1.23');
  });

  it('should handle zero', () => {
    expect(formatAmount(0)).toBe('0.0000');
  });

  it('should handle NaN gracefully', () => {
    expect(formatAmount('invalid')).toBe('0.0000');
  });

  it('should handle large numbers', () => {
    expect(formatAmount(1000000.123456, 2)).toBe('1000000.12');
  });
});

describe('formatDuration (Time Lock display)', () => {
  // From CORE_PRINCIPLES.md:
  // - Normal Time Lock: 24 hours (86400 seconds)
  // - Emergency Time Lock: 7 days (604800 seconds)

  describe('Core Principles compliance', () => {
    it('should format Normal Time Lock (24 hours = 86400s) as "1d"', () => {
      expect(formatDuration(86400)).toBe('1d');
    });

    it('should format Emergency Time Lock (7 days = 604800s) as "7d"', () => {
      expect(formatDuration(604800)).toBe('7d');
    });
  });

  describe('countdown scenarios', () => {
    it('should format seconds only', () => {
      expect(formatDuration(45)).toBe('45s');
    });

    it('should format minutes and seconds', () => {
      expect(formatDuration(125)).toBe('2m 5s');
    });

    it('should format hours, minutes, and seconds', () => {
      expect(formatDuration(3665)).toBe('1h 1m 5s');
    });

    it('should format days and hours (no seconds for longer periods)', () => {
      // 1 day + 1 hour + 1 minute + 1 second = 90061 seconds
      // For periods >= 1 day, we omit seconds for cleaner display
      expect(formatDuration(90061)).toBe('1d 1h 1m');
    });

    it('should handle exact hour boundaries', () => {
      expect(formatDuration(3600)).toBe('1h');
    });

    it('should handle exact day boundaries', () => {
      expect(formatDuration(172800)).toBe('2d');
    });
  });

  describe('edge cases', () => {
    it('should return "0s" for zero', () => {
      expect(formatDuration(0)).toBe('0s');
    });

    it('should return "0s" for negative values (countdown never negative)', () => {
      expect(formatDuration(-10)).toBe('0s');
    });

    it('should handle very small positive values', () => {
      expect(formatDuration(1)).toBe('1s');
    });
  });
});

describe('weiToEth', () => {
  it('should convert Wei string to ETH', () => {
    expect(weiToEth('1000000000000000000')).toBe(1);
  });

  it('should convert Wei bigint to ETH', () => {
    expect(weiToEth(BigInt('1000000000000000000'))).toBe(1);
  });

  it('should handle fractional ETH', () => {
    expect(weiToEth('500000000000000000')).toBe(0.5);
  });
});
