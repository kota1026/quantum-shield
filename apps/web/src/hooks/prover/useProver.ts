/**
 * Prover Portal React Query Hooks
 *
 * Provides data fetching hooks for Prover Portal components.
 * Uses React Query for caching, automatic refetch, and optimistic updates.
 *
 * API Endpoints (Backend: /v1/prover):
 * - GET /v1/prover/:prover_id/dashboard - Prover dashboard
 * - GET /v1/prover/:prover_id/queue - Signing queue
 * - GET /v1/prover/:prover_id/metrics - Prover metrics
 * - GET /v1/prover/:prover_id/alerts - Prover alerts
 * - GET /v1/prover/:prover_id/challenges - Challenges
 * - POST /v1/prover/register - Register as prover
 * - POST /v1/prover/:prover_id/sign - Submit signature
 * - POST /v1/prover/:prover_id/exit - Initiate exit
 * - GET /v1/prover/:prover_id/exit-status - Exit status
 * - POST /v1/prover/:prover_id/withdraw - Withdraw stake
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

// Prover ID storage key - in production, this would come from auth context
const PROVER_ID_KEY = 'quantum_shield_prover_id';

/**
 * Get the current prover ID from localStorage
 * In production, this should come from authentication context
 */
function getProverId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(PROVER_ID_KEY);
}

/**
 * Set the prover ID in localStorage
 * Called after successful registration
 */
export function setProverId(proverId: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(PROVER_ID_KEY, proverId);
  }
}

/**
 * Clear the prover ID from localStorage
 * Called on logout or exit completion
 */
export function clearProverId(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(PROVER_ID_KEY);
  }
}

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
  // Dashboard & basic info
  dashboard: (proverId: string) => [...proverKeys.all, 'dashboard', proverId] as const,
  stats: () => [...proverKeys.all, 'stats'] as const,
  // Queue
  queue: (proverId: string) => [...proverKeys.all, 'queue', proverId] as const,
  queueItem: (proverId: string, queueId: string) => [...proverKeys.all, 'queue', proverId, queueId] as const,
  // Metrics & performance
  metrics: (proverId: string) => [...proverKeys.all, 'metrics', proverId] as const,
  performance: () => [...proverKeys.all, 'performance'] as const,
  detailMetrics: () => [...proverKeys.all, 'detailMetrics'] as const,
  signatureHistory: () => [...proverKeys.all, 'signatureHistory'] as const,
  // Rewards & stake
  rewards: () => [...proverKeys.all, 'rewards'] as const,
  stake: () => [...proverKeys.all, 'stake'] as const,
  stakeData: () => [...proverKeys.all, 'stakeData'] as const,
  rewardsSummary: () => [...proverKeys.all, 'rewardsSummary'] as const,
  payoutHistory: () => [...proverKeys.all, 'payoutHistory'] as const,
  // Alerts & challenges
  alerts: (proverId: string) => [...proverKeys.all, 'alerts', proverId] as const,
  challenges: (proverId: string) => [...proverKeys.all, 'challenges', proverId] as const,
  // Exit
  exitStatus: (proverId: string) => [...proverKeys.all, 'exitStatus', proverId] as const,
  // Enterprise
  enterpriseContract: () => [...proverKeys.all, 'enterprise', 'contract'] as const,
  // Application
  applicationStatus: (id: string) => [...proverKeys.all, 'application', id] as const,
};

// ==================== RESPONSE TYPES ====================

// Backend API response types (matching Rust backend)
interface ProverDashboardResponse {
  status: string;
  stake_amount: string;
  total_signatures: number;
  signatures_24h: number;
  pending_rewards: string;
  queue_size: number;
  active_challenges: number;
  uptime_percentage: number;
}

interface SigningQueueResponse {
  items: Array<{
    id: string;
    lock_id: string;
    amount: string;
    sr_commitment: string;
    deadline: string;
    priority: string;
    status: string;
  }>;
  total: number;
  pending_count: number;
}

interface ProverMetricsResponse {
  total_signatures: number;
  signatures_24h: number;
  signatures_7d: number;
  avg_response_time_ms: number;
  success_rate: number;
  uptime_percentage: number;
  total_rewards: string;
  pending_rewards: string;
  slash_count: number;
  slash_total: string;
  rank: number;
  total_provers: number;
}

interface ProverAlertsResponse {
  alerts: Array<{
    id: string;
    type: string;
    message: string;
    severity: string;
    created_at: string;
    acknowledged: boolean;
  }>;
  total: number;
  unacknowledged_count: number;
}

