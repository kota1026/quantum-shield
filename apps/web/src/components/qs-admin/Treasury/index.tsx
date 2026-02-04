'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Wallet,
  Send,
  Clock,
  Shield,
  ArrowRight,
  ExternalLink,
  Users,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// Demo data - In production, this would come from API
const FALLBACK_STATS = {
  totalBalance: '125,000 ETH',
  totalUsd: '$312,500,000',
  walletsCount: 5,
  pendingTransfers: 3,
  pendingApprovals: 2,
};

const FALLBACK_WALLETS = [
  {
    id: 'main',
    name: 'main',
    balance: '75,000 ETH',
    usdValue: '$187,500,000',
    signers: 5,
    threshold: 3,
    status: 'active',
  },
  {
    id: 'operational',
    name: 'operational',
    balance: '25,000 ETH',
    usdValue: '$62,500,000',
    signers: 3,
    threshold: 2,
    status: 'active',
  },
  {
    id: 'grants',
    name: 'grants',
    balance: '15,000 ETH',
    usdValue: '$37,500,000',
    signers: 5,
    threshold: 3,
    status: 'active',
  },
  {
    id: 'insurance',
    name: 'insurance',
    balance: '8,000 ETH',
    usdValue: '$20,000,000',
    signers: 7,
    threshold: 5,
    status: 'active',
  },
  {
    id: 'emergency',
    name: 'emergency',
    balance: '2,000 ETH',
    usdValue: '$5,000,000',
    signers: 3,
    threshold: 2,
    status: 'active',
  },
];

const FALLBACK_PENDING_TRANSFERS = [
  {
    id: 'TXF-001',
    from: 'operational',
    to: 'grants',
    amount: '500 ETH',
    initiator: 'admin@qs.foundation',
    approvals: 1,
    required: 2,
    timestamp: '2024-01-27 14:30',
  },
  {
    id: 'TXF-002',
    from: 'main',
    to: '0x1234...5678',
    amount: '1,000 ETH',
    initiator: 'treasury@qs.foundation',
    approvals: 2,
    required: 3,
    timestamp: '2024-01-27 13:15',
  },
];

const FALLBACK_RECENT_TRANSFERS = [
  {
    id: 'TXF-100',
    from: 'main',
    to: 'operational',
    amount: '5,000 ETH',
    status: 'completed',
    timestamp: '2024-01-26 10:30',
  },
  {
    id: 'TXF-099',
    from: 'operational',
    to: '0x2345...6789',
    amount: '200 ETH',
    status: 'completed',
    timestamp: '2024-01-25 16:45',
  },
  {
    id: 'TXF-098',
    from: 'grants',
    to: '0x3456...7890',
    amount: '100 ETH',
    status: 'completed',
    timestamp: '2024-01-24 09:20',
  },
];

interface StatCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  icon: React.ElementType;
  trend?: { value: number; isPositive: boolean; label: string };
  href?: string;
}

