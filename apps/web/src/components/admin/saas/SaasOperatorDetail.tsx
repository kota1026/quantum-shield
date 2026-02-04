'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useState } from 'react';
import {
  Building2,
  ChevronRight,
  CheckCircle,
  XCircle,
  Users,
  Wallet,
  TrendingUp,
  Activity,
  Clock,
  ExternalLink,
  Copy,
  FileText,
  Settings,
  Shield,
  CreditCard,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AdminSidebarV2 } from '../AdminSidebarV2';

interface SaasOperatorDetailProps {
  operatorId: string;
}

// Stat card
interface StatCardProps {
  label: string;
  value: string;
  subValue?: string;
  icon: React.ReactNode;
  status?: 'success' | 'warning' | 'danger' | 'info';
}

function StatCard({ label, value, subValue, icon, status = 'info' }: StatCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={cn(
          'flex h-10 w-10 items-center justify-center rounded-lg',
          status === 'success' && 'bg-success/10 text-success',
          status === 'warning' && 'bg-warning/10 text-warning',
          status === 'danger' && 'bg-danger/10 text-danger',
          status === 'info' && 'bg-info/10 text-info'
        )}>
          {icon}
        </div>
        <div>
          <div className="text-xs text-foreground-tertiary">{label}</div>
          <div className="text-xl font-bold text-foreground">{value}</div>
          {subValue && <div className="text-xs text-foreground-secondary">{subValue}</div>}
        </div>
      </div>
    </Card>
  );
}

