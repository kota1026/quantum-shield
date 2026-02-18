'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

/**
 * Error Page - Catches runtime errors within the locale layout.
 * Rendered inside the locale layout, so i18n and styling are available.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('common.error');
  const router = useRouter();

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-background px-4"
      role="alert"
      aria-live="assertive"
    >
      <div className="w-full max-w-md text-center">
        {/* Error icon */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-hinomaru shadow-glow-hinomaru">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-white"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        {/* Title */}
        <h1 className="mb-3 text-2xl font-bold text-foreground">
          {t('title')}
        </h1>

        {/* Description */}
        <p className="mb-6 text-sm leading-relaxed text-foreground-secondary">
          {t('description')}
        </p>

        {/* Error digest code */}
        {error.digest && (
          <p className="mb-6 font-mono text-xs text-foreground-tertiary">
            {t('errorCode')}: {error.digest}
          </p>
        )}

        {/* Action buttons */}
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={() => reset()}
            className="btn-primary min-h-[44px] min-w-[44px] px-6 py-3 text-sm"
          >
            {t('retry')}
          </button>
          <button
            onClick={() => router.push('/')}
            className="btn-secondary min-h-[44px] min-w-[44px] px-6 py-3 text-sm"
          >
            {t('backToHome')}
          </button>
        </div>

        {/* Support message */}
        <p className="mt-8 text-xs text-foreground-tertiary">
          {t('support')}
        </p>
      </div>
    </div>
  );
}
