'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useState } from 'react';
import {
  ChevronRight,
  Activity,
  Users,
  Shield,
  FileSignature,
  Download,
  BarChart3,
  TrendingUp,
  AlertTriangle,
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
const SAMPLE_OPERATOR_USAGE = [
  {
    id: 'op-001',
    name: 'Mega Corp',
    plan: 'Enterprise',
    users: { used: 850, limit: -1 },
    signatures: { used: 45230, limit: -1 },
    apiCalls: { used: 1250000, limit: -1 },
    storage: { used: 45, limit: 100 },
    billingStatus: 'current',
  },
  {
    id: 'op-002',
    name: 'Tech Solutions',
    plan: 'Professional',
    users: { used: 420, limit: 1000 },
    signatures: { used: 12500, limit: 50000 },
    apiCalls: { used: 850000, limit: 1000000 },
    storage: { used: 18, limit: 50 },
    billingStatus: 'current',
  },
  {
    id: 'op-003',
    name: 'Digital Bank',
    plan: 'Professional',
    users: { used: 890, limit: 1000 },
    signatures: { used: 48000, limit: 50000 },
    apiCalls: { used: 920000, limit: 1000000 },
    storage: { used: 42, limit: 50 },
    billingStatus: 'warning',
  },
  {
    id: 'op-004',
    name: 'Startup Inc',
    plan: 'Starter',
    users: { used: 45, limit: 100 },
    signatures: { used: 2100, limit: 5000 },
    apiCalls: { used: 120000, limit: 200000 },
    storage: { used: 3, limit: 10 },
    billingStatus: 'current',
  },
  {
    id: 'op-005',
    name: 'Finance Corp',
    plan: 'Enterprise',
    users: { used: 1200, limit: -1 },
    signatures: { used: 78500, limit: -1 },
    apiCalls: { used: 2100000, limit: -1 },
    storage: { used: 68, limit: 100 },
    billingStatus: 'current',
  },
];

const DEFAULT_USAGE_METRICS = {
  totalUsers: 3405,
  totalSignatures: 186330,
  totalApiCalls: 5240000,
  totalStorage: 176,
  avgUtilization: 72,
};

export function SaasBillingUsage() {
  const t = useTranslations('admin.billingUsage');
  const [timeRange, setTimeRange] = useState<'today' | '7d' | '30d'>('30d');
  const [sortBy, setSortBy] = useState<'users' | 'signatures' | 'apiCalls'>('signatures');

  const timeRanges = [
    { key: 'today', label: t('timeRanges.today') },
    { key: '7d', label: t('timeRanges.7d') },
    { key: '30d', label: t('timeRanges.30d') },
  ];

  const getUsagePercentage = (used: number, limit: number): number => {
    if (limit === -1) return 0;
    return Math.round((used / limit) * 100);
  };

  const getUsageColor = (percentage: number): string => {
    if (percentage >= 90) return 'text-danger';
    if (percentage >= 75) return 'text-warning';
    return 'text-success';
  };

  const getUsageBarColor = (percentage: number): string => {
    if (percentage >= 90) return 'bg-danger';
    if (percentage >= 75) return 'bg-warning';
    return 'bg-success';
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

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
              <Link href="/admin/saas/billing" className="hover:text-foreground">
                Billing
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
                {t('exportReport')}
              </Button>
            </div>
          </div>

          {/* Time Range Selector */}
          <div className="mb-6 flex items-center gap-4">
            <div className="flex gap-1 rounded-lg border border-surface-tertiary bg-background-secondary p-1">
              {timeRanges.map((range) => (
                <button
                  key={range.key}
                  onClick={() => setTimeRange(range.key as typeof timeRange)}
                  className={cn(
                    'rounded-md px-4 py-2 text-sm font-medium transition-all',
                    timeRange === range.key
                      ? 'bg-gold text-background'
                      : 'text-foreground-secondary hover:text-foreground'
                  )}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard
              label={t('stats.totalUsers')}
              value={DEFAULT_USAGE_METRICS.totalUsers.toLocaleString()}
              trend={{ value: '+12%', direction: 'up' }}
              icon={<Users className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.totalSignatures')}
              value={formatNumber(DEFAULT_USAGE_METRICS.totalSignatures)}
              trend={{ value: '+8%', direction: 'up' }}
              icon={<FileSignature className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.totalApiCalls')}
              value={formatNumber(DEFAULT_USAGE_METRICS.totalApiCalls)}
              trend={{ value: '+15%', direction: 'up' }}
              icon={<Activity className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.totalStorage')}
              value={`${DEFAULT_USAGE_METRICS.totalStorage} GB`}
              icon={<Shield className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.avgUtilization')}
              value={`${DEFAULT_USAGE_METRICS.avgUtilization}%`}
              icon={<BarChart3 className="h-5 w-5" />}
              status="success"
            />
          </div>

          {/* Usage Chart */}
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">{t('chart.title')}</CardTitle>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-gold" />
                  {t('chart.signatures')}
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-success" />
                  {t('chart.apiCalls')}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-surface-tertiary">
                <div className="text-center text-foreground-tertiary">
                  <BarChart3 className="mx-auto h-12 w-12" />
                  <p className="mt-2">{t('chart.placeholder')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Operator Usage Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">{t('table.title')}</CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-xs text-foreground-tertiary">{t('table.sortBy')}:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="rounded-lg border border-surface-tertiary bg-background-secondary px-3 py-1.5 text-sm focus:border-gold focus:outline-none"
                >
                  <option value="signatures">{t('table.sortOptions.signatures')}</option>
                  <option value="users">{t('table.sortOptions.users')}</option>
                  <option value="apiCalls">{t('table.sortOptions.apiCalls')}</option>
                </select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-surface-tertiary text-left text-xs text-foreground-tertiary">
                      <th className="pb-3 font-medium">{t('table.columns.operator')}</th>
                      <th className="pb-3 font-medium">{t('table.columns.plan')}</th>
                      <th className="pb-3 font-medium">{t('table.columns.users')}</th>
                      <th className="pb-3 font-medium">{t('table.columns.signatures')}</th>
                      <th className="pb-3 font-medium">{t('table.columns.apiCalls')}</th>
                      <th className="pb-3 font-medium">{t('table.columns.storage')}</th>
                      <th className="pb-3 font-medium">{t('table.columns.status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SAMPLE_OPERATOR_USAGE.map((operator) => {
                      const usersPercent = getUsagePercentage(operator.users.used, operator.users.limit);
                      const signaturesPercent = getUsagePercentage(operator.signatures.used, operator.signatures.limit);
                      const apiPercent = getUsagePercentage(operator.apiCalls.used, operator.apiCalls.limit);
                      const storagePercent = getUsagePercentage(operator.storage.used, operator.storage.limit);

                      return (
                        <tr
                          key={operator.id}
                          className="border-b border-surface-tertiary/50 hover:bg-background-secondary/50"
                        >
                          <td className="py-4">
                            <Link
                              href={`/admin/saas/operators/${operator.id}`}
                              className="font-medium text-foreground hover:text-gold"
                            >
                              {operator.name}
                            </Link>
                          </td>
                          <td className="py-4">
                            <Badge variant={operator.plan === 'Enterprise' ? 'gold' : 'default'}>
                              {operator.plan}
                            </Badge>
                          </td>
                          <td className="py-4">
                            <div className="w-32">
                              <div className="flex items-center justify-between text-xs">
                                <span className={operator.users.limit === -1 ? '' : getUsageColor(usersPercent)}>
                                  {operator.users.used.toLocaleString()}
                                </span>
                                <span className="text-foreground-tertiary">
                                  / {operator.users.limit === -1 ? t('unlimited') : operator.users.limit.toLocaleString()}
                                </span>
                              </div>
                              {operator.users.limit !== -1 && (
                                <div className="mt-1 h-1.5 rounded-full bg-surface-tertiary">
                                  <div
                                    className={cn('h-full rounded-full', getUsageBarColor(usersPercent))}
                                    style={{ width: `${Math.min(usersPercent, 100)}%` }}
                                  />
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-4">
                            <div className="w-32">
                              <div className="flex items-center justify-between text-xs">
                                <span className={operator.signatures.limit === -1 ? '' : getUsageColor(signaturesPercent)}>
                                  {formatNumber(operator.signatures.used)}
                                </span>
                                <span className="text-foreground-tertiary">
                                  / {operator.signatures.limit === -1 ? t('unlimited') : formatNumber(operator.signatures.limit)}
                                </span>
                              </div>
                              {operator.signatures.limit !== -1 && (
                                <div className="mt-1 h-1.5 rounded-full bg-surface-tertiary">
                                  <div
                                    className={cn('h-full rounded-full', getUsageBarColor(signaturesPercent))}
                                    style={{ width: `${Math.min(signaturesPercent, 100)}%` }}
                                  />
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-4">
                            <div className="w-32">
                              <div className="flex items-center justify-between text-xs">
                                <span className={operator.apiCalls.limit === -1 ? '' : getUsageColor(apiPercent)}>
                                  {formatNumber(operator.apiCalls.used)}
                                </span>
                                <span className="text-foreground-tertiary">
                                  / {operator.apiCalls.limit === -1 ? t('unlimited') : formatNumber(operator.apiCalls.limit)}
                                </span>
                              </div>
                              {operator.apiCalls.limit !== -1 && (
                                <div className="mt-1 h-1.5 rounded-full bg-surface-tertiary">
                                  <div
                                    className={cn('h-full rounded-full', getUsageBarColor(apiPercent))}
                                    style={{ width: `${Math.min(apiPercent, 100)}%` }}
                                  />
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-4">
                            <div className="w-24">
                              <div className="flex items-center justify-between text-xs">
                                <span className={getUsageColor(storagePercent)}>
                                  {operator.storage.used} GB
                                </span>
                                <span className="text-foreground-tertiary">
                                  / {operator.storage.limit} GB
                                </span>
                              </div>
                              <div className="mt-1 h-1.5 rounded-full bg-surface-tertiary">
                                <div
                                  className={cn('h-full rounded-full', getUsageBarColor(storagePercent))}
                                  style={{ width: `${Math.min(storagePercent, 100)}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-4">
                            {operator.billingStatus === 'warning' ? (
                              <Badge variant="warning" className="flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                {t('status.nearLimit')}
                              </Badge>
                            ) : (
                              <Badge variant="success">{t('status.normal')}</Badge>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
