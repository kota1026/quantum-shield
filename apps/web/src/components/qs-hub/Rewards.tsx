'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  ArrowLeft,
  Gift,
  Coins,
  TrendingUp,
  Clock,
  CheckCircle2,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Demo data
const DEMO_REWARDS = {
  claimable: 0.85,
  pending: 0.32,
  totalClaimed: 12.45,
  nextEpoch: '2d 14h',
};

const DEMO_HISTORY = [
  {
    id: '1',
    type: 'protocol_fee' as const,
    amount: 0.25,
    status: 'claimable' as const,
    epoch: 'Epoch 47',
    date: '2024-01-21',
  },
  {
    id: '2',
    type: 'voting_reward' as const,
    amount: 0.35,
    status: 'claimable' as const,
    epoch: 'Epoch 47',
    date: '2024-01-21',
  },
  {
    id: '3',
    type: 'staking_bonus' as const,
    amount: 0.25,
    status: 'claimable' as const,
    epoch: 'Epoch 47',
    date: '2024-01-21',
  },
  {
    id: '4',
    type: 'protocol_fee' as const,
    amount: 0.42,
    status: 'claimed' as const,
    epoch: 'Epoch 46',
    date: '2024-01-14',
    txHash: '0x1234...5678',
  },
  {
    id: '5',
    type: 'voting_reward' as const,
    amount: 0.55,
    status: 'claimed' as const,
    epoch: 'Epoch 46',
    date: '2024-01-14',
    txHash: '0x1234...5678',
  },
];

const typeIcons = {
  protocol_fee: Coins,
  voting_reward: Gift,
  staking_bonus: TrendingUp,
};

const typeColors = {
  protocol_fee: 'bg-gold/10 text-gold',
  voting_reward: 'bg-success/10 text-success',
  staking_bonus: 'bg-hinomaru/10 text-hinomaru',
};

export function QSHubRewards() {
  const t = useTranslations('qs-hub.rewards');
  const tCommon = useTranslations('qs-hub.common');
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);

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
            className="flex items-center gap-2 text-sm text-foreground-secondary hover:text-foreground transition-colors"
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
          <Card className="p-5 border-gold/30 bg-gradient-to-br from-gold/5 to-transparent">
            <div className="text-xs text-foreground-tertiary mb-1">{t('stats.claimable')}</div>
            <div className="text-2xl font-bold text-gold">{DEMO_REWARDS.claimable} ETH</div>
          </Card>
          <Card className="p-5">
            <div className="text-xs text-foreground-tertiary mb-1">{t('stats.pending')}</div>
            <div className="text-2xl font-bold">{DEMO_REWARDS.pending} ETH</div>
            <div className="text-xs text-foreground-tertiary mt-1">
              {t('stats.nextEpoch', { time: DEMO_REWARDS.nextEpoch })}
            </div>
          </Card>
          <Card className="p-5">
            <div className="text-xs text-foreground-tertiary mb-1">{t('stats.totalClaimed')}</div>
            <div className="text-2xl font-bold">{DEMO_REWARDS.totalClaimed} ETH</div>
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
                disabled={isClaiming || DEMO_REWARDS.claimable === 0}
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
            <span>{t('epoch.endsIn', { time: DEMO_REWARDS.nextEpoch })}</span>
          </div>
        </Card>

        {/* Rewards History */}
        <section aria-labelledby="history-heading">
          <h2 id="history-heading" className="text-lg font-semibold mb-4">
            {t('history.title')}
          </h2>

          <div className="space-y-3" role="list" aria-label={t('history.listAriaLabel')}>
            {DEMO_HISTORY.map((reward) => {
              const Icon = typeIcons[reward.type];
              return (
                <Card
                  key={reward.id}
                  className="p-4 hover:border-gold/30 transition-all duration-200"
                  role="listitem"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          'w-10 h-10 rounded-full flex items-center justify-center',
                          typeColors[reward.type]
                        )}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-medium">{t(`types.${reward.type}`)}</div>
                        <div className="text-xs text-foreground-tertiary">
                          {reward.epoch} • {reward.date}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{reward.amount} ETH</div>
                      <div className="text-xs">
                        {reward.status === 'claimable' ? (
                          <span className="text-gold">{t('status.claimable')}</span>
                        ) : (
                          <span className="flex items-center gap-1 text-foreground-tertiary">
                            <CheckCircle2 className="w-3 h-3" />
                            {t('status.claimed')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {reward.txHash && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <a
                        href={`https://etherscan.io/tx/${reward.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-gold hover:underline"
                      >
                        {t('history.viewTransaction')}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}

export default QSHubRewards;
