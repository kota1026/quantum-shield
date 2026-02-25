'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useState } from 'react';
import {
  Vote,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart3,
  Users,
  Shield,
  AlertTriangle,
  Scale,
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
const mockVotingPowerData = {
  overview: {
    totalVotingPower: '45M QS',
    activeVotingPower: '38.5M QS',
    delegatedPower: '28.5M QS',
    quorumThreshold: '4.5M QS',
    avgVoterTurnout: '42%',
    nakamotoCoefficient: '8',
  },
  timeRanges: ['7d', '30d', '90d', '1y'] as const,
  powerDistribution: [
    { category: 'Top 10 ホルダー', power: '18.5M QS', percentage: 41, color: 'gold' },
    { category: 'Top 11-50 ホルダー', power: '12.3M QS', percentage: 27, color: 'success' },
    { category: 'Top 51-100 ホルダー', power: '6.8M QS', percentage: 15, color: 'warning' },
    { category: 'その他', power: '7.4M QS', percentage: 17, color: 'foreground-tertiary' },
  ],
  decentralizationMetrics: [
    { metric: 'Gini係数', value: '0.72', status: 'warning', description: '高い集中度' },
    { metric: 'HHI (ハーフィンダール指数)', value: '0.15', status: 'success', description: '適度な分散' },
    { metric: 'Nakamoto係数', value: '8', status: 'success', description: '8エンティティでマジョリティ' },
    { metric: '上位10保有者シェア', value: '41%', status: 'warning', description: '注意レベル' },
  ],
  votingHistory: [
    { month: '8月', turnout: 38, proposals: 5 },
    { month: '9月', turnout: 42, proposals: 7 },
    { month: '10月', turnout: 45, proposals: 4 },
    { month: '11月', turnout: 39, proposals: 6 },
    { month: '12月', turnout: 48, proposals: 8 },
    { month: '1月', turnout: 42, proposals: 5 },
  ],
  powerConcentrationAlerts: [
    { type: 'warning', message: 'Top 3保有者が25%以上を保持', timestamp: '2時間前' },
    { type: 'info', message: '新しいデリゲートが1M QS以上を獲得', timestamp: '1日前' },
    { type: 'success', message: '投票参加率が前月比10%増加', timestamp: '3日前' },
  ],
};

export function PublicVotingPower() {
  const t = useTranslations('admin.publicVotingPower');
  const [selectedTimeRange, setSelectedTimeRange] = useState<typeof mockVotingPowerData.timeRanges[number]>('30d');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <div className="h-2 w-2 rounded-full bg-success" />;
      case 'warning':
        return <div className="h-2 w-2 rounded-full bg-warning" />;
      case 'danger':
        return <div className="h-2 w-2 rounded-full bg-danger" />;
      default:
        return null;
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'success':
        return <TrendingUp className="h-4 w-4 text-success" />;
      default:
        return <Shield className="h-4 w-4 text-foreground-tertiary" />;
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
              <Link href="/admin/public/users" className="hover:text-foreground">
                Public
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
                {mockVotingPowerData.timeRanges.map((range) => (
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
              label={t('stats.totalVotingPower')}
              value={mockVotingPowerData.overview.totalVotingPower}
              icon={<Vote className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.activeVotingPower')}
              value={mockVotingPowerData.overview.activeVotingPower}
              subValue="85.5%"
              icon={<BarChart3 className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.delegatedPower')}
              value={mockVotingPowerData.overview.delegatedPower}
              trend={{ value: '+5.2%', direction: 'up' }}
              icon={<Users className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.quorumThreshold')}
              value={mockVotingPowerData.overview.quorumThreshold}
              subValue="10%"
              icon={<Scale className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.avgVoterTurnout')}
              value={mockVotingPowerData.overview.avgVoterTurnout}
              trend={{ value: '+3%', direction: 'up' }}
              icon={<PieChart className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.nakamotoCoefficient')}
              value={mockVotingPowerData.overview.nakamotoCoefficient}
              icon={<Shield className="h-5 w-5" />}
              status="success"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Power Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('powerDistribution.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Simple Pie Chart Visualization */}
                <div className="mb-6 flex justify-center">
                  <div className="relative h-40 w-40">
                    <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                      <circle
                        cx="18"
                        cy="18"
                        r="15.9155"
                        fill="none"
                        stroke="var(--color-gold)"
                        strokeWidth="3"
                        strokeDasharray="41 59"
                        strokeDashoffset="0"
                      />
                      <circle
                        cx="18"
                        cy="18"
                        r="15.9155"
                        fill="none"
                        stroke="var(--color-success)"
                        strokeWidth="3"
                        strokeDasharray="27 73"
                        strokeDashoffset="-41"
                      />
                      <circle
                        cx="18"
                        cy="18"
                        r="15.9155"
                        fill="none"
                        stroke="var(--color-warning)"
                        strokeWidth="3"
                        strokeDasharray="15 85"
                        strokeDashoffset="-68"
                      />
                      <circle
                        cx="18"
                        cy="18"
                        r="15.9155"
                        fill="none"
                        stroke="var(--color-foreground-tertiary)"
                        strokeWidth="3"
                        strokeDasharray="17 83"
                        strokeDashoffset="-83"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold">{mockVotingPowerData.overview.totalVotingPower}</span>
                      <span className="text-xs text-foreground-tertiary">{t('powerDistribution.total')}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {mockVotingPowerData.powerDistribution.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          'h-3 w-3 rounded-full',
                          item.color === 'gold' && 'bg-gold',
                          item.color === 'success' && 'bg-success',
                          item.color === 'warning' && 'bg-warning',
                          item.color === 'foreground-tertiary' && 'bg-foreground-tertiary'
                        )} />
                        <span className="text-sm text-foreground">{item.category}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{item.power}</div>
                        <div className="text-xs text-foreground-tertiary">{item.percentage}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Decentralization Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('decentralization.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockVotingPowerData.decentralizationMetrics.map((metric, index) => (
                    <div
                      key={index}
                      className="rounded-lg border border-surface-tertiary p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(metric.status)}
                          <span className="text-sm font-medium">{metric.metric}</span>
                        </div>
                        <Badge variant={metric.status === 'success' ? 'success' : 'warning'}>
                          {metric.value}
                        </Badge>
                      </div>
                      <div className="mt-2 text-xs text-foreground-tertiary">
                        {metric.description}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Voting History & Alerts */}
            <div className="space-y-6">
              {/* Voting Turnout Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t('votingHistory.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-between gap-2">
                    {mockVotingPowerData.votingHistory.map((data, index) => (
                      <div key={index} className="flex flex-col items-center gap-1">
                        <div className="relative h-24 w-8">
                          <div
                            className="absolute bottom-0 w-8 rounded-t bg-gold"
                            style={{ height: `${data.turnout}%` }}
                          />
                        </div>
                        <span className="text-xs text-foreground-tertiary">{data.month}</span>
                        <span className="text-xs font-medium">{data.turnout}%</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Concentration Alerts */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t('alerts.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mockVotingPowerData.powerConcentrationAlerts.map((alert, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 rounded-lg border border-surface-tertiary p-3"
                      >
                        {getAlertIcon(alert.type)}
                        <div className="flex-1">
                          <div className="text-sm">{alert.message}</div>
                          <div className="mt-1 text-xs text-foreground-tertiary">{alert.timestamp}</div>
                        </div>
                      </div>
                    ))}
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
