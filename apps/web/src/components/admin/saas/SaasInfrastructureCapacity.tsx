'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useState } from 'react';
import {
  Server,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Cpu,
  HardDrive,
  Activity,
  AlertTriangle,
  Plus,
  BarChart3,
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
const mockCapacityData = {
  overview: {
    totalCapacity: '2,400 vCPU',
    usedCapacity: '1,680 vCPU',
    availableCapacity: '720 vCPU',
    utilizationRate: '70%',
    projectedGrowth: '+15%',
    daysToCapacity: '45',
  },
  regions: [
    {
      name: 'Tokyo',
      cpu: { total: 800, used: 612, percentage: 76.5 },
      memory: { total: '3.2TB', used: '2.4TB', percentage: 75 },
      storage: { total: '100TB', used: '68TB', percentage: 68 },
      status: 'healthy',
    },
    {
      name: 'Singapore',
      cpu: { total: 400, used: 280, percentage: 70 },
      memory: { total: '1.6TB', used: '1.1TB', percentage: 69 },
      storage: { total: '50TB', used: '32TB', percentage: 64 },
      status: 'healthy',
    },
    {
      name: 'Frankfurt',
      cpu: { total: 400, used: 356, percentage: 89 },
      memory: { total: '1.6TB', used: '1.4TB', percentage: 87 },
      storage: { total: '50TB', used: '42TB', percentage: 84 },
      status: 'warning',
    },
    {
      name: 'Virginia',
      cpu: { total: 800, used: 432, percentage: 54 },
      memory: { total: '3.2TB', used: '1.8TB', percentage: 56 },
      storage: { total: '100TB', used: '55TB', percentage: 55 },
      status: 'healthy',
    },
  ],
  projections: [
    { month: '2月', projected: 72, actual: null },
    { month: '3月', projected: 76, actual: null },
    { month: '4月', projected: 80, actual: null },
    { month: '5月', projected: 84, actual: null },
    { month: '6月', projected: 88, actual: null },
  ],
  alerts: [
    { region: 'Frankfurt', type: 'CPU', message: 'CPU使用率が85%を超過', severity: 'warning' },
    { region: 'Frankfurt', type: 'Memory', message: 'メモリ使用率が85%を超過', severity: 'warning' },
  ],
};

export function SaasInfrastructureCapacity() {
  const t = useTranslations('admin.saasInfrastructureCapacity');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge variant="success">{t('status.healthy')}</Badge>;
      case 'warning':
        return <Badge variant="warning">{t('status.warning')}</Badge>;
      case 'critical':
        return <Badge variant="danger">{t('status.critical')}</Badge>;
      default:
        return null;
    }
  };

  const getUsageColor = (percentage: number) => {
    if (percentage < 70) return 'bg-success';
    if (percentage < 85) return 'bg-warning';
    return 'bg-danger';
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
              <Link href="/admin/saas/infrastructure" className="hover:text-foreground">
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
              <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
                {t('actions.requestCapacity')}
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
            <StatCard
              label={t('stats.totalCapacity')}
              value={mockCapacityData.overview.totalCapacity}
              icon={<Server className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.usedCapacity')}
              value={mockCapacityData.overview.usedCapacity}
              icon={<Cpu className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.availableCapacity')}
              value={mockCapacityData.overview.availableCapacity}
              icon={<HardDrive className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.utilizationRate')}
              value={mockCapacityData.overview.utilizationRate}
              icon={<Activity className="h-5 w-5" />}
              status="warning"
            />
            <StatCard
              label={t('stats.projectedGrowth')}
              value={mockCapacityData.overview.projectedGrowth}
              subValue={t('stats.nextQuarter')}
              icon={<TrendingUp className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.daysToCapacity')}
              value={mockCapacityData.overview.daysToCapacity}
              subValue={t('stats.days')}
              icon={<BarChart3 className="h-5 w-5" />}
              status="warning"
            />
          </div>

          {/* Alerts */}
          {mockCapacityData.alerts.length > 0 && (
            <Card className="mb-6 border-warning/50 bg-warning/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  <div>
                    <div className="font-medium text-warning">{t('alerts.title')}</div>
                    <div className="mt-2 space-y-2">
                      {mockCapacityData.alerts.map((alert, index) => (
                        <div key={index} className="text-sm">
                          <span className="font-medium">{alert.region}</span>: {alert.message}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Regional Capacity */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t('regionalCapacity.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {mockCapacityData.regions.map((region, index) => (
                      <div
                        key={index}
                        className="rounded-lg border border-surface-tertiary p-4"
                      >
                        <div className="mb-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Server className="h-5 w-5 text-foreground-tertiary" />
                            <span className="font-medium">{region.name}</span>
                          </div>
                          {getStatusBadge(region.status)}
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          {/* CPU */}
                          <div>
                            <div className="mb-2 flex items-center justify-between text-xs">
                              <span className="text-foreground-tertiary">CPU</span>
                              <span>{region.cpu.used}/{region.cpu.total} vCPU</span>
                            </div>
                            <div className="h-2 rounded-full bg-background-secondary">
                              <div
                                className={cn('h-2 rounded-full', getUsageColor(region.cpu.percentage))}
                                style={{ width: `${region.cpu.percentage}%` }}
                              />
                            </div>
                            <div className="mt-1 text-right text-xs text-foreground-tertiary">
                              {region.cpu.percentage}%
                            </div>
                          </div>

                          {/* Memory */}
                          <div>
                            <div className="mb-2 flex items-center justify-between text-xs">
                              <span className="text-foreground-tertiary">Memory</span>
                              <span>{region.memory.used}/{region.memory.total}</span>
                            </div>
                            <div className="h-2 rounded-full bg-background-secondary">
                              <div
                                className={cn('h-2 rounded-full', getUsageColor(region.memory.percentage))}
                                style={{ width: `${region.memory.percentage}%` }}
                              />
                            </div>
                            <div className="mt-1 text-right text-xs text-foreground-tertiary">
                              {region.memory.percentage}%
                            </div>
                          </div>

                          {/* Storage */}
                          <div>
                            <div className="mb-2 flex items-center justify-between text-xs">
                              <span className="text-foreground-tertiary">Storage</span>
                              <span>{region.storage.used}/{region.storage.total}</span>
                            </div>
                            <div className="h-2 rounded-full bg-background-secondary">
                              <div
                                className={cn('h-2 rounded-full', getUsageColor(region.storage.percentage))}
                                style={{ width: `${region.storage.percentage}%` }}
                              />
                            </div>
                            <div className="mt-1 text-right text-xs text-foreground-tertiary">
                              {region.storage.percentage}%
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Capacity Projection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('projection.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4 rounded-lg bg-background-secondary p-4">
                  <div className="text-xs text-foreground-tertiary">{t('projection.description')}</div>
                  <div className="mt-2 text-2xl font-bold text-gold">45{t('projection.days')}</div>
                  <div className="text-sm text-foreground-secondary">{t('projection.until85')}</div>
                </div>

                <div className="space-y-3">
                  {mockCapacityData.projections.map((proj, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg border border-surface-tertiary p-3"
                    >
                      <span className="text-sm">{proj.month}</span>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 rounded-full bg-background-secondary">
                          <div
                            className={cn('h-2 rounded-full', getUsageColor(proj.projected))}
                            style={{ width: `${proj.projected}%` }}
                          />
                        </div>
                        <span className={cn(
                          'text-sm font-medium',
                          proj.projected >= 85 ? 'text-danger' :
                          proj.projected >= 70 ? 'text-warning' : 'text-success'
                        )}>
                          {proj.projected}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4">
                  <Button variant="outline" className="w-full">
                    {t('projection.viewDetailedReport')}
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
