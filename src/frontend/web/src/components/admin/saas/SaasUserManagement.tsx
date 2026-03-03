'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  ChevronRight,
  Building2,
  Wallet,
  Clock,
  Lock,
  Activity,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Shield,
  Download,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AdminSidebarV2 } from '../AdminSidebarV2';

interface StatCardProps {
  label: string;
  value: string;
  subValue?: string;
  trend?: { value: string; direction: 'up' | 'down' };
  icon: React.ReactNode;
  status?: 'success' | 'warning' | 'danger';
}

function StatCard({ label, value, subValue, trend, icon, status = 'success' }: StatCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={cn(
          'flex h-10 w-10 items-center justify-center rounded-lg',
          status === 'success' && 'bg-success/10 text-success',
          status === 'warning' && 'bg-warning/10 text-warning',
          status === 'danger' && 'bg-danger/10 text-danger'
        )}>
          {icon}
        </div>
        <div className="flex-1">
          <div className="text-xs text-foreground-tertiary">{label}</div>
          <div className="flex items-center gap-2">
            <div className="text-xl font-bold text-foreground">{value}</div>
            {trend && (
              <span className={cn(
                'flex items-center text-xs',
                trend.direction === 'up' ? 'text-success' : 'text-danger'
              )}>
                <TrendingUp className={cn('h-3 w-3', trend.direction === 'down' && 'rotate-180')} />
                {trend.value}
              </span>
            )}
          </div>
          {subValue && <div className="text-xs text-foreground-secondary">{subValue}</div>}
        </div>
      </div>
    </Card>
  );
}

// Mock data
const SAMPLE_USERS = [
  {
    id: 'saas-user-001',
    userId: 'USR-12345',
    email: 'tanaka@example.com',
    operatorId: 'op-001',
    operatorName: 'Global Finance Corp',
    status: 'active',
    plan: 'Enterprise',
    totalTransactions: 1523,
    lastActivity: '2分前',
    registeredAt: '2025-10-15',
    riskScore: 12,
  },
  {
    id: 'saas-user-002',
    userId: 'USR-12346',
    email: 'yamamoto@corp.co.jp',
    operatorId: 'op-002',
    operatorName: 'Asian Banking Group',
    status: 'active',
    plan: 'Professional',
    totalTransactions: 892,
    lastActivity: '15分前',
    registeredAt: '2025-11-20',
    riskScore: 8,
  },
  {
    id: 'saas-user-003',
    userId: 'USR-12347',
    email: 'suzuki@finance.jp',
    operatorId: 'op-001',
    operatorName: 'Global Finance Corp',
    status: 'suspended',
    plan: 'Enterprise',
    totalTransactions: 2341,
    lastActivity: '3日前',
    registeredAt: '2025-09-05',
    riskScore: 85,
  },
  {
    id: 'saas-user-004',
    userId: 'USR-12348',
    email: 'kim@crypto.kr',
    operatorId: 'op-003',
    operatorName: 'Nordic Crypto Exchange',
    status: 'pending',
    plan: 'Professional',
    totalTransactions: 0,
    lastActivity: '-',
    registeredAt: '2026-01-15',
    riskScore: 0,
  },
  {
    id: 'saas-user-005',
    userId: 'USR-12349',
    email: 'mueller@bank.de',
    operatorId: 'op-002',
    operatorName: 'Asian Banking Group',
    status: 'active',
    plan: 'Professional',
    totalTransactions: 456,
    lastActivity: '1時間前',
    registeredAt: '2025-12-01',
    riskScore: 15,
  },
  {
    id: 'saas-user-006',
    userId: 'USR-12350',
    email: 'chen@trade.cn',
    operatorId: 'op-004',
    operatorName: 'Euro Securities Ltd',
    status: 'flagged',
    plan: 'Enterprise',
    totalTransactions: 3892,
    lastActivity: '30分前',
    registeredAt: '2025-08-10',
    riskScore: 72,
  },
];

const DEFAULT_METRICS = {
  totalUsers: 15892,
  activeUsers: 12456,
  suspendedUsers: 234,
  flaggedUsers: 89,
  avgTransactions: 523,
};