export function SaasOperatorDetail({ operatorId }: SaasOperatorDetailProps) {
  const t = useTranslations('admin.operatorDetail');
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'billing' | 'contract' | 'settings'>('overview');

  // Mock data
  const operator = {
    id: operatorId,
    name: 'ACME Corporation',
    status: 'active',
    plan: 'Business',
    mrr: '$8,000',
    users: 245,
    activeUsers: 189,
    tvl: '$12.5M',
    transactions: 4567,
    contractStart: '2025-06-01',
    contractEnd: '2026-05-31',
    accountManager: '田中 花子',
    lastActivity: '5分前',
  };

  const recentActivity = [
    { id: 'act-001', type: 'user_added', description: '新規ユーザー追加: user@acme.com', timestamp: '2時間前' },
    { id: 'act-002', type: 'api_key', description: '本番APIキー作成', timestamp: '1日前' },
    { id: 'act-003', type: 'transaction', description: 'ロックトランザクション 100件完了', timestamp: '2日前' },
  ];

  const billingHistory = [
    { id: 'bill-001', period: '2026年1月', amount: '$8,000', status: 'paid', date: '2026-01-01' },
    { id: 'bill-002', period: '2025年12月', amount: '$8,000', status: 'paid', date: '2025-12-01' },
    { id: 'bill-003', period: '2025年11月', amount: '$8,000', status: 'paid', date: '2025-11-01' },
  ];

  const tabs = [
    { key: 'overview', label: t('tabs.overview') },
    { key: 'users', label: t('tabs.users') },
    { key: 'billing', label: t('tabs.billing') },
    { key: 'contract', label: t('tabs.contract') },
    { key: 'settings', label: t('tabs.settings') },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">{t('status.active')}</Badge>;
      case 'suspended':
        return <Badge variant="danger">{t('status.suspended')}</Badge>;
      case 'pending':
        return <Badge variant="warning">{t('status.pending')}</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebarV2 />

      <main className="pl-[280px]" role="main" aria-label={t('ariaLabel')}>
        <div className="p-6 lg:p-8">
          {/* Header */}
          <div className="mb-6">
            <nav className="flex items-center gap-2 text-sm text-foreground-tertiary" aria-label="Breadcrumb">
              <Link href="/admin/dashboard" className="hover:text-foreground">
                Dashboard
              </Link>
              <ChevronRight className="h-4 w-4" />
              <Link href="/admin/saas/operators" className="hover:text-foreground">
                {t('breadcrumb.operators')}
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground">{operator.name}</span>
            </nav>
            <div className="mt-4 flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gold/10">
                  <Building2 className="h-8 w-8 text-gold" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-foreground">{operator.name}</h1>
                    {getStatusBadge(operator.status)}
                    <Badge variant="gold">{operator.plan}</Badge>
                  </div>
                  <div className="mt-1 flex items-center gap-4 text-sm text-foreground-tertiary">
                    <span>ID: {operator.id}</span>
                    <span>CSM: {operator.accountManager}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" leftIcon={<FileText className="h-4 w-4" />}>
                  {t('actions.viewContract')}
                </Button>
                <Button leftIcon={<Settings className="h-4 w-4" />}>
                  {t('actions.manage')}
                </Button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard
              label={t('stats.mrr')}
              value={operator.mrr}
              icon={<CreditCard className="h-5 w-5" />}
              status="success"
            />
            <StatCard
              label={t('stats.users')}
              value={String(operator.users)}
              subValue={`${operator.activeUsers} ${t('stats.active')}`}
              icon={<Users className="h-5 w-5" />}
              status="info"
            />
            <StatCard
              label={t('stats.tvl')}
              value={operator.tvl}
              icon={<Wallet className="h-5 w-5" />}
              status="info"
            />
            <StatCard
              label={t('stats.transactions')}
              value={operator.transactions.toLocaleString()}
              icon={<Activity className="h-5 w-5" />}
              status="info"
            />
            <StatCard
              label={t('stats.lastActivity')}
              value={operator.lastActivity}
              icon={<Clock className="h-5 w-5" />}
              status="success"
            />
          </div>

          {/* Tabs */}
          <div className="mb-6 flex gap-1 rounded-lg border border-surface-tertiary bg-background-secondary p-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={cn(
                  'rounded-md px-4 py-2 text-sm font-medium transition-all',
                  activeTab === tab.key
                    ? 'bg-gold text-background'
                    : 'text-foreground-secondary hover:text-foreground'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t('overview.info')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-3">
                    <div className="flex justify-between">
                      <dt className="text-foreground-tertiary">{t('overview.operatorId')}</dt>
                      <dd className="font-mono text-foreground">{operator.id}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-foreground-tertiary">{t('overview.plan')}</dt>
                      <dd className="text-foreground">{operator.plan}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-foreground-tertiary">{t('overview.contractPeriod')}</dt>
                      <dd className="text-foreground">{operator.contractStart} 〜 {operator.contractEnd}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-foreground-tertiary">{t('overview.accountManager')}</dt>
                      <dd className="text-foreground">{operator.accountManager}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t('overview.recentActivity')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-center justify-between rounded-lg border border-surface-tertiary bg-background-secondary p-3">
                        <div>
                          <div className="text-sm text-foreground">{activity.description}</div>
                        </div>
                        <span className="text-xs text-foreground-tertiary">{activity.timestamp}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('users.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-surface-tertiary">
                  <div className="text-center text-foreground-tertiary">
                    <Users className="mx-auto h-12 w-12" />
                    <p className="mt-2">{t('users.placeholder')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Billing Tab */}
          {activeTab === 'billing' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('billing.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {billingHistory.map((bill) => (
                    <div key={bill.id} className="flex items-center justify-between rounded-lg border border-surface-tertiary bg-background-secondary p-4">
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5 text-gold" />
                        <div>
                          <div className="font-medium text-foreground">{bill.period}</div>
                          <div className="text-xs text-foreground-tertiary">{bill.date}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-mono font-medium text-foreground">{bill.amount}</span>
                        <Badge variant="success">{bill.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Contract Tab */}
          {activeTab === 'contract' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('contract.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="rounded-lg border border-surface-tertiary p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-gold" />
                        <div>
                          <div className="font-medium text-foreground">{t('contract.msa')}</div>
                          <div className="text-xs text-foreground-tertiary">v2.1 - 2025-06-01</div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        {t('contract.view')}
                      </Button>
                    </div>
                  </div>
                  <div className="rounded-lg border border-surface-tertiary p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-gold" />
                        <div>
                          <div className="font-medium text-foreground">{t('contract.sla')}</div>
                          <div className="text-xs text-foreground-tertiary">v1.5 - 2025-06-01</div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        {t('contract.view')}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('settings.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border border-surface-tertiary p-4">
                    <div>
                      <div className="font-medium text-foreground">{t('settings.suspendAccount')}</div>
                      <div className="text-sm text-foreground-tertiary">{t('settings.suspendDesc')}</div>
                    </div>
                    <Button variant="outline" className="border-warning text-warning hover:bg-warning hover:text-white">
                      {t('settings.suspend')}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-danger/30 bg-danger/5 p-4">
                    <div>
                      <div className="font-medium text-foreground">{t('settings.terminateAccount')}</div>
                      <div className="text-sm text-foreground-tertiary">{t('settings.terminateDesc')}</div>
                    </div>
                    <Button variant="outline" className="border-danger text-danger hover:bg-danger hover:text-white">
                      {t('settings.terminate')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
