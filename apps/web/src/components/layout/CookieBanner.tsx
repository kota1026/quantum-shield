'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CookieBannerProps {
  className?: string;
}

export function CookieBanner({ className }: CookieBannerProps) {
  const t = useTranslations('cookie');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already accepted cookies
    const hasAccepted = localStorage.getItem('cookie-consent');
    if (!hasAccepted) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:max-w-md z-50',
        'bg-surface border border-border rounded-qs-xl',
        'p-5 shadow-lg',
        className
      )}
      role="dialog"
      aria-label={t('ariaLabel')}
      aria-describedby="cookie-description"
    >
      <div className="flex items-start gap-4">
        <p id="cookie-description" className="flex-1 text-sm text-foreground-secondary">
          {t('message')}{' '}
          <a
            href="/cookie-policy"
            className="text-gold hover:text-gold-400 underline underline-offset-2"
          >
            {t('learnMore')}
          </a>
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={handleAccept}
            className="px-4 py-2 bg-hinomaru text-white text-sm font-medium rounded-qs hover:bg-hinomaru-400 transition-colors"
          >
            {t('accept')}
          </button>
          <button
            onClick={handleAccept}
            className="p-2 text-foreground-tertiary hover:text-foreground transition-colors"
            aria-label="Close cookie banner"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
