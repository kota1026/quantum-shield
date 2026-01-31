/**
 * Prover Portal React Query Hooks
 *
 * Provides data fetching hooks for Prover Portal components.
 * Uses React Query for caching, automatic refetch, and optimistic updates.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  ProverStats,
  QueueItem,
  ProverRewards,
  ProverStake,
  EnterpriseContract,
  PerformanceStats,
  SignatureHistoryItem,
  DetailMetric,
  RewardsSummary,
  PayoutHistoryItem,
  ProverAlert,
  StakeData,
  ApplicationStatus,
  ApplicationFormData,
} from '@/lib/api/prover/mock';

// ==================== API BASE ====================

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message);
  }

  return res.json();
}

// ==================== QUERY KEY FACTORY ====================

export const proverKeys = {
  all: ['prover'] as const,
  stats: () => [...proverKeys.all, 'stats'] as const,
  queue: () => [...proverKeys.all, 'queue'] as const,
  rewards: () => [...proverKeys.all, 'rewards'] as const,
  stake: () => [...proverKeys.all, 'stake'] as const,
  enterpriseContract: () => [...proverKeys.all, 'enterprise', 'contract'] as const,
  performance: () => [...proverKeys.all, 'performance'] as const,
  signatureHistory: () => [...proverKeys.all, 'signatureHistory'] as const,
  detailMetrics: () => [...proverKeys.all, 'detailMetrics'] as const,
  rewardsSummary: () => [...proverKeys.all, 'rewardsSummary'] as const,
  payoutHistory: () => [...proverKeys.all, 'payoutHistory'] as const,
  alerts: () => [...proverKeys.all, 'alerts'] as const,
  stakeData: () => [...proverKeys.all, 'stakeData'] as const,
  applicationStatus: (id: string) => [...proverKeys.all, 'application', id] as const,
};

// ==================== RESPONSE TYPES ====================

interface StatsResponse {
  stats: ProverStats;
}

interface QueueResponse {
  items: QueueItem[];
  total: number;
}

interface RewardsResponse {
  rewards: ProverRewards;
}

interface StakeResponse {
  stake: ProverStake;
}

interface EnterpriseContractResponse {
  contract: EnterpriseContract;
}

interface PerformanceResponse {
  stats: PerformanceStats;
}

interface SignatureHistoryResponse {
  history: SignatureHistoryItem[];
}

interface DetailMetricsResponse {
  metrics: DetailMetric[];
}

interface RewardsSummaryResponse {
  summary: RewardsSummary;
}

interface PayoutHistoryResponse {
  history: PayoutHistoryItem[];
}

interface AlertsResponse {
  alerts: ProverAlert[];
}

interface StakeDataResponse {
  data: StakeData;
}

interface ApplicationStatusResponse {
  status: ApplicationStatus;
}

// ==================== DASHBOARD HOOKS ====================

export function useProverStats() {
  return useQuery({
    queryKey: proverKeys.stats(),
    queryFn: async () => {
      const response = await fetchApi<StatsResponse>('/api/prover/stats');
      return response.stats;
    },
    staleTime: 30_000,
  });
}

export function useProverQueue() {
  return useQuery({
    queryKey: proverKeys.queue(),
    queryFn: async () => {
      return fetchApi<QueueResponse>('/api/prover/queue');
    },
    staleTime: 15_000, // Refresh more frequently for queue
  });
}

export function useProverRewards() {
  return useQuery({
    queryKey: proverKeys.rewards(),
    queryFn: async () => {
      const response = await fetchApi<RewardsResponse>('/api/prover/rewards');
      return response.rewards;
    },
    staleTime: 60_000,
  });
}

export function useProverStake() {
  return useQuery({
    queryKey: proverKeys.stake(),
    queryFn: async () => {
      const response = await fetchApi<StakeResponse>('/api/prover/stake');
      return response.stake;
    },
    staleTime: 60_000,
  });
}

export function useEnterpriseContract() {
  return useQuery({
    queryKey: proverKeys.enterpriseContract(),
    queryFn: async () => {
      const response = await fetchApi<EnterpriseContractResponse>('/api/prover/enterprise/contract');
      return response.contract;
    },
    staleTime: 300_000, // Contract info changes rarely
  });
}

// ==================== METRICS HOOKS ====================

export function usePerformanceStats() {
  return useQuery({
    queryKey: proverKeys.performance(),
    queryFn: async () => {
      const response = await fetchApi<PerformanceResponse>('/api/prover/performance');
      return response.stats;
    },
    staleTime: 30_000,
  });
}

export function useSignatureHistory() {
  return useQuery({
    queryKey: proverKeys.signatureHistory(),
    queryFn: async () => {
      const response = await fetchApi<SignatureHistoryResponse>('/api/prover/signature-history');
      return response.history;
    },
    staleTime: 60_000,
  });
}

export function useDetailMetrics() {
  return useQuery({
    queryKey: proverKeys.detailMetrics(),
    queryFn: async () => {
      const response = await fetchApi<DetailMetricsResponse>('/api/prover/detail-metrics');
      return response.metrics;
    },
    staleTime: 30_000,
  });
}

export function useRewardsSummary() {
  return useQuery({
    queryKey: proverKeys.rewardsSummary(),
    queryFn: async () => {
      const response = await fetchApi<RewardsSummaryResponse>('/api/prover/rewards-summary');
      return response.summary;
    },
    staleTime: 60_000,
  });
}

export function usePayoutHistory() {
  return useQuery({
    queryKey: proverKeys.payoutHistory(),
    queryFn: async () => {
      const response = await fetchApi<PayoutHistoryResponse>('/api/prover/payout-history');
      return response.history;
    },
    staleTime: 60_000,
  });
}

// ==================== ALERTS HOOKS ====================

export function useProverAlerts() {
  return useQuery({
    queryKey: proverKeys.alerts(),
    queryFn: async () => {
      const response = await fetchApi<AlertsResponse>('/api/prover/alerts');
      return response.alerts;
    },
    staleTime: 15_000,
  });
}

export function useResolveAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alertId: number) => {
      return fetchApi(`/api/prover/alerts/${alertId}/resolve`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proverKeys.alerts() });
    },
  });
}

// ==================== STAKE HOOKS ====================

export function useStakeData() {
  return useQuery({
    queryKey: proverKeys.stakeData(),
    queryFn: async () => {
      const response = await fetchApi<StakeDataResponse>('/api/prover/stake-data');
      return response.data;
    },
    staleTime: 60_000,
  });
}

export function useClaimRewards() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (amount: number) => {
      return fetchApi('/api/prover/rewards/claim', {
        method: 'POST',
        body: JSON.stringify({ amount }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proverKeys.rewards() });
      queryClient.invalidateQueries({ queryKey: proverKeys.rewardsSummary() });
      queryClient.invalidateQueries({ queryKey: proverKeys.payoutHistory() });
    },
  });
}

export function useAddStake() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (amount: number) => {
      return fetchApi('/api/prover/stake/add', {
        method: 'POST',
        body: JSON.stringify({ amount }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proverKeys.stake() });
      queryClient.invalidateQueries({ queryKey: proverKeys.stakeData() });
    },
  });
}

// ==================== APPLICATION HOOKS ====================

export function useApplicationStatus(applicationId: string) {
  return useQuery({
    queryKey: proverKeys.applicationStatus(applicationId),
    queryFn: async () => {
      const response = await fetchApi<ApplicationStatusResponse>(
        `/api/prover/application/${applicationId}/status`
      );
      return response.status;
    },
    staleTime: 60_000,
    enabled: !!applicationId,
  });
}

export function useSubmitApplication() {
  return useMutation({
    mutationFn: async (formData: ApplicationFormData) => {
      return fetchApi<{ applicationId: string }>('/api/prover/application', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
    },
  });
}

export function useVerifyInvitation() {
  return useMutation({
    mutationFn: async (code: string) => {
      return fetchApi<{ valid: boolean; invitation?: unknown }>('/api/prover/invitation/verify', {
        method: 'POST',
        body: JSON.stringify({ code }),
      });
    },
  });
}

// ==================== QUEUE ACTIONS ====================

export function useProcessSignature() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: string) => {
      return fetchApi(`/api/prover/queue/${requestId}/process`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proverKeys.queue() });
      queryClient.invalidateQueries({ queryKey: proverKeys.stats() });
    },
  });
}
