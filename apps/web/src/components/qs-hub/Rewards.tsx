'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  ArrowLeft,
  Gift,
  Clock,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQSHubRewards } from '@/hooks/qs-hub/useQSHub';

export function QSHubRewards() {
  const t = useTranslations('qs-hub.rewards');
  const tCommon = useTranslations('qs-hub.common');
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);

  // Fetch rewards from API
  const { data: rewards, isLoading: rewardsLoading, error: rewardsError } = useQSHubRewards();

  const handleClaim = async () => {
    setIsClaiming(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsClaiming(false);
    setClaimSuccess(true);
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Background Effect */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
        <div
          className={cn(
            'absolute -top-24 left-1/2 -translate-x-1/2',
            'w-[800px] h-[500px]',
            'bg-[radial-gradient(ellipse,rgba(201,169,98,0.12),transparent_60%)]',
            'opacity-50'
          )}
        />
      </div>

      <main className="relative z-10 max-w-[1000px] mx-auto px-4 sm:px-6 pt-6" role="main">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <Link
            href="/qs-hub/dashboard"
            className="min-h-[44px] px-2 -ml-2 inline-flex items-center gap-2 text-sm text-foreground-secondary hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {tCommon('backToHome')}
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 relative flex items-center justify-center">
              <div
                className="absolute inset-0 border border-gold rounded-full animate-spin"
                style={{ animationDuration: '25s' }}
              />
              <div className="w-5 h-5 bg-hinomaru rounded-full shadow-glow-hinomaru" />
            </div>
            <div>
              <div className="text-sm font-semibold">Quantum Shield</div>
              <div className="text-[10px] text-gold tracking-wider">{tCommon('portalName')}</div>
            </div>
          </div>
        </header>

        {/* Page Title */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center">
            <Gift className="w-6 h-6 text-gold" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t('title')}</h1>
            <p className="text-sm text-foreground-secondary">{t('subtitle')}</p>
          </div>
        </div>

        {/* Stats */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8" aria-label={t('stats.ariaLabel')}>
          {rewardsLoading ? (
            <div className="col-span-full text-center py-8 text-foreground-tertiary">{t('loading')}</div>
          ) : rewardsError ? (
            <div className="col-span-full text-center py-8 text-warning">{t('error')}</div>
          ) : (
            <>
              <Card className="p-5 border-gold/30 bg-gradient-to-br from-gold/5 to-transparent">
                <div className="text-xs text-foreground-tertiary mb-1">{t('stats.claimable')}</div>
                <div className="text-2xl font-bold text-gold">{rewards?.claimable ?? 0} ETH</div>
              </Card>
              <Card className="p-5">
                <div className="text-xs text-foreground-tertiary mb-1">{t('stats.pending')}</div>
                <div className="text-2xl font-bold">-</div>
                <div className="text-xs text-foreground-tertiary mt-1">
                  {t('stats.nextEpoch', { time: rewards?.nextEpoch ?? '-' })}
                </div>
              </Card>
              <Card className="p-5">
                <div className="text-xs text-foreground-tertiary mb-1">{t('stats.totalClaimed')}</div>
                <div className="text-2xl font-bold">-</div>
              </Card>
              <Card className="p-5 flex flex-col justify-center">
                {claimSuccess ? (
                  <div className="flex items-center gap-2 text-success">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-medium">{t('claim.success')}</span>
                  </div>
                ) : (
                  <Button
                    variant="primary"
                    onClick={handleClaim}
                    disabled={isClaiming || (rewards?.claimable ?? 0) === 0}
                    className="w-full"
                  >
                    {isClaiming ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {t('claim.claiming')}
                      </>
                    ) : (
                      t('claim.button')
                    )}
                  </Button>
                )}
              </Card>
            </>
          )}
        </section>

        {/* Epoch Progress */}
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">{t('epoch.title')}</h2>
            <Badge variant="gold">Epoch 47</Badge>
          </div>
          <div className="mb-2">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-foreground-secondary">{t('epoch.progress')}</span>
              <span>72%</span>
            </div>
            <div className="h-2 bg-surface rounded-full overflow-hidden">
              <div
                className="h-full bg-gold rounded-full transition-all duration-500"
                style={{ width: '72%' }}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-foreground-tertiary">
            <Clock className="w-4 h-4" />
            <span>{t('epoch.endsIn', { time: rewards?.nextEpoch ?? '-' })}</span>
          </div>
        </Card>

        {/* Rewards History */}
        <section aria-labelledby="history-heading">
          <h2 id="history-heading" className="text-lg font-semibold mb-4">
            {t('history.title')}
          </h2>

          <div className="text-center py-8 text-foreground-tertiary">
            {t('history.empty')}
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-border text-center">
          <p className="text-xs text-foreground-tertiary">
            © 2024 Quantum Shield. All rights reserved.
          </p>
        </footer>
      </main>
    </div>
  );
}

export default QSHubRewards;
