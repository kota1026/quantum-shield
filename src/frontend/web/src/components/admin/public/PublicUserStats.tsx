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
  UserMinus,
  Clock,
  BarChart3,
  Calendar,
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
const mockStatsData = {
  overview: {
    totalUsers: '4,523',
    activeUsers: '3,891',
    newUsersThisMonth: '342',
    churnRate: '2.1%',
    avgSessionDuration: '8.5m',
    retentionRate: '87%',
  },
  timeRanges: ['7d', '30d', '90d', '1y'] as const,
  userGrowth: [
    { month: '8月', users: 2850, newUsers: 280 },
    { month: '9月', users: 3120, newUsers: 310 },
    { month: '10月', users: 3580, newUsers: 390 },
    { month: '11月', users: 3950, newUsers: 420 },
    { month: '12月', users: 4280, newUsers: 380 },
    { month: '1月', users: 4523, newUsers: 342 },
  ],
  userActivity: [
    { label: '毎日アクティブ', count: 1245, percentage: 32 },
    { label: '週次アクティブ', count: 2156, percentage: 55 },
    { label: '月次アクティブ', count: 890, percentage: 23 },
    { label: '休眠状態', count: 632, percentage: 14 },
  ],
  userSegments: [
    { segment: '大口保有者 (>100 ETH)', count: 45, tvl: '$28.5M', color: 'gold' },
    { segment: '中口保有者 (10-100 ETH)', count: 312, tvl: '$12.8M', color: 'success' },
    { segment: '小口保有者 (<10 ETH)', count: 4166, tvl: '$3.9M', color: 'warning' },
  ],
  topRegions: [
    { region: '日本', users: 1820, percentage: 40 },
    { region: '米国', users: 905, percentage: 20 },
    { region: 'シンガポール', users: 678, percentage: 15 },
    { region: '韓国', users: 452, percentage: 10 },
    { region: 'その他', users: 668, percentage: 15 },
  ],
};

export function PublicUserStats() {
  const t = useTranslations('admin.publicUserStats');
  const [selectedTimeRange, setSelectedTimeRange] = useState<typeof mockStatsData.timeRanges[number]>('30d');

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
              <Link href="/admin/public/users" className="hover:text-foreground">
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
                {mockStatsData.timeRanges.map((range) => (
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
              value={mockStatsData.overview.totalUsers}
              trend={{ value: '+5.2%', direction: 'up' }}
              icon={<Users className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.activeUsers')}
              value={mockStatsData.overview.activeUsers}
              subValue="86%"
              icon={<Activity className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.newUsersThisMonth')}
              value={mockStatsData.overview.newUsersThisMonth}
              trend={{ value: '+12%', direction: 'up' }}
              icon={<UserPlus className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.churnRate')}
              value={mockStatsData.overview.churnRate}
              trend={{ value: '-0.3%', direction: 'up' }}
              icon={<UserMinus className="h-5 w-5" />}
              status="warning"
            />
            <StatCard
              label={t('stats.avgSessionDuration')}
              value={mockStatsData.overview.avgSessionDuration}
              icon={<Clock className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.retentionRate')}
              value={mockStatsData.overview.retentionRate}
              icon={<TrendingUp className="h-5 w-5" />}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
                      {mockStatsData.userGrowth.map((data, index) => (
                        <div key={index} className="flex flex-col items-center gap-1">
                          <div className="relative">
                            <div
                              className="w-10 rounded-t bg-gold/30"
                              style={{ height: `${(data.users / 5000) * 150}px` }}
                            />
                            <div
                              className="absolute bottom-0 w-10 rounded-t bg-gold"
                              style={{ height: `${(data.newUsers / 5000) * 150}px` }}
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

            {/* User Activity Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('userActivity.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockStatsData.userActivity.map((activity, index) => (
                    <div key={index}>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm text-foreground">{activity.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">{activity.count.toLocaleString()}</span>
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

            {/* User Segments */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('userSegments.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockStatsData.userSegments.map((segment, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg border border-surface-tertiary p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'h-3 w-3 rounded-full',
                          segment.color === 'gold' && 'bg-gold',
                          segment.color === 'success' && 'bg-success',
                          segment.color === 'warning' && 'bg-warning'
                        )} />
                        <span className="text-sm font-medium">{segment.segment}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold">{segment.count.toLocaleString()}</div>
                        <div className="text-xs text-foreground-tertiary">{segment.tvl}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Regions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('topRegions.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockStatsData.topRegions.map((region, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className="w-24 text-sm text-foreground">{region.region}</div>
                      <div className="flex-1">
                        <div className="h-6 rounded bg-background-secondary">
                          <div
                            className="flex h-6 items-center justify-end rounded bg-gold px-2"
                            style={{ width: `${region.percentage}%` }}
                          >
                            <span className="text-xs font-medium text-background">{region.percentage}%</span>
                          </div>
                        </div>
                      </div>
                      <div className="w-16 text-right text-sm text-foreground-secondary">
                        {region.users.toLocaleString()}
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
