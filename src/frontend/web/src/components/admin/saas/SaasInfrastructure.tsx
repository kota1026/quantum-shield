'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useState } from 'react';
import {
  Server,
  ChevronRight,
  Cpu,
  HardDrive,
  Network,
  Activity,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Gauge,
  Cloud,
  Database,
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
const DEFAULT_INFRASTRUCTURE = {
  regions: [
    {
      id: 'asia-northeast1',
      name: 'Tokyo',
      status: 'healthy',
      servers: 8,
      cpuUsage: 45,
      memoryUsage: 62,
      networkIn: '2.3 GB/s',
      networkOut: '1.8 GB/s',
    },
    {
      id: 'asia-southeast1',
      name: 'Singapore',
      status: 'degraded',
      servers: 4,
      cpuUsage: 85,
      memoryUsage: 78,
      networkIn: '1.2 GB/s',
      networkOut: '0.9 GB/s',
    },
    {
      id: 'europe-west3',
      name: 'Frankfurt',
      status: 'healthy',
      servers: 6,
      cpuUsage: 52,
      memoryUsage: 58,
      networkIn: '1.8 GB/s',
      networkOut: '1.4 GB/s',
    },
    {
      id: 'us-east1',
      name: 'Virginia',
      status: 'healthy',
      servers: 5,
      cpuUsage: 38,
      memoryUsage: 45,
      networkIn: '1.5 GB/s',
      networkOut: '1.2 GB/s',
    },
  ],
  services: [
    { name: 'Prover API', status: 'operational', latency: '45ms', uptime: '99.99%' },
    { name: 'Signature Service', status: 'operational', latency: '23ms', uptime: '99.98%' },
    { name: 'Queue Service', status: 'degraded', latency: '120ms', uptime: '99.5%' },
    { name: 'Database Cluster', status: 'operational', latency: '8ms', uptime: '99.99%' },
    { name: 'Cache Layer', status: 'operational', latency: '2ms', uptime: '100%' },
  ],
};

const DEFAULT_METRICS = {
  totalServers: 23,
  healthyServers: 21,
  avgCpuUsage: 52,
  avgMemoryUsage: 61,
  totalBandwidth: '7.8 GB/s',
};

export function SaasInfrastructure() {
  const t = useTranslations('admin.saasInfrastructure');
  const [selectedRegion, setSelectedRegion] = useState<typeof DEFAULT_INFRASTRUCTURE.regions[0] | null>(DEFAULT_INFRASTRUCTURE.regions[0]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'operational':
        return <Badge variant="success">{t('status.healthy')}</Badge>;
      case 'degraded':
        return <Badge variant="warning">{t('status.degraded')}</Badge>;
      case 'down':
        return <Badge variant="danger">{t('status.down')}</Badge>;
      default:
        return null;
    }
  };

  const getUsageColor = (usage: number) => {
    if (usage >= 80) return 'bg-danger';
    if (usage >= 60) return 'bg-warning';
    return 'bg-success';
  };

  const getUsageTextColor = (usage: number) => {
    if (usage >= 80) return 'text-danger';
    if (usage >= 60) return 'text-warning';
    return 'text-success';
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
              <Link href="/admin/saas/operators" className="hover:text-foreground">
                SaaS
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground">{t('breadcrumb')}</span>
            </div>
            <h1 className="mt-2 text-3xl font-bold text-foreground">{t('title')}</h1>
            <p className="mt-1 text-sm text-foreground-secondary">{t('subtitle')}</p>
          </div>

          {/* Stats */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard
              label={t('stats.totalServers')}
              value={String(DEFAULT_METRICS.totalServers)}
              icon={<Server className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.healthyServers')}
              value={String(DEFAULT_METRICS.healthyServers)}
              subValue={`${Math.round((DEFAULT_METRICS.healthyServers / DEFAULT_METRICS.totalServers) * 100)}%`}
              icon={<CheckCircle className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.avgCpu')}
              value={`${DEFAULT_METRICS.avgCpuUsage}%`}
              icon={<Cpu className="h-5 w-5" />}
              status={DEFAULT_METRICS.avgCpuUsage >= 70 ? 'warning' : 'success'}
            />
            <StatCard
              label={t('stats.avgMemory')}
              value={`${DEFAULT_METRICS.avgMemoryUsage}%`}
              icon={<HardDrive className="h-5 w-5" />}
              status={DEFAULT_METRICS.avgMemoryUsage >= 70 ? 'warning' : 'success'}
            />
            <StatCard
              label={t('stats.totalBandwidth')}
              value={DEFAULT_METRICS.totalBandwidth}
              icon={<Network className="h-5 w-5" />}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Regions */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t('regions.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {DEFAULT_INFRASTRUCTURE.regions.map((region) => (
                      <div
                        key={region.id}
                        onClick={() => setSelectedRegion(region)}
                        className={cn(
                          'cursor-pointer rounded-lg border p-4 transition-all',
                          selectedRegion?.id === region.id
                            ? 'border-gold bg-gold/5'
                            : 'border-surface-tertiary hover:border-gold/50'
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10">
                              <Cloud className="h-5 w-5 text-gold" />
                            </div>
                            <div>
                              <div className="font-medium text-foreground">{region.name}</div>
                              <div className="text-xs text-foreground-tertiary">{region.id}</div>
                            </div>
                          </div>
                          {getStatusBadge(region.status)}
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3">
                          <div>
                            <div className="mb-1 flex justify-between text-xs">
                              <span className="text-foreground-tertiary">CPU</span>
                              <span className={getUsageTextColor(region.cpuUsage)}>{region.cpuUsage}%</span>
                            </div>
                            <div className="h-2 rounded-full bg-background-secondary">
                              <div
                                className={cn('h-2 rounded-full', getUsageColor(region.cpuUsage))}
                                style={{ width: `${region.cpuUsage}%` }}
                              />
                            </div>
                          </div>
                          <div>
                            <div className="mb-1 flex justify-between text-xs">
                              <span className="text-foreground-tertiary">Memory</span>
                              <span className={getUsageTextColor(region.memoryUsage)}>{region.memoryUsage}%</span>
                            </div>
                            <div className="h-2 rounded-full bg-background-secondary">
                              <div
                                className={cn('h-2 rounded-full', getUsageColor(region.memoryUsage))}
                                style={{ width: `${region.memoryUsage}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center gap-4 text-xs text-foreground-tertiary">
                          <span>{region.servers} {t('regions.servers')}</span>
                          <span className="flex items-center gap-1">
                            <Network className="h-3 w-3" />
                            {region.networkIn}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Services */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-base">{t('services.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {DEFAULT_INFRASTRUCTURE.services.map((service, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-lg border border-surface-tertiary p-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'h-2 w-2 rounded-full',
                            service.status === 'operational' ? 'bg-success' : 'bg-warning'
                          )} />
                          <span className="font-medium">{service.name}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-xs text-foreground-tertiary">{t('services.latency')}</div>
                            <div className="text-sm">{service.latency}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-foreground-tertiary">{t('services.uptime')}</div>
                            <div className="text-sm text-success">{service.uptime}</div>
                          </div>
                          {getStatusBadge(service.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Region Detail Panel */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t('detail.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedRegion ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Badge variant="gold">{selectedRegion.name}</Badge>
                        {getStatusBadge(selectedRegion.status)}
                      </div>

                      <div>
                        <div className="text-xs text-foreground-tertiary">{t('detail.regionId')}</div>
                        <div className="font-mono text-sm">{selectedRegion.id}</div>
                      </div>

                      <div>
                        <div className="text-xs text-foreground-tertiary">{t('detail.servers')}</div>
                        <div className="flex items-center gap-2">
                          <Server className="h-4 w-4 text-gold" />
                          <span className="text-lg font-bold">{selectedRegion.servers}</span>
                        </div>
                      </div>

                      <div className="space-y-3 border-t border-surface-tertiary pt-4">
                        <div>
                          <div className="mb-1 flex justify-between text-xs">
                            <span className="text-foreground-tertiary">{t('detail.cpuUsage')}</span>
                            <span className={getUsageTextColor(selectedRegion.cpuUsage)}>
                              {selectedRegion.cpuUsage}%
                            </span>
                          </div>
                          <div className="h-3 rounded-full bg-background-secondary">
                            <div
                              className={cn('h-3 rounded-full', getUsageColor(selectedRegion.cpuUsage))}
                              style={{ width: `${selectedRegion.cpuUsage}%` }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="mb-1 flex justify-between text-xs">
                            <span className="text-foreground-tertiary">{t('detail.memoryUsage')}</span>
                            <span className={getUsageTextColor(selectedRegion.memoryUsage)}>
                              {selectedRegion.memoryUsage}%
                            </span>
                          </div>
                          <div className="h-3 rounded-full bg-background-secondary">
                            <div
                              className={cn('h-3 rounded-full', getUsageColor(selectedRegion.memoryUsage))}
                              style={{ width: `${selectedRegion.memoryUsage}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 border-t border-surface-tertiary pt-4">
                        <div>
                          <div className="text-xs text-foreground-tertiary">{t('detail.networkIn')}</div>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-4 w-4 text-success" />
                            <span className="font-medium">{selectedRegion.networkIn}</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-foreground-tertiary">{t('detail.networkOut')}</div>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-4 w-4 rotate-180 text-gold" />
                            <span className="font-medium">{selectedRegion.networkOut}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-4">
                        <Button variant="outline" size="sm" className="flex-1" leftIcon={<Activity className="h-4 w-4" />}>
                          {t('detail.actions.viewMetrics')}
                        </Button>
                        <Button size="sm" className="flex-1" leftIcon={<Server className="h-4 w-4" />}>
                          {t('detail.actions.manage')}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-64 items-center justify-center text-center text-foreground-tertiary">
                      <div>
                        <Cloud className="mx-auto h-12 w-12" />
                        <p className="mt-2">{t('detail.selectRegion')}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
