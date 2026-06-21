'use client';

import { useTranslations } from 'next-intl';
import { Lock, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface LockItem {
  id: string;
  number: number;
  amount: string;
  timestamp: string;
  status: 'locked' | 'pending';
  remainingTime?: string;
}

interface LockCardProps {
  lock: LockItem;
  selected: boolean;
  onSelect: () => void;
}

export function LockCard({ lock, selected, onSelect }: LockCardProps) {
  const t = useTranslations('consumer.unlock.selectLock');

  return (
    <div
      role="radio"
      aria-checked={selected}
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        'p-5 rounded-qs-xl border cursor-pointer transition-all',
        'bg-surface hover:border-border-secondary',
        selected
          ? 'border-hinomaru bg-hinomaru/5'
          : 'border-border'
      )}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div
            className={cn(
              'w-10 h-10 rounded-qs flex items-center justify-center',
              'bg-surface-secondary'
            )}
          >
            {lock.status === 'locked' ? (
              <Lock className="w-5 h-5 text-foreground-secondary" />
            ) : (
              <Clock className="w-5 h-5 text-warning" />
            )}
          </div>

          {/* Info */}
          <div>
            <p className="font-semibold text-sm text-foreground">
              {t('lockTitle', { number: lock.number })}
            </p>
            <p className="text-xs text-foreground-tertiary font-mono">
              {lock.timestamp}
            </p>
          </div>
        </div>

        {/* Radio indicator */}
        <div
          className={cn(
            'w-5 h-5 rounded-full border-2',
            'flex items-center justify-center transition-all',
            selected
              ? 'border-hinomaru bg-hinomaru'
              : 'border-border'
          )}
        >
          {selected && (
            <div className="w-2 h-2 rounded-full bg-white" />
          )}
        </div>
      </div>

      {/* Amount & Status */}
      <div className="flex justify-between items-center">
        <span className="text-lg font-bold text-foreground">
          {lock.amount}
        </span>
        <Badge
          variant={lock.status === 'locked' ? 'hinomaru' : 'warning'}
          size="sm"
        >
          {lock.status === 'locked'
            ? t('status.locked')
            : `${t('status.pending')} ${lock.remainingTime ? `(${lock.remainingTime})` : ''}`}
        </Badge>
      </div>
    </div>
  );
}
