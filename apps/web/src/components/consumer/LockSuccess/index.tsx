'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Check, Copy, CheckCircle, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function LockSuccess() {
  const t = useTranslations('consumer.lockSuccess');
  const searchParams = useSearchParams();
  const [copied, setCopied] = useState(false);

  // Get data from URL params or use defaults
  const amount = searchParams.get('amount') || '0';
  const txHash = searchParams.get('txHash') || '0x7a3f...9c2d';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(txHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error('Failed to copy');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-success/15 to-transparent" />
      </div>

      <main role="main" className="relative z-10 text-center px-6 max-w-md w-full">
        {/* Success Icon */}
        <div className="relative w-32 h-32 mx-auto mb-8">
          <div className="absolute inset-0 bg-gradient-radial from-success/20 to-transparent rounded-full" />
          <div className="absolute inset-4 bg-success/20 rounded-full flex items-center justify-center">
            <div className="w-16 h-16 bg-success rounded-full flex items-center justify-center">
              <Check className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        <h1 className="text-2xl font-bold mb-3">{t('title')}</h1>
        <p className="text-sm text-foreground-secondary mb-8">{t('subtitle')}</p>

        {/* Lock Details Card */}
        <div className="bg-surface border border-border rounded-qs-lg p-5 mb-8 text-left">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Lock className="w-4 h-4 text-gold" aria-hidden="true" />
              {t('details.title')}
            </h2>
            <Badge variant="gold" className="flex items-center gap-1">
              <Lock className="w-3 h-3" aria-hidden="true" />
              {t('details.status')}
            </Badge>
          </div>

          <div className="space-y-3">
            {/* Lock ID / Tx Hash */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-foreground-secondary">{t('details.lockId')}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono text-foreground truncate max-w-[160px]" title={txHash}>
                  {txHash.length > 20 ? `${txHash.slice(0, 10)}...${txHash.slice(-8)}` : txHash}
                </span>
                <button
                  onClick={handleCopy}
                  className={cn(
                    'min-w-[44px] min-h-[44px] flex items-center justify-center rounded-qs transition-colors -m-2 flex-shrink-0',
                    'hover:bg-surface-secondary',
                    copied ? 'text-success' : 'text-foreground-secondary hover:text-foreground'
                  )}
                  aria-label={copied ? t('details.copied') : t('details.copy')}
                >
                  {copied ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Amount */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-foreground-secondary">{t('details.amount')}</span>
              <span className="text-lg font-semibold text-foreground">{amount} ETH</span>
            </div>

            {/* Unlock Info */}
            <div className="flex justify-between items-center pt-3 border-t border-border">
              <span className="text-sm text-foreground-secondary">{t('details.unlockWait')}</span>
              <span className="font-medium text-gold">{t('details.unlockWaitValue')}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <Button asChild variant="primary" fullWidth size="lg">
            <Link href="/consumer/dashboard">{t('buttons.backToDashboard')}</Link>
          </Button>
          <Button asChild variant="outline" fullWidth>
            <Link href="/consumer/history">{t('buttons.viewHistory')}</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
