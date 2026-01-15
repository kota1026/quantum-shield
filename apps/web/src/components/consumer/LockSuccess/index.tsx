'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Check, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function LockSuccess() {
  const t = useTranslations('consumer.lockSuccess');

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-success/15 to-transparent" />
      </div>

      <div className="relative z-10 text-center px-6 max-w-md w-full">
        <div className="relative w-32 h-32 mx-auto mb-8">
          <div className="absolute inset-0 bg-gradient-radial from-success/20 to-transparent rounded-full" />
          <div className="absolute inset-4 bg-success/20 rounded-full flex items-center justify-center">
            <div className="w-16 h-16 bg-success rounded-full flex items-center justify-center">
              <Check className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        <h1 className="text-2xl font-bold mb-3">{t('title')}</h1>
        <p className="text-sm text-muted-foreground mb-8">{t('subtitle')}</p>

        <div className="bg-card/50 border border-border-subtle rounded-qs p-4 mb-8">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm text-muted-foreground">{t('details.amount')}</span>
            <span className="text-lg font-semibold">5.00 ETH</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">{t('details.txHash')}</span>
            <a
              href="https://sepolia.etherscan.io/tx/0x7a3f...9c2d"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-mono text-gold hover:underline"
            >
              0x7a3f...9c2d
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Button asChild variant="outline" className="w-full">
            <Link href="/consumer/history">{t('buttons.viewHistory')}</Link>
          </Button>
          <Button asChild variant="default" className="w-full">
            <Link href="/consumer/dashboard">{t('buttons.backToDashboard')}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
