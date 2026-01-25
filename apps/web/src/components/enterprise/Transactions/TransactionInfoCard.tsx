'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Shield } from 'lucide-react';
import { Tooltip } from '@/components/shared/Tooltip';

export type TxDetailStatus = 'complete' | 'pending' | 'failed';
export type TxDetailType = 'lock' | 'unlock' | 'emergency';

export interface TransactionInfo {
  txHash: string;
  type: TxDetailType;
  amount: string;
  usdValue: string;
  fromAddress: string;
  contractAddress: string;
  blockNumber: string;
  gasUsed: string;
  gasPrice: string;
  transactionFee: string;
  status: TxDetailStatus;
  isQuantumProtected: boolean;
  signatureAlgorithm?: string;
}

interface TransactionInfoCardProps {
  transaction: TransactionInfo;
  className?: string;
}

const STATUS_STYLES: Record<TxDetailStatus, string> = {
  complete: 'bg-success/10 text-success',
  pending: 'bg-warning/10 text-warning',
  failed: 'bg-destructive/10 text-destructive',
};

export function TransactionInfoCard({ transaction, className }: TransactionInfoCardProps) {
  const t = useTranslations('enterprise.transactionDetail.info');

  const rows = [
    { label: t('txHash'), value: transaction.txHash, mono: true, gold: true },
    { label: t('type'), value: t(`types.${transaction.type}`) },
    { label: t('amount'), value: transaction.amount, mono: true, large: true },
    { label: t('usdValue'), value: transaction.usdValue },
    { label: t('fromAddress'), value: transaction.fromAddress, mono: true },
    { label: t('contractAddress'), value: transaction.contractAddress, mono: true },
    { label: t('blockNumber'), value: transaction.blockNumber, mono: true },
    { label: t('gasUsed'), value: transaction.gasUsed, mono: true },
    { label: t('gasPrice'), value: transaction.gasPrice, mono: true },
    { label: t('transactionFee'), value: transaction.transactionFee, mono: true },
  ];

  return (
    <section
      className={cn(
        'bg-background-secondary border border-white/5 rounded-xl overflow-hidden',
        className
      )}
      aria-labelledby="tx-info-title"
    >
      {/* Card Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <h2 id="tx-info-title" className="text-base font-semibold text-foreground">
          {t('title')}
        </h2>
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold',
            STATUS_STYLES[transaction.status]
          )}
          role="status"
        >
          {transaction.status === 'complete' && '✓ '}
          {t(`statuses.${transaction.status}`)}
        </span>
      </div>

      {/* Card Body */}
      <div className="p-6">
        <dl className="space-y-0">
          {rows.map((row, index) => (
            <div
              key={row.label}
              className={cn(
                'flex items-center justify-between py-4',
                index < rows.length - 1 && 'border-b border-white/5'
              )}
            >
              <dt className="text-sm text-muted-foreground">{row.label}</dt>
              <dd
                className={cn(
                  'text-sm font-medium text-right max-w-[60%] truncate',
                  row.mono && 'font-mono',
                  row.gold && 'text-gold',
                  row.large && 'text-base font-bold'
                )}
                title={row.value}
              >
                {row.value}
              </dd>
            </div>
          ))}
        </dl>

        {/* Quantum Protected Badge */}
        {transaction.isQuantumProtected && (
          <div
            className="flex items-center gap-3 mt-6 p-4 bg-hinomaru/10 border border-hinomaru rounded-lg"
            role="status"
            aria-label={t('quantumProtected')}
          >
            <Shield className="w-6 h-6 text-hinomaru-400" aria-hidden="true" />
            <div className="text-sm">
              <Tooltip content={t('tooltips.quantumProtected')}>
                <strong className="block text-hinomaru-400 cursor-help">{t('quantumProtected')}</strong>
              </Tooltip>
              <Tooltip content={t('tooltips.dilithium')}>
                <span className="text-muted-foreground cursor-help">
                  {t('signedWith', { algorithm: transaction.signatureAlgorithm || 'CRYSTALS-Dilithium' })}
                </span>
              </Tooltip>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
