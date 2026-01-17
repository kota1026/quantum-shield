'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import {
  Coins,
  ArrowLeft,
  Check,
  Sparkles,
  Lock,
  Vote,
  Users,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TokenHubHeader } from '../Dashboard/TokenHubHeader';
import { Link } from '@/i18n/navigation';

// Demo data
const DEMO_CLAIMABLE = {
  total: 847,
  usdValue: 4235,
  breakdown: {
    veqsHolding: 620,
    votingParticipation: 127,
    delegationBonus: 100,
  },
};

export function RewardsClaim() {
  const t = useTranslations('token-hub.rewardsClaim');
  const tCommon = useTranslations('token-hub.common');
  const router = useRouter();
  const [isClaiming, setIsClaiming] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleClaim = useCallback(async () => {
    setIsClaiming(true);
    // Simulate transaction
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsClaiming(false);
    setIsSuccess(true);
  }, []);

  const handleDone = useCallback(() => {
    router.push('/token-hub/rewards');
  }, [router]);

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background pb-8">
        {/* Premium Background Effect */}
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

        <main className="relative z-10 max-w-[700px] mx-auto px-4 sm:px-6 pt-6" role="main">
          <TokenHubHeader />

          {/* Success Card */}
          <Card padding="none" className="overflow-hidden mt-8">
            <div className="p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-success" aria-hidden="true" />
              </div>

              <h1 className="text-2xl font-bold mb-2">{t('success.title')}</h1>
              <p className="text-foreground-secondary mb-6">{t('success.description')}</p>

              <div className="text-4xl font-bold font-mono text-gold mb-8">
                +{DEMO_CLAIMABLE.total.toLocaleString()} QS
              </div>

              <Button
                variant="gold"
                size="lg"
                onClick={handleDone}
                className="w-full"
              >
                {t('success.done')}
              </Button>
            </div>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Premium Background Effect */}
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

      <main className="relative z-10 max-w-[700px] mx-auto px-4 sm:px-6 pt-6" role="main">
        <TokenHubHeader />

        {/* Back Button */}
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-sm text-foreground-tertiary hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          {t('back')}
        </button>

        {/* Claim Card */}
        <Card padding="none" className="overflow-hidden">
          <div className="flex items-center gap-3 p-6 border-b border-border">
            <Coins className="w-5 h-5 text-gold" aria-hidden="true" />
            <h1 className="text-xl font-semibold">{t('title')}</h1>
          </div>

          <div className="p-6 space-y-6">
            {/* Total Claimable */}
            <div className="bg-gradient-to-br from-background-secondary to-gold/5 border border-gold rounded-xl p-6 text-center">
              <div className="flex items-center justify-center gap-2 text-sm text-foreground-secondary mb-2">
                <Sparkles className="w-4 h-4 text-gold" aria-hidden="true" />
                {t('claimable.label')}
              </div>
              <div className="text-4xl font-bold font-mono text-gold mb-1">
                {DEMO_CLAIMABLE.total.toLocaleString()} QS
              </div>
              <div className="text-sm text-foreground-secondary">
                {t('claimable.usdValue', { amount: DEMO_CLAIMABLE.usdValue.toLocaleString() })}
              </div>
            </div>

            {/* Breakdown */}
            <div>
              <h2 className="text-sm font-medium mb-4">{t('breakdown.title')}</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-4 bg-background-secondary rounded-xl">
                  <span className="text-sm text-foreground-secondary flex items-center gap-2">
                    <Lock className="w-4 h-4 text-gold" aria-hidden="true" />
                    {t('breakdown.veqsHolding')}
                  </span>
                  <span className="font-mono font-semibold text-gold">
                    {DEMO_CLAIMABLE.breakdown.veqsHolding} QS
                  </span>
                </div>

                <div className="flex justify-between items-center p-4 bg-background-secondary rounded-xl">
                  <span className="text-sm text-foreground-secondary flex items-center gap-2">
                    <Vote className="w-4 h-4 text-gold" aria-hidden="true" />
                    {t('breakdown.votingParticipation')}
                  </span>
                  <span className="font-mono font-semibold text-gold">
                    {DEMO_CLAIMABLE.breakdown.votingParticipation} QS
                  </span>
                </div>

                <div className="flex justify-between items-center p-4 bg-background-secondary rounded-xl">
                  <span className="text-sm text-foreground-secondary flex items-center gap-2">
                    <Users className="w-4 h-4 text-gold" aria-hidden="true" />
                    {t('breakdown.delegationBonus')}
                  </span>
                  <span className="font-mono font-semibold text-gold">
                    {DEMO_CLAIMABLE.breakdown.delegationBonus} QS
                  </span>
                </div>
              </div>
            </div>

            {/* Claim Button */}
            <Button
              variant="gold"
              size="lg"
              onClick={handleClaim}
              disabled={isClaiming}
              className="w-full"
            >
              {isClaiming ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" aria-hidden="true" />
                  {t('claiming')}
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" aria-hidden="true" />
                  {t('claimButton')}
                </>
              )}
            </Button>

            {/* Info Notice */}
            <p className="text-xs text-foreground-tertiary text-center">
              {t('notice')}
            </p>
          </div>
        </Card>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-border">
          <nav className="flex flex-wrap justify-center gap-4 md:gap-6 mb-4" aria-label={tCommon('footer.navLabel')}>
            <Link
              href="/consumer/terms"
              className="text-xs text-foreground-tertiary hover:text-gold transition-colors"
            >
              {tCommon('footer.terms')}
            </Link>
            <Link
              href="/consumer/privacy"
              className="text-xs text-foreground-tertiary hover:text-gold transition-colors"
            >
              {tCommon('footer.privacy')}
            </Link>
          </nav>
          <p className="text-xs text-foreground-tertiary text-center max-w-lg mx-auto">
            {tCommon('footer.disclaimer')}
          </p>
        </footer>
      </main>
    </div>
  );
}

export default RewardsClaim;
