/**
 * Enterprise App React Query Hooks
 *
 * Provides data fetching hooks for Enterprise Admin components.
 * Uses React Query for caching, automatic refetch, and optimistic updates.
 *
 * API Endpoints (Backend: /v1/enterprise):
 * - GET /v1/enterprise/dashboard/overview - Dashboard overview
 * - GET /v1/enterprise/dashboard/tvl - TVL metrics
 * - GET /v1/enterprise/dashboard/volume - Volume metrics
 * - GET /v1/enterprise/transactions - Transaction list
 * - GET /v1/enterprise/transactions/:id - Transaction detail
 * - POST /v1/enterprise/transactions/export - Export transactions
 * - GET /v1/enterprise/users - User list
 * - GET /v1/enterprise/users/:id - User detail
 * - POST /v1/enterprise/users - Create user
 * - POST /v1/enterprise/users/invite - Invite user
 * - PUT /v1/enterprise/users/:id/role - Update user role
 * - GET /v1/enterprise/api-keys - API keys list
 * - POST /v1/enterprise/api-keys - Create API key
 * - DELETE /v1/enterprise/api-keys/:id - Revoke API key
 * - GET /v1/enterprise/settings - Settings
 * - PUT /v1/enterprise/settings - Update settings
 * - GET /v1/enterprise/audit-log - Audit log
 * - GET /v1/enterprise/provers - Prover list
 * - GET /v1/enterprise/observers - Observer list
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ==================== API BASE ====================

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api-proxy';

// Enterprise org ID storage key
const ENTERPRISE_ORG_ID_KEY = 'quantum_shield_enterprise_org_id';

/**
 * Get the current enterprise org ID from localStorage
 */
function getOrgId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ENTERPRISE_ORG_ID_KEY);
}

/**
 * Set the enterprise org ID in localStorage
 */
export function setOrgId(orgId: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(ENTERPRISE_ORG_ID_KEY, orgId);
  }
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const orgId = getOrgId();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (orgId) {
    headers['X-Enterprise-Org-Id'] = orgId;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers,
    ...options,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message);
  }

  return res.json();
}

// ==================== TYPES ====================

export interface DashboardOverview {
  total_tvl: string;
  tvl_change_24h: number;
  total_transactions: number;
  active_locks: number;
  pending_unlocks: number;
  total_users: number;
  api_calls_24h: number;
  webhook_success_rate: number;
}

export interface TVLMetrics {
  current_tvl: string;
  tvl_history: Array<{ date: string; value: string }>;
  tvl_by_asset: Array<{ asset: string; value: string }>;
}

export interface VolumeMetrics {
  total_volume_24h: string;
  volume_history: Array<{ date: string; value: string }>;
  volume_by_type: Array<{ type: string; value: string }>;
}

export interface EnterpriseTransaction {
  id: string;
  hash: string;
  type: 'lock' | 'unlock' | 'emergency';
  amount: string;
  status: 'pending' | 'complete' | 'failed';
  time: string;
  user_address?: string;
}

export interface TransactionDetail extends EnterpriseTransaction {
  block_number?: number;
  gas_used?: string;
  confirmations?: number;
  metadata?: Record<string, string>;
}

export interface EnterpriseUser {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'operator' | 'viewer';
  status: 'active' | 'pending' | 'suspended';
  created_at: string;
  last_login?: string;
}

export interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  status: 'active' | 'revoked' | 'expired';
  created_at: string;
  last_used?: string;
  permissions: string[];
}

export interface EnterpriseSettings {
  organization_name: string;
  webhook_url?: string;
  notification_email?: string;
  two_factor_required: boolean;
  ip_whitelist: string[];
}

export interface AuditLogEntry {
  id: string;
  action: string;
  actor_email: string;
  target?: string;
  timestamp: string;
  ip_address?: string;
  details?: Record<string, string>;
}

export interface EnterpriseProver {
  id: string;
  address: string;
  status: 'active' | 'inactive' | 'slashed';
  stake_amount: string;
  jobs_completed: number;
  success_rate: number;
}

