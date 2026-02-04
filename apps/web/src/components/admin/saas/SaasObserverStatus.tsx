'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useState } from 'react';
import {
  Eye,
  ChevronRight,
  TrendingUp,
  Activity,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Globe,
  Zap,
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
const mockStatusData = {
  overview: {
    overallHealth: '98.5%',
    activeMonitoring: '12/12',
    pendingChallenges: '1',
    resolvedToday: '2',
    avgLatency: '125ms',
    coverage: '100%',
  },
  regions: [
    { name: 'Tokyo', observers: 3, status: 'healthy', latency: '45ms', load: 68 },
    { name: 'Singapore', observers: 2, status: 'healthy', latency: '62ms', load: 55 },
    { name: 'Frankfurt', observers: 2, status: 'degraded', latency: '185ms', load: 82 },
    { name: 'Virginia', observers: 3, status: 'healthy', latency: '78ms', load: 61 },
    { name: 'Sydney', observers: 2, status: 'healthy', latency: '95ms', load: 48 },
  ],
  recentEvents: [
    { type: 'challenge', message: '疑わしいトランザクションを検出', observer: 'QS-Observer-Tokyo-01', time: '5分前', severity: 'warning' },
    { type: 'resolved', message: 'チャレンジが正常に解決', observer: 'QS-Observer-Singapore-01', time: '15分前', severity: 'success' },
    { type: 'alert', message: 'レイテンシ増加を検出', observer: 'QS-Observer-Frankfurt-01', time: '30分前', severity: 'warning' },
    { type: 'resolved', message: 'システム復旧完了', observer: 'QS-Observer-Frankfurt-01', time: '45分前', severity: 'success' },
    { type: 'info', message: '定期メンテナンス完了', observer: 'QS-Observer-Tokyo-02', time: '1時間前', severity: 'info' },
  ],
  healthHistory: [
    { time: '00:00', health: 99.8 },
    { time: '04:00', health: 99.9 },
    { time: '08:00', health: 99.7 },
    { time: '12:00', health: 98.2 },
    { time: '16:00', health: 98.5 },
    { time: '20:00', health: 99.1 },
  ],
};

export function SaasObserverStatus() {
  const t = useTranslations('admin.saasObserverStatus');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-success';
      case 'degraded':
        return 'text-warning';
      case 'down':
        return 'text-danger';
      default:
        return 'text-foreground-tertiary';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-success" />;
      default:
        return <Activity className="h-4 w-4 text-foreground-tertiary" />;
    }
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
              <Link href="/admin/saas/observers" className="hover:text-foreground">
                {t('breadcrumbParent')}
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground">{t('breadcrumb')}</span>
            </div>
            <h1 className="mt-2 text-3xl font-bold text-foreground">{t('title')}</h1>
            <p className="mt-1 text-sm text-foreground-secondary">{t('subtitle')}</p>
          </div>

          {/* Stats */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
            <StatCard
              label={t('stats.overallHealth')}
              value={mockStatusData.overview.overallHealth}
              icon={<Shield className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.activeMonitoring')}
              value={mockStatusData.overview.activeMonitoring}
              icon={<Eye className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.pendingChallenges')}
              value={mockStatusData.overview.pendingChallenges}
              icon={<AlertTriangle className="h-5 w-5" />}
              status="warning"
            />
            <StatCard
              label={t('stats.resolvedToday')}
              value={mockStatusData.overview.resolvedToday}
              icon={<CheckCircle className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.avgLatency')}
              value={mockStatusData.overview.avgLatency}
              icon={<Zap className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.coverage')}
              value={mockStatusData.overview.coverage}
              icon={<Globe className="h-5 w-5" />}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Regional Status */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t('regionalStatus.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockStatusData.regions.map((region, index) => (
                      <div
                        key={index}
                        className="rounded-lg border border-surface-tertiary p-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              'h-3 w-3 rounded-full',
                              region.status === 'healthy' && 'bg-success',
                              region.status === 'degraded' && 'bg-warning',
                              region.status === 'down' && 'bg-danger'
                            )} />
                            <div>
                              <div className="font-medium">{region.name}</div>
                              <div className="text-xs text-foreground-tertiary">
                                {region.observers} {t('regionalStatus.observers')}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <div className="text-xs text-foreground-tertiary">{t('regionalStatus.latency')}</div>
                              <div className={cn(
                                'text-sm font-medium',
                                getStatusColor(region.status)
                              )}>
                                {region.latency}
                              </div>
                            </div>
                            <div className="w-32">
                              <div className="mb-1 flex items-center justify-between text-xs">
                                <span className="text-foreground-tertiary">{t('regionalStatus.load')}</span>
                                <span>{region.load}%</span>
                              </div>
                              <div className="h-2 rounded-full bg-background-secondary">
                                <div
                                  className={cn(
                                    'h-2 rounded-full',
                                    region.load < 70 && 'bg-success',
                                    region.load >= 70 && region.load < 85 && 'bg-warning',
                                    region.load >= 85 && 'bg-danger'
                                  )}
                                  style={{ width: `${region.load}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Health History Chart */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-base">{t('healthHistory.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48 rounded-lg bg-background-secondary p-4">
                    <div className="flex h-full items-end justify-between gap-4">
                      {mockStatusData.healthHistory.map((data, index) => (
                        <div key={index} className="flex flex-1 flex-col items-center gap-2">
                          <div className="relative h-32 w-full">
                            <div
                              className={cn(
                                'absolute bottom-0 w-full rounded-t',
                                data.health >= 99 && 'bg-success',
                                data.health >= 98 && data.health < 99 && 'bg-warning',
                                data.health < 98 && 'bg-danger'
                              )}
                              style={{ height: `${(data.health - 95) * 20}%` }}
                            />
                          </div>
                          <span className="text-xs text-foreground-tertiary">{data.time}</span>
                          <span className="text-xs font-medium">{data.health}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Events */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('recentEvents.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockStatusData.recentEvents.map((event, index) => (
                    <div
                      key={index}
                      className="rounded-lg border border-surface-tertiary p-3"
                    >
                      <div className="flex items-start gap-3">
                        {getSeverityIcon(event.severity)}
                        <div className="flex-1">
                          <div className="text-sm">{event.message}</div>
                          <div className="mt-1 flex items-center gap-2">
                            <span className="text-xs text-gold">{event.observer}</span>
                            <span className="text-xs text-foreground-tertiary">•</span>
                            <span className="text-xs text-foreground-tertiary">{event.time}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4">
                  <Button variant="outline" className="w-full">
                    {t('recentEvents.viewAll')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
