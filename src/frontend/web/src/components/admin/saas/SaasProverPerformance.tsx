'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useState } from 'react';
import {
  Activity,
  ChevronRight,
  Zap,
  Clock,
  TrendingUp,
  TrendingDown,
  Server,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Cpu,
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
const DEFAULT_PERFORMANCE_DATA = {
  overview: {
    avgProofTime: '2.7s',
    p95ProofTime: '4.2s',
    p99ProofTime: '6.1s',
    successRate: 99.8,
    throughput: '1,234',
    errorRate: 0.2,
  },
  timeRanges: ['1h', '6h', '24h', '7d', '30d'] as const,
  proverPerformance: [
    {
      id: 'prover-001',
      name: 'QS-Prover-Tokyo-01',
      type: 'qs',
      avgTime: '2.1s',
      p95Time: '3.5s',
      successRate: 99.9,
      throughput: 245,
      trend: 'up',
    },
    {
      id: 'prover-002',
      name: 'QS-Prover-Tokyo-02',
      type: 'qs',
      avgTime: '2.8s',
      p95Time: '4.2s',
      successRate: 99.7,
      throughput: 198,
      trend: 'stable',
    },
    {
      id: 'prover-003',
      name: 'GFC-Prover-01',
      type: 'operator',
      avgTime: '2.4s',
      p95Time: '3.8s',
      successRate: 99.8,
      throughput: 312,
      trend: 'up',
    },
    {
      id: 'prover-004',
      name: 'ABG-Prover-Main',
      type: 'operator',
      avgTime: '4.5s',
      p95Time: '6.8s',
      successRate: 97.2,
      throughput: 89,
      trend: 'down',
    },
    {
      id: 'prover-005',
      name: 'QS-Prover-Singapore-01',
      type: 'qs',
      avgTime: '3.9s',
      p95Time: '5.5s',
      successRate: 98.5,
      throughput: 156,
      trend: 'down',
    },
  ],
  hourlyData: [
    { hour: '00:00', proofs: 850, avgTime: 2.5 },
    { hour: '04:00', proofs: 420, avgTime: 2.2 },
    { hour: '08:00', proofs: 1250, avgTime: 2.8 },
    { hour: '12:00', proofs: 1890, avgTime: 3.1 },
    { hour: '16:00', proofs: 1650, avgTime: 2.9 },
    { hour: '20:00', proofs: 1120, avgTime: 2.6 },
  ],
};

export function SaasProverPerformance() {
  const t = useTranslations('admin.saasProverPerformance');
  const [selectedTimeRange, setSelectedTimeRange] = useState<typeof DEFAULT_PERFORMANCE_DATA.timeRanges[number]>('24h');
  const [selectedProverType, setSelectedProverType] = useState<'all' | 'qs' | 'operator'>('all');

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 99.5) return 'text-success';
    if (rate >= 98) return 'text-warning';
    return 'text-danger';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-success" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-danger" />;
      default:
        return <Activity className="h-4 w-4 text-foreground-tertiary" />;
    }
  };

  const filteredProvers = DEFAULT_PERFORMANCE_DATA.proverPerformance.filter((prover) => {
    if (selectedProverType === 'all') return true;
    return prover.type === selectedProverType;
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
              <div className="flex gap-2">
                {DEFAULT_PERFORMANCE_DATA.timeRanges.map((range) => (
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
              label={t('stats.avgProofTime')}
              value={DEFAULT_PERFORMANCE_DATA.overview.avgProofTime}
              trend={{ value: '-8%', direction: 'up' }}
              icon={<Clock className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.p95ProofTime')}
              value={DEFAULT_PERFORMANCE_DATA.overview.p95ProofTime}
              icon={<Zap className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.p99ProofTime')}
              value={DEFAULT_PERFORMANCE_DATA.overview.p99ProofTime}
              icon={<BarChart3 className="h-5 w-5" />}
              status="warning"
            />
            <StatCard
              label={t('stats.successRate')}
              value={`${DEFAULT_PERFORMANCE_DATA.overview.successRate}%`}
              icon={<CheckCircle className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.throughput')}
              value={DEFAULT_PERFORMANCE_DATA.overview.throughput}
              subValue={t('stats.proofsPerHour')}
              trend={{ value: '+15%', direction: 'up' }}
              icon={<Activity className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.errorRate')}
              value={`${DEFAULT_PERFORMANCE_DATA.overview.errorRate}%`}
              icon={<AlertTriangle className="h-5 w-5" />}
              status={DEFAULT_PERFORMANCE_DATA.overview.errorRate < 1 ? 'success' : 'danger'}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Performance Chart Placeholder */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">{t('chart.title')}</CardTitle>
                  <Badge variant="gold">{selectedTimeRange}</Badge>
                </CardHeader>
                <CardContent>
                  <div className="h-64 rounded-lg bg-background-secondary p-4">
                    <div className="flex h-full flex-col justify-between">
                      <div className="text-xs text-foreground-tertiary">{t('chart.proofsOverTime')}</div>
                      <div className="flex items-end justify-between gap-2">
                        {DEFAULT_PERFORMANCE_DATA.hourlyData.map((data, index) => (
                          <div key={index} className="flex flex-col items-center gap-1">
                            <div
                              className="w-8 rounded-t bg-gold"
                              style={{ height: `${(data.proofs / 2000) * 150}px` }}
                            />
                            <span className="text-xs text-foreground-tertiary">{data.hour}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Latency Distribution */}
                  <div className="mt-6">
                    <div className="mb-3 text-sm font-medium">{t('chart.latencyDistribution')}</div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="w-16 text-xs text-foreground-tertiary">{'< 2s'}</span>
                        <div className="h-4 flex-1 rounded bg-background-secondary">
                          <div className="h-4 rounded bg-success" style={{ width: '45%' }} />
                        </div>
                        <span className="w-12 text-right text-xs">45%</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="w-16 text-xs text-foreground-tertiary">2-4s</span>
                        <div className="h-4 flex-1 rounded bg-background-secondary">
                          <div className="h-4 rounded bg-gold" style={{ width: '38%' }} />
                        </div>
                        <span className="w-12 text-right text-xs">38%</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="w-16 text-xs text-foreground-tertiary">4-6s</span>
                        <div className="h-4 flex-1 rounded bg-background-secondary">
                          <div className="h-4 rounded bg-warning" style={{ width: '12%' }} />
                        </div>
                        <span className="w-12 text-right text-xs">12%</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="w-16 text-xs text-foreground-tertiary">{'> 6s'}</span>
                        <div className="h-4 flex-1 rounded bg-background-secondary">
                          <div className="h-4 rounded bg-danger" style={{ width: '5%' }} />
                        </div>
                        <span className="w-12 text-right text-xs">5%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top/Bottom Performers */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">{t('proverRanking.title')}</CardTitle>
                  <div className="flex gap-1">
                    {(['all', 'qs', 'operator'] as const).map((type) => (
                      <Button
                        key={type}
                        variant={selectedProverType === type ? 'primary' : 'ghost'}
                        size="sm"
                        onClick={() => setSelectedProverType(type)}
                        className="h-7 px-2 text-xs"
                      >
                        {t(`proverRanking.types.${type}`)}
                      </Button>
                    ))}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {filteredProvers.map((prover, index) => (
                      <div
                        key={prover.id}
                        className="flex items-center justify-between rounded-lg border border-surface-tertiary p-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold',
                            index === 0 ? 'bg-gold/20 text-gold' :
                            index === 1 ? 'bg-foreground-tertiary/20 text-foreground-tertiary' :
                            'bg-background-secondary text-foreground-tertiary'
                          )}>
                            {index + 1}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{prover.name}</span>
                              <Badge variant={prover.type === 'qs' ? 'gold' : 'default'} size="sm">
                                {prover.type.toUpperCase()}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-foreground-tertiary">
                              <span>{prover.avgTime}</span>
                              <span className={getSuccessRateColor(prover.successRate)}>
                                {prover.successRate}%
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <div className="text-sm font-medium">{prover.throughput}</div>
                            <div className="text-xs text-foreground-tertiary">/hr</div>
                          </div>
                          {getTrendIcon(prover.trend)}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 border-t border-surface-tertiary pt-4">
                    <Button variant="outline" className="w-full" leftIcon={<BarChart3 className="h-4 w-4" />}>
                      {t('proverRanking.viewDetailedReport')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