export interface EnterpriseObserver {
  id: string;
  address: string;
  status: 'active' | 'inactive';
  challenges_submitted: number;
  earnings: string;
}

export interface SystemStatus {
  id: string;
  name: string;
  status: 'online' | 'degraded' | 'offline';
  value: string;
}

export interface ActivityItem {
  id: string;
  type: 'lock' | 'unlock' | 'user' | 'api' | 'system';
  title: string;
  meta: string;
}

// ==================== QUERY KEY FACTORY ====================

export const enterpriseKeys = {
  all: ['enterprise'] as const,
  // Dashboard
  dashboard: () => [...enterpriseKeys.all, 'dashboard'] as const,
  overview: () => [...enterpriseKeys.dashboard(), 'overview'] as const,
  tvl: () => [...enterpriseKeys.dashboard(), 'tvl'] as const,
  volume: () => [...enterpriseKeys.dashboard(), 'volume'] as const,
  // Transactions
  transactions: () => [...enterpriseKeys.all, 'transactions'] as const,
  transactionList: (filters?: TransactionFilters) => [...enterpriseKeys.transactions(), filters] as const,
  transactionDetail: (id: string) => [...enterpriseKeys.transactions(), id] as const,
  // Users
  users: () => [...enterpriseKeys.all, 'users'] as const,
  userList: () => [...enterpriseKeys.users(), 'list'] as const,
  userDetail: (id: string) => [...enterpriseKeys.users(), id] as const,
  // API Keys
  apiKeys: () => [...enterpriseKeys.all, 'api-keys'] as const,
  // Settings
  settings: () => [...enterpriseKeys.all, 'settings'] as const,
  // Audit Log
  auditLog: () => [...enterpriseKeys.all, 'audit-log'] as const,
  // Provers & Observers
  provers: () => [...enterpriseKeys.all, 'provers'] as const,
  observers: () => [...enterpriseKeys.all, 'observers'] as const,
  // System Status
  systemStatus: () => [...enterpriseKeys.all, 'system-status'] as const,
  // Activity
  recentActivity: () => [...enterpriseKeys.all, 'recent-activity'] as const,
};

// ==================== FILTER TYPES ====================

export interface TransactionFilters {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
  from_date?: string;
  to_date?: string;
}

// ==================== DASHBOARD HOOKS ====================

/**
 * Get dashboard overview data
 */
export function useDashboardOverview() {
  return useQuery({
    queryKey: enterpriseKeys.overview(),
    queryFn: () => fetchApi<DashboardOverview>('/v1/enterprise/dashboard/overview'),
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Get TVL metrics
 */
export function useTVLMetrics() {
  return useQuery({
    queryKey: enterpriseKeys.tvl(),
    queryFn: () => fetchApi<TVLMetrics>('/v1/enterprise/dashboard/tvl'),
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Get volume metrics
 */
export function useVolumeMetrics() {
  return useQuery({
    queryKey: enterpriseKeys.volume(),
    queryFn: () => fetchApi<VolumeMetrics>('/v1/enterprise/dashboard/volume'),
    staleTime: 60 * 1000,
  });
}

// ==================== TRANSACTION HOOKS ====================

/**
 * Get transaction list
 */
export function useTransactions(filters?: TransactionFilters) {
  return useQuery({
    queryKey: enterpriseKeys.transactionList(filters),
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters?.page) params.set('page', String(filters.page));
      if (filters?.limit) params.set('limit', String(filters.limit));
      if (filters?.type) params.set('type', filters.type);
      if (filters?.status) params.set('status', filters.status);
      const query = params.toString();
      return fetchApi<{ transactions: EnterpriseTransaction[]; total: number }>(
        `/v1/enterprise/transactions${query ? `?${query}` : ''}`
      );
    },
    staleTime: 30 * 1000,
  });
}

/**
 * Get transaction detail
 */
export function useTransactionDetail(id: string) {
  return useQuery({
    queryKey: enterpriseKeys.transactionDetail(id),
    queryFn: () => fetchApi<TransactionDetail>(`/v1/enterprise/transactions/${id}`),
    enabled: !!id,
  });
}

/**
 * Export transactions
 */
export function useExportTransactions() {
  return useMutation({
    mutationFn: (params: { format: 'csv' | 'json'; from_date?: string; to_date?: string }) =>
      fetchApi<{ download_url: string }>('/v1/enterprise/transactions/export', {
        method: 'POST',
        body: JSON.stringify(params),
      }),
  });
}

// ==================== USER HOOKS ====================

/**
 * Get user list
 */
export function useUsers() {
  return useQuery({
    queryKey: enterpriseKeys.userList(),
    queryFn: () => fetchApi<{ users: EnterpriseUser[] }>('/v1/enterprise/users'),
    staleTime: 60 * 1000,
  });
}

/**
 * Get user detail
 */
export function useUserDetail(id: string) {
  return useQuery({
    queryKey: enterpriseKeys.userDetail(id),
    queryFn: () => fetchApi<EnterpriseUser>(`/v1/enterprise/users/${id}`),
    enabled: !!id,
  });
}

/**
 * Create user
 */
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { email: string; name: string; role: string }) =>
      fetchApi<EnterpriseUser>('/v1/enterprise/users', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: enterpriseKeys.users() });
    },
  });
}

