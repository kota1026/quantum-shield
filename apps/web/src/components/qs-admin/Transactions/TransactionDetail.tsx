'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  ExternalLink,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  Copy,
  Lock,
  Unlock,
  Shield,
  FileWarning,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface TransactionDetailProps {
  type: 'lock' | 'unlock' | 'emergency' | 'challenge';
  id: string;
}

const FALLBACK_TRANSACTION = {
  id: 'LK-001234',
  type: 'lock',
  user: '0x1234567890abcdef1234567890abcdef12345678',
  amount: '10.5 ETH',
  token: 'ETH',
  duration: '30 days',
  status: 'completed',
  timestamp: '2024-01-27 14:30:00',
  prover: 'Prover-A',
  proverId: 'PRV-001',
  txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
  blockNumber: 19234567,
  gasUsed: '125,000',
  confirmations: 50,
  createdAt: '2024-01-27 14:25:00',
  updatedAt: '2024-01-27 14:30:00',
  lockPeriod: '30 days',
  unlockDate: '2024-02-26 14:30:00',
  proofGenerated: '2024-01-27 14:28:00',
  proofVerified: '2024-01-27 14:29:00',
};

const STATUS_CONFIG = {
  pending: { icon: Clock, color: 'text-warning', bg: 'bg-warning/10' },
  processing: { icon: Clock, color: 'text-info', bg: 'bg-info/10' },
  completed: { icon: CheckCircle, color: 'text-success', bg: 'bg-success/10' },
  failed: { icon: XCircle, color: 'text-danger', bg: 'bg-danger/10' },
  challenged: { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10' },
  approved: { icon: CheckCircle, color: 'text-success', bg: 'bg-success/10' },
  rejected: { icon: XCircle, color: 'text-danger', bg: 'bg-danger/10' },
};

const TYPE_ICONS = {
  lock: Lock,
  unlock: Unlock,
  emergency: Shield,
  challenge: FileWarning,
};

export function TransactionDetail({ type, id }: TransactionDetailProps) {
  const t = useTranslations('qsAdmin.transactions');
  const tCommon = useTranslations('qsAdmin.common');

  const tx = { ...FALLBACK_TRANSACTION, id, type };
  const statusConfig = STATUS_CONFIG[tx.status as keyof typeof STATUS_CONFIG];
  const StatusIcon = statusConfig?.icon || Clock;
  const TypeIcon = TYPE_ICONS[type];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href={`/qs-admin/transactions/${type}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center space-x-3">
            <div className={cn('h-12 w-12 rounded-lg flex items-center justify-center', statusConfig?.bg)}>
              <TypeIcon className={cn('h-6 w-6', statusConfig?.color)} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{t('detail.title')}</h1>
              <p className="text-foreground-secondary">{id}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={cn('inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium', statusConfig?.bg, statusConfig?.color)}>
            <StatusIcon className="h-4 w-4 mr-1.5" />
            {t(`status.${tx.status}`)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('detail.basicInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-foreground-secondary">{t('table.id')}</p>
                  <p className="font-mono font-medium">{tx.id}</p>
                </div>
                <div>
                  <p className="text-sm text-foreground-secondary">{t('table.type')}</p>
                  <p className="font-medium capitalize">{t(`filters.${type}`)}</p>
                </div>
                <div>
                  <p className="text-sm text-foreground-secondary">{t('table.amount')}</p>
                  <p className="font-medium text-lg">{tx.amount}</p>
                </div>
                <div>
                  <p className="text-sm text-foreground-secondary">{t('table.duration')}</p>
                  <p className="font-medium">{tx.duration}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <p className="text-sm text-foreground-secondary mb-2">{t('table.user')}</p>
                <div className="flex items-center space-x-2">
                  <code className="font-mono text-sm bg-surface px-3 py-2 rounded-lg flex-1">{tx.user}</code>
                  <Button variant="ghost" size="icon" onClick={() => copyToClipboard(tx.user)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {tx.prover !== '-' && (
                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-foreground-secondary mb-2">{t('table.prover')}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{tx.prover}</span>
                    <Link href={`/qs-admin/prover/list/${tx.proverId}`}>
                      <Button variant="outline" size="sm">
                        {tCommon('view')}
                        <ExternalLink className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Transaction Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('detail.transactionInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-foreground-secondary mb-2">{t('detail.txHash')}</p>
                <div className="flex items-center space-x-2">
                  <code className="font-mono text-xs bg-surface px-3 py-2 rounded-lg flex-1 truncate">{tx.txHash}</code>
                  <Button variant="ghost" size="icon" onClick={() => copyToClipboard(tx.txHash)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <a href={`https://etherscan.io/tx/${tx.txHash}`} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="icon">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
                <div>
                  <p className="text-sm text-foreground-secondary">{t('detail.blockNumber')}</p>
                  <p className="font-mono font-medium">{tx.blockNumber.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-foreground-secondary">{t('detail.gasUsed')}</p>
                  <p className="font-mono font-medium">{tx.gasUsed}</p>
                </div>
                <div>
                  <p className="text-sm text-foreground-secondary">{t('detail.confirmations')}</p>
                  <p className="font-mono font-medium text-success">{tx.confirmations}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions for pending transactions - not shown for emergency unlocks (no approval needed) */}
          {(tx.status === 'pending' || tx.status === 'processing') && type !== 'emergency' && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-end space-x-3">
                  <Button variant="outline">
                    {t('detail.actions.cancel')}
                  </Button>
                  <Button variant="outline" className="text-danger border-danger hover:bg-danger/10">
                    {t('detail.actions.reject')}
                  </Button>
                  <Button className="bg-gradient-hinomaru">
                    {t('detail.actions.approve')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {tx.status === 'failed' && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-end space-x-3">
                  <Button className="bg-gradient-hinomaru">
                    {t('detail.actions.retry')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Timeline */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('detail.timeline')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <TimelineItem
                  label={t('detail.createdAt')}
                  value={tx.createdAt}
                  status="completed"
                />
                <TimelineItem
                  label={t('detail.proofGenerated')}
                  value={tx.proofGenerated}
                  status="completed"
                />
                <TimelineItem
                  label={t('detail.proofVerified')}
                  value={tx.proofVerified}
                  status="completed"
                />
                <TimelineItem
                  label={t('detail.updatedAt')}
                  value={tx.updatedAt}
                  status={tx.status === 'completed' ? 'completed' : 'pending'}
                  isLast
                />
              </div>

              <div className="mt-6 pt-6 border-t border-border">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-foreground-secondary">{t('detail.lockPeriod')}</p>
                    <p className="font-medium">{tx.lockPeriod}</p>
                  </div>
                  <div>
                    <p className="text-sm text-foreground-secondary">{t('detail.unlockDate')}</p>
                    <p className="font-medium">{tx.unlockDate}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-border">
                <a href={`https://etherscan.io/tx/${tx.txHash}`} target="_blank" rel="noopener noreferrer" className="block">
                  <Button variant="outline" className="w-full">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {t('detail.viewOnExplorer')}
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

interface TimelineItemProps {
  label: string;
  value: string;
  status: 'completed' | 'pending';
  isLast?: boolean;
}

function TimelineItem({ label, value, status, isLast }: TimelineItemProps) {
  return (
    <div className="flex items-start">
      <div className="flex flex-col items-center mr-4">
        <div className={cn(
          'h-3 w-3 rounded-full',
          status === 'completed' ? 'bg-success' : 'bg-border'
        )} />
        {!isLast && (
          <div className={cn(
            'w-0.5 h-12 mt-1',
            status === 'completed' ? 'bg-success' : 'bg-border'
          )} />
        )}
      </div>
      <div className="flex-1 pb-4">
        <p className="text-sm text-foreground-secondary">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}
