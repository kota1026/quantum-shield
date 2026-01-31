'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  ArrowRight,
  Copy,
  Wallet,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface TransferDetailProps {
  id: string;
}

const DEMO_TRANSFER = {
  id: 'TXF-001',
  from: 'operational',
  to: 'grants',
  amount: '500 ETH',
  initiator: 'admin@qs.foundation',
  approvals: 1,
  required: 2,
  status: 'pending',
  timestamp: '2024-01-27 14:30',
  purpose: 'Q1 Grant Distribution',
  txHash: '',
  approvalHistory: [
    { approver: 'cfo@qs.foundation', action: 'approved', timestamp: '2024-01-27 15:00', comment: 'Approved for Q1 distribution' },
  ],
  pendingApprovers: ['treasury@qs.foundation'],
};

const STATUS_CONFIG = {
  pending: { icon: Clock, color: 'text-warning', bg: 'bg-warning/10' },
  completed: { icon: CheckCircle, color: 'text-success', bg: 'bg-success/10' },
  rejected: { icon: XCircle, color: 'text-danger', bg: 'bg-danger/10' },
};

export function TransferDetail({ id }: TransferDetailProps) {
  const t = useTranslations('qsAdmin.treasury');
  const tCommon = useTranslations('qsAdmin.common');
  const [comment, setComment] = useState('');

  const transfer = { ...DEMO_TRANSFER, id };
  const statusConfig = STATUS_CONFIG[transfer.status as keyof typeof STATUS_CONFIG];
  const StatusIcon = statusConfig.icon;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getWalletLabel = (wallet: string) => {
    if (wallet.includes('0x')) return wallet;
    return t(`wallets.${wallet}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/qs-admin/treasury/transfers">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center space-x-3">
            <div className={cn('h-12 w-12 rounded-lg flex items-center justify-center', statusConfig.bg)}>
              <Send className={cn('h-6 w-6', statusConfig.color)} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{t('detail.title')}</h1>
              <p className="text-foreground-secondary">{transfer.id}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={cn('inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium capitalize', statusConfig.bg, statusConfig.color)}>
            <StatusIcon className="h-4 w-4 mr-1.5" />
            {t(`status.${transfer.status}`)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Transfer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('detail.transferInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Route */}
              <div className="p-4 bg-surface rounded-lg">
                <div className="flex items-center justify-center space-x-4">
                  <div className="text-center">
                    <Wallet className="h-8 w-8 mx-auto text-hinomaru" />
                    <p className="text-sm text-foreground-secondary mt-1">{t('table.from')}</p>
                    <p className="font-medium">{getWalletLabel(transfer.from)}</p>
                  </div>
                  <ArrowRight className="h-6 w-6 text-foreground-tertiary" />
                  <div className="text-center">
                    <Wallet className="h-8 w-8 mx-auto text-success" />
                    <p className="text-sm text-foreground-secondary mt-1">{t('table.to')}</p>
                    <p className="font-medium">{getWalletLabel(transfer.to)}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div>
                  <p className="text-sm text-foreground-secondary">{t('table.amount')}</p>
                  <p className="text-2xl font-bold mt-1">{transfer.amount}</p>
                </div>
                <div>
                  <p className="text-sm text-foreground-secondary">{t('table.purpose')}</p>
                  <p className="font-medium mt-1">{transfer.purpose}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div>
                  <p className="text-sm text-foreground-secondary">{t('table.initiator')}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <User className="h-4 w-4 text-foreground-tertiary" />
                    <span>{transfer.initiator}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-foreground-secondary">{t('detail.createdAt')}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Clock className="h-4 w-4 text-foreground-tertiary" />
                    <span>{transfer.timestamp}</span>
                  </div>
                </div>
              </div>

              {transfer.txHash && (
                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-foreground-secondary">{t('detail.txHash')}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <code className="font-mono text-sm bg-surface px-3 py-2 rounded-lg flex-1">{transfer.txHash}</code>
                    <Button variant="ghost" size="icon" onClick={() => copyToClipboard(transfer.txHash)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Approval History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('detail.approvalHistory')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transfer.approvalHistory.map((event, index) => (
                  <div key={index} className="flex items-start space-x-3 p-4 bg-surface rounded-lg">
                    <div className={cn('h-8 w-8 rounded-full flex items-center justify-center', event.action === 'approved' ? 'bg-success/10' : 'bg-danger/10')}>
                      {event.action === 'approved' ? (
                        <CheckCircle className="h-4 w-4 text-success" />
                      ) : (
                        <XCircle className="h-4 w-4 text-danger" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{event.approver}</p>
                        <p className="text-xs text-foreground-tertiary">{event.timestamp}</p>
                      </div>
                      <p className={cn('text-sm capitalize', event.action === 'approved' ? 'text-success' : 'text-danger')}>
                        {event.action}
                      </p>
                      {event.comment && (
                        <p className="text-sm text-foreground-secondary mt-1">{event.comment}</p>
                      )}
                    </div>
                  </div>
                ))}

                {transfer.pendingApprovers.length > 0 && transfer.status === 'pending' && (
                  <div className="border-t border-border pt-4">
                    <p className="text-sm text-foreground-secondary mb-2">{t('detail.approvers')} ({t('status.pending')})</p>
                    <div className="flex flex-wrap gap-2">
                      {transfer.pendingApprovers.map((approver, index) => (
                        <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-warning/10 text-warning">
                          <Clock className="h-3 w-3 mr-1" />
                          {approver}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Approval Actions */}
          {transfer.status === 'pending' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('detail.approvalInfo')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment (optional)"
                  rows={3}
                />
                <div className="flex justify-end space-x-3">
                  <Button variant="outline" className="text-danger border-danger hover:bg-danger/10">
                    <XCircle className="h-4 w-4 mr-2" />
                    {t('actions.reject')}
                  </Button>
                  <Button className="bg-gradient-hinomaru">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {t('actions.approve')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Approval Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('detail.approvalInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-surface rounded-lg text-center">
                <p className="text-4xl font-bold">
                  <span className={transfer.approvals >= transfer.required ? 'text-success' : 'text-warning'}>
                    {transfer.approvals}
                  </span>
                  <span className="text-foreground-tertiary">/{transfer.required}</span>
                </p>
                <p className="text-sm text-foreground-secondary mt-1">{t('table.approvals')}</p>
              </div>

              <div className="h-2 bg-surface rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full', transfer.approvals >= transfer.required ? 'bg-success' : 'bg-warning')}
                  style={{ width: `${(transfer.approvals / transfer.required) * 100}%` }}
                />
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-foreground-secondary">{t('detail.currentApprovals')}</span>
                <span className="font-medium">{transfer.approvals}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-foreground-secondary">{t('detail.requiredApprovals')}</span>
                <span className="font-medium">{transfer.required}</span>
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-foreground-secondary">{t('table.status')}</p>
                  <span className={cn('inline-flex items-center px-2 py-1 rounded-md text-xs font-medium capitalize mt-1', statusConfig.bg, statusConfig.color)}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {t(`status.${transfer.status}`)}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-foreground-secondary">{t('table.amount')}</p>
                  <p className="text-xl font-bold">{transfer.amount}</p>
                </div>
                <div>
                  <p className="text-sm text-foreground-secondary">{t('table.initiator')}</p>
                  <p className="font-medium">{transfer.initiator}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