/**
 * Invite user
 */
export function useInviteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { email: string; role: string }) =>
      fetchApi<{ invitation_id: string }>('/v1/enterprise/users/invite', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: enterpriseKeys.users() });
    },
  });
}

/**
 * Update user role
 */
export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      fetchApi<EnterpriseUser>(`/v1/enterprise/users/${id}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role }),
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: enterpriseKeys.userDetail(id) });
      queryClient.invalidateQueries({ queryKey: enterpriseKeys.userList() });
    },
  });
}

// ==================== API KEY HOOKS ====================

/**
 * Get API keys list
 */
export function useApiKeys() {
  return useQuery({
    queryKey: enterpriseKeys.apiKeys(),
    queryFn: () => fetchApi<{ api_keys: ApiKey[] }>('/v1/enterprise/api-keys'),
    staleTime: 60 * 1000,
  });
}

/**
 * Create API key
 */
export function useCreateApiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; permissions: string[] }) =>
      fetchApi<{ api_key: ApiKey; secret: string }>('/v1/enterprise/api-keys', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: enterpriseKeys.apiKeys() });
    },
  });
}

/**
 * Revoke API key
 */
export function useRevokeApiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      fetchApi<{ success: boolean }>(`/v1/enterprise/api-keys/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: enterpriseKeys.apiKeys() });
    },
  });
}

// ==================== SETTINGS HOOKS ====================

/**
 * Get enterprise settings
 */
export function useSettings() {
  return useQuery({
    queryKey: enterpriseKeys.settings(),
    queryFn: () => fetchApi<EnterpriseSettings>('/v1/enterprise/settings'),
  });
}

/**
 * Update settings
 */
export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<EnterpriseSettings>) =>
      fetchApi<EnterpriseSettings>('/v1/enterprise/settings', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: enterpriseKeys.settings() });
    },
  });
}

// ==================== AUDIT LOG HOOKS ====================

export interface AuditEvent {
  id: string;
  category: string;
  actor: string;
  action: string;
  details: string;
  timestamp: string;
  ip_address: string;
  severity?: string;
}

/**
 * Get audit log
 */
export function useAuditLog(filters?: { page?: number; limit?: number; action?: string }) {
  return useQuery({
    queryKey: enterpriseKeys.auditLog(),
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters?.page) params.set('page', String(filters.page));
      if (filters?.limit) params.set('limit', String(filters.limit));
      if (filters?.action) params.set('action', filters.action);
      const query = params.toString();
      return fetchApi<{ events: AuditEvent[]; entries: AuditLogEntry[]; total: number }>(
        `/v1/enterprise/audit-log${query ? `?${query}` : ''}`
      );
    },
    staleTime: 30 * 1000,
  });
}

// ==================== PROVER & OBSERVER HOOKS ====================

/**
 * Get enterprise provers
 */
