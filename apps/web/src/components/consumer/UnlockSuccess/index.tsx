'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, ArrowRight, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function UnlockSuccess() {
  const t = useTranslations('consumer.unlockSuccess');
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-success/10 to-transparent" />
      </div>

      <div className="relative z-10 text-center px-6 max-w-md w-full">
        {/* Success Icon */}
        <div className="relative w-32 h-32 mx-auto mb-8">
          <div className="absolute inset-0 bg-success/20 rounded-full animate-pulse" />
          <div className="absolute inset-4 bg-success/30 rounded-full" />
          <div className="absolute inset-8 bg-success rounded-full flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
        </div>

        <h1 className="text-2xl font-bold mb-3">{t('title')}</h1>
        <p className="text-sm text-muted-foreground mb-8">{t('subtitle')}</p>

        {/* Time Lock Info */}
        <div className={cn(
          'bg-surface border border-border rounded-qs-lg p-6 mb-8',
          'text-left'
        )}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gold/10 rounded-full flex items-center justify-center">
              <Clock className="w-5 h-5 text-gold" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{t('timeLock.title')}</p>
              <p className="text-xs text-muted-foreground">{t('timeLock.description')}</p>
            </div>
          </div>

          <div className="bg-background/50 rounded-qs p-4 mb-4">
            <p className="text-3xl font-bold text-gold text-center font-mono">
              23:59:59
            </p>
            <p className="text-xs text-muted-foreground text-center mt-1">
              {t('timeLock.remaining')}
            </p>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('details.amount')}</span>
              <span className="font-medium">10.00 ETH</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('details.estimatedCompletion')}</span>
              <span className="font-medium">2026-01-16 10:00</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('details.txHash')}</span>
              <a
                href="https://sepolia.etherscan.io/tx/0x8b4e...1d3f"
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-gold hover:underline"
              >
                0x8b4e...1d3f
              </a>
            </div>
          </div>
        </div>

        {/* Info Message */}
        <p className="text-xs text-muted-foreground mb-8 px-4">
          {t('info.message')}
        </p>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            variant="primary"
            fullWidth
            onClick={() => router.push('/consumer/history')}
          >
            {t('buttons.viewHistory')}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>

          <Link
            href="/consumer/dashboard"
            className={cn(
              'block w-full py-3 text-sm text-muted-foreground',
              'hover:text-foreground transition-colors'
            )}
          >
            {t('buttons.backToDashboard')}
          </Link>
        </div>
      </div>
    </div>
  );
}
