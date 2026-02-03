'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users,
  Lock,
  Server,
  Eye,
  Clock,
  Wallet,
  ArrowRight,
  AlertTriangle,
  AlertCircle,
  Info,
  TrendingUp,
  Activity,
  BarChart3,
  FileText,
  Coins,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import {
  useDashboardOverview,
  useTvlHistory,
  useVolumeHistory,
  useUserGrowthHistory,
  useAlerts,
} from '@/hooks/admin/useDashboard';
import { TvlChart, VolumeChart, UserGrowthChart } from '@/components/charts';
import type {
  ChartDataPoint,
  VolumeDataPoint,
  ActivityItem,
  AlertItem,
} from '@/lib/api/admin/types';

// Local fallback stats type
interface FallbackStats {
  totalUsers: number;
  totalLocked: string;
  activeProvers: number;
  activeObservers: number;
  pendingUnlocks: number;
  treasuryBalance: string;
}

// Fallback mock data for development when API is unavailable
const FALLBACK_STATS: FallbackStats = {
  totalUsers: 12847,
  totalLocked: '45,230 ETH',
  activeProvers: 24,
  activeObservers: 156,
  pendingUnlocks: 18,
  treasuryBalance: '125,000 ETH',
};

const FALLBACK_TVL_DATA: ChartDataPoint[] = [
  { date: '01/21', value: 38500 },
  { date: '01/22', value: 39200 },
  { date: '01/23', value: 40100 },
  { date: '01/24', value: 41800 },
  { date: '01/25', value: 43200 },
  { date: '01/26', value: 44100 },
  { date: '01/27', value: 45230 },
];

const FALLBACK_VOLUME_DATA: VolumeDataPoint[] = [
  { date: '01/21', locks: 45, unlocks: 32 },
  { date: '01/22', locks: 52, unlocks: 38 },
  { date: '01/23', locks: 48, unlocks: 42 },
  { date: '01/24', locks: 61, unlocks: 35 },
  { date: '01/25', locks: 55, unlocks: 48 },
  { date: '01/26', locks: 72, unlocks: 52 },
  { date: '01/27', locks: 68, unlocks: 58 },
];

const FALLBACK_USER_DATA: ChartDataPoint[] = [
  { date: '01/21', value: 11800 },
  { date: '01/22', value: 12050 },
  { date: '01/23', value: 12280 },
  { date: '01/24', value: 12420 },
  { date: '01/25', value: 12580 },
  { date: '01/26', value: 12720 },
  { date: '01/27', value: 12847 },
];

const FALLBACK_ACTIVITY: ActivityItem[] = [
  { id: '1', type: 'prover_request', message: 'New Prover application received', timestamp: '5 min ago' },
  { id: '2', type: 'unlock', message: 'Large unlock request (500 ETH)', timestamp: '12 min ago' },
  { id: '3', type: 'challenge', message: 'Challenge initiated on unlock #4521', timestamp: '25 min ago' },
  { id: '4', type: 'treasury', message: 'Treasury transfer approved', timestamp: '1 hour ago' },
];

const FALLBACK_ALERTS: AlertItem[] = [
  { id: '1', level: 'warning', message: 'Prover node #12 response time degraded', timestamp: '10 min ago', acknowledged: false },
  { id: '2', level: 'info', message: 'System maintenance scheduled for tonight', timestamp: '2 hours ago', acknowledged: true },
];

// Metrics data structure for Stats tab
interface MetricsData {
  users: number;
  locks: number;
  lockAmount: string;
  unlocks: number;
  unlockAmount: string;
  provers: number;
  observers: number;
  revenue: string;
  proposals: number;
  treasury: string;
}

const FALLBACK_METRICS: Record<string, MetricsData> = {
  daily: {
    users: 147,
    locks: 68,
    lockAmount: '2,450 ETH',
    unlocks: 58,
    unlockAmount: '1,890 ETH',
    provers: 0,
    observers: 2,
    revenue: '12.5 ETH',
    proposals: 0,
    treasury: '125,000 ETH',
  },
  weekly: {
    users: 1047,
    locks: 401,
    lockAmount: '15,230 ETH',
    unlocks: 305,
    unlockAmount: '11,450 ETH',
    provers: 2,
    observers: 8,
    revenue: '87.5 ETH',
    proposals: 2,
    treasury: '125,000 ETH',
  },
  monthly: {
    users: 4520,
    locks: 1680,
    lockAmount: '62,500 ETH',
    unlocks: 1240,
    unlockAmount: '45,800 ETH',
    provers: 8,
    observers: 32,
    revenue: '375 ETH',
    proposals: 5,
    treasury: '125,000 ETH',
  },
  total: {
    users: 12847,
    locks: 8920,
    lockAmount: '245,000 ETH',
    unlocks: 6340,
    unlockAmount: '178,500 ETH',
    provers: 24,
    observers: 156,
    revenue: '1,850 ETH',
    proposals: 42,
    treasury: '125,000 ETH',
  },
};