export function useProvers() {
  return useQuery({
    queryKey: enterpriseKeys.provers(),
    queryFn: () => fetchApi<{ provers: EnterpriseProver[] }>('/v1/enterprise/provers'),
    staleTime: 60 * 1000,
  });
}

/**
 * Get enterprise observers
 */
export function useObservers() {
  return useQuery({
    queryKey: enterpriseKeys.observers(),
    queryFn: () => fetchApi<{ observers: EnterpriseObserver[] }>('/v1/enterprise/observers'),
    staleTime: 60 * 1000,
  });
}

// ==================== SYSTEM STATUS HOOKS ====================

/**
 * Get system status
 */
export function useSystemStatus() {
  return useQuery({
    queryKey: enterpriseKeys.systemStatus(),
    queryFn: () => fetchApi<{ systems: SystemStatus[] }>('/v1/enterprise/status'),
    staleTime: 30 * 1000,
  });
}

/**
 * Get recent activity
 */
export function useRecentActivity() {
  return useQuery({
    queryKey: enterpriseKeys.recentActivity(),
    queryFn: () => fetchApi<{ activities: ActivityItem[] }>('/v1/enterprise/activity'),
    staleTime: 30 * 1000,
  });
}

// ==================== WEBHOOKS HOOKS ====================

export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  is_active: boolean;
  success_rate: number;
  last_triggered: string | null;
}

/**
 * Get webhooks list
 */
export function useWebhooks() {
  return useQuery({
    queryKey: [...enterpriseKeys.all, 'webhooks'] as const,
    queryFn: () => fetchApi<{ webhooks: Webhook[] }>('/v1/enterprise/webhooks'),
    staleTime: 60 * 1000,
  });
}

// ==================== REPORTS HOOKS ====================

export interface ReportStats {
  total_transactions: { value: number; change: number };
  total_volume: { value: string; change: number };
  avg_tvl: { value: string; change: number };
  active_users: { value: number; change: number };
}

export interface TransactionSummary {
  type: string;
  count: number;
  volume: string;
  avg_size: string;
  percentage: string;
}

export interface TopUser {
  address: string;
  transactions: number;
  volume: string;
}

/**
 * Get reports data
 */
export function useReports() {
  return useQuery({
    queryKey: [...enterpriseKeys.all, 'reports'] as const,
    queryFn: () => fetchApi<{
      stats: ReportStats;
      transaction_summary: TransactionSummary[];
      top_users: TopUser[];
    }>('/v1/enterprise/reports'),
    staleTime: 60 * 1000,
  });
}

// ==================== LICENSE REPORTS HOOKS ====================

export interface LicenseReport {
  id: string;
  name: string;
  period: string;
  status: string;
  submitted_at: string | null;
  due_date: string;
}

/**
 * Get license/audit reports
 */
export function useLicenseReports() {
  return useQuery({
    queryKey: [...enterpriseKeys.all, 'license-reports'] as const,
    queryFn: () => fetchApi<{ reports: LicenseReport[] }>('/v1/enterprise/license/reports'),
    staleTime: 60 * 1000,
  });
}

// ==================== ENVIRONMENTS HOOKS ====================

export interface Environment {
  id: string;
  name: string;
  type: string;
  endpoint: string;
  api_key: string;
  status: string;
  created_at: string;
}

/**
 * Get environments list
 */
export function useEnvironments() {
  return useQuery({
    queryKey: [...enterpriseKeys.all, 'environments'] as const,
    queryFn: () => fetchApi<{ environments: Environment[] }>('/v1/enterprise/environments'),
    staleTime: 60 * 1000,
  });
}

// ==================== USER ACTIVITY HOOKS ====================

export interface UserActivityItem {
  id: string;
  type: string;
  time: string;
}

/**
 * Get user activity
 */
export function useUserActivity(userId: string) {
  return useQuery({
    queryKey: [...enterpriseKeys.userDetail(userId), 'activity'] as const,
    queryFn: () => fetchApi<{ activities: UserActivityItem[] }>(`/v1/enterprise/users/${userId}/activity`),
    enabled: !!userId,
    staleTime: 30 * 1000,
  });
}
