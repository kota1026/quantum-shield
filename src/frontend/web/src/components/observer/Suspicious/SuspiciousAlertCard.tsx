'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { AlertTriangle, AlertCircle, Eye, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RiskFactor {
  type: 'high' | 'medium';
  text: string;
}

interface SuspiciousAlert {
  id: string;
  riskLevel: 'high' | 'medium';
  riskScore: number;
  detectedTime: string;
  address: string;
  amount: string;
  unlockType: 'normal' | 'emergency';
  timeRemaining: string;
  riskFactors: RiskFactor[];
}

interface SuspiciousAlertCardProps {
  alert: SuspiciousAlert;
  onDismiss?: (id: string) => void;
}

export function SuspiciousAlertCard({
  alert,
  onDismiss,
}: SuspiciousAlertCardProps) {
  const t = useTranslations('observer.dashboard.suspiciousPage');

  const isHighRisk = alert.riskLevel === 'high';

  const riskStyles = {
    high: {
      border: 'border-l-4 border-l-danger',
      iconBg: 'bg-danger/10',
      labelColor: 'text-danger',
      scoreBg: 'bg-danger text-white',
      icon: AlertTriangle,
    },
    medium: {
      border: 'border-l-4 border-l-warning',
      iconBg: 'bg-warning/10',
      labelColor: 'text-warning',
      scoreBg: 'bg-warning text-background',
      icon: AlertCircle,
    },
  };

  const style = riskStyles[alert.riskLevel];
  const Icon = style.icon;

  return (
    <article
      className={cn(
        'bg-card border border-border/30 rounded-xl overflow-hidden transition-all',
        'hover:border-border hover:-translate-y-0.5',
        style.border
      )}
      role="article"
      aria-label={`${t(`riskLevels.${alert.riskLevel}`)} - ${alert.address}`}
    >
      {/* Header */}
      <header className="flex justify-between items-center p-6 bg-background-secondary">
        <div className="flex items-center gap-4">
          <div
            className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center',
              style.iconBg
            )}
          >
            <Icon
              className={cn('w-5 h-5', style.labelColor)}
              aria-hidden="true"
            />
          </div>
          <div>
            <h3 className={cn('text-lg font-semibold', style.labelColor)}>
              {t(`riskLevels.${alert.riskLevel}`)}
            </h3>
            <p className="text-xs text-foreground-tertiary">
              {t('detectedAgo', { time: alert.detectedTime })}
            </p>
          </div>
        </div>
        <div
          className={cn(
            'text-2xl font-bold px-4 py-2 rounded-lg',
            style.scoreBg
          )}
          aria-label={`Risk score: ${alert.riskScore}`}
        >
          {alert.riskScore}
        </div>
      </header>

      {/* Body */}
      <div className="p-6">
        {/* Transaction Summary */}
        <div className="grid grid-cols-4 gap-6 mb-6">
          <div>
            <div className="text-[11px] text-foreground-tertiary uppercase tracking-wider mb-1">
              {t('txSummary.address')}
            </div>
            <div className="font-mono text-sm text-foreground">
              {alert.address}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-foreground-tertiary uppercase tracking-wider mb-1">
              {t('txSummary.amount')}
            </div>
            <div className="text-base font-semibold text-foreground">
              {alert.amount}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-foreground-tertiary uppercase tracking-wider mb-1">
              {t('txSummary.unlockType')}
            </div>
            <div
              className={cn(
                'text-base font-semibold',
                alert.unlockType === 'emergency'
                  ? 'text-warning'
                  : 'text-foreground'
              )}
            >
              {alert.unlockType === 'emergency' ? 'Emergency' : 'Normal'}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-foreground-tertiary uppercase tracking-wider mb-1">
              {t('txSummary.timeRemaining')}
            </div>
            <div className="font-mono text-base text-warning">
              {alert.timeRemaining}
            </div>
          </div>
        </div>

        {/* Risk Factors */}
        <div className="bg-background-secondary rounded-lg p-4 mb-6">
          <h4 className="text-sm font-semibold text-foreground-secondary mb-3">
            {t('riskFactors.title')}
          </h4>
          <ul className="space-y-2">
            {alert.riskFactors.map((factor, index) => (
              <li key={index} className="flex items-center gap-3 text-sm">
                <span
                  className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium',
                    factor.type === 'high'
                      ? 'bg-danger/10 text-danger'
                      : 'bg-warning/10 text-warning'
                  )}
                >
                  !
                </span>
                <span className="text-foreground">{factor.text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {isHighRisk ? (
            <>
              <Link
                href={`/observer/challenge/new?address=${alert.address}`}
                className={cn(
                  'flex-1 py-3 px-4 text-center rounded-lg font-semibold text-sm text-white',
                  'bg-gradient-to-r from-hinomaru to-hinomaru-400',
                  'hover:-translate-y-0.5 hover:shadow-glow-hinomaru transition-all'
                )}
              >
                {t('actions.challenge')}
              </Link>
              <button
                className={cn(
                  'flex-1 py-3 px-4 rounded-lg font-medium text-sm',
                  'bg-transparent border border-border text-foreground-secondary',
                  'hover:border-gold hover:text-gold transition-colors'
                )}
              >
                {t('actions.viewDetails')}
              </button>
              <button
                onClick={() => onDismiss?.(alert.id)}
                className={cn(
                  'flex-1 py-3 px-4 rounded-lg font-medium text-sm',
                  'bg-transparent border border-border text-foreground-secondary',
                  'hover:border-danger hover:text-danger transition-colors'
                )}
                aria-label={t('actions.dismiss')}
              >
                {t('actions.dismiss')}
              </button>
            </>
          ) : (
            <>
              <button
                className={cn(
                  'flex-[2] py-3 px-4 rounded-lg font-medium text-sm flex items-center justify-center gap-2',
                  'bg-transparent border border-border text-foreground-secondary',
                  'hover:border-gold hover:text-gold transition-colors'
                )}
              >
                <Eye className="w-4 h-4" />
                {t('actions.monitorClosely')}
              </button>
              <button
                onClick={() => onDismiss?.(alert.id)}
                className={cn(
                  'flex-1 py-3 px-4 rounded-lg font-medium text-sm flex items-center justify-center gap-2',
                  'bg-transparent border border-border text-foreground-secondary',
                  'hover:border-danger hover:text-danger transition-colors'
                )}
                aria-label={t('actions.dismiss')}
              >
                <X className="w-4 h-4" />
                {t('actions.dismiss')}
              </button>
            </>
          )}
        </div>
      </div>
    </article>
  );
}
