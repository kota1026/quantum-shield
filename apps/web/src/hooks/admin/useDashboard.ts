/**
 * QS Admin Dashboard Hooks
 *
 * React Query hooks for dashboard data fetching
 * Updated to match existing backend API endpoints
 */

import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin/client';
import type {
  ChartDataPoint,
  VolumeDataPoint,
  AlertItem,
} from '@/lib/api/admin/types';

// Query keys factory
export const dashboardKeys = {
  all: ['admin', 'dashboard'] as const,
  overview: () => [...dashboardKeys.all, 'overview'] as const,
  analyticsOverview: () => [...dashboardKeys.all, 'analyticsOverview'] as const,
  analyticsUsers: () => [...dashboardKeys.all, 'analyticsUsers'] as const,
  analyticsRevenue: () => [...dashboardKeys.all, 'analyticsRevenue'] as const,
  alerts: () => [...dashboardKeys.all, 'alerts'] as const,
};

// Backend response types (matching Rust API)
interface QsDashboardResponse {
  health: {
    status: string;
    uptime_percent: number;
    last_incident: string | null;
    active_provers: number;
    total_nodes: number;
  };
  metrics: {
    total_tvl: string;
    tvl_change_24h: number;
    total_transactions: number;
    tx_change_24h: number;
    active_users: number;
    pending_challenges: number;
  };
  recent_alerts: AlertItem[];
  stats: {
    enterprise_accounts: number;
    active_staff: number;
    pending_requests: number;
    open_reports: number;
  };
}

interface AnalyticsOverviewResponse {
  tvl: number;
  tvl_change_24h: number;
  total_locks: number;
  total_unlocks: number;
  prover_performance: Array<{
    prover_id: string;
    success_rate: number;
    avg_response: number;
  }>;
}

interface AnalyticsUsersResponse {
  total_users: number;
  active_users_24h: number;
  active_users_7d: number;
  active_users_30d: number;
  new_users_today: number;
  new_users_week: number;
  retention_rate_7d: number;
  retention_rate_30d: number;
  daily_active_users: ChartDataPoint[];
}

interface AnalyticsRevenueResponse {
  total_revenue: string;
  revenue_today: string;
  revenue_week: string;
  revenue_month: string;
  revenue_change_24h: number;
  daily_revenue: ChartDataPoint[];
}

interface DashboardAlertsResponse {
  alerts: AlertItem[];
  total: number;
  unacknowledged_count: number;
}

// Backend response types (matching actual API response - already camelCase)
interface ActualDashboardResponse {
  health: {
    status: string;
    uptime: number;
    lastIncident: string | null;
    activeProvers: number;
    totalNodes: number;
  };
  metrics: {
    totalTvl: string;
    tvlChange24h: number;
    totalTransactions: number;
    txChange24h: number;
    activeUsers: number;
    pendingChallenges: number;
  };
  recentAlerts: AlertItem[];
  stats: {
    enterpriseAccounts: number;
    activeStaff: number;
    pendingRequests: number;
    openReports: number;
  };
}

/**
 * Fetch QS Admin Dashboard overview
 * Endpoint: GET /api/admin/dashboard
 */
export function useDashboardOverview() {
  return useQuery({
    queryKey: dashboardKeys.overview(),
    queryFn: async () => {
      const response = await adminApi.get<ActualDashboardResponse>('/api/admin/dashboard');
      // API already returns camelCase, pass through with minor adjustments
      return {
        health: {
          status: response.health.status,
          uptimePercent: response.health.uptime,
          lastIncident: response.health.lastIncident,
          activeProvers: response.health.activeProvers,
          totalNodes: response.health.totalNodes,
        },
        metrics: {
          totalTvl: response.metrics.totalTvl,
          tvlChange24h: response.metrics.tvlChange24h,
          totalTransactions: response.metrics.totalTransactions,
          txChange24h: response.metrics.txChange24h,
          activeUsers: response.metrics.activeUsers,
          pendingChallenges: response.metrics.pendingChallenges,
        },
        recentAlerts: response.recentAlerts,
        stats: {
          enterpriseAccounts: response.stats.enterpriseAccounts,
          activeStaff: response.stats.activeStaff,
          pendingRequests: response.stats.pendingRequests,
          openReports: response.stats.openReports,
        },
      };
    },
    staleTime: 30_000, // 30 seconds
    refetchInterval: 60_000, // Refetch every minute
  });
}

