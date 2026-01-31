'use client';

import { useMemo, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import {
  ArrowLeft,
  Lock,
  Unlock,
  Clock,
  AlertTriangle,
  ExternalLink,
  Copy,
  CheckCircle2,
  HelpCircle,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/consumer/Dashboard/Tooltip';
import type { HistoryTransaction, TransactionType, TransactionStatus } from '../History/HistoryItem';

interface HistoryDetailProps {
  transaction: HistoryTransaction;
}

// Transaction type configuration
const TYPE_CONFIG: Record<
  TransactionType,
  { icon: React.ReactNode; iconBg: string; label: string }
> = {
  lock: {
    icon: <Lock className="w-6 h-6 text-hinomaru" />,
    iconBg: 'bg-hinomaru/10',
    label: 'Lock',
  },
  normalUnlock: {
    icon: <Clock className="w-6 h-6 text-warning" />,
    iconBg: 'bg-warning/10',
    label: 'Normal Unlock',
  },
  emergencyUnlock: {
    icon: <AlertTriangle className="w-6 h-6 text-danger" />,
    iconBg: 'bg-danger/10',
    label: 'Emergency Unlock',
  },
  unlockComplete: {
    icon: <Unlock className="w-6 h-6 text-gold" />,
    iconBg: 'bg-gold/10',
    label: 'Unlock Complete',
  },
};

// Status configuration
const STATUS_CONFIG: Record<
  TransactionStatus,
  { textClass: string; bgClass: string; icon: React.ReactNode }
> = {
  complete: {
    textClass: 'text-success',
    bgClass: 'bg-success/10',
    icon: <CheckCircle2 className="w-4 h-4" />,
  },
  pending24h: {
    textClass: 'text-warning',
    bgClass: 'bg-warning/10',
    icon: <Clock className="w-4 h-4" />,
  },
  pending7d: {
    textClass: 'text-danger',
    bgClass: 'bg-danger/10',
    icon: <AlertTriangle className="w-4 h-4" />,
  },
};

export function HistoryDetail({ transaction }: HistoryDetailProps) {
  const t = useTranslations('consumer.historyDetail');
  const tHistory = useTranslations('consumer.history');
  const [copied, setCopied] = useState(false);

  const typeConfig = TYPE_CONFIG[transaction.type];
  const statusConfig = STATUS_CONFIG[transaction.status];

  // Copy transaction hash to clipboard with feedback
  const handleCopyTxHash = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(transaction.txHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error('Failed to copy');
    }
  }, [transaction.txHash]);

  // Transaction steps for timeline
  const timelineSteps = useMemo(() => {
    const steps = [
      {
        id: 'initiated',
        label: t('timeline.initiated'),
        timestamp: transaction.timestamp,
        completed: true,
      },
    ];

    if (transaction.type === 'lock') {
      steps.push({
        id: 'confirmed',
        label: t('timeline.confirmed'),
        timestamp: transaction.timestamp,
        completed: transaction.status === 'complete',
      });
    } else if (transaction.type === 'normalUnlock') {
      steps.push(
        {
          id: 'signed',
          label: t('timeline.signed'),
          timestamp: transaction.timestamp,
          completed: true,
        },
        {
          id: 'waiting',
          label: t('timeline.waiting24h'),
          timestamp: transaction.remainingTime ? `${t('timeline.remaining')}: ${transaction.remainingTime}` : '',
          completed: transaction.status === 'complete',
        },
        {
          id: 'released',
          label: t('timeline.released'),
          timestamp: '',
          completed: transaction.status === 'complete',
        }
      );
    } else if (transaction.type === 'emergencyUnlock') {
      steps.push(
        {
          id: 'bondDeposited',
          label: t('timeline.bondDeposited'),
          timestamp: transaction.bondAmount ? `Bond: ${transaction.bondAmount}` : '',
          completed: true,
        },
        {
          id: 'challengePeriod',
          label: t('timeline.challengePeriod'),
          timestamp: transaction.remainingTime ? `${t('timeline.remaining')}: ${transaction.remainingTime}` : '',
          completed: transaction.status === 'complete',
        },
        {
          id: 'released',
          label: t('timeline.released'),
          timestamp: '',
          completed: transaction.status === 'complete',
        }
      );
    } else if (transaction.type === 'unlockComplete') {
      steps.push({
        id: 'completed',
        label: t('timeline.completed'),
        timestamp: transaction.timestamp,
        completed: true,
      });
    }

    return steps;
  }, [transaction, t]);

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Premium Background Effect */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        aria-hidden="true"
      >
        <div
          className={cn(
            'absolute -top-48 left-1/2 -translate-x-1/2',
            'w-[800px] h-[600px]',
            'bg-gradient-radial-hinomaru opacity-30'
          )}
        />
      </div>

      {/* Main Content */}
      <main className="relative z-10 max-w-[900px] mx-auto px-4 sm:px-6 pt-6" role="main">
        {/* Header */}
        <header className="flex items-center gap-4 mb-6">
          <Link
            href="/consumer/history"
            className={cn(
              'w-11 h-11 flex items-center justify-center',
              'bg-surface border border-border rounded-qs',
              'text-foreground-secondary hover:border-hinomaru hover:text-hinomaru',
              'transition-all',
              'focus:outline-none focus:ring-2 focus:ring-hinomaru/30 focus:border-hinomaru'
            )}
            aria-label={t('header.back')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-foreground">
            {t('header.title')}
          </h1>
        </header>

        {/* Transaction Summary Card */}
        <section
          className="bg-surface border border-border rounded-qs-xl p-6 mb-6"
          aria-label={t('summary.ariaLabel')}
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            {/* Type Icon */}
            <div
              className={cn(
                'w-16 h-16 flex items-center justify-center rounded-qs-lg flex-shrink-0',
                typeConfig.iconBg
              )}
              aria-hidden="true"
            >
              {typeConfig.icon}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h2 className="text-xl font-bold text-foreground">
                  {tHistory(`types.${transaction.type}`)}
                </h2>
                <span
                  className={cn(
                    'inline-flex items-center gap-1 text-sm px-3 py-1 rounded-full font-medium',
                    statusConfig.bgClass,
                    statusConfig.textClass
                  )}
                >
                  {statusConfig.icon}
                  {tHistory(`status.${transaction.status}`)}
                </span>
              </div>
              <p className="text-3xl font-bold font-mono text-foreground">
                {transaction.amount}
              </p>
            </div>
          </div>
        </section>

        {/* Transaction Details */}
        <section
          className="bg-surface border border-border rounded-qs-xl p-6 mb-6"
          aria-labelledby="details-heading"
        >
          <h3 id="details-heading" className="text-lg font-semibold text-foreground mb-4">
            {t('details.title')}
          </h3>

          <dl className="space-y-4">
            {/* Transaction Hash */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
              <dt className="text-sm text-foreground-tertiary sm:w-32 flex-shrink-0">
                {t('details.txHash')}
              </dt>
              <dd className="flex items-center gap-2">
                <span className="font-mono text-foreground text-sm">
                  {transaction.txHash}
                </span>
                <Tooltip content={copied ? t('details.copied') : t('details.copyTooltip')}>
                  <button
                    onClick={handleCopyTxHash}
                    className={cn(
                      'min-w-[44px] min-h-[44px] flex items-center justify-center -m-2 transition-colors focus:outline-none focus:ring-2 focus:ring-gold/50 rounded',
                      copied ? 'text-success' : 'text-foreground-tertiary hover:text-foreground'
                    )}
                    aria-label={t('details.copyAriaLabel')}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span className="sr-only" aria-live="polite">
                      {copied ? t('details.copied') : ''}
                    </span>
                  </button>
                </Tooltip>
                <Tooltip content={t('details.viewOnExplorer')}>
                  <a
                    href={`https://sepolia.etherscan.io/tx/${transaction.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center -m-2 text-foreground-tertiary hover:text-foreground transition-colors"
                    aria-label={t('details.viewOnExplorerAriaLabel')}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </Tooltip>
              </dd>
            </div>

            {/* Date */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
              <dt className="text-sm text-foreground-tertiary sm:w-32 flex-shrink-0">
                {t('details.date')}
              </dt>
              <dd className="text-foreground">
                {transaction.timestamp}
              </dd>
            </div>

            {/* Amount */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
              <dt className="text-sm text-foreground-tertiary sm:w-32 flex-shrink-0">
                {t('details.amount')}
              </dt>
              <dd className="font-mono font-semibold text-foreground">
                {transaction.amount}
              </dd>
            </div>

            {/* Block Confirmations (if complete) */}
            {transaction.blockConfirmed && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                <dt className="text-sm text-foreground-tertiary sm:w-32 flex-shrink-0 flex items-center gap-1">
                  {t('details.confirmations')}
                  <Tooltip content={t('details.confirmationsTooltip')}>
                    <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
                  </Tooltip>
                </dt>
                <dd className="text-success font-medium">
                  {transaction.blockConfirmed} {t('details.blocks')}
                </dd>
              </div>
            )}

            {/* Bond Amount (for emergency unlock) */}
            {transaction.bondAmount && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                <dt className="text-sm text-foreground-tertiary sm:w-32 flex-shrink-0 flex items-center gap-1">
                  {t('details.bond')}
                  <Tooltip content={t('details.bondTooltip')}>
                    <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
                  </Tooltip>
                </dt>
                <dd className="font-mono text-foreground">
                  {transaction.bondAmount}
                </dd>
              </div>
            )}

            {/* Remaining Time (for pending) */}
            {transaction.remainingTime && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                <dt className="text-sm text-foreground-tertiary sm:w-32 flex-shrink-0">
                  {t('details.remaining')}
                </dt>
                <dd className="font-mono text-warning font-medium">
                  {transaction.remainingTime}
                </dd>
              </div>
            )}
          </dl>
        </section>

        {/* Timeline */}
        <section
          className="bg-surface border border-border rounded-qs-xl p-6 mb-6"
          aria-labelledby="timeline-heading"
        >
          <h3 id="timeline-heading" className="text-lg font-semibold text-foreground mb-6">
            {t('timeline.title')}
          </h3>

          <ol className="relative border-l-2 border-border ml-3" aria-label={t('timeline.ariaLabel')}>
            {timelineSteps.map((step, index) => {
              // Determine if this is the current step (first incomplete step)
              const isCurrentStep = !step.completed &&
                (index === 0 || timelineSteps[index - 1]?.completed);

              return (
              <li
                key={step.id}
                className="mb-6 ml-6 last:mb-0"
                aria-current={isCurrentStep ? 'step' : undefined}
              >
                {/* Step indicator */}
                <span
                  className={cn(
                    'absolute -left-[9px] flex items-center justify-center w-4 h-4 rounded-full',
                    step.completed
                      ? 'bg-success'
                      : 'bg-surface border-2 border-border'
                  )}
                  aria-hidden="true"
                >
                  {step.completed && (
                    <CheckCircle2 className="w-3 h-3 text-white" />
                  )}
                </span>

                {/* Step content */}
                <div>
                  <h4
                    className={cn(
                      'text-sm font-medium',
                      step.completed ? 'text-foreground' : 'text-foreground-tertiary'
                    )}
                  >
                    {step.label}
                  </h4>
                  {step.timestamp && (
                    <p className="text-xs text-foreground-tertiary mt-0.5">
                      {step.timestamp}
                    </p>
                  )}
                </div>
              </li>
              );
            })}
          </ol>
        </section>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="ghost"
            fullWidth
            asChild
          >
            <Link href="/consumer/history">
              {t('actions.backToHistory')}
            </Link>
          </Button>

          {transaction.status !== 'complete' && transaction.type === 'normalUnlock' && (
            <Button
              variant="secondary"
              fullWidth
              asChild
            >
              <Link href="/consumer/unlock">
                {t('actions.viewUnlockStatus')}
              </Link>
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}

export default HistoryDetail;
