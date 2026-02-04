'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export type TxType = 'lock' | 'unlock' | 'emergency';
export type TxStatus = 'complete' | 'pending' | 'failed';

export interface Transaction {
  id: string;
  txHash: string;
  type: TxType;
  amount: string;
  fromAddress: string;
  status: TxStatus;
  statusLabel?: string;
  timestamp: string;
}

interface TransactionTableProps {
  transactions: Transaction[];
  selectedIds: string[];
  onSelectAll: (checked: boolean) => void;
  onSelectOne: (id: string, checked: boolean) => void;
  total: number;
  pageStart: number;
  pageEnd: number;
}

const TYPE_STYLES: Record<TxType, string> = {
  lock: 'bg-hinomaru/10 text-hinomaru-400',
  unlock: 'bg-gold/10 text-gold',
  emergency: 'bg-destructive/10 text-destructive',
};

const STATUS_STYLES: Record<TxStatus, string> = {
  complete: 'bg-success/10 text-success',
  pending: 'bg-warning/10 text-warning',
  failed: 'bg-destructive/10 text-destructive',
};

export function TransactionTable({
  transactions,
  selectedIds,
  onSelectAll,
  onSelectOne,
  total,
  pageStart,
  pageEnd,
}: TransactionTableProps) {
  const t = useTranslations('enterprise.transactions.table');
  const allSelected = transactions.length > 0 && selectedIds.length === transactions.length;

  return (
    <div className="bg-background-secondary border border-white/5 rounded-xl overflow-hidden">
      {/* Card Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <h2 className="text-base font-semibold text-foreground">{t('title')}</h2>
        <span className="text-sm text-muted-foreground">
          {t('showing', { start: pageStart, end: pageEnd, total })}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full" role="grid" aria-label={t('ariaLabel')}>
          <thead>
            <tr className="bg-background">
              <th className="w-10 p-4 text-left" scope="col">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="w-4 h-4 accent-hinomaru"
                  aria-label={t('selectAll')}
                />
              </th>
              <th className="p-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide" scope="col">
                {t('columns.txHash')}
              </th>
              <th className="p-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide" scope="col">
                {t('columns.type')}
              </th>
              <th className="p-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide" scope="col">
                {t('columns.amount')}
              </th>
              <th className="p-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide" scope="col">
                {t('columns.from')}
              </th>
              <th className="p-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide" scope="col">
                {t('columns.status')}
              </th>
              <th className="p-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide" scope="col">
                {t('columns.time')}
              </th>
              <th className="p-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide" scope="col">
                {t('columns.actions')}
              </th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr
                key={tx.id}
                className="border-b border-white/5 hover:bg-background transition-colors"
              >
                <td className="p-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(tx.id)}
                    onChange={(e) => onSelectOne(tx.id, e.target.checked)}
                    className="w-4 h-4 accent-hinomaru"
                    aria-label={t('selectRow', { hash: tx.txHash })}
                  />
                </td>
                <td className="p-4">
                  <Link
                    href={`/enterprise/transactions/${tx.id}`}
                    className="font-mono text-gold hover:underline"
                  >
                    {tx.txHash}
                  </Link>
                </td>
                <td className="p-4">
                  <span
                    className={cn(
                      'inline-flex px-2.5 py-1 rounded text-xs font-medium',
                      TYPE_STYLES[tx.type]
                    )}
                  >
                    {t(`types.${tx.type}`)}
                  </span>
                </td>
                <td className="p-4 font-mono font-semibold text-foreground">
                  {tx.amount}
                </td>
                <td className="p-4 font-mono text-xs text-muted-foreground">
                  {tx.fromAddress}
                </td>
                <td className="p-4">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium',
                      STATUS_STYLES[tx.status]
                    )}
                  >
                    {tx.statusLabel || t(`statuses.${tx.status}`)}
                  </span>
                </td>
                <td className="p-4 font-mono text-xs text-muted-foreground">
                  {tx.timestamp}
                </td>
                <td className="p-4">
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <Link href={`/enterprise/transactions/${tx.id}`}>
                      {t('view')}
                    </Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
