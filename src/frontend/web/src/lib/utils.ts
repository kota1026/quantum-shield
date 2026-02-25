import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with proper precedence
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format wallet address for display
 */
export function formatAddress(address: string, chars = 4): string {
  if (!address) return '';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Format ETH value with precision
 */
export function formatEth(value: string | number, decimals = 4): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return num.toFixed(decimals);
}

/**
 * Format number with locale-aware separators
 */
export function formatNumber(
  value: number,
  locale: string = 'ja-JP',
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(locale, options).format(value);
}

/**
 * Get timezone for locale
 * Japanese locale uses JST (Asia/Tokyo)
 */
function getTimezoneForLocale(locale: string): string {
  if (locale === 'ja' || locale === 'ja-JP' || locale.startsWith('ja')) {
    return 'Asia/Tokyo';
  }
  // For other locales, use browser's local timezone
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Format date with locale and appropriate timezone
 * Japanese locale automatically uses JST
 */
export function formatDate(
  date: Date | string | number,
  locale: string = 'ja-JP',
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === 'string' ? new Date(date) :
            typeof date === 'number' ? new Date(date) : date;

  const timezone = getTimezoneForLocale(locale);

  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: timezone,
    ...options,
  }).format(d);
}

/**
 * Format date and time with locale and appropriate timezone
 * Japanese locale automatically uses JST
 */
export function formatDateTime(
  date: Date | string | number,
  locale: string = 'ja-JP',
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === 'string' ? new Date(date) :
            typeof date === 'number' ? new Date(date) : date;

  const timezone = getTimezoneForLocale(locale);

  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezone,
    ...options,
  }).format(d);
}

/**
 * Format time only with locale and appropriate timezone
 * Japanese locale automatically uses JST
 */
export function formatTime(
  date: Date | string | number,
  locale: string = 'ja-JP',
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === 'string' ? new Date(date) :
            typeof date === 'number' ? new Date(date) : date;

  const timezone = getTimezoneForLocale(locale);

  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezone,
    ...options,
  }).format(d);
}

/**
 * Format relative time (e.g., "3 hours ago", "in 2 days")
 */
export function formatRelativeTime(
  date: Date | string | number,
  locale: string = 'ja-JP'
): string {
  const d = typeof date === 'string' ? new Date(date) :
            typeof date === 'number' ? new Date(date) : date;

  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHour = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHour / 24);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (Math.abs(diffDay) >= 1) {
    return rtf.format(diffDay, 'day');
  } else if (Math.abs(diffHour) >= 1) {
    return rtf.format(diffHour, 'hour');
  } else if (Math.abs(diffMin) >= 1) {
    return rtf.format(diffMin, 'minute');
  } else {
    return rtf.format(diffSec, 'second');
  }
}

/**
 * Calculate time remaining for timelock
 */
export function getTimelockRemaining(unlockDate: Date): {
  days: number;
  hours: number;
  minutes: number;
  isExpired: boolean;
} {
  const now = new Date();
  const diff = unlockDate.getTime() - now.getTime();

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, isExpired: true };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return { days, hours, minutes, isExpired: false };
}
