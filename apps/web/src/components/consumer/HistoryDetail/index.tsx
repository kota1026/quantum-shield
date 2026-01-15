'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import {
  ArrowLeft,
  Lock,
  Unlock,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Copy,
  Calendar,
  Hash,
  Timer,
  Coins,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useCallback } from 'react';

export type TransactionType = 'lock' | 'normalUnlock' | 'emergencyUnlock' | 'unlockComplete';
export type TransactionStatus = 'complete' | 'pending24h' | 'pending7d';

export interface TransactionDetail {
  id: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: string;
  amountUsd?: string;
  timestamp: string;
  txHash: string;
  fullTxHash: string;
  blockNumber?: number;
  blockConfirmed?: number;
  remainingTime?: string;
  bondAmount?: string;
  estimatedCompletion?: string;
  gasUsed?: string;
  gasFee?: string;
}

interface HistoryDetailProps {
  transaction: TransactionDetail;
}

const TYPE_CONFIG: Record<
  TransactionType,
  { icon: React.ReactNode; iconBg: string; label: string }
> = {
  lock: {
    icon: <Lock className="w-6 h-6 text-hinomaru" />,
    iconBg: 'bg-hinomaru/10',
    label: 'lock',
  },
  normalUnlock: {
    icon: <Clock className="w-6 h-6 text-warning" />,
    iconBg: 'bg-warning/10',
    label: 'normalUnlock',
  },
  emergencyUnlock: {
    icon: <AlertTriangle className="w-6 h-6 text-danger" />,
    iconBg: 'bg-danger/10',
    label: 'emergencyUnlock',
  },
  unlockComplete: {
    icon: <Unlock className="w-6 h-6 text-gold" />,
    iconBg: 'bg-gold/10',
    label: 'unlockComplete',
  },
};

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

  const { icon, iconBg, label } = TYPE_CONFIG[transaction.type];
  const { textClass, bgClass, icon: statusIcon } = STATUS_CONFIG[transaction.status];

  const handleCopyTxHash = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(transaction.fullTxHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [transaction.fullTxHash]);

  const explorerUrl = `https://etherscan.io/tx/${transaction.fullTxHash}`;

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
      <div className="relative z-10 max-w-[700px] mx-auto px-4 sm:px-6 pt-6">
        {/* Header */}
        <header className="flex items-center gap-4 mb-6">
          <Link
            href="/consumer/history"
            className={cn(
              'w-10 h-10 flex items-center justify-center',
              'bg-surface border border-border rounded-qs',
              'text-foreground-secondary hover:border-hinomaru hover:text-hinomaru',
              'transition-all'
            )}
            aria-label={t('header.back')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-foreground">
            {t('header.title')}
          </h1>
        </header>

        {/* Transaction Type Card */}
        <div className="bg-surface border border-border rounded-qs-xl p-6 mb-4">
          <div className="flex items-center gap-4 mb-6">
            <div
              className={cn(
                'w-14 h-14 flex items-center justify-center rounded-qs-lg',
                iconBg
              )}
              aria-hidden="true"
            >
              {icon}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-foreground mb-1">
                {tHistory(`types.${label}`)}
              </h2>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold',
                    bgClass,
                    textClass
                  )}
                >
                  {statusIcon}
                  {tHistory(`status.${transaction.status}`)}
                </span>
              </div>
            </div>
          </div>

          {/* Amount */}
          <div className="text-center py-6 border-y border-border">
            <p className="text-sm text-foreground-tertiary mb-1">{t('amount')}</p>
            <p className="text-4xl font-bold font-mono text-foreground">
              {transaction.amount}
            </p>
            {transaction.amountUsd && (
              <p className="text-sm text-foreground-secondary mt-1">
                {transaction.amountUsd}
              </p>
            )}
          </div>

          {/* Time Lock Progress (for pending transactions) */}
          {transaction.status !== 'complete' && transaction.remainingTime && (
            <div className="mt-6 p-4 bg-background rounded-qs-lg border border-border">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-sm text-foreground-secondary">
                  <Timer className="w-4 h-4" />
                  <span>{t('timelock.remaining')}</span>
                </div>
                <span className={cn('text-lg font-bold font-mono', textClass)}>
                  {transaction.remainingTime}
                </span>
              </div>
              {transaction.estimatedCompletion && (
                <p className="text-xs text-foreground-tertiary">
                  {t('timelock.estimatedCompletion', { time: transaction.estimatedCompletion })}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Transaction Details Card */}
        <div className="bg-surface border border-border rounded-qs-xl p-6 mb-4">
          <h3 className="text-sm font-semibold text-foreground-secondary uppercase tracking-wider mb-4">
            {t('details.title')}
          </h3>

          <div className="space-y-4">
            {/* Date/Time */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-sm text-foreground-tertiary">
                <Calendar className="w-4 h-4" />
                <span>{t('details.timestamp')}</span>
              </div>
              <span className="text-sm text-foreground font-medium">
                {transaction.timestamp}
              </span>
            </div>

            {/* Transaction Hash */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm text-foreground-tertiary">
                <Hash className="w-4 h-4" />
                <span>{t('details.txHash')}</span>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs font-mono text-foreground bg-background px-3 py-2 rounded-qs overflow-x-auto">
                  {transaction.fullTxHash}
                </code>
                <button
                  onClick={handleCopyTxHash}
                  className={cn(
                    'p-2 rounded-qs transition-all',
                    'bg-background hover:bg-surface-secondary',
                    'text-foreground-tertiary hover:text-foreground'
                  )}
                  aria-label={t('details.copy')}
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              {copied && (
                <p className="text-xs text-success">{t('details.copied')}</p>
              )}
            </div>

            {/* Block Number */}
            {transaction.blockNumber && (
              <div className="flex items-start justify-between">
                <span className="text-sm text-foreground-tertiary">
                  {t('details.blockNumber')}
                </span>
                <span className="text-sm text-foreground font-mono">
                  #{transaction.blockNumber.toLocaleString()}
                </span>
              </div>
            )}

            {/* Block Confirmations */}
            {transaction.status === 'complete' && transaction.blockConfirmed && (
              <div className="flex items-start justify-between">
                <span className="text-sm text-foreground-tertiary">
                  {t('details.confirmations')}
                </span>
                <span className="text-sm text-success font-medium">
                  {transaction.blockConfirmed} {t('details.blocks')}
                </span>
              </div>
            )}

            {/* Gas Used */}
            {transaction.gasUsed && (
              <div className="flex items-start justify-between">
                <span className="text-sm text-foreground-tertiary">
                  {t('details.gasUsed')}
                </span>
                <span className="text-sm text-foreground font-mono">
                  {transaction.gasUsed}
                </span>
              </div>
            )}

            {/* Gas Fee */}
            {transaction.gasFee && (
              <div className="flex items-start justify-between">
                <span className="text-sm text-foreground-tertiary">
                  {t('details.gasFee')}
                </span>
                <span className="text-sm text-foreground font-mono">
                  {transaction.gasFee}
                </span>
              </div>
            )}

            {/* Bond Amount (for emergency unlock) */}
            {transaction.bondAmount && (
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 text-sm text-foreground-tertiary">
                  <Coins className="w-4 h-4" />
                  <span>{t('details.bondAmount')}</span>
                </div>
                <span className="text-sm text-danger font-medium font-mono">
                  {transaction.bondAmount}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Security Info (for pending transactions) */}
        {transaction.status !== 'complete' && (
          <div className="bg-surface border border-border rounded-qs-xl p-6 mb-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-hinomaru/10 rounded-qs">
                <Shield className="w-5 h-5 text-hinomaru" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1">
                  {t('security.title')}
                </h3>
                <p className="text-sm text-foreground-secondary">
                  {transaction.status === 'pending24h'
                    ? t('security.pending24hMessage')
                    : t('security.pending7dMessage')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-5 py-3',
              'bg-surface border border-border rounded-qs',
              'text-foreground-secondary text-sm font-medium',
              'hover:border-gold hover:text-gold transition-all',
              'focus:outline-none focus:ring-2 focus:ring-gold/50'
            )}
          >
            <ExternalLink className="w-4 h-4" />
            {t('actions.viewOnExplorer')}
          </a>
          <Link
            href="/consumer/history"
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-5 py-3',
              'bg-hinomaru/10 border border-hinomaru rounded-qs',
              'text-hinomaru text-sm font-medium',
              'hover:bg-hinomaru hover:text-white transition-all',
              'focus:outline-none focus:ring-2 focus:ring-hinomaru/50'
            )}
          >
            {t('actions.backToHistory')}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default HistoryDetail;
export type { TransactionDetail };
