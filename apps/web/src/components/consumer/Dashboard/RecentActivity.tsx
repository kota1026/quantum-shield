'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Lock, Unlock, Clock, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Tooltip } from './Tooltip';

export interface Transaction {
  id: string;
  type: 'lock' | 'unlock' | 'unlocking';
  amount: string;
  timestamp: string;
  status: 'complete' | 'pending';
}

interface RecentActivityProps {
  transactions: Transaction[];
  className?: string;
}

export function RecentActivity({ transactions, className }: RecentActivityProps) {
  const t = useTranslations('consumer.dashboard.activity');

  const getIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'lock':
        return <Lock className="w-4 h-4" />;
      case 'unlock':
        return <Unlock className="w-4 h-4" />;
      case 'unlocking':
        return <Clock className="w-4 h-4" />;
    }
  };

  const getIconStyles = (type: Transaction['type']) => {
    switch (type) {
      case 'lock':
        return 'bg-hinomaru/10 text-hinomaru';
      case 'unlock':
        return 'bg-gold/10 text-gold';
      case 'unlocking':
        return 'bg-warning/10 text-warning';
    }
  };

  return (
    <Card padding="none" className={className}>
      {/* Header */}
      <div className="flex justify-between items-center p-5 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">{t('title')}</h2>
      </div>

      {/* Body */}
      <div className="p-5">
        {transactions.length === 0 ? (
          <p className="text-center text-foreground-secondary py-8">
            {t('emptyState')}
          </p>
        ) : (
          <div className="flex flex-col gap-2" role="list" aria-label={t('title')}>
            {transactions.map((tx) => (
              <Link
                key={tx.id}
                href="/consumer/history"
                className={cn(
                  'flex items-center gap-3 p-3',
                  'bg-surface-secondary rounded-qs',
                  'hover:bg-surface-tertiary transition-colors',
                  'group'
                )}
                role="listitem"
              >
                {/* Icon */}
                <div
                  className={cn(
                    'w-9 h-9 rounded-qs flex items-center justify-center',
                    getIconStyles(tx.type)
                  )}
                  aria-hidden="true"
                >
                  {getIcon(tx.type)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {t(`types.${tx.type}`)}
                  </p>
                  <p className="text-xs text-foreground-tertiary font-mono">
                    {tx.timestamp}
                  </p>
                </div>

                {/* Amount & Status */}
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">
                    {tx.amount}
                  </p>
                  {tx.status === 'pending' ? (
                    <Tooltip content={t('status.pendingTooltip')}>
                      <Badge
                        variant="warning"
                        size="sm"
                        className="mt-1 cursor-help"
                      >
                        {t('status.pending')}
                      </Badge>
                    </Tooltip>
                  ) : (
                    <Badge
                      variant="success"
                      size="sm"
                      className="mt-1"
                    >
                      {t('status.complete')}
                    </Badge>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* View All Button */}
        <Link href="/consumer/history" className="block mt-4">
          <Button
            variant="outline"
            fullWidth
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            {t('viewAll')}
          </Button>
        </Link>
      </div>
    </Card>
  );
}