interface ProverChallengesResponse {
  challenges: Array<{
    id: string;
    challenger: string;
    challenged_at: string;
    defense_deadline: string;
    time_remaining: number;
    status: string;
    potential_slash: string;
  }>;
  total: number;
  pending_count: number;
}

interface ProverExitStatusResponse {
  prover_id: string;
  status: string;
  exit_initiated_at: string | null;
  unbonding_end: string | null;
  time_remaining: number | null;
  can_withdraw: boolean;
  pending_challenges: number;
  stake_to_return: string;
  rewards_to_return: string;
}

interface ProverRegisterResponse {
  prover_id: string;
  status: string;
  stake_locked: string;
}

// Legacy response types (for backward compatibility during migration)
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

/**
 * Get prover dashboard data from backend
 * Endpoint: GET /v1/prover/:prover_id/dashboard
 */
export function useProverDashboard(providedProverId?: string) {
  const proverId = providedProverId || getProverId();

  return useQuery({
    queryKey: proverKeys.dashboard(proverId || ''),
    queryFn: async () => {
      if (!proverId) {
        throw new Error('Prover ID not found. Please register or login.');
      }
      const response = await fetchApi<ProverDashboardResponse>(
        `/v1/prover/${proverId}/dashboard`
      );
      // Transform to frontend format
      return {
        status: response.status,
        stakeAmount: response.stake_amount,
        totalSignatures: response.total_signatures,
        signatures24h: response.signatures_24h,
        pendingRewards: response.pending_rewards,
        queueSize: response.queue_size,
        activeChallenges: response.active_challenges,
        uptimePercentage: response.uptime_percentage,
      };
    },
    enabled: !!proverId,
    staleTime: 30_000,
  });
}

/**
 * Legacy hook for backward compatibility
 * @deprecated Use useProverDashboard instead
 */
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

/**
 * Get signing queue from backend
 * Endpoint: GET /v1/prover/:prover_id/queue
 */
export function useProverSigningQueue(providedProverId?: string) {
  const proverId = providedProverId || getProverId();

  return useQuery({
    queryKey: proverKeys.queue(proverId || ''),
    queryFn: async () => {
      if (!proverId) {
        throw new Error('Prover ID not found. Please register or login.');
      }
      const response = await fetchApi<SigningQueueResponse>(
        `/v1/prover/${proverId}/queue`
      );
      // Transform to frontend format
      return {
        items: response.items.map(item => ({
          id: item.id,
          lockId: item.lock_id,
          amount: item.amount,
          srCommitment: item.sr_commitment,
          deadline: item.deadline,
          priority: item.priority,
          status: item.status,
        })),
        total: response.total,
        pendingCount: response.pending_count,
      };
    },
    enabled: !!proverId,
    staleTime: 15_000, // Refresh more frequently for queue
  });
}

/**
 * Legacy hook for backward compatibility
 * @deprecated Use useProverSigningQueue instead
 */
