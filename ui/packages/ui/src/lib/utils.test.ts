import { describe, it, expect } from 'vitest';
import { cn, formatAddress, formatAmount, formatDuration } from './utils';

describe('cn', () => {
  it('should merge class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('should handle conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
  });

  it('should merge tailwind classes correctly', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });
});

describe('formatAddress', () => {
  it('should format a full address', () => {
    const address = '0x1234567890abcdef1234567890abcdef12345678';
    expect(formatAddress(address)).toBe('0x1234...5678');
  });

  it('should handle custom char length', () => {
    const address = '0x1234567890abcdef1234567890abcdef12345678';
    expect(formatAddress(address, 6)).toBe('0x123456...345678');
  });

  it('should return empty string for empty input', () => {
    expect(formatAddress('')).toBe('');
  });

  it('should return short addresses unchanged', () => {
    expect(formatAddress('0x1234')).toBe('0x1234');
  });
});

describe('formatAmount', () => {
  it('should format number with default decimals', () => {
    expect(formatAmount(1.23456789)).toBe('1.2346');
  });

  it('should format string amount', () => {
    expect(formatAmount('1.5')).toBe('1.5000');
  });

  it('should handle custom decimals', () => {
    expect(formatAmount(1.23456789, 2)).toBe('1.23');
  });
});

describe('formatDuration', () => {
  it('should format seconds', () => {
    expect(formatDuration(45)).toBe('45s');
  });

  it('should format minutes', () => {
    expect(formatDuration(125)).toBe('2m 5s');
  });

  it('should format hours', () => {
    expect(formatDuration(3665)).toBe('1h 1m 5s');
  });

  it('should format days', () => {
    expect(formatDuration(90061)).toBe('1d 1h 1m');
  });

  it('should handle 24 hours (normal time lock)', () => {
    expect(formatDuration(86400)).toBe('1d');
  });

  it('should handle 7 days (emergency time lock)', () => {
    expect(formatDuration(604800)).toBe('7d');
  });

  it('should return 0s for zero or negative', () => {
    expect(formatDuration(0)).toBe('0s');
    expect(formatDuration(-10)).toBe('0s');
  });
});
