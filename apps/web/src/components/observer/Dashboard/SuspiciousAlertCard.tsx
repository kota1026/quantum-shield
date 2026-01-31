'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { AlertTriangle, Zap, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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
  const tCommon = useTranslations('observer.common');

  const riskStyles = {
    high: {
      bg: 'bg-warning/15',
      border: 'border-warning/70',
      titleColor: 'text-warning',
      scoreBg: 'bg-warning text-background',
      icon: AlertTriangle,
    },
    medium: {
      bg: 'bg-foreground-secondary/10',
      border: 'border-foreground-secondary/50',
      titleColor: 'text-foreground-secondary',
      scoreBg: 'bg-foreground-secondary text-background',
      icon: Zap,
    },
    low: {
      bg: 'bg-success/15',
      border: 'border-success/70',
      titleColor: 'text-success',
      scoreBg: 'bg-success text-background',
      icon: Zap,
    },
  };

  return (
    <TooltipProvider>
    <Card variant="default" padding="none" className={cn(className)}>
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-5 border-b border-border/50">
        <h2 className="text-xl font-bold text-foreground">{t('title')}</h2>
        <Link
          href="/observer/suspicious"
          className="text-sm font-medium text-gold hover:text-gold/80 hover:underline transition-colors"
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
              <div className="flex justify-between items-center mb-3">
                <div
                  className={cn('flex items-center gap-2 text-base font-bold', style.titleColor)}
                >
                  <Icon className="w-5 h-5" aria-hidden="true" />
                  {tx.riskLevel === 'high' ? t('highRisk') : t('mediumRisk')}
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      className={cn(
                        'text-sm px-3 py-1 rounded-full font-bold cursor-help flex items-center gap-1',
                        style.scoreBg
                      )}
                    >
                      {t('score')}: {tx.score}
                      <HelpCircle className="h-3 w-3" aria-hidden="true" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>{tCommon('tooltip.riskScore')}</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Alert Detail */}
              <div className="text-sm font-medium text-foreground">
                <span className="font-mono">{tx.address}</span> • {tx.amount}{' '}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="cursor-help border-b border-dotted border-foreground-tertiary">
                      {tx.type === 'emergency' ? 'Emergency' : 'Normal'} Unlock
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>{tx.type === 'emergency' ? tCommon('tooltip.emergencyUnlock') : tCommon('tooltip.normalUnlock')}</p>
                  </TooltipContent>
                </Tooltip>
                <br />
                <span className={cn('text-sm', style.titleColor)}>{tx.reason}</span>
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
    </TooltipProvider>
  );
}
