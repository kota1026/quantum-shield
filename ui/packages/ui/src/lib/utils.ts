import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge class names with tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format Ethereum address for display
 * 
 * Design spec: Display addresses in truncated form for UI readability
 * 
 * @param address - Full Ethereum address (e.g., "0x1234567890abcdef...")
 * @param chars - Number of characters to show on each side (default: 4)
 * @returns Formatted address like "0x1234...5678"
 *          Returns empty string for empty input
 *          Returns original if address is too short to meaningfully truncate
 */
export function formatAddress(address: string, chars = 4): string {
  if (!address) return '';
  // Minimum meaningful length: 0x + chars + ... + chars = 2 + chars + 3 + chars
  const minLength = 2 + chars + 3 + chars;
  if (address.length <= minLength) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Format amount for display (human-readable units)
 * 
 * Design spec: Display amounts in human-readable format
 * Note: This function expects amounts already converted from Wei
 * For Wei conversion, use weiToEth function
 * 
 * @param amount - Amount in display units (e.g., ETH, not Wei)
 * @param decimals - Number of decimal places to display (default: 4)
 * @returns Formatted string with fixed decimal places
 */
export function formatAmount(
  amount: string | number,
  decimals = 4
): string {
  const value = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(value)) return '0.0000';
  return value.toFixed(decimals);
}

/**
 * Format duration in seconds to human-readable string
 * 
 * Design spec (from CORE_PRINCIPLES.md):
 * - Normal Time Lock: 24 hours (86400 seconds) → "1d"
 * - Emergency Time Lock: 7 days (604800 seconds) → "7d"
 * 
 * Used by TimeLockCountdown component to display remaining time
 * 
 * @param seconds - Duration in seconds (must be >= 0)
 * @returns Formatted string like "1d", "2h 30m", "45s"
 *          Returns "0s" for zero or negative values
 */
export function formatDuration(seconds: number): string {
  // Handle zero or negative (countdown should never be negative)
  if (seconds <= 0) return '0s';

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  // Only show seconds if:
  // 1. No larger units (pure seconds), OR
  // 2. There are remaining seconds and we're under 1 day (for precision in short countdowns)
  if (parts.length === 0 || (secs > 0 && days === 0)) {
    parts.push(`${secs}s`);
  }

  return parts.join(' ');
}

/**
 * Convert Wei to ETH
 * 
 * @param wei - Amount in Wei (as string or bigint)
 * @returns Amount in ETH
 */
export function weiToEth(wei: string | bigint): number {
  const value = typeof wei === 'string' ? BigInt(wei) : wei;
  return Number(value) / 1e18;
}
