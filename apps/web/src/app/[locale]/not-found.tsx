import { useTranslations } from 'next-intl';
import Link from 'next/link';

/**
 * Not Found Page - Displayed when a page route doesn't exist (404).
 * Can be a server component since it doesn't need error/reset props.
 */
export default function NotFound() {
  const t = useTranslations('common.notFound');

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-background px-4"
      role="main"
    >
      <div className="w-full max-w-md text-center">
        {/* 404 indicator */}
        <p className="mb-4 font-mono text-5xl font-bold text-gradient-hinomaru">
          {t('errorCode')}
        </p>

        {/* Title */}
        <h1 className="mb-3 text-2xl font-bold text-foreground">
          {t('title')}
        </h1>

        {/* Description */}
        <p className="mb-8 text-sm leading-relaxed text-foreground-secondary">
          {t('description')}
        </p>

        {/* Back to home */}
        <Link
          href="/"
          className="btn-primary inline-flex min-h-[44px] min-w-[44px] px-6 py-3 text-sm no-underline"
        >
          {t('backToHome')}
        </Link>
      </div>
    </div>
  );
}