/**
 * Fetch analytics overview (TVL, locks, unlocks, prover performance)
 * Endpoint: GET /api/analytics/overview
 */
export function useAnalyticsOverview() {
  return useQuery({
    queryKey: dashboardKeys.analyticsOverview(),
    queryFn: async () => {
      const response = await adminApi.get<AnalyticsOverviewResponse>('/api/analytics/overview');
      return response;
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

/**
 * Fetch user analytics
 * Endpoint: GET /api/admin/analytics/users
 */
export function useAnalyticsUsers() {
  return useQuery({
    queryKey: dashboardKeys.analyticsUsers(),
    queryFn: async () => {
      const response = await adminApi.get<AnalyticsUsersResponse>('/api/admin/analytics/users');
      return response;
    },
    staleTime: 5 * 60_000, // 5 minutes
  });
}

/**
 * Fetch revenue analytics
 * Endpoint: GET /api/admin/analytics/revenue
 */
export function useAnalyticsRevenue() {
  return useQuery({
    queryKey: dashboardKeys.analyticsRevenue(),
    queryFn: async () => {
      const response = await adminApi.get<AnalyticsRevenueResponse>('/api/admin/analytics/revenue');
      return response;
    },
    staleTime: 5 * 60_000,
  });
}

/**
 * Fetch dashboard alerts
 * Endpoint: GET /api/admin/dashboard/alerts
 */
export function useAlerts(acknowledged?: boolean) {
  return useQuery({
    queryKey: dashboardKeys.alerts(),
    queryFn: async () => {
      const response = await adminApi.get<DashboardAlertsResponse>('/api/admin/dashboard/alerts', {
        acknowledged: acknowledged !== undefined ? acknowledged : undefined,
      });
      return response.alerts;
    },
    staleTime: 10_000,
    refetchInterval: 30_000,
  });
}

// Mock generators removed — API should return real chart data

/**
 * Fetch TVL history chart data from real API
 */
export function useTvlHistory(period: '7d' | '30d' | '90d' = '7d') {
  return useQuery({
    queryKey: [...dashboardKeys.all, 'tvl', period] as const,
    queryFn: async () => {
      const response = await adminApi.get<{ data: ChartDataPoint[]; period: string }>(
        `/api/admin/dashboard/tvl-history?period=${period}`
      );
      return response.data;
    },
    retry: 2,
    staleTime: 5 * 60_000,
  });
}

/**
 * Fetch transaction volume chart data from real API
 */
export function useVolumeHistory(period: '7d' | '30d' | '90d' = '7d') {
  return useQuery({
    queryKey: [...dashboardKeys.all, 'volume', period] as const,
    queryFn: async () => {
      const response = await adminApi.get<{ data: VolumeDataPoint[]; period: string }>(
        `/api/admin/dashboard/volume-history?period=${period}`
      );
      return response.data;
    },
    retry: 2,
    staleTime: 5 * 60_000,
  });
}

/**
 * Fetch user growth chart data from real API
 */
export function useUserGrowthHistory(period: '7d' | '30d' | '90d' = '7d') {
  return useQuery({
    queryKey: [...dashboardKeys.all, 'userGrowth', period] as const,
    queryFn: async () => {
      const response = await adminApi.get<{ data: ChartDataPoint[]; period: string }>(
        `/api/admin/dashboard/user-growth?period=${period}`
      );
      return response.data;
    },
    retry: 2,
    staleTime: 5 * 60_000,
  });
}

// Dashboard stats response type
interface DashboardStatsResponse {
  period: string;
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

// Activity response type
interface ActivityResponse {
  activities: Array<{
    id: string;
    type: string;
    message: string;
    timestamp: string;
  }>;
}

/**
 * Fetch dashboard statistics with period filtering
 */
export function useDashboardStats(period: 'daily' | 'weekly' | 'monthly' | 'total' = 'weekly') {
  return useQuery({
    queryKey: [...dashboardKeys.all, 'stats', period] as const,
    queryFn: async () => {
      const response = await adminApi.get<DashboardStatsResponse>(
        `/api/admin/dashboard/stats?period=${period}`
      );
      return response;
    },
    staleTime: 30_000,
  });
}

/**
 * Fetch dashboard activity
 */
export function useDashboardActivity() {
  return useQuery({
    queryKey: [...dashboardKeys.all, 'activity'] as const,
    queryFn: async () => {
      const response = await adminApi.get<ActivityResponse>('/api/admin/dashboard/activity');
      return response.activities;
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

/**
 * Combined dashboard data hook
 * Fetches all dashboard data in parallel
 */
export function useDashboardData() {
  const overview = useDashboardOverview();
  const analyticsOverview = useAnalyticsOverview();
  const tvl = useTvlHistory();
  const volume = useVolumeHistory();
  const alerts = useAlerts(false);

  return {
    overview: overview.data,
    analyticsOverview: analyticsOverview.data,
    health: overview.data?.health,
    metrics: overview.data?.metrics,
    stats: overview.data?.stats,
    tvl: tvl.data,
    volume: volume.data,
    alerts: alerts.data,
    isLoading: overview.isLoading || analyticsOverview.isLoading || tvl.isLoading,
    isError: overview.isError || analyticsOverview.isError || tvl.isError,
    error: overview.error || analyticsOverview.error || tvl.error,
  };
}

// ============================================================================
// Metrics History Hooks (for Stats Tab Charts)
// ============================================================================

interface MetricsHistoryResponse {
  data: ChartDataPoint[];
  period: string;
  metric: string;
}

type MetricPeriod = '7d' | '30d' | '90d' | 'daily' | 'weekly' | 'monthly' | 'total';

function mapPeriodToQuery(period: MetricPeriod): string {
  switch (period) {
    case 'daily': return '7d';
    case 'weekly': return '7d';
    case 'monthly': return '30d';
    case 'total': return '90d';
    default: return period;
  }
}

/**
 * Fetch locks count history
 */
export function useLocksCountHistory(period: MetricPeriod = '7d') {
  return useQuery({
    queryKey: [...dashboardKeys.all, 'metrics', 'locks-count', period] as const,
    queryFn: async () => {
      try {
        const queryPeriod = mapPeriodToQuery(period);
        const response = await adminApi.get<MetricsHistoryResponse>(
          `/api/admin/dashboard/metrics/locks-count?period=${queryPeriod}`
        );
        return response.data;
      } catch (error) {
        console.warn('Locks count API failed:', error);
        return [];
      }
    },
    staleTime: 5 * 60_000,
  });
}

/**
 * Fetch locks amount history (ETH * 10000)
 */
export function useLocksAmountHistory(period: MetricPeriod = '7d') {
  return useQuery({
    queryKey: [...dashboardKeys.all, 'metrics', 'locks-amount', period] as const,
    queryFn: async () => {
      try {
        const queryPeriod = mapPeriodToQuery(period);
        const response = await adminApi.get<MetricsHistoryResponse>(
          `/api/admin/dashboard/metrics/locks-amount?period=${queryPeriod}`
        );
        return response.data;
      } catch (error) {
        console.warn('Locks amount API failed:', error);
        return [];
      }
    },
    staleTime: 5 * 60_000,
  });
}

/**
 * Fetch unlocks count history
 */
export function useUnlocksCountHistory(period: MetricPeriod = '7d') {
  return useQuery({
    queryKey: [...dashboardKeys.all, 'metrics', 'unlocks-count', period] as const,
    queryFn: async () => {
      try {
        const queryPeriod = mapPeriodToQuery(period);
        const response = await adminApi.get<MetricsHistoryResponse>(
          `/api/admin/dashboard/metrics/unlocks-count?period=${queryPeriod}`
        );
        return response.data;
      } catch (error) {
        console.warn('Unlocks count API failed:', error);
        return [];
      }
    },
    staleTime: 5 * 60_000,
  });
}

/**
 * Fetch unlocks amount history (ETH * 10000)
 */
export function useUnlocksAmountHistory(period: MetricPeriod = '7d') {
  return useQuery({
    queryKey: [...dashboardKeys.all, 'metrics', 'unlocks-amount', period] as const,
    queryFn: async () => {
      try {
        const queryPeriod = mapPeriodToQuery(period);
        const response = await adminApi.get<MetricsHistoryResponse>(
          `/api/admin/dashboard/metrics/unlocks-amount?period=${queryPeriod}`
        );
        return response.data;
      } catch (error) {
        console.warn('Unlocks amount API failed:', error);
        return [];
      }
    },
    staleTime: 5 * 60_000,
  });
}

/**
 * Fetch provers count history
 */
export function useProversHistory(period: MetricPeriod = '7d') {
  return useQuery({
    queryKey: [...dashboardKeys.all, 'metrics', 'provers', period] as const,
    queryFn: async () => {
      try {
        const queryPeriod = mapPeriodToQuery(period);
        const response = await adminApi.get<MetricsHistoryResponse>(
          `/api/admin/dashboard/metrics/provers?period=${queryPeriod}`
        );
        return response.data;
      } catch (error) {
        console.warn('Provers history API failed:', error);
        return [];
      }
    },
    staleTime: 5 * 60_000,
  });
}

/**
 * Fetch observers count history
 */
export function useObserversHistory(period: MetricPeriod = '7d') {
  return useQuery({
    queryKey: [...dashboardKeys.all, 'metrics', 'observers', period] as const,
    queryFn: async () => {
      try {
        const queryPeriod = mapPeriodToQuery(period);
        const response = await adminApi.get<MetricsHistoryResponse>(
          `/api/admin/dashboard/metrics/observers?period=${queryPeriod}`
        );
        return response.data;
      } catch (error) {
        console.warn('Observers history API failed:', error);
        return [];
      }
    },
    staleTime: 5 * 60_000,
  });
}

/**
 * Fetch proposals count history
 */
export function useProposalsHistory(period: MetricPeriod = '7d') {
  return useQuery({
    queryKey: [...dashboardKeys.all, 'metrics', 'proposals', period] as const,
    queryFn: async () => {
      try {
        const queryPeriod = mapPeriodToQuery(period);
        const response = await adminApi.get<MetricsHistoryResponse>(
          `/api/admin/dashboard/metrics/proposals?period=${queryPeriod}`
        );
        return response.data;
      } catch (error) {
        console.warn('Proposals history API failed:', error);
        return [];
      }
    },
    staleTime: 5 * 60_000,
  });
}

/**
 * Fetch treasury balance history (ETH * 10000)
 */
export function useTreasuryHistory(period: MetricPeriod = '7d') {
  return useQuery({
    queryKey: [...dashboardKeys.all, 'metrics', 'treasury', period] as const,
    queryFn: async () => {
      try {
        const queryPeriod = mapPeriodToQuery(period);
        const response = await adminApi.get<MetricsHistoryResponse>(
          `/api/admin/dashboard/metrics/treasury?period=${queryPeriod}`
        );
        return response.data;
      } catch (error) {
        console.warn('Treasury history API failed:', error);
        return [];
      }
    },
    staleTime: 5 * 60_000,
  });
}

/**
 * Fetch revenue history (ETH * 10000)
 */
export function useRevenueHistory(period: MetricPeriod = '7d') {
  return useQuery({
    queryKey: [...dashboardKeys.all, 'metrics', 'revenue', period] as const,
    queryFn: async () => {
      try {
        const queryPeriod = mapPeriodToQuery(period);
        const response = await adminApi.get<MetricsHistoryResponse>(
          `/api/admin/dashboard/metrics/revenue?period=${queryPeriod}`
        );
        return response.data;
      } catch (error) {
        console.warn('Revenue history API failed:', error);
        return [];
      }
    },
    staleTime: 5 * 60_000,
  });
}
