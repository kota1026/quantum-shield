'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useState } from 'react';
import {
  Users,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Activity,
  UserPlus,
  Building2,
  Clock,
  BarChart3,
  PieChart,
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
                {trend.direction === 'up' ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
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
const DEFAULT_STATS_DATA = {
  overview: {
    totalUsers: '28,456',
    activeUsers: '24,891',
    newUsersThisMonth: '1,234',
    avgSessionDuration: '12.5m',
    totalOperators: '45',
    avgUsersPerOperator: '632',
  },
  timeRanges: ['7d', '30d', '90d', '1y'] as const,
  usersByOperator: [
    { operator: 'GFC Holdings', users: 8500, percentage: 30, growth: '+12%' },
    { operator: 'ABG Bank', users: 6200, percentage: 22, growth: '+8%' },
    { operator: 'Crypto Trust', users: 4800, percentage: 17, growth: '+15%' },
    { operator: 'SecureVault', users: 3500, percentage: 12, growth: '+5%' },
    { operator: 'Others', users: 5456, percentage: 19, growth: '+10%' },
  ],
  userGrowthByMonth: [
    { month: '8月', users: 18500, new: 2100 },
    { month: '9月', users: 20800, new: 2300 },
    { month: '10月', users: 23200, new: 2400 },
    { month: '11月', users: 25800, new: 2600 },
    { month: '12月', users: 27200, new: 1400 },
    { month: '1月', users: 28456, new: 1234 },
  ],
  userActivity: [
    { label: '毎日アクティブ', count: 8500, percentage: 34 },
    { label: '週次アクティブ', count: 12500, percentage: 50 },
    { label: '月次アクティブ', count: 3891, percentage: 16 },
  ],
  usersByPlan: [
    { plan: 'Enterprise', users: 12500, color: 'gold' },
    { plan: 'Professional', users: 10500, color: 'success' },
    { plan: 'Starter', users: 5456, color: 'warning' },
  ],
};

export function SaasUserStats() {
  const t = useTranslations('admin.saasUserStats');
  const [selectedTimeRange, setSelectedTimeRange] = useState<typeof DEFAULT_STATS_DATA.timeRanges[number]>('30d');

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
              <Link href="/admin/saas/users" className="hover:text-foreground">
                {t('breadcrumbParent')}
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground">{t('breadcrumb')}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>
                <p className="mt-1 text-sm text-foreground-secondary">{t('subtitle')}</p>
              </div>
              <div className="flex gap-2">
                {DEFAULT_STATS_DATA.timeRanges.map((range) => (
                  <Button
                    key={range}
                    variant={selectedTimeRange === range ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedTimeRange(range)}
                  >
                    {range}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
            <StatCard
              label={t('stats.totalUsers')}
              value={DEFAULT_STATS_DATA.overview.totalUsers}
              trend={{ value: '+8.2%', direction: 'up' }}
              icon={<Users className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.activeUsers')}
              value={DEFAULT_STATS_DATA.overview.activeUsers}
              subValue="87.5%"
              icon={<Activity className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.newUsersThisMonth')}
              value={DEFAULT_STATS_DATA.overview.newUsersThisMonth}
              trend={{ value: '+15%', direction: 'up' }}
              icon={<UserPlus className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.avgSessionDuration')}
              value={DEFAULT_STATS_DATA.overview.avgSessionDuration}
              icon={<Clock className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.totalOperators')}
              value={DEFAULT_STATS_DATA.overview.totalOperators}
              icon={<Building2 className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.avgUsersPerOperator')}
              value={DEFAULT_STATS_DATA.overview.avgUsersPerOperator}
              icon={<BarChart3 className="h-5 w-5" />}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Users by Operator */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('usersByOperator.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {DEFAULT_STATS_DATA.usersByOperator.map((op, index) => (
                    <div key={index}>
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-foreground-tertiary" />
                          <span className="text-sm font-medium">{op.operator}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm">{op.users.toLocaleString()}</span>
                          <Badge variant="success" size="sm">{op.growth}</Badge>
                        </div>
                      </div>
                      <div className="h-2 rounded-full bg-background-secondary">
                        <div
                          className="h-2 rounded-full bg-gold"
                          style={{ width: `${op.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* User Growth Chart */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">{t('userGrowth.title')}</CardTitle>
                <Badge variant="gold">{selectedTimeRange}</Badge>
              </CardHeader>
              <CardContent>
                <div className="h-64 rounded-lg bg-background-secondary p-4">
                  <div className="flex h-full flex-col justify-between">
                    <div className="text-xs text-foreground-tertiary">{t('userGrowth.chartLabel')}</div>
                    <div className="flex items-end justify-between gap-2">
                      {DEFAULT_STATS_DATA.userGrowthByMonth.map((data, index) => (
                        <div key={index} className="flex flex-col items-center gap-1">
                          <div className="relative">
                            <div
                              className="w-10 rounded-t bg-gold/30"
                              style={{ height: `${(data.users / 30000) * 150}px` }}
                            />
                            <div
                              className="absolute bottom-0 w-10 rounded-t bg-gold"
                              style={{ height: `${(data.new / 30000) * 150}px` }}
                            />
                          </div>
                          <span className="text-xs text-foreground-tertiary">{data.month}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded bg-gold/30" />
                    <span className="text-xs text-foreground-secondary">{t('userGrowth.totalUsers')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded bg-gold" />
                    <span className="text-xs text-foreground-secondary">{t('userGrowth.newUsers')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* User Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('userActivity.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {DEFAULT_STATS_DATA.userActivity.map((activity, index) => (
                    <div key={index}>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm text-foreground">{activity.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{activity.count.toLocaleString()}</span>
                          <span className="text-xs text-foreground-tertiary">({activity.percentage}%)</span>
                        </div>
                      </div>
                      <div className="h-2 rounded-full bg-background-secondary">
                        <div
                          className="h-2 rounded-full bg-gold"
                          style={{ width: `${activity.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Users by Plan */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('usersByPlan.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {DEFAULT_STATS_DATA.usersByPlan.map((plan, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg border border-surface-tertiary p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'h-3 w-3 rounded-full',
                          plan.color === 'gold' && 'bg-gold',
                          plan.color === 'success' && 'bg-success',
                          plan.color === 'warning' && 'bg-warning'
                        )} />
                        <span className="text-sm font-medium">{plan.plan}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{plan.users.toLocaleString()}</div>
                        <div className="text-xs text-foreground-tertiary">
                          {Math.round((plan.users / 28456) * 100)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
