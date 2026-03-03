'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useState } from 'react';
import {
  Shield,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  AlertTriangle,
  Activity,
  BarChart3,
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
                {trend.direction === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
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
const SAMPLE_PROVER_PERFORMANCE = [
  {
    id: 'prover-001',
    operator: 'Alpha Node Labs',
    sla: 99.98,
    avgResponseTime: 45,
    signatures24h: 1234,
    uptime: 100,
    errors24h: 0,
    trend: 'up' as const,
  },
  {
    id: 'prover-002',
    operator: 'Beta Validators',
    sla: 99.95,
    avgResponseTime: 52,
    signatures24h: 1189,
    uptime: 100,
    errors24h: 2,
    trend: 'stable' as const,
  },
  {
    id: 'prover-003',
    operator: 'Gamma Security',
    sla: 98.5,
    avgResponseTime: 78,
    signatures24h: 892,
    uptime: 98.5,
    errors24h: 15,
    trend: 'down' as const,
  },
  {
    id: 'prover-004',
    operator: 'Delta Network',
    sla: 99.92,
    avgResponseTime: 48,
    signatures24h: 1456,
    uptime: 100,
    errors24h: 1,
    trend: 'up' as const,
  },
  {
    id: 'prover-005',
    operator: 'Epsilon Infra',
    sla: 99.88,
    avgResponseTime: 55,
    signatures24h: 1102,
    uptime: 99.9,
    errors24h: 3,
    trend: 'stable' as const,
  },
];

const DEFAULT_NETWORK_METRICS = {
  avgSla: 99.65,
  avgResponseTime: 56,
  totalSignatures24h: 5873,
  activeProvers: 127,
  avgUptime: 99.85,
  totalErrors24h: 21,
};

export function PublicProverPerformance() {
  const t = useTranslations('admin.proverPerformance');
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
  const [sortBy, setSortBy] = useState<'sla' | 'signatures' | 'response'>('sla');

  const timeRanges = [
    { key: '24h', label: t('timeRanges.24h') },
    { key: '7d', label: t('timeRanges.7d') },
    { key: '30d', label: t('timeRanges.30d') },
  ];

  const getSlaColor = (sla: number) => {
    if (sla >= 99.5) return 'text-success';
    if (sla >= 98) return 'text-warning';
    return 'text-danger';
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-success" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-danger" />;
      default:
        return <Activity className="h-4 w-4 text-foreground-tertiary" />;
    }
  };

  const sortedProvers = [...SAMPLE_PROVER_PERFORMANCE].sort((a, b) => {
    switch (sortBy) {
      case 'sla':
        return b.sla - a.sla;
      case 'signatures':
        return b.signatures24h - a.signatures24h;
      case 'response':
        return a.avgResponseTime - b.avgResponseTime;
      default:
        return 0;
    }
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
              <Link href="/admin/public/provers" className="hover:text-foreground">
                Provers
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

          {/* Network Stats */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
            <StatCard
              label={t('stats.avgSla')}
              value={`${DEFAULT_NETWORK_METRICS.avgSla}%`}
              trend={{ value: '+0.02%', direction: 'up' }}
              icon={<Shield className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.avgResponseTime')}
              value={`${DEFAULT_NETWORK_METRICS.avgResponseTime}ms`}
              trend={{ value: '-3ms', direction: 'up' }}
              icon={<Clock className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.totalSignatures')}
              value={DEFAULT_NETWORK_METRICS.totalSignatures24h.toLocaleString()}
              trend={{ value: '+12%', direction: 'up' }}
              icon={<CheckCircle className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.activeProvers')}
              value={String(DEFAULT_NETWORK_METRICS.activeProvers)}
              icon={<Activity className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.avgUptime')}
              value={`${DEFAULT_NETWORK_METRICS.avgUptime}%`}
              icon={<TrendingUp className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.totalErrors')}
              value={String(DEFAULT_NETWORK_METRICS.totalErrors24h)}
              trend={{ value: '-5', direction: 'up' }}
              icon={<AlertTriangle className="h-5 w-5" />}
              status="warning"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Performance Chart */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">{t('chart.title')}</CardTitle>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-success" />
                      {t('chart.sla')}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-gold" />
                      {t('chart.responseTime')}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-surface-tertiary">
                    <div className="text-center text-foreground-tertiary">
                      <BarChart3 className="mx-auto h-12 w-12" />
                      <p className="mt-2">{t('chart.placeholder')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top/Bottom Performers */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t('topPerformers.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {sortedProvers.slice(0, 3).map((prover, index) => (
                      <div
                        key={prover.id}
                        className="flex items-center gap-3 rounded-lg border border-surface-tertiary p-3"
                      >
                        <div className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold',
                          index === 0 && 'bg-gold/20 text-gold',
                          index === 1 && 'bg-foreground-tertiary/20 text-foreground-tertiary',
                          index === 2 && 'bg-warning/20 text-warning'
                        )}>
                          #{index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium">{prover.operator}</div>
                          <div className={cn('font-mono text-xs', getSlaColor(prover.sla))}>
                            SLA: {prover.sla}%
                          </div>
                        </div>
                        {getTrendIcon(prover.trend)}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-base">{t('needsAttention.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {sortedProvers
                      .filter((p) => p.sla < 99.5)
                      .slice(0, 3)
                      .map((prover) => (
                        <div
                          key={prover.id}
                          className="flex items-center gap-3 rounded-lg border border-danger/30 bg-danger/5 p-3"
                        >
                          <AlertTriangle className="h-5 w-5 text-danger" />
                          <div className="flex-1">
                            <div className="text-sm font-medium">{prover.operator}</div>
                            <div className="text-xs text-danger">
                              SLA: {prover.sla}% | Errors: {prover.errors24h}
                            </div>
                          </div>
                          <Link
                            href={`/admin/public/provers/${prover.id}`}
                            className="text-xs text-gold hover:underline"
                          >
                            {t('needsAttention.view')}
                          </Link>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Prover Performance Table */}
          <Card className="mt-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">{t('table.title')}</CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-xs text-foreground-tertiary">{t('table.sortBy')}:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="rounded-lg border border-surface-tertiary bg-background-secondary px-3 py-1.5 text-sm focus:border-gold focus:outline-none"
                >
                  <option value="sla">{t('table.sortOptions.sla')}</option>
                  <option value="signatures">{t('table.sortOptions.signatures')}</option>
                  <option value="response">{t('table.sortOptions.response')}</option>
                </select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-surface-tertiary text-left text-xs text-foreground-tertiary">
                      <th className="pb-3 font-medium">{t('table.columns.rank')}</th>
                      <th className="pb-3 font-medium">{t('table.columns.prover')}</th>
                      <th className="pb-3 font-medium">{t('table.columns.sla')}</th>
                      <th className="pb-3 font-medium">{t('table.columns.responseTime')}</th>
                      <th className="pb-3 font-medium">{t('table.columns.signatures')}</th>
                      <th className="pb-3 font-medium">{t('table.columns.uptime')}</th>
                      <th className="pb-3 font-medium">{t('table.columns.errors')}</th>
                      <th className="pb-3 font-medium">{t('table.columns.trend')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedProvers.map((prover, index) => (
                      <tr
                        key={prover.id}
                        className="border-b border-surface-tertiary/50 hover:bg-background-secondary/50"
                      >
                        <td className="py-4">
                          <span className="font-mono text-sm">#{index + 1}</span>
                        </td>
                        <td className="py-4">
                          <Link
                            href={`/admin/public/provers/${prover.id}`}
                            className="font-medium text-foreground hover:text-gold"
                          >
                            {prover.operator}
                          </Link>
                          <div className="font-mono text-xs text-foreground-tertiary">
                            {prover.id}
                          </div>
                        </td>
                        <td className="py-4">
                          <span className={cn('font-mono', getSlaColor(prover.sla))}>
                            {prover.sla}%
                          </span>
                        </td>
                        <td className="py-4">
                          <span className="font-mono">{prover.avgResponseTime}ms</span>
                        </td>
                        <td className="py-4">
                          <span className="font-mono">{prover.signatures24h.toLocaleString()}</span>
                        </td>
                        <td className="py-4">
                          <span className={cn('font-mono', prover.uptime < 99.5 && 'text-warning')}>
                            {prover.uptime}%
                          </span>
                        </td>
                        <td className="py-4">
                          <Badge variant={prover.errors24h === 0 ? 'success' : prover.errors24h > 10 ? 'danger' : 'warning'}>
                            {prover.errors24h}
                          </Badge>
                        </td>
                        <td className="py-4">
                          {getTrendIcon(prover.trend)}
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
