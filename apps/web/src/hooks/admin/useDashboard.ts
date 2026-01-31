/**
 * QS Admin Dashboard Hooks
 *
 * React Query hooks for dashboard data fetching
 */

import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin/client';
import type {
  DashboardStats,
  ChartDataPoint,
  VolumeDataPoint,
  ActivityItem,
  AlertItem,
  SystemHealth,
  DashboardMetrics,
} from '@/lib/api/admin/types';

// Query keys factory
export const dashboardKeys = {
  all: ['admin', 'dashboard'] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
  metrics: () => [...dashboardKeys.all, 'metrics'] as const,
  health: () => [...dashboardKeys.all, 'health'] as const,
  tvl: (period?: string) => [...dashboardKeys.all, 'tvl', period] as const,
  volume: (period?: string) => [...dashboardKeys.all, 'volume', period] as const,
  userGrowth: (period?: string) => [...dashboardKeys.all, 'userGrowth', period] as const,
  activity: () => [...dashboardKeys.all, 'activity'] as const,
  alerts: () => [...dashboardKeys.all, 'alerts'] as const,
};

// Response types
interface StatsResponse {
  stats: DashboardStats;
}

interface MetricsResponse {
  metrics: DashboardMetrics;
}

interface HealthResponse {
  health: SystemHealth;
}

interface ChartResponse {
  data: ChartDataPoint[];
}

interface VolumeResponse {
  data: VolumeDataPoint[];
}

interface ActivityResponse {
  activity: ActivityItem[];
}

interface AlertsResponse {
  alerts: AlertItem[];
}

/**
 * Fetch dashboard statistics
 */
export function useDashboardStats() {
  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: async () => {
      const response = await adminApi.get<StatsResponse>('/api/admin/dashboard/stats');
      return response.stats;
    },
    staleTime: 30_000, // 30 seconds
    refetchInterval: 60_000, // Refetch every minute
  });
}

/**
 * Fetch dashboard metrics (TVL, transactions, etc.)
 */
export function useDashboardMetrics() {
  return useQuery({
    queryKey: dashboardKeys.metrics(),
    queryFn: async () => {
      const response = await adminApi.get<MetricsResponse>('/api/admin/dashboard/metrics');
      return response.metrics;
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

/**
 * Fetch system health status
 */
export function useSystemHealth() {
  return useQuery({
    queryKey: dashboardKeys.health(),
    queryFn: async () => {
      const response = await adminApi.get<HealthResponse>('/api/admin/system/health');
      return response.health;
    },
    staleTime: 10_000, // 10 seconds - more frequent for health
    refetchInterval: 30_000,
  });
}

/**
 * Fetch TVL history chart data
 */
export function useTvlHistory(period: '7d' | '30d' | '90d' = '7d') {
  return useQuery({
    queryKey: dashboardKeys.tvl(period),
    queryFn: async () => {
      const response = await adminApi.get<ChartResponse>('/api/admin/dashboard/tvl', { period });
      return response.data;
    },
    staleTime: 5 * 60_000, // 5 minutes
  });
}

/**
 * Fetch transaction volume chart data
 */
export function useVolumeHistory(period: '7d' | '30d' | '90d' = '7d') {
  return useQuery({
    queryKey: dashboardKeys.volume(period),
    queryFn: async () => {
      const response = await adminApi.get<VolumeResponse>('/api/admin/dashboard/volume', { period });
      return response.data;
    },
    staleTime: 5 * 60_000,
  });
}

/**
 * Fetch user growth chart data
 */
export function useUserGrowthHistory(period: '7d' | '30d' | '90d' = '7d') {
  return useQuery({
    queryKey: dashboardKeys.userGrowth(period),
    queryFn: async () => {
      const response = await adminApi.get<ChartResponse>('/api/admin/dashboard/users', { period });
      return response.data;
    },
    staleTime: 5 * 60_000,
  });
}

/**
 * Fetch recent activity
 */
export function useRecentActivity(limit: number = 10) {
  return useQuery({
    queryKey: dashboardKeys.activity(),
    queryFn: async () => {
      const response = await adminApi.get<ActivityResponse>('/api/admin/dashboard/activity', { limit });
      return response.activity;
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

/**
 * Fetch active alerts
 */
export function useAlerts(acknowledged?: boolean) {
  return useQuery({
    queryKey: dashboardKeys.alerts(),
    queryFn: async () => {
      const response = await adminApi.get<AlertsResponse>('/api/admin/dashboard/alerts', {
        acknowledged: acknowledged !== undefined ? acknowledged : undefined,
      });
      return response.alerts;
    },
    staleTime: 10_000,
    refetchInterval: 30_000,
  });
}

/**
 * Combined dashboard data hook
 * Fetches all dashboard data in parallel
 */
export function useDashboardData() {
  const stats = useDashboardStats();
  const health = useSystemHealth();
  const tvl = useTvlHistory();
  const volume = useVolumeHistory();
  const activity = useRecentActivity();
  const alerts = useAlerts(false);

  return {
    stats: stats.data,
    health: health.data,
    tvl: tvl.data,
    volume: volume.data,
    activity: activity.data,
    alerts: alerts.data,
    isLoading: stats.isLoading || health.isLoading || tvl.isLoading,
    isError: stats.isError || health.isError || tvl.isError,
    error: stats.error || health.error || tvl.error,
  };
}
