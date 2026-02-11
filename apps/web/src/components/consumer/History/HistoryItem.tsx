'use client';

import { useTranslations } from 'next-intl';
import { Lock, Unlock, Clock, AlertTriangle, ChevronRight, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip } from '@/components/consumer/Dashboard/Tooltip';

export type TransactionType = 'lock' | 'normalUnlock' | 'emergencyUnlock' | 'unlockComplete';
export type TransactionStatus = 'complete' | 'pending24h' | 'pending7d';

export interface HistoryTransaction {
  id: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: string;
  timestamp: string;
  txHash: string;
  blockConfirmed?: number;
  remainingTime?: string;
  bondAmount?: string;
}

interface HistoryItemProps {
  transaction: HistoryTransaction;
  onClick?: (transaction: HistoryTransaction) => void;
}

const TYPE_CONFIG: Record<
  TransactionType,
  { icon: React.ReactNode; iconBg: string }
> = {
  lock: {
    icon: <Lock className="w-5 h-5 text-hinomaru" />,
    iconBg: 'bg-hinomaru/10',
  },
  normalUnlock: {
    icon: <Clock className="w-5 h-5 text-warning" />,
    iconBg: 'bg-warning/10',
  },
  emergencyUnlock: {
    icon: <AlertTriangle className="w-5 h-5 text-danger" />,
    iconBg: 'bg-danger/10',
  },
  unlockComplete: {
    icon: <Unlock className="w-5 h-5 text-gold" />,
    iconBg: 'bg-gold/10',
  },
};

const STATUS_CONFIG: Record<
  TransactionStatus,
  { textClass: string; bgClass: string }
> = {
  complete: {
    textClass: 'text-success',
    bgClass: 'bg-success/10',
  },
  pending24h: {
    textClass: 'text-warning',
    bgClass: 'bg-warning/10',
  },
  pending7d: {
    textClass: 'text-danger',
    bgClass: 'bg-danger/10',
  },
};

export function HistoryItem({ transaction, onClick }: HistoryItemProps) {
  const t = useTranslations('consumer.history');

  const { icon, iconBg } = TYPE_CONFIG[transaction.type];
  const { textClass, bgClass } = STATUS_CONFIG[transaction.status];

  const handleClick = () => {
    onClick?.(transaction);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  // Format meta information based on status
  const getMetaInfo = () => {
    if (transaction.status === 'complete' && transaction.blockConfirmed) {
      return {
        text: t('item.blockConfirmed'),
        tooltip: t('item.blockConfirmedTooltip', { count: transaction.blockConfirmed }),
      };
    }
    if (transaction.remainingTime) {
      return {
        text: t('item.remaining', { time: transaction.remainingTime }),
        tooltip: null,
      };
    }
    if (transaction.bondAmount) {
      return {
        text: t('item.bond', { amount: transaction.bondAmount }),
        tooltip: null,
      };
    }
    return null;
  };

  const metaInfo = getMetaInfo();

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        'flex flex-wrap md:flex-nowrap items-center gap-4',
        'bg-surface border border-border rounded-qs-lg p-5',
        'cursor-pointer transition-all hover-gradient-border',
        'focus:outline-none focus:ring-2 focus:ring-hinomaru/30 focus:border-hinomaru'
      )}
      aria-label={`${t(`types.${transaction.type}`)} ${transaction.amount} ${t(`status.${transaction.status}`)}`}
    >
      {/* Icon */}
      <div
        className={cn(
          'w-12 h-12 flex items-center justify-center rounded-qs flex-shrink-0',
          iconBg
        )}
        aria-hidden="true"
      >
        {icon}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[15px] font-semibold text-foreground">
            {t(`types.${transaction.type}`)}
          </span>
          <span
            className={cn(
              'text-[10px] px-2 py-0.5 rounded-full font-semibold',
              bgClass,
              textClass
            )}
          >
            {transaction.status === 'complete' && '✓ '}
            {transaction.status !== 'complete' && '⏳ '}
            {t(`status.${transaction.status}`)}
          </span>
        </div>
        <div className="flex gap-4 text-xs text-foreground-tertiary">
          <span className="flex items-center gap-1">
            📅 {transaction.timestamp}
          </span>
          {metaInfo && (
            <span className="flex items-center gap-1">
              {transaction.bondAmount ? '💰' : '⏱'}{' '}
              {metaInfo.tooltip ? (
                <Tooltip content={metaInfo.tooltip}>
                  <span className="flex items-center gap-1 cursor-help">
                    {metaInfo.text}
                    <HelpCircle className="w-3 h-3" aria-hidden="true" />
                  </span>
                </Tooltip>
              ) : (
                metaInfo.text
              )}
            </span>
          )}
        </div>
      </div>

      {/* Amount */}
      <div className="w-full md:w-auto md:text-right flex-shrink-0 mt-3 md:mt-0 pt-3 md:pt-0 border-t md:border-t-0 border-border flex md:block justify-between items-center">
        <p className="text-lg font-semibold font-mono text-foreground">
          {transaction.amount}
        </p>
        <Tooltip content={t('item.txHashTooltip')}>
          <p className="text-[11px] text-foreground-tertiary font-mono cursor-help flex items-center gap-1 md:justify-end">
            <span className="sr-only">{t('item.txHashLabel')}: </span>
            {transaction.txHash}
            <HelpCircle className="w-3 h-3 inline-block" aria-hidden="true" />
          </p>
        </Tooltip>
      </div>

      {/* Arrow */}
      <ChevronRight
        className="w-5 h-5 text-foreground-tertiary flex-shrink-0 hidden md:block"
        aria-hidden="true"
      />
    </article>
  );
}

export default HistoryItem;
