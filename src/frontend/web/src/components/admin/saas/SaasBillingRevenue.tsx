'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useState } from 'react';
import {
  ChevronRight,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
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
                {trend.direction === 'up' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
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
const mockRevenueByPlan = [
  { plan: 'Enterprise', revenue: 180000000, percentage: 48.6 },
  { plan: 'Professional', revenue: 160000000, percentage: 43.2 },
  { plan: 'Starter', revenue: 30000000, percentage: 8.2 },
];

const mockMonthlyRevenue = [
  { month: '2025-08', revenue: 280000000, growth: 0 },
  { month: '2025-09', revenue: 295000000, growth: 5.4 },
  { month: '2025-10', revenue: 320000000, growth: 8.5 },
  { month: '2025-11', revenue: 340000000, growth: 6.3 },
  { month: '2025-12', revenue: 355000000, growth: 4.4 },
  { month: '2026-01', revenue: 370000000, growth: 4.2 },
];

const mockTopOperators = [
  { name: 'Mega Corp', plan: 'Enterprise', revenue: 60000000, growth: 12.5 },
  { name: 'Finance Corp', plan: 'Enterprise', revenue: 55000000, growth: 8.2 },
  { name: 'Tech Solutions', plan: 'Professional', revenue: 24000000, growth: 15.3 },
  { name: 'Digital Bank', plan: 'Professional', revenue: 22000000, growth: -2.1 },
  { name: 'Global Trade', plan: 'Enterprise', revenue: 45000000, growth: 5.8 },
];

const mockMetrics = {
  mrr: 37000000,
  arr: 444000000,
  avgRevenuePerOperator: 16086956,
  churnRate: 2.1,
  ltv: 192000000,
};

function formatCurrency(amount: number): string {
  if (amount >= 100000000) return `¥${(amount / 100000000).toFixed(1)}億`;
  if (amount >= 10000) return `¥${(amount / 10000).toFixed(0)}万`;
  return `¥${amount.toLocaleString()}`;
}

export function SaasBillingRevenue() {
  const t = useTranslations('admin.billingRevenue');
  const [timeRange, setTimeRange] = useState<'30d' | '90d' | '12m'>('12m');

  const timeRanges = [
    { key: '30d', label: t('timeRanges.30d') },
    { key: '90d', label: t('timeRanges.90d') },
    { key: '12m', label: t('timeRanges.12m') },
  ];

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

          {/* Key Metrics */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard
              label={t('stats.mrr')}
              value={formatCurrency(mockMetrics.mrr)}
              trend={{ value: '+4.2%', direction: 'up' }}
              icon={<DollarSign className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.arr')}
              value={formatCurrency(mockMetrics.arr)}
              trend={{ value: '+8.5%', direction: 'up' }}
              icon={<Calendar className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.arpu')}
              value={formatCurrency(mockMetrics.avgRevenuePerOperator)}
              trend={{ value: '+2.1%', direction: 'up' }}
              icon={<TrendingUp className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.churnRate')}
              value={`${mockMetrics.churnRate}%`}
              trend={{ value: '-0.3%', direction: 'up' }}
              icon={<TrendingDown className="h-5 w-5" />}
              status="success"
            />
            <StatCard
              label={t('stats.ltv')}
              value={formatCurrency(mockMetrics.ltv)}
              icon={<BarChart3 className="h-5 w-5" />}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Revenue Chart */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">{t('revenueChart.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-surface-tertiary">
                    <div className="text-center text-foreground-tertiary">
                      <BarChart3 className="mx-auto h-12 w-12" />
                      <p className="mt-2">{t('revenueChart.placeholder')}</p>
                    </div>
                  </div>

                  {/* Monthly Revenue Table */}
                  <div className="mt-6 overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-surface-tertiary text-left text-xs text-foreground-tertiary">
                          <th className="pb-3 font-medium">{t('revenueChart.columns.month')}</th>
                          <th className="pb-3 font-medium text-right">{t('revenueChart.columns.revenue')}</th>
                          <th className="pb-3 font-medium text-right">{t('revenueChart.columns.growth')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mockMonthlyRevenue.map((month) => (
                          <tr
                            key={month.month}
                            className="border-b border-surface-tertiary/50"
                          >
                            <td className="py-3 text-sm">{month.month}</td>
                            <td className="py-3 text-right font-mono text-sm">
                              {formatCurrency(month.revenue)}
                            </td>
                            <td className="py-3 text-right text-sm">
                              {month.growth > 0 ? (
                                <span className="flex items-center justify-end gap-1 text-success">
                                  <ArrowUpRight className="h-3 w-3" />
                                  +{month.growth}%
                                </span>
                              ) : month.growth < 0 ? (
                                <span className="flex items-center justify-end gap-1 text-danger">
                                  <ArrowDownRight className="h-3 w-3" />
                                  {month.growth}%
                                </span>
                              ) : (
                                <span className="text-foreground-tertiary">-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Revenue by Plan */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t('revenueByPlan.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-surface-tertiary">
                    <div className="text-center text-foreground-tertiary">
                      <PieChart className="mx-auto h-12 w-12" />
                      <p className="mt-2">{t('revenueByPlan.placeholder')}</p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    {mockRevenueByPlan.map((item) => (
                      <div
                        key={item.plan}
                        className="flex items-center justify-between rounded-lg border border-surface-tertiary p-3"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              'h-3 w-3 rounded-full',
                              item.plan === 'Enterprise' && 'bg-gold',
                              item.plan === 'Professional' && 'bg-success',
                              item.plan === 'Starter' && 'bg-foreground-tertiary'
                            )}
                          />
                          <div>
                            <div className="text-sm font-medium">{item.plan}</div>
                            <div className="text-xs text-foreground-tertiary">{item.percentage}%</div>
                          </div>
                        </div>
                        <div className="font-mono text-sm font-medium text-gold">
                          {formatCurrency(item.revenue)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Top Revenue Operators */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base">{t('topOperators.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-surface-tertiary text-left text-xs text-foreground-tertiary">
                      <th className="pb-3 font-medium">{t('topOperators.columns.rank')}</th>
                      <th className="pb-3 font-medium">{t('topOperators.columns.operator')}</th>
                      <th className="pb-3 font-medium">{t('topOperators.columns.plan')}</th>
                      <th className="pb-3 font-medium text-right">{t('topOperators.columns.revenue')}</th>
                      <th className="pb-3 font-medium text-right">{t('topOperators.columns.growth')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockTopOperators.map((operator, index) => (
                      <tr
                        key={operator.name}
                        className="border-b border-surface-tertiary/50 hover:bg-background-secondary/50"
                      >
                        <td className="py-4">
                          <span
                            className={cn(
                              'flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold',
                              index === 0 && 'bg-gold/20 text-gold',
                              index === 1 && 'bg-foreground-tertiary/20 text-foreground-tertiary',
                              index === 2 && 'bg-warning/20 text-warning',
                              index > 2 && 'bg-surface-tertiary text-foreground-secondary'
                            )}
                          >
                            #{index + 1}
                          </span>
                        </td>
                        <td className="py-4">
                          <Link
                            href={`/admin/saas/operators/${operator.name.toLowerCase().replace(' ', '-')}`}
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
                        <td className="py-4 text-right font-mono">
                          {formatCurrency(operator.revenue)}
                        </td>
                        <td className="py-4 text-right">
                          {operator.growth > 0 ? (
                            <span className="flex items-center justify-end gap-1 text-success">
                              <ArrowUpRight className="h-3 w-3" />
                              +{operator.growth}%
                            </span>
                          ) : operator.growth < 0 ? (
                            <span className="flex items-center justify-end gap-1 text-danger">
                              <ArrowDownRight className="h-3 w-3" />
                              {operator.growth}%
                            </span>
                          ) : (
                            <span className="text-foreground-tertiary">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
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
