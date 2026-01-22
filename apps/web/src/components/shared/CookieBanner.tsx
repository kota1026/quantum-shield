'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CookieBannerProps {
  /** Cookie policy URL - defaults to /cookie-policy.html */
  policyUrl?: string;
  /** Position of the banner */
  position?: 'bottom-left' | 'bottom-right' | 'bottom-center';
  /** Custom class name */
  className?: string;
}

/**
 * Shared Cookie Banner component for GDPR compliance
 * Displays a cookie consent notice with accept and dismiss options
 *
 * Usage:
 * <CookieBanner />
 * <CookieBanner position="bottom-right" />
 */
export function CookieBanner({
  policyUrl = '/cookie-policy.html',
  position = 'bottom-left',
  className,
}: CookieBannerProps) {
  const t = useTranslations('common.cookie');
  const [isVisible, setIsVisible] = useState(false);

  // Check if user has already accepted cookies
  useEffect(() => {
    const hasAccepted = localStorage.getItem('cookie-consent');
    if (!hasAccepted) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  const positionClasses = {
    'bottom-left': 'left-6 right-6 md:right-auto',
    'bottom-right': 'right-6 left-6 md:left-auto',
    'bottom-center': 'left-1/2 -translate-x-1/2',
  };

  return (
    <div
      className={cn(
        'fixed bottom-6 max-w-md bg-surface border border-border rounded-xl p-5 flex items-center gap-5 z-50 shadow-lg',
        positionClasses[position],
        className
      )}
      role="alertdialog"
      aria-modal="false"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-desc"
    >
      <p id="cookie-banner-title" className="sr-only">
        Cookie Consent
      </p>
      <p id="cookie-banner-desc" className="flex-1 text-sm text-foreground-secondary">
        {t('message')}{' '}
        <a
          href={policyUrl}
          className="text-gold hover:underline focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-surface rounded"
        >
          {t('details')}
        </a>
      </p>
      <Button
        variant="primary"
        size="sm"
        onClick={handleAccept}
        aria-label={t('accept')}
      >
        {t('accept')}
      </Button>
      <button
        onClick={handleDismiss}
        className="text-foreground-tertiary hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-hinomaru focus:ring-offset-2 focus:ring-offset-surface rounded"
        aria-label={t('close')}
        type="button"
      >
        <X className="w-5 h-5" aria-hidden="true" />
      </button>
    </div>
  );
}

export default CookieBanner;