// ============= Loading Skeletons =============

function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-muted rounded w-24 animate-pulse" />
            <div className="h-8 bg-muted rounded w-32 animate-pulse" />
            <div className="h-3 bg-muted rounded w-20 animate-pulse" />
          </div>
          <div className="h-12 w-12 rounded-lg bg-muted animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}

function ChartSkeleton() {
  return (
    <div className="h-48 flex items-end gap-1">
      {[...Array(7)].map((_, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full bg-muted rounded-t animate-pulse"
            style={{ height: `${Math.random() * 60 + 40}%` }}
          />
          <div className="h-3 bg-muted rounded w-8 animate-pulse" />
        </div>
      ))}
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex items-start space-x-3 p-3">
          <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
            <div className="h-3 bg-muted rounded w-1/4 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

function AlertsSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(2)].map((_, i) => (
        <div key={i} className="p-3 rounded-lg border border-border">
          <div className="flex items-start space-x-2">
            <div className="h-4 w-4 bg-muted rounded animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-full animate-pulse" />
              <div className="h-3 bg-muted rounded w-1/3 animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============= Error State =============

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <AlertTriangle className="h-8 w-8 text-warning mb-2" />
      <p className="text-sm text-muted-foreground mb-4">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      )}
    </div>
  );
}

// ============= Stat Card =============

interface StatCardProps {
  title: string;
  description: string;
  value: string | number;
  icon: React.ElementType;
  trend?: { value: number; isPositive: boolean; label: string };
}