function StatCard({ title, value, subValue, icon: Icon, trend, href }: StatCardProps) {
  const content = (
    <Card className={cn(href && 'hover:border-hinomaru/50 transition-colors cursor-pointer')}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-foreground-secondary">{title}</p>
            <p className="text-2xl font-bold mt-2">{value}</p>
            {subValue && (
              <p className="text-sm text-foreground-tertiary mt-1">{subValue}</p>
            )}
            {trend && (
              <p className={cn(
                'text-xs mt-2 flex items-center',
                trend.isPositive ? 'text-success' : 'text-danger'
              )}>
                {trend.isPositive ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1" />
                )}
                {trend.isPositive ? '+' : ''}{trend.value}% {trend.label}
              </p>
            )}
          </div>
          <div className="h-12 w-12 rounded-lg bg-hinomaru/10 flex items-center justify-center">
            <Icon className="h-6 w-6 text-hinomaru" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

export function TreasuryDashboard() {
  const t = useTranslations('qsAdmin.treasury');
  const tCommon = useTranslations('qsAdmin.common');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
          <p className="text-foreground-secondary">{t('subtitle')}</p>
        </div>
        <Button className="bg-gradient-hinomaru text-white">
          <Send className="h-4 w-4 mr-2" />
          {t('transfers.newTransfer')}
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('wallets.balance')}
          value={FALLBACK_STATS.totalBalance}
          subValue={FALLBACK_STATS.totalUsd}
          icon={Wallet}
          trend={{ value: 5.2, isPositive: true, label: tCommon('trend.fromLastWeek') }}
        />
        <StatCard
          title={t('wallets.title')}
          value={FALLBACK_STATS.walletsCount}
          icon={Shield}
          href="/qs-admin/treasury/wallets"
        />
        <StatCard
          title={t('transfers.pendingApprovals')}
          value={FALLBACK_STATS.pendingApprovals}
          icon={Clock}
          href="/qs-admin/treasury/transfers"
        />
        <StatCard
          title={t('transfers.title')}
          value={FALLBACK_STATS.pendingTransfers}
          icon={Send}
          href="/qs-admin/treasury/transfers"
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Wallets List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">{t('wallets.title')}</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/qs-admin/treasury/wallets">
                {tCommon('view')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {FALLBACK_WALLETS.map((wallet) => (
                <div
                  key={wallet.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-surface hover:bg-surface/80 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-lg bg-hinomaru/10 flex items-center justify-center">
                      <Wallet className="h-5 w-5 text-hinomaru" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{t(`wallets.${wallet.name}`)}</p>
                      <p className="text-sm text-foreground-secondary">
                        <Users className="inline h-3 w-3 mr-1" />
                        {wallet.threshold}/{wallet.signers} {t('wallets.signers')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-foreground">{wallet.balance}</p>
                    <p className="text-sm text-foreground-tertiary">{wallet.usdValue}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pending Approvals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center">
              {t('transfers.pendingApprovals')}
              {FALLBACK_PENDING_TRANSFERS.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-warning/10 text-warning text-xs rounded-full">
                  {FALLBACK_PENDING_TRANSFERS.length}
                </span>
              )}
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/qs-admin/treasury/transfers">
                {tCommon('view')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {FALLBACK_PENDING_TRANSFERS.map((transfer) => (
                <div
                  key={transfer.id}
                  className="p-4 rounded-lg border border-border hover:border-hinomaru/30 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <code className="text-sm font-mono text-foreground">{transfer.id}</code>
                      <p className="text-sm text-foreground-secondary mt-1">
                        {t(`wallets.${transfer.from}`)} → {transfer.to.includes('0x') ? transfer.to : t(`wallets.${transfer.to}`)}
                      </p>
                    </div>
                    <p className="font-bold text-foreground">{transfer.amount}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={cn(
                        'inline-flex items-center px-2 py-1 rounded-md text-xs font-medium',
                        transfer.approvals >= transfer.required
                          ? 'bg-success/10 text-success'
                          : 'bg-warning/10 text-warning'
                      )}>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {transfer.approvals}/{transfer.required}
                      </span>
                    </div>
                    <Button size="sm" variant="outline">
                      {t('actions.approve')}
                    </Button>
                  </div>
                </div>
              ))}
              {FALLBACK_PENDING_TRANSFERS.length === 0 && (
                <p className="text-center py-8 text-foreground-secondary">
                  {t('empty')}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transfers */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">{t('transfers.history')}</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/qs-admin/treasury/transfers">
              {tCommon('view')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">ID</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">From</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">To</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">Time</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {FALLBACK_RECENT_TRANSFERS.map((transfer) => (
                  <tr
                    key={transfer.id}
                    className="border-b border-border hover:bg-surface transition-colors"
                  >
                    <td className="py-3 px-4">
                      <code className="text-sm font-mono">{transfer.id}</code>
                    </td>
                    <td className="py-3 px-4 text-foreground-secondary">
                      {t(`wallets.${transfer.from}`)}
                    </td>
                    <td className="py-3 px-4 text-foreground-secondary">
                      {transfer.to.includes('0x') ? (
                        <code className="text-sm font-mono">{transfer.to}</code>
                      ) : (
                        t(`wallets.${transfer.to}`)
                      )}
                    </td>
                    <td className="py-3 px-4 font-medium">{transfer.amount}</td>
                    <td className="py-3 px-4">
                      <span className={cn(
                        'inline-flex items-center px-2 py-1 rounded-md text-xs font-medium',
                        transfer.status === 'completed' && 'bg-success/10 text-success',
                        transfer.status === 'pending' && 'bg-warning/10 text-warning',
                        transfer.status === 'failed' && 'bg-danger/10 text-danger'
                      )}>
                        {transfer.status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                        {transfer.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                        {transfer.status === 'failed' && <AlertTriangle className="h-3 w-3 mr-1" />}
                        {transfer.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-foreground-secondary">{transfer.timestamp}</td>
                    <td className="py-3 px-4">
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