export function useProverQueue() {
  return useQuery({
    queryKey: proverKeys.queue('legacy'),
    queryFn: async () => {
      return fetchApi<QueueResponse>('/api/prover/queue');
    },
    staleTime: 15_000,
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

/**
 * Get prover metrics from backend
 * Endpoint: GET /v1/prover/:prover_id/metrics
 */
export function useProverMetrics(providedProverId?: string) {
  const proverId = providedProverId || getProverId();

  return useQuery({
    queryKey: proverKeys.metrics(proverId || ''),
    queryFn: async () => {
      if (!proverId) {
        throw new Error('Prover ID not found. Please register or login.');
      }
      const response = await fetchApi<ProverMetricsResponse>(
        `/v1/prover/${proverId}/metrics`
      );
      // Transform to frontend format
      return {
        totalSignatures: response.total_signatures,
        signatures24h: response.signatures_24h,
        signatures7d: response.signatures_7d,
        avgResponseTimeMs: response.avg_response_time_ms,
        successRate: response.success_rate,
        uptimePercentage: response.uptime_percentage,
        totalRewards: response.total_rewards,
        pendingRewards: response.pending_rewards,
        slashCount: response.slash_count,
        slashTotal: response.slash_total,
        rank: response.rank,
        totalProvers: response.total_provers,
      };
    },
    enabled: !!proverId,
    staleTime: 30_000,
  });
}

/**
 * Legacy hook for backward compatibility
 * @deprecated Use useProverMetrics instead
 */
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

/**
 * Get prover alerts from backend
 * Endpoint: GET /v1/prover/:prover_id/alerts
 */
export function useProverAlertsV2(providedProverId?: string) {
  const proverId = providedProverId || getProverId();

  return useQuery({
    queryKey: proverKeys.alerts(proverId || ''),
    queryFn: async () => {
      if (!proverId) {
        throw new Error('Prover ID not found. Please register or login.');
      }
      const response = await fetchApi<ProverAlertsResponse>(
        `/v1/prover/${proverId}/alerts`
      );
      // Transform to frontend format
      return {
        alerts: response.alerts.map(alert => ({
          id: alert.id,
          type: alert.type,
          message: alert.message,
          severity: alert.severity,
          createdAt: alert.created_at,
          acknowledged: alert.acknowledged,
        })),
        total: response.total,
        unacknowledgedCount: response.unacknowledged_count,
      };
    },
    enabled: !!proverId,
    staleTime: 15_000,
  });
}

/**
 * Get prover challenges from backend
 * Endpoint: GET /v1/prover/:prover_id/challenges
 */
export function useProverChallenges(providedProverId?: string) {
  const proverId = providedProverId || getProverId();

  return useQuery({
    queryKey: proverKeys.challenges(proverId || ''),
    queryFn: async () => {
      if (!proverId) {
        throw new Error('Prover ID not found. Please register or login.');
      }
      const response = await fetchApi<ProverChallengesResponse>(
        `/v1/prover/${proverId}/challenges`
      );
      // Transform to frontend format
      return {
        challenges: response.challenges.map(challenge => ({
          id: challenge.id,
          challenger: challenge.challenger,
          challengedAt: challenge.challenged_at,
          defenseDeadline: challenge.defense_deadline,
          timeRemaining: challenge.time_remaining,
          status: challenge.status,
          potentialSlash: challenge.potential_slash,
        })),
        total: response.total,
        pendingCount: response.pending_count,
      };
    },
    enabled: !!proverId,
    staleTime: 30_000,
  });
}

/**
 * Legacy hook for backward compatibility
 * @deprecated Use useProverAlertsV2 instead
 */
export function useProverAlerts() {
  return useQuery({
    queryKey: proverKeys.alerts('legacy'),
    queryFn: async () => {
      const response = await fetchApi<AlertsResponse>('/api/prover/alerts');
      return response.alerts;
    },
    staleTime: 15_000,
  });
}

export function useResolveAlert() {
  const queryClient = useQueryClient();
  const proverId = getProverId();

  return useMutation({
    mutationFn: async (alertId: number) => {
      // Note: Backend may not have this endpoint yet
      return fetchApi(`/api/prover/alerts/${alertId}/resolve`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      if (proverId) {
        queryClient.invalidateQueries({ queryKey: proverKeys.alerts(proverId) });
      }
      queryClient.invalidateQueries({ queryKey: proverKeys.alerts('legacy') });
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

// ==================== EXIT HOOKS ====================

/**
 * Get prover exit status from backend
 * Endpoint: GET /v1/prover/:prover_id/exit-status
 */
export function useProverExitStatus(providedProverId?: string) {
  const proverId = providedProverId || getProverId();

  return useQuery({
    queryKey: proverKeys.exitStatus(proverId || ''),
    queryFn: async () => {
      if (!proverId) {
        throw new Error('Prover ID not found. Please register or login.');
      }
      const response = await fetchApi<ProverExitStatusResponse>(
        `/v1/prover/${proverId}/exit-status`
      );
      // Transform to frontend format
      return {
        proverId: response.prover_id,
        status: response.status,
        exitInitiatedAt: response.exit_initiated_at,
        unbondingEnd: response.unbonding_end,
        timeRemaining: response.time_remaining,
        canWithdraw: response.can_withdraw,
        pendingChallenges: response.pending_challenges,
        stakeToReturn: response.stake_to_return,
        rewardsToReturn: response.rewards_to_return,
      };
    },
    enabled: !!proverId,
    staleTime: 60_000,
  });
}

/**
 * Initiate prover exit
 * Endpoint: POST /v1/prover/:prover_id/exit
 */
export function useInitiateProverExit() {
  const queryClient = useQueryClient();
  const proverId = getProverId();

  return useMutation({
    mutationFn: async (data: { confirmation_signature: string }) => {
      if (!proverId) {
        throw new Error('Prover ID not found. Please register or login.');
      }
      return fetchApi<{ prover_id: string; unbonding_end: string; stake_to_return: string }>(
        `/v1/prover/${proverId}/exit`,
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      );
    },
    onSuccess: () => {
      if (proverId) {
        queryClient.invalidateQueries({ queryKey: proverKeys.dashboard(proverId) });
        queryClient.invalidateQueries({ queryKey: proverKeys.exitStatus(proverId) });
      }
    },
  });
}

/**
 * Withdraw stake after unbonding
 * Endpoint: POST /v1/prover/:prover_id/withdraw
 */
export function useWithdrawProverStake() {
  const queryClient = useQueryClient();
  const proverId = getProverId();

  return useMutation({
    mutationFn: async (data: { destination_address: string; confirmation_signature: string }) => {
      if (!proverId) {
        throw new Error('Prover ID not found. Please register or login.');
      }
      return fetchApi<{ prover_id: string; total_returned: string; destination_address: string; tx_hash: string }>(
        `/v1/prover/${proverId}/withdraw`,
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      );
    },
    onSuccess: () => {
      // Clear prover ID after successful withdrawal
      clearProverId();
      if (proverId) {
        queryClient.invalidateQueries({ queryKey: proverKeys.all });
      }
    },
  });
}

// ==================== APPLICATION / REGISTRATION HOOKS ====================

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

/**
 * Register as a new prover
 * Endpoint: POST /v1/prover/register
 *
 * Requirements (from backend):
 * - Minimum stake: $400K (Phase 1) / $500K (Phase 2+)
 * - HSM attestation required
 * - 2-of-3 multisig proof required
 * - Valid SPHINCS+-128s public key (32 bytes)
 */
export function useProverRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      operator_addr: string;
      stake_amount: string;
      sphincs_pubkey: string;
      hsm_attestation: string;
      multisig_proof: string;
    }) => {
      const response = await fetchApi<ProverRegisterResponse>('/v1/prover/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      // Store prover ID on successful registration
      if (response.prover_id) {
        setProverId(response.prover_id);
      }

      return {
        proverId: response.prover_id,
        status: response.status,
        stakeLocked: response.stake_locked,
      };
    },
    onSuccess: (data) => {
      // Invalidate all prover queries to refresh data
      queryClient.invalidateQueries({ queryKey: proverKeys.all });
      if (data.proverId) {
        queryClient.invalidateQueries({ queryKey: proverKeys.dashboard(data.proverId) });
      }
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

/**
 * Submit a signature for a queue item
 * Endpoint: POST /v1/prover/:prover_id/sign
 */
export function useSubmitProverSignature() {
  const queryClient = useQueryClient();
  const proverId = getProverId();

  return useMutation({
    mutationFn: async (data: {
      queue_id: string;
      signature: string;
      hsm_attestation: string;
    }) => {
      if (!proverId) {
        throw new Error('Prover ID not found. Please register or login.');
      }
      return fetchApi<{
        queue_id: string;
        status: string;
        total_signatures: number;
        required_signatures: number;
      }>(`/v1/prover/${proverId}/sign`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      if (proverId) {
        queryClient.invalidateQueries({ queryKey: proverKeys.queue(proverId) });
        queryClient.invalidateQueries({ queryKey: proverKeys.dashboard(proverId) });
        queryClient.invalidateQueries({ queryKey: proverKeys.metrics(proverId) });
      }
    },
  });
}

/**
 * Submit challenge response
 * Endpoint: POST /v1/prover/:prover_id/challenge-response
 */
export function useSubmitChallengeResponse() {
  const queryClient = useQueryClient();
  const proverId = getProverId();

  return useMutation({
    mutationFn: async (data: {
      challenge_id: string;
      defense_proof: string;
      explanation?: string;
    }) => {
      if (!proverId) {
        throw new Error('Prover ID not found. Please register or login.');
      }
      return fetchApi<{
        challenge_id: string;
        defense_accepted: boolean;
        new_status: string;
      }>(`/v1/prover/${proverId}/challenge-response`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      if (proverId) {
        queryClient.invalidateQueries({ queryKey: proverKeys.challenges(proverId) });
        queryClient.invalidateQueries({ queryKey: proverKeys.alerts(proverId) });
        queryClient.invalidateQueries({ queryKey: proverKeys.dashboard(proverId) });
      }
    },
  });
}

/**
 * Legacy hook for backward compatibility
 * @deprecated Use useSubmitProverSignature instead
 */
export function useProcessSignature() {
  const queryClient = useQueryClient();
  const proverId = getProverId();

  return useMutation({
    mutationFn: async (requestId: string) => {
      return fetchApi(`/api/prover/queue/${requestId}/process`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      if (proverId) {
        queryClient.invalidateQueries({ queryKey: proverKeys.queue(proverId) });
      }
      queryClient.invalidateQueries({ queryKey: proverKeys.stats() });
    },
  });
}
