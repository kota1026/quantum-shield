/**
 * Treasury Hooks for QS Admin
 *
 * React Query hooks for treasury data management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin/client';

// ============= Query Keys =============

export const treasuryKeys = {
  all: ['admin', 'treasury'] as const,
  overview: () => [...treasuryKeys.all, 'overview'] as const,
  wallets: () => [...treasuryKeys.all, 'wallets'] as const,
  wallet: (id: string) => [...treasuryKeys.all, 'wallet', id] as const,
  transfers: (filters?: TransferFilters) => [...treasuryKeys.all, 'transfers', filters] as const,
  transferStats: () => [...treasuryKeys.all, 'transfers', 'stats'] as const,
  transfer: (id: string) => [...treasuryKeys.all, 'transfer', id] as const,
  budget: (period?: string) => [...treasuryKeys.all, 'budget', period] as const,
  auditLogs: (filters?: AuditLogFilters) => [...treasuryKeys.all, 'audit', filters] as const,
  auditStats: () => [...treasuryKeys.all, 'audit', 'stats'] as const,
};

// ============= Types =============

export interface TreasuryOverview {
  totalBalance: string;
  walletCount: number;
  pendingTransfers: number;
  todayRevenue: string;
  monthlyRevenue: string;
}

export interface TreasuryWallet {
  id: string;
  name: string;
  address: string;
  balance: string;
  usdValue: string;
  signers: number;
  threshold: number;
  status: string;
  lastActivity: string;
  signerList?: string[];
}

export interface TransferFilters {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
  [key: string]: string | number | boolean | undefined;
}

export interface TransferStats {
  pendingApprovals: number;
  transfersThisMonth: number;
  totalVolume: string;
  avgTransferSize: string;
}

export interface TreasuryTransfer {
  id: string;
  from: string;
  to: string;
  amount: string;
  initiator: string;
  approvals: number;
  required: number;
  status: string;
  timestamp: string;
  purpose: string;
}

export interface BudgetData {
  totalBudget: string;
  allocated: string;
  spent: string;
  remaining: string;
  period: string;
  categories: BudgetCategory[];
  monthly: MonthlyBudget[];
}

export interface BudgetCategory {
  name: string;
  allocated: number;
  spent: number;
  color: string;
}

export interface MonthlyBudget {
  month: string;
  budget: number;
  spent: number;
}

export interface AuditLogFilters {
  severity?: string;
  search?: string;
  page?: number;
  limit?: number;
  [key: string]: string | number | boolean | undefined;
}

export interface AuditLogStats {
  totalLogs: number;
  logsThisWeek: number;
  criticalEvents: number;
  pendingReviews: number;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  actor: string;
  target: string;
  details: string;
  severity: string;
  timestamp: string;
  ip: string;
}

// ============= API Response Types =============

interface OverviewResponse {
  totalBalance: string;
  walletCount: number;
  pendingTransfers: number;
  todayRevenue: string;
  monthlyRevenue: string;
}

interface WalletsResponse {
  wallets: TreasuryWallet[];
  total?: number;
}

interface TransfersResponse {
  transfers: TreasuryTransfer[];
  total: number;
}

interface TransferStatsResponse {
  stats: TransferStats;
}

interface BudgetResponse {
  budget: BudgetData;
}

interface AuditLogsResponse {
  logs: AuditLogEntry[];
  total: number;
}

interface AuditStatsResponse {
  stats: AuditLogStats;
}

// ============= Hooks =============

/**
 * Fetch treasury overview
 */
export function useTreasuryOverview() {
  return useQuery({
    queryKey: treasuryKeys.overview(),
    queryFn: async () => {
      const response = await adminApi.get<OverviewResponse>('/api/admin/treasury/overview');
      return response;
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

/**
 * Fetch treasury wallets list
 */
export function useTreasuryWallets() {
  return useQuery({
    queryKey: treasuryKeys.wallets(),
    queryFn: async () => {
      const response = await adminApi.get<WalletsResponse>('/api/admin/treasury/wallets');
      return response.wallets;
    },
    staleTime: 30_000,
  });
}

/**
 * Fetch single wallet details
 */
export function useTreasuryWallet(id: string) {
  return useQuery({
    queryKey: treasuryKeys.wallet(id),
    queryFn: async () => {
      const response = await adminApi.get<TreasuryWallet>(`/api/admin/treasury/wallets/${id}`);
      return response;
    },
    enabled: !!id,
  });
}

/**
 * Fetch transfer stats
 */
export function useTransferStats() {
  return useQuery({
    queryKey: treasuryKeys.transferStats(),
    queryFn: async () => {
      const response = await adminApi.get<TransferStatsResponse>('/api/admin/treasury/transfers/stats');
      return response.stats;
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

/**
 * Fetch transfers list with filters
 */
export function useTreasuryTransfers(filters?: TransferFilters) {
  return useQuery({
    queryKey: treasuryKeys.transfers(filters),
    queryFn: async () => {
      const response = await adminApi.get<TransfersResponse>('/api/admin/treasury/transfers', filters);
      return response;
    },
    staleTime: 30_000,
  });
}

/**
 * Fetch single transfer details
 */
export function useTreasuryTransfer(id: string) {
  return useQuery({
    queryKey: treasuryKeys.transfer(id),
    queryFn: async () => {
      const response = await adminApi.get<TreasuryTransfer>(`/api/admin/treasury/transfers/${id}`);
      return response;
    },
    enabled: !!id,
  });
}

/**
 * Fetch budget data
 */
export function useTreasuryBudget(period?: string) {
  return useQuery({
    queryKey: treasuryKeys.budget(period),
    queryFn: async () => {
      const response = await adminApi.get<BudgetResponse>('/api/admin/treasury/budget', { period });
      return response.budget;
    },
    staleTime: 60_000,
  });
}

/**
 * Fetch audit log stats
 */
export function useAuditLogStats() {
  return useQuery({
    queryKey: treasuryKeys.auditStats(),
    queryFn: async () => {
      const response = await adminApi.get<AuditStatsResponse>('/api/admin/treasury/audit/stats');
      return response.stats;
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

/**
 * Fetch audit logs with filters
 */
export function useAuditLogs(filters?: AuditLogFilters) {
  return useQuery({
    queryKey: treasuryKeys.auditLogs(filters),
    queryFn: async () => {
      const response = await adminApi.get<AuditLogsResponse>('/api/admin/treasury/audit', filters);
      return response;
    },
    staleTime: 30_000,
  });
}

// ============= Mutations =============

/**
 * Approve a transfer
 */
export function useApproveTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transferId: string) => {
      const response = await adminApi.post<{ success: boolean }>(
        `/api/admin/treasury/transfers/${transferId}/approve`
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: treasuryKeys.transfers() });
      queryClient.invalidateQueries({ queryKey: treasuryKeys.transferStats() });
    },
  });
}

/**
 * Reject a transfer
 */
export function useRejectTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ transferId, reason }: { transferId: string; reason: string }) => {
      const response = await adminApi.post<{ success: boolean }>(
        `/api/admin/treasury/transfers/${transferId}/reject`,
        { reason }
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: treasuryKeys.transfers() });
      queryClient.invalidateQueries({ queryKey: treasuryKeys.transferStats() });
    },
  });
}

/**
 * Create new transfer
 */
export function useCreateTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      from: string;
      to: string;
      amount: string;
      purpose: string;
    }) => {
      const response = await adminApi.post<TreasuryTransfer>(
        '/api/admin/treasury/transfers',
        data
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: treasuryKeys.transfers() });
      queryClient.invalidateQueries({ queryKey: treasuryKeys.transferStats() });
    },
  });
}
