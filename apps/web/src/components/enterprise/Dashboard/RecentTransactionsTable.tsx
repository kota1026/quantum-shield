'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, ArrowRight } from 'lucide-react';

export interface EnterpriseTransaction {
  id: string;
  hash: string;
  type: 'lock' | 'unlock' | 'emergency';
  amount: string;
  status: 'complete' | 'pending' | 'failed';
  time: string;
}

interface RecentTransactionsTableProps {
  transactions: EnterpriseTransaction[];
  className?: string;
}

export function RecentTransactionsTable({
  transactions,
  className,
}: RecentTransactionsTableProps) {
  const t = useTranslations('enterprise.dashboard.recentTransactions');

  const statusVariantMap = {
    complete: 'success' as const,
    pending: 'warning' as const,
    failed: 'danger' as const,
  };

  return (
    <div
      className={cn(
        'bg-card border border-white/5 rounded-2xl overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <div className="flex justify-between items-center p-6 border-b border-white/5">
        <h2 className="text-base font-semibold text-foreground">{t('title')}</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/enterprise/monitoring?tab=export">
              <Download className="w-4 h-4 mr-2" aria-hidden="true" />
              {t('export')}
            </Link>
          </Button>
          <Button variant="primary" size="sm" asChild>
            <Link href="/enterprise/monitoring">
              {t('viewAll')}
              <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full" role="table">
          <thead>
            <tr className="border-b border-white/5">
              <th
                scope="col"
                className="text-left px-6 py-3 text-[11px] font-semibold text-foreground-tertiary uppercase tracking-wider"
              >
                {t('columns.txHash')}
              </th>
              <th
                scope="col"
                className="text-left px-6 py-3 text-[11px] font-semibold text-foreground-tertiary uppercase tracking-wider"
              >
                {t('columns.type')}
              </th>
              <th
                scope="col"
                className="text-left px-6 py-3 text-[11px] font-semibold text-foreground-tertiary uppercase tracking-wider"
              >
                {t('columns.amount')}
              </th>
              <th
                scope="col"
                className="text-left px-6 py-3 text-[11px] font-semibold text-foreground-tertiary uppercase tracking-wider"
              >
                {t('columns.status')}
              </th>
              <th
                scope="col"
                className="text-left px-6 py-3 text-[11px] font-semibold text-foreground-tertiary uppercase tracking-wider"
              >
                {t('columns.time')}
              </th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr
                key={tx.id}
                className="border-b border-white/5 last:border-b-0 hover:bg-background-tertiary transition-colors"
              >
                <td className="px-6 py-4">
                  <Link
                    href={`/enterprise/monitoring?tx=${tx.id}`}
                    className="font-mono text-sm text-gold hover:text-gold/80 transition-colors"
                  >
                    {tx.hash}
                  </Link>
                </td>
                <td className="px-6 py-4 text-sm text-foreground">
                  {t(`types.${tx.type}`)}
                </td>
                <td className="px-6 py-4 font-mono text-sm font-semibold text-foreground">
                  {tx.amount}
                </td>
                <td className="px-6 py-4">
                  <Badge variant={statusVariantMap[tx.status]} size="sm" withDot>
                    {t(`statuses.${tx.status}`)}
                  </Badge>
                </td>
                <td className="px-6 py-4 font-mono text-xs text-foreground-tertiary">
                  {tx.time}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
