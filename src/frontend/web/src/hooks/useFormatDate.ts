/**
 * Hook for locale-aware date formatting
 *
 * Automatically uses current locale and appropriate timezone:
 * - ja/ja-JP: JST (Asia/Tokyo)
 * - Other locales: Browser's local timezone
 */

import { useLocale } from 'next-intl';
import { useCallback, useMemo } from 'react';
import { formatDate, formatDateTime, formatTime, formatRelativeTime } from '@/lib/utils';

export function useFormatDate() {
  const locale = useLocale();

  // Map next-intl locale to Intl locale
  const intlLocale = useMemo(() => {
    if (locale === 'ja') return 'ja-JP';
    if (locale === 'en') return 'en-US';
    return locale;
  }, [locale]);

  const date = useCallback(
    (value: Date | string | number, options?: Intl.DateTimeFormatOptions) => {
      return formatDate(value, intlLocale, options);
    },
    [intlLocale]
  );

  const dateTime = useCallback(
    (value: Date | string | number, options?: Intl.DateTimeFormatOptions) => {
      return formatDateTime(value, intlLocale, options);
    },
    [intlLocale]
  );

  const time = useCallback(
    (value: Date | string | number, options?: Intl.DateTimeFormatOptions) => {
      return formatTime(value, intlLocale, options);
    },
    [intlLocale]
  );

  const relative = useCallback(
    (value: Date | string | number) => {
      return formatRelativeTime(value, intlLocale);
    },
    [intlLocale]
  );

  return {
    /** Format date only (e.g., "2024年1月15日") */
    date,
    /** Format date and time (e.g., "2024年1月15日 14:30") */
    dateTime,
    /** Format time only (e.g., "14:30") */
    time,
    /** Format relative time (e.g., "3時間前", "2日後") */
    relative,
    /** Current locale */
    locale: intlLocale,
  };
}
