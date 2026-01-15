'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Clock, CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function UnlockSuccess() {
  const t = useTranslations('consumer.unlockSuccess');

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-gold/15 to-transparent" />
      </div>

      <div className="relative z-10 text-center px-6 max-w-md w-full">
        {/* Success Icon */}
        <div className="relative w-32 h-32 mx-auto mb-8">
          <div className="absolute inset-0 bg-success/20 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
          <div className="relative w-full h-full bg-success rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.4)]">
            <CheckCircle className="w-16 h-16 text-white" />
          </div>
        </div>

        <h1 className="text-2xl font-bold mb-3">{t('title')}</h1>
        <p className="text-sm text-foreground-secondary mb-8">{t('subtitle')}</p>

        {/* Time Lock Info Card */}
        <div className={cn(
          'p-6 rounded-qs-lg border border-gold/30 bg-gold/5 mb-8'
        )}>
          <div className="flex items-center justify-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-gold" />
            <span className="text-sm font-semibold text-gold">{t('timelock.title')}</span>
          </div>

          <div className="text-4xl font-bold text-foreground mb-2 font-mono">
            23:59:59
          </div>
          <p className="text-xs text-foreground-secondary">{t('timelock.label')}</p>
        </div>

        {/* Details */}
        <div className="space-y-3 mb-8 text-left">
          <div className="flex justify-between items-center p-3 bg-surface rounded-qs">
            <span className="text-sm text-foreground-secondary">{t('details.amount')}</span>
            <span className="text-sm font-semibold text-foreground">10.00 ETH</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-surface rounded-qs">
            <span className="text-sm text-foreground-secondary">{t('details.estimatedCompletion')}</span>
            <span className="text-sm font-medium text-foreground">2026-01-16 12:00</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-surface rounded-qs">
            <span className="text-sm text-foreground-secondary">{t('details.txHash')}</span>
            <a
              href="https://sepolia.etherscan.io/tx/0x8b4e...1d3f"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gold hover:underline font-mono"
            >
              0x8b4e...1d3f
            </a>
          </div>
        </div>

        {/* Info */}
        <div className="p-4 bg-surface-secondary rounded-qs mb-8">
          <p className="text-xs text-foreground-secondary leading-relaxed">
            {t('info.message')}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link href="/consumer/history" className="block">
            <Button variant="secondary" fullWidth>
              {t('buttons.viewHistory')}
            </Button>
          </Link>
          <Link href="/consumer/dashboard" className="block">
            <Button variant="primary" fullWidth>
              {t('buttons.backToDashboard')}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
