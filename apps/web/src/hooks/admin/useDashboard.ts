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

/**
 * Fetch QS Admin Dashboard overview
 * Endpoint: GET /api/admin/dashboard
 */
export function useDashboardOverview() {
  return useQuery({
    queryKey: dashboardKeys.overview(),
    queryFn: async () => {
      const response = await adminApi.get<QsDashboardResponse>('/api/admin/dashboard');
      return response;
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

/**
 * Generate mock chart data for TVL history
 * Used until backend implements historical data endpoint
 */
function generateMockTvlHistory(days: number): ChartDataPoint[] {
  const data: ChartDataPoint[] = [];
  const now = new Date();
  let value = 1250000; // Starting TVL

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    // Random walk with slight upward trend
    value = value * (1 + (Math.random() - 0.45) * 0.05);
    data.push({
      date: date.toISOString().split('T')[0],
      value: Math.round(value),
    });
  }
  return data;
}

/**
 * Generate mock chart data for transaction volume
 * Used until backend implements historical data endpoint
 */
function generateMockVolumeHistory(days: number): VolumeDataPoint[] {
  const data: VolumeDataPoint[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toISOString().split('T')[0],
      locks: Math.floor(Math.random() * 50) + 20,
      unlocks: Math.floor(Math.random() * 30) + 10,
    });
  }
  return data;
}

/**
 * Generate mock chart data for user growth
 * Used until backend implements historical data endpoint
 */
function generateMockUserGrowth(days: number): ChartDataPoint[] {
  const data: ChartDataPoint[] = [];
  const now = new Date();
  let value = 2000; // Starting users

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    // Gradual growth
    value = value + Math.floor(Math.random() * 30) + 5;
    data.push({
      date: date.toISOString().split('T')[0],
      value,
    });
  }
  return data;
}

/**
 * Fetch TVL history chart data (with mock fallback)
 */
export function useTvlHistory(period: '7d' | '30d' | '90d' = '7d') {
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;

  return useQuery({
    queryKey: [...dashboardKeys.all, 'tvl', period] as const,
    queryFn: async () => {
      // Use mock data until backend implements historical endpoint
      return generateMockTvlHistory(days);
    },
    staleTime: 5 * 60_000,
  });
}

/**
 * Fetch transaction volume chart data (with mock fallback)
 */
export function useVolumeHistory(period: '7d' | '30d' | '90d' = '7d') {
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;

  return useQuery({
    queryKey: [...dashboardKeys.all, 'volume', period] as const,
    queryFn: async () => {
      // Use mock data until backend implements historical endpoint
      return generateMockVolumeHistory(days);
    },
    staleTime: 5 * 60_000,
  });
}

/**
 * Fetch user growth chart data (with mock fallback)
 */
export function useUserGrowthHistory(period: '7d' | '30d' | '90d' = '7d') {
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;

  return useQuery({
    queryKey: [...dashboardKeys.all, 'userGrowth', period] as const,
    queryFn: async () => {
      // Use mock data until backend implements historical endpoint
      return generateMockUserGrowth(days);
    },
    staleTime: 5 * 60_000,
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