export function SaasUserManagement() {
  const t = useTranslations('admin.saasUsers');
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'suspended' | 'flagged' | 'pending'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const tabs = [
    { key: 'all', label: t('tabs.all'), count: SAMPLE_USERS.length },
    { key: 'active', label: t('tabs.active'), count: SAMPLE_USERS.filter(u => u.status === 'active').length },
    { key: 'suspended', label: t('tabs.suspended'), count: SAMPLE_USERS.filter(u => u.status === 'suspended').length },
    { key: 'flagged', label: t('tabs.flagged'), count: SAMPLE_USERS.filter(u => u.status === 'flagged').length },
    { key: 'pending', label: t('tabs.pending'), count: SAMPLE_USERS.filter(u => u.status === 'pending').length },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">{t('status.active')}</Badge>;
      case 'suspended':
        return <Badge variant="danger">{t('status.suspended')}</Badge>;
      case 'flagged':
        return <Badge variant="warning">{t('status.flagged')}</Badge>;
      case 'pending':
        return <Badge variant="default">{t('status.pending')}</Badge>;
      default:
        return null;
    }
  };

  const getRiskBadge = (score: number) => {
    if (score >= 70) return <Badge variant="danger">{t('risk.high')}</Badge>;
    if (score >= 40) return <Badge variant="warning">{t('risk.medium')}</Badge>;
    return <Badge variant="success">{t('risk.low')}</Badge>;
  };

  const filteredUsers = SAMPLE_USERS.filter((user) => {
    const matchesSearch =
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.userId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.operatorName.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === 'all') return matchesSearch;
    return matchesSearch && user.status === activeTab;
  });

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebarV2 />

      <main className="pl-[280px]" role="main" aria-label={t('ariaLabel')}>
        <div className="p-6 lg:p-8">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 text-sm text-foreground-tertiary">
              <Link href="/admin/dashboard" className="hover:text-foreground">
                Dashboard
              </Link>
              <ChevronRight className="h-4 w-4" />
              <Link href="/admin/saas/operators" className="hover:text-foreground">
                SaaS
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground">{t('breadcrumb')}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>
                <p className="mt-1 text-sm text-foreground-secondary">{t('subtitle')}</p>
              </div>
              <Button variant="outline" leftIcon={<Download className="h-4 w-4" />}>
                {t('actions.exportUsers')}
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard
              label={t('stats.totalUsers')}
              value={DEFAULT_METRICS.totalUsers.toLocaleString()}
              trend={{ value: '+8.5%', direction: 'up' }}
              icon={<Users className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.activeUsers')}
              value={DEFAULT_METRICS.activeUsers.toLocaleString()}
              subValue="78.4%"
              icon={<CheckCircle className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.suspendedUsers')}
              value={String(DEFAULT_METRICS.suspendedUsers)}
              icon={<AlertTriangle className="h-5 w-5" />}
              status="danger"
            />
            <StatCard
              label={t('stats.flaggedUsers')}
              value={String(DEFAULT_METRICS.flaggedUsers)}
              icon={<Shield className="h-5 w-5" />}
              status="warning"
            />
            <StatCard
              label={t('stats.avgTransactions')}
              value={String(DEFAULT_METRICS.avgTransactions)}
              subValue={t('stats.perUser')}
              icon={<Activity className="h-5 w-5" />}
            />
          </div>

          {/* Tabs */}
          <div className="mb-6 flex gap-1 rounded-lg border border-surface-tertiary bg-background-secondary p-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={cn(
                  'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all',
                  activeTab === tab.key
                    ? 'bg-gold text-background'
                    : 'text-foreground-secondary hover:text-foreground'
                )}
              >
                {tab.label}
                <Badge size="sm" variant={activeTab === tab.key ? 'gold' : 'default'}>
                  {tab.count}
                </Badge>
              </button>
            ))}
          </div>

          {/* User List */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">{t('userList.title')}</CardTitle>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-tertiary" />
                  <input
                    type="text"
                    placeholder={t('userList.searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="rounded-lg border border-surface-tertiary bg-background-secondary py-2 pl-10 pr-4 text-sm focus:border-gold focus:outline-none"
                  />
                </div>
                <Button variant="outline" size="sm" leftIcon={<Filter className="h-4 w-4" />}>
                  {t('userList.filter')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-surface-tertiary text-left text-xs text-foreground-tertiary">
                      <th className="pb-3 font-medium">{t('table.columns.user')}</th>
                      <th className="pb-3 font-medium">{t('table.columns.operator')}</th>
                      <th className="pb-3 font-medium">{t('table.columns.status')}</th>
                      <th className="pb-3 font-medium">{t('table.columns.riskScore')}</th>
                      <th className="pb-3 font-medium">{t('table.columns.transactions')}</th>
                      <th className="pb-3 font-medium">{t('table.columns.lastActivity')}</th>
                      <th className="pb-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr
                        key={user.id}
                        className="border-b border-surface-tertiary/50 hover:bg-background-secondary/50"
                      >
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/10">
                              <Users className="h-5 w-5 text-gold" />
                            </div>
                            <div>
                              <div className="font-medium text-foreground">{user.email}</div>
                              <div className="font-mono text-xs text-foreground-tertiary">
                                {user.userId}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-foreground-tertiary" />
                            <Link
                              href={`/admin/saas/operators/${user.operatorId}`}
                              className="text-sm text-gold hover:underline"
                            >
                              {user.operatorName}
                            </Link>
                          </div>
                          <div className="mt-1">
                            <Badge size="sm" variant="default">{user.plan}</Badge>
                          </div>
                        </td>
                        <td className="py-4">{getStatusBadge(user.status)}</td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm">{user.riskScore}</span>
                            {getRiskBadge(user.riskScore)}
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4 text-foreground-tertiary" />
                            <span>{user.totalTransactions.toLocaleString()}</span>
                          </div>
                        </td>
                        <td className="py-4 text-sm text-foreground-secondary">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {user.lastActivity}
                          </div>
                        </td>
                        <td className="py-4">
                          <Link
                            href={`/admin/saas/users/${user.id}`}
                            className="text-gold hover:underline"
                          >
                            {t('table.viewDetail')}
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="mt-4 flex items-center justify-between border-t border-surface-tertiary pt-4">
                <div className="text-sm text-foreground-tertiary">
                  {t('pagination.showing', { count: filteredUsers.length, total: SAMPLE_USERS.length })}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled>
                    {t('pagination.previous')}
                  </Button>
                  <Button variant="outline" size="sm">
                    {t('pagination.next')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
