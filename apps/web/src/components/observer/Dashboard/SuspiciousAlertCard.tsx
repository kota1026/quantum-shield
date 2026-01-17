'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { AlertTriangle, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

interface SuspiciousTransaction {
  id: string;
  address: string;
  amount: string;
  type: 'emergency' | 'normal';
  riskLevel: 'high' | 'medium' | 'low';
  score: number;
  reason: string;
}

interface SuspiciousAlertCardProps {
  transactions: SuspiciousTransaction[];
  className?: string;
}

export function SuspiciousAlertCard({
  transactions,
  className,
}: SuspiciousAlertCardProps) {
  const t = useTranslations('observer.dashboard.suspicious');

  const riskStyles = {
    high: {
      bg: 'bg-warning/10',
      border: 'border-warning',
      titleColor: 'text-warning',
      scoreBg: 'bg-warning text-background',
      icon: AlertTriangle,
    },
    medium: {
      bg: 'bg-foreground-tertiary/10',
      border: 'border-foreground-tertiary',
      titleColor: 'text-foreground-tertiary',
      scoreBg: 'bg-foreground-tertiary text-background',
      icon: Zap,
    },
    low: {
      bg: 'bg-success/10',
      border: 'border-success',
      titleColor: 'text-success',
      scoreBg: 'bg-success text-background',
      icon: Zap,
    },
  };

  return (
    <Card variant="default" padding="none" className={cn(className)}>
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-4 border-b border-border/30">
        <h2 className="text-lg font-semibold text-foreground">{t('title')}</h2>
        <Link
          href="/observer/suspicious"
          className="text-sm text-gold hover:underline"
        >
          {t('viewAll')} →
        </Link>
      </div>

      {/* Alerts */}
      <div className="p-6 space-y-4">
        {transactions.map((tx) => {
          const style = riskStyles[tx.riskLevel];
          const Icon = style.icon;

          return (
            <div
              key={tx.id}
              className={cn(
                'rounded-xl p-4 border cursor-pointer transition-all hover:translate-x-1',
                style.bg,
                style.border
              )}
              onClick={() => {
                window.location.href =
                  tx.riskLevel === 'high'
                    ? '/observer/challenge/new'
                    : '/observer/suspicious';
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  window.location.href =
                    tx.riskLevel === 'high'
                      ? '/observer/challenge/new'
                      : '/observer/suspicious';
                }
              }}
            >
              {/* Alert Header */}
              <div className="flex justify-between items-center mb-2">
                <div
                  className={cn('flex items-center gap-2 font-semibold', style.titleColor)}
                >
                  <Icon className="w-4 h-4" aria-hidden="true" />
                  {tx.riskLevel === 'high' ? t('highRisk') : t('mediumRisk')}
                </div>
                <span
                  className={cn(
                    'text-xs px-2 py-0.5 rounded-full font-semibold',
                    style.scoreBg
                  )}
                >
                  {t('score')}: {tx.score}
                </span>
              </div>

              {/* Alert Detail */}
              <div className="text-sm text-foreground-secondary">
                <span className="font-mono">{tx.address}</span> • {tx.amount}{' '}
                {tx.type === 'emergency' ? 'Emergency' : 'Normal'} Unlock
                <br />
                <small className={style.titleColor}>{tx.reason}</small>
              </div>

              {/* Challenge Button for High Risk */}
              {tx.riskLevel === 'high' && (
                <div className="mt-4">
                  <Link
                    href="/observer/challenge/new"
                    className={cn(
                      'inline-flex items-center gap-2 px-4 py-2',
                      'bg-hinomaru text-white rounded-lg text-sm font-medium',
                      'hover:bg-hinomaru-400 hover:shadow-glow-hinomaru transition-all'
                    )}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {t('challengeButton')}
                  </Link>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