function StatCard({ title, description, value, icon: Icon, trend }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-2">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
            {trend && (
              <p className={cn(
                'text-xs mt-2 flex items-center',
                trend.isPositive ? 'text-success' : 'text-danger'
              )}>
                <TrendingUp className={cn('h-3 w-3 mr-1', !trend.isPositive && 'rotate-180')} />
                {trend.isPositive ? '+' : ''}{trend.value}% {trend.label}
              </p>
            )}
          </div>
          <div className="h-12 w-12 rounded-lg bg-hinomaru/10 flex items-center justify-center">
            <Icon className="h-6 w-6 text-hinomaru" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============= Main Dashboard Component =============

export function Dashboard() {
  const t = useTranslations('qsAdmin.dashboard');
  const tCommon = useTranslations('qsAdmin.common');
  const [activeTab, setActiveTab] = useState<'overview' | 'stats'>('overview');
  const [statsPeriod, setStatsPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'total'>('weekly');

  // Fetch data using React Query hooks
  const overviewQuery = useDashboardOverview();
  const tvlQuery = useTvlHistory();
  const volumeQuery = useVolumeHistory();
  const userGrowthQuery = useUserGrowthHistory();
  const alertsQuery = useAlerts(false);

  // Use API data with fallback to mock data
  const dashboardData = overviewQuery.data;
  const stats = dashboardData ? {
    totalUsers: dashboardData.metrics.active_users,
    totalLocked: dashboardData.metrics.total_tvl,
    activeProvers: dashboardData.health.active_provers,
    activeObservers: dashboardData.health.total_nodes - dashboardData.health.active_provers,
    pendingUnlocks: dashboardData.metrics.pending_challenges,
    treasuryBalance: '125,000 ETH', // From static for now
  } : FALLBACK_STATS;
  const tvlData = tvlQuery.data ?? FALLBACK_TVL_DATA;
  const volumeData = volumeQuery.data ?? FALLBACK_VOLUME_DATA;
  const userData = userGrowthQuery.data ?? FALLBACK_USER_DATA;
  const activityData = dashboardData?.recent_alerts?.map((a, i) => ({
    id: String(i),
    type: 'lock' as const,
    message: a.message,
    timestamp: a.timestamp,
  })) ?? FALLBACK_ACTIVITY;
  const alertsData = alertsQuery.data ?? FALLBACK_ALERTS;
  const currentMetrics = FALLBACK_METRICS[statsPeriod];

  const tabs = [
    { key: 'overview', label: t('tabs.overview') },
    { key: 'stats', label: t('tabs.stats') },
  ];

  const periodTabs = [
    { key: 'daily', label: t('period.daily') },
    { key: 'weekly', label: t('period.weekly') },
    { key: 'monthly', label: t('period.monthly') },
    { key: 'total', label: t('period.total') },
  ];

  // Loading state for main stats
  const isMainLoading = overviewQuery.isLoading;
  const isChartsLoading = tvlQuery.isLoading || volumeQuery.isLoading || userGrowthQuery.isLoading;
  const isActivityLoading = overviewQuery.isLoading;
  const isAlertsLoading = alertsQuery.isLoading;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as 'overview' | 'stats')}
            className={cn(
              'px-6 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
              activeTab === tab.key
                ? 'border-hinomaru text-hinomaru'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' ? (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isMainLoading ? (
              <>
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
              </>
            ) : overviewQuery.isError ? (
              <Card className="col-span-full">
                <CardContent className="p-6">
                  <ErrorState
                    message="Failed to load statistics"
                    onRetry={() => overviewQuery.refetch()}
                  />
                </CardContent>
              </Card>
            ) : (
              <>
                <StatCard
                  title={t('stats.totalUsers')}
                  description={t('stats.totalUsersDesc')}
                  value={stats.totalUsers.toLocaleString()}
                  icon={Users}
                  trend={{ value: 5.2, isPositive: true, label: tCommon('trend.fromLastWeek') }}
                />
                <StatCard
                  title={t('stats.totalLocked')}
                  description={t('stats.totalLockedDesc')}
                  value={stats.totalLocked}
                  icon={Lock}
                  trend={{ value: 12.8, isPositive: true, label: tCommon('trend.fromLastWeek') }}
                />
                <StatCard
                  title={t('stats.activeProvers')}
                  description={t('stats.activeProversDesc')}
                  value={stats.activeProvers}
                  icon={Server}
                />
                <StatCard
                  title={t('stats.activeObservers')}
                  description={t('stats.activeObserversDesc')}
                  value={stats.activeObservers}
                  icon={Eye}
                />
                <StatCard
                  title={t('stats.pendingUnlocks')}
                  description={t('stats.pendingUnlocksDesc')}
                  value={stats.pendingUnlocks}
                  icon={Clock}
                />
                <StatCard
                  title={t('stats.treasuryBalance')}
                  description={t('stats.treasuryBalanceDesc')}
                  value={stats.treasuryBalance}
                  icon={Wallet}
                />
              </>
            )}
          </div>

          {/* Charts Row 1: TVL + Transaction Volume */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* TVL Trend Chart */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-hinomaru" />
                  {t('charts.tvlTrend')}
                </CardTitle>
                <span className="text-xs text-muted-foreground">{t('charts.last7Days')}</span>
              </CardHeader>
              <CardContent>
                {tvlQuery.isLoading ? (
                  <ChartSkeleton />
                ) : tvlQuery.isError ? (
                  <ErrorState
                    message="Failed to load TVL data"
                    onRetry={() => tvlQuery.refetch()}
                  />
                ) : tvlData && tvlData.length > 0 ? (
                  <TvlChart data={tvlData} height={200} />
                ) : (
                  <div className="h-48 flex items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Transaction Volume Chart */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="h-5 w-5 text-hinomaru" />
                  {t('charts.transactionVolume')}
                </CardTitle>
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-success rounded" />
                    {t('charts.locks')}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-info rounded" />
                    {t('charts.unlocks')}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                {volumeQuery.isLoading ? (
                  <ChartSkeleton />
                ) : volumeQuery.isError ? (
                  <ErrorState
                    message="Failed to load volume data"
                    onRetry={() => volumeQuery.refetch()}
                  />
                ) : volumeData && volumeData.length > 0 ? (
                  <VolumeChart data={volumeData} height={200} />
                ) : (
                  <div className="h-48 flex items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 2: User Growth */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-hinomaru" />
                {t('charts.userGrowth')}
              </CardTitle>
              <span className="text-xs text-muted-foreground">{t('charts.last7Days')}</span>
            </CardHeader>
            <CardContent>
              {userGrowthQuery.isLoading ? (
                <ChartSkeleton />
              ) : userGrowthQuery.isError ? (
                <ErrorState
                  message="Failed to load user growth data"
                  onRetry={() => userGrowthQuery.refetch()}
                />
              ) : userData && userData.length > 0 ? (
                <UserGrowthChart data={userData} height={200} />
              ) : (
                <div className="h-48 flex items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Activity */}
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">{t('recentActivity.title')}</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/qs-admin/transactions">
                    {t('recentActivity.viewAll')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {isActivityLoading ? (
                  <ActivitySkeleton />
                ) : overviewQuery.isError ? (
                  <ErrorState
                    message="Failed to load activity"
                    onRetry={() => overviewQuery.refetch()}
                  />
                ) : activityData.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No recent activity
                  </p>
                ) : (
                  <div className="space-y-4">
                    {activityData.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                          <Activity className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{activity.message}</p>
                          <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Alerts */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">{t('alerts.title')}</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/qs-admin/system/alerts">
                    {t('alerts.viewAll')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {alertsQuery.isLoading ? (
                  <AlertsSkeleton />
                ) : alertsQuery.isError ? (
                  <ErrorState
                    message="Failed to load alerts"
                    onRetry={() => alertsQuery.refetch()}
                  />
                ) : alertsData.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {t('alerts.noAlerts')}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {alertsData.map((alert) => (
                      <div
                        key={alert.id}
                        className={cn(
                          'p-3 rounded-lg border',
                          alert.level === 'critical' && 'bg-danger/10 border-danger/20',
                          alert.level === 'error' && 'bg-danger/10 border-danger/20',
                          alert.level === 'warning' && 'bg-warning/10 border-warning/20',
                          alert.level === 'info' && 'bg-info/10 border-info/20'
                        )}
                      >
                        <div className="flex items-start space-x-2">
                          {(alert.level === 'critical' || alert.level === 'error') && <AlertTriangle className="h-4 w-4 text-danger mt-0.5" />}
                          {alert.level === 'warning' && <AlertCircle className="h-4 w-4 text-warning mt-0.5" />}
                          {alert.level === 'info' && <Info className="h-4 w-4 text-info mt-0.5" />}
                          <div>
                            <p className="text-sm font-medium">{alert.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">{alert.timestamp}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('quickActions.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button variant="outline" className="h-auto py-4 flex flex-col items-center space-y-2" asChild>
                  <Link href="/qs-admin/prover/requests">
                    <Server className="h-5 w-5" />
                    <span>{t('quickActions.reviewProver')}</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex flex-col items-center space-y-2" asChild>
                  <Link href="/qs-admin/transactions/unlock">
                    <Clock className="h-5 w-5" />
                    <span>{t('quickActions.viewPendingUnlocks')}</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex flex-col items-center space-y-2" asChild>
                  <Link href="/qs-admin/announcements">
                    <Activity className="h-5 w-5" />
                    <span>{t('quickActions.createAnnouncement')}</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex flex-col items-center space-y-2" asChild>
                  <Link href="/qs-admin/treasury">
                    <Wallet className="h-5 w-5" />
                    <span>{t('quickActions.viewTreasury')}</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        /* Stats Tab */
        <>
          {/* Period Tabs */}
          <div className="flex space-x-2">
            {periodTabs.map((period) => (
              <button
                key={period.key}
                onClick={() => setStatsPeriod(period.key as typeof statsPeriod)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  statsPeriod === period.key
                    ? 'bg-hinomaru text-white'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                {period.label}
              </button>
            ))}
          </div>

          {/* Stats Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-hinomaru" />
                {t('statsTable.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t('statsTable.metric')}</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">{t('statsTable.value')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border hover:bg-muted/50">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <Users className="h-5 w-5 text-info" />
                          <span className="font-medium">{t('statsTable.totalUsers')}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right font-mono text-lg">{currentMetrics.users.toLocaleString()}</td>
                    </tr>
                    <tr className="border-b border-border hover:bg-muted/50">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <Lock className="h-5 w-5 text-success" />
                          <span className="font-medium">{t('statsTable.locks')}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="font-mono text-lg">{currentMetrics.locks.toLocaleString()}</span>
                        <span className="text-muted-foreground ml-2">({currentMetrics.lockAmount})</span>
                      </td>
                    </tr>
                    <tr className="border-b border-border hover:bg-muted/50">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <Clock className="h-5 w-5 text-warning" />
                          <span className="font-medium">{t('statsTable.unlocks')}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="font-mono text-lg">{currentMetrics.unlocks.toLocaleString()}</span>
                        <span className="text-muted-foreground ml-2">({currentMetrics.unlockAmount})</span>
                      </td>
                    </tr>
                    <tr className="border-b border-border hover:bg-muted/50">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <Server className="h-5 w-5 text-hinomaru" />
                          <span className="font-medium">{t('statsTable.provers')}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right font-mono text-lg">{currentMetrics.provers.toLocaleString()}</td>
                    </tr>
                    <tr className="border-b border-border hover:bg-muted/50">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <Eye className="h-5 w-5 text-info" />
                          <span className="font-medium">{t('statsTable.observers')}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right font-mono text-lg">{currentMetrics.observers.toLocaleString()}</td>
                    </tr>
                    <tr className="border-b border-border hover:bg-muted/50">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <Coins className="h-5 w-5 text-gold" />
                          <span className="font-medium">{t('statsTable.revenue')}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right font-mono text-lg text-success">{currentMetrics.revenue}</td>
                    </tr>
                    <tr className="border-b border-border hover:bg-muted/50">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-info" />
                          <span className="font-medium">{t('statsTable.proposals')}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right font-mono text-lg">{currentMetrics.proposals.toLocaleString()}</td>
                    </tr>
                    <tr className="hover:bg-muted/50">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <Wallet className="h-5 w-5 text-hinomaru" />
                          <span className="font-medium">{t('statsTable.treasury')}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right font-mono text-lg">{currentMetrics.treasury}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
