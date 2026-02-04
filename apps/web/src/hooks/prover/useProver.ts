/**
 * Prover Portal React Query Hooks
 *
 * Provides data fetching hooks for Prover Portal components.
 * Uses React Query for caching, automatic refetch, and optimistic updates.
 *
 * API Endpoints (Backend: /v1/prover):
 * - POST /v1/prover/register - Register as prover
 * - GET /v1/prover/:prover_id/dashboard - Prover dashboard
 * - GET /v1/prover/:prover_id/queue - Signing queue
 * - GET /v1/prover/:prover_id/queue/:queue_id - Queue item details
 * - POST /v1/prover/:prover_id/sign - Submit signature
 * - GET /v1/prover/:prover_id/metrics - Prover metrics
 * - GET /v1/prover/:prover_id/alerts - Prover alerts
 * - GET /v1/prover/:prover_id/challenges - Challenges against prover
 * - POST /v1/prover/:prover_id/challenge-response - Submit defense
 * - POST /v1/prover/:prover_id/exit - Initiate exit
 * - GET /v1/prover/:prover_id/exit-status - Check exit status
 * - POST /v1/prover/:prover_id/withdraw - Withdraw stake
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ==================== QUERY KEY FACTORY ====================

export const proverKeys = {
  all: ['prover'] as const,
  dashboard: (proverId: string) => [...proverKeys.all, 'dashboard', proverId] as const,
  queue: (proverId: string) => [...proverKeys.all, 'queue', proverId] as const,
  queueItem: (proverId: string, queueId: string) => [...proverKeys.all, 'queue', proverId, queueId] as const,
  metrics: (proverId: string) => [...proverKeys.all, 'metrics', proverId] as const,
  alerts: (proverId: string) => [...proverKeys.all, 'alerts', proverId] as const,
  challenges: (proverId: string) => [...proverKeys.all, 'challenges', proverId] as const,
  exitStatus: (proverId: string) => [...proverKeys.all, 'exitStatus', proverId] as const,
  list: () => [...proverKeys.all, 'list'] as const,
};

// ==================== API CONFIG ====================

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message);
  }

  return res.json();
}

// ==================== DASHBOARD HOOKS ====================

export function useProverDashboard(proverId: string) {
  return useQuery({
    queryKey: proverKeys.dashboard(proverId),
    queryFn: async () => {
      const response = await fetchApi<{
        prover_id: string;
        status: string;
        stake_amount: string;
        pending_rewards: string;
        total_earnings: string;
        queue_size: number;
        active_challenges: number;
        signatures_24h: number;
        signatures_total: number;
        uptime_percentage: number;
        tier: number;
      }>(`/v1/prover/${proverId}/dashboard`);

      return {
        proverId: response.prover_id,
        status: response.status,
        stakeAmount: response.stake_amount,
        pendingRewards: response.pending_rewards,
        totalEarnings: response.total_earnings,
        queueSize: response.queue_size,
        activeChallenges: response.active_challenges,
        signatures24h: response.signatures_24h,
        signaturesTotal: response.signatures_total,
        uptimePercentage: response.uptime_percentage,
        tier: response.tier,
      };
    },
    enabled: !!proverId,
    staleTime: 30_000,
  });
}

// ==================== SIGNING QUEUE HOOKS ====================

export function useSigningQueue(proverId: string) {
  return useQuery({
    queryKey: proverKeys.queue(proverId),
    queryFn: async () => {
      const response = await fetchApi<{
        items: Array<{
          queue_id: string;
          lock_id: string;
          unlock_type: 'normal' | 'emergency';
          user_address: string;
          amount: string;
          asset: string;
          sr_0: string;
          sr_1: string;
          created_at: number;
          deadline: number;
          priority: 'normal' | 'high' | 'critical';
          dilithium_verified: boolean;
        }>;
        total: number;
        pending_count: number;
      }>(`/v1/prover/${proverId}/queue`);

      return {
        items: response.items.map(item => ({
          queueId: item.queue_id,
          lockId: item.lock_id,
          unlockType: item.unlock_type,
          userAddress: item.user_address,
          amount: item.amount,
          asset: item.asset,
          sr0: item.sr_0,
          sr1: item.sr_1,
          createdAt: item.created_at,
          deadline: item.deadline,
          priority: item.priority,
          dilithiumVerified: item.dilithium_verified,
        })),
        total: response.total,
        pendingCount: response.pending_count,
      };
    },
    enabled: !!proverId,
    staleTime: 10_000,
    refetchInterval: 30_000,
  });
}

export function useQueueItem(proverId: string, queueId: string) {
  return useQuery({
    queryKey: proverKeys.queueItem(proverId, queueId),
    queryFn: async () => {
      const response = await fetchApi<{
        queue_id: string;
        lock_id: string;
        unlock_type: 'normal' | 'emergency';
        user_address: string;
        amount: string;
        asset: string;
        sr_0: string;
        sr_1: string;
        created_at: number;
        deadline: number;
        priority: 'normal' | 'high' | 'critical';
        dilithium_signature: string;
        dilithium_verified: boolean;
        source_chain: string;
        dest_chain: string;
      }>(`/v1/prover/${proverId}/queue/${queueId}`);

      return {
        queueId: response.queue_id,
        lockId: response.lock_id,
        unlockType: response.unlock_type,
        userAddress: response.user_address,
        amount: response.amount,
        asset: response.asset,
        sr0: response.sr_0,
        sr1: response.sr_1,
        createdAt: response.created_at,
        deadline: response.deadline,
        priority: response.priority,
        dilithiumSignature: response.dilithium_signature,
        dilithiumVerified: response.dilithium_verified,
        sourceChain: response.source_chain,
        destChain: response.dest_chain,
      };
    },
    enabled: !!proverId && !!queueId,
    staleTime: 30_000,
  });
}

// ==================== SIGNING MUTATIONS ====================

export function useSubmitSignature(proverId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      queueId: string;
      sphincsSignature: string;
      hsmAttestation: string;
    }) => {
      const response = await fetchApi<{
        queue_id: string;
        signature_accepted: boolean;
        total_signatures: number;
        required_signatures: number;
        tx_hash?: string;
      }>(`/v1/prover/${proverId}/sign`, {
        method: 'POST',
        body: JSON.stringify({
          queue_id: data.queueId,
          sphincs_signature: data.sphincsSignature,
          hsm_attestation: data.hsmAttestation,
        }),
      });

      return {
        queueId: response.queue_id,
        signatureAccepted: response.signature_accepted,
        totalSignatures: response.total_signatures,
        requiredSignatures: response.required_signatures,
        txHash: response.tx_hash,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proverKeys.queue(proverId) });
      queryClient.invalidateQueries({ queryKey: proverKeys.dashboard(proverId) });
      queryClient.invalidateQueries({ queryKey: proverKeys.metrics(proverId) });
    },
  });
}

export function useSubmitBatchSignatures(proverId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      signatures: Array<{
        queueId: string;
        sphincsSignature: string;
        hsmAttestation: string;
      }>;
    }) => {
      return fetchApi<{ processed: number; failed: number }>(
        `/v1/prover/${proverId}/sign/batch`,
        {
          method: 'POST',
          body: JSON.stringify({
            signatures: data.signatures.map(s => ({
              queue_id: s.queueId,
              sphincs_signature: s.sphincsSignature,
              hsm_attestation: s.hsmAttestation,
            })),
          }),
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proverKeys.queue(proverId) });
      queryClient.invalidateQueries({ queryKey: proverKeys.dashboard(proverId) });
      queryClient.invalidateQueries({ queryKey: proverKeys.metrics(proverId) });
    },
  });
}

// ==================== METRICS HOOKS ====================

export function useProverMetrics(proverId: string) {
  return useQuery({
    queryKey: proverKeys.metrics(proverId),
    queryFn: async () => {
      const response = await fetchApi<{
        prover_id: string;
        total_signatures: number;
        signatures_24h: number;
        signatures_7d: number;
        success_rate: number;
        avg_response_time_ms: number;
        uptime_percentage: number;
        total_earnings: string;
        pending_rewards: string;
        slash_count: number;
        slash_total: string;
        rank: number;
        total_provers: number;
      }>(`/v1/prover/${proverId}/metrics`);

      return {
        proverId: response.prover_id,
        totalSignatures: response.total_signatures,
        signatures24h: response.signatures_24h,
        signatures7d: response.signatures_7d,
        successRate: response.success_rate,
        avgResponseTimeMs: response.avg_response_time_ms,
        uptimePercentage: response.uptime_percentage,
        totalEarnings: response.total_earnings,
        pendingRewards: response.pending_rewards,
        slashCount: response.slash_count,
        slashTotal: response.slash_total,
        rank: response.rank,
        totalProvers: response.total_provers,
      };
    },
    enabled: !!proverId,
    staleTime: 60_000,
  });
}

// ==================== ALERTS HOOKS ====================

export function useProverAlerts(proverId?: string) {
  return useQuery({
    queryKey: proverKeys.alerts(proverId || 'current'),
    queryFn: async () => {
      const endpoint = proverId ? `/v1/prover/${proverId}/alerts` : '/v1/prover/alerts';
      const response = await fetchApi<{
        alerts: Array<{
          alert_id: string;
          alert_type: string;
          severity: 'info' | 'warning' | 'critical';
          title: string;
          message: string;
          created_at: number;
          acknowledged: boolean;
          reference_id?: string;
          // Extra fields for component compatibility
          request_id?: string;
          remaining_time?: number;
          server?: string;
          cpu_usage?: number;
        }>;
        total: number;
        unacknowledged_count: number;
      }>(endpoint);

      // Transform to match component expectations (returns array directly)
      return response.alerts.map((alert, index) => ({
        id: index + 1,
        type: alert.severity as 'critical' | 'warning' | 'info',
        title: alert.title,
        timestamp: new Date(alert.created_at * 1000).toISOString().replace('T', ' ').slice(0, 19),
        description: alert.message,
        requestId: alert.request_id,
        remainingTime: alert.remaining_time,
        server: alert.server,
        cpuUsage: alert.cpu_usage,
        resolved: alert.acknowledged,
      }));
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useAcknowledgeAlert(proverId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alertId: string) => {
      return fetchApi<{ acknowledged: boolean }>(
        `/v1/prover/${proverId}/alerts/${alertId}/acknowledge`,
        { method: 'POST' }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proverKeys.alerts(proverId) });
    },
  });
}

// ==================== CHALLENGES HOOKS ====================

export function useProverChallenges(proverId: string) {
  return useQuery({
    queryKey: proverKeys.challenges(proverId),
    queryFn: async () => {
      const response = await fetchApi<{
        challenges: Array<{
          challenge_id: string;
          challenger_address: string;
          lock_id: string;
          amount_at_risk: string;
          created_at: number;
          defense_deadline: number;
          status: string;
          reason: string;
        }>;
        total: number;
        pending_count: number;
      }>(`/v1/prover/${proverId}/challenges`);

      return {
        challenges: response.challenges.map(c => ({
          challengeId: c.challenge_id,
          challengerAddress: c.challenger_address,
          lockId: c.lock_id,
          amountAtRisk: c.amount_at_risk,
          createdAt: c.created_at,
          defenseDeadline: c.defense_deadline,
          status: c.status,
          reason: c.reason,
        })),
        total: response.total,
        pendingCount: response.pending_count,
      };
    },
    enabled: !!proverId,
    staleTime: 30_000,
  });
}

export function useSubmitChallengeDefense(proverId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      challengeId: string;
      defenseProof: string;
      explanation?: string;
    }) => {
      return fetchApi<{ accepted: boolean; status: string }>(
        `/v1/prover/${proverId}/challenge-response`,
        {
          method: 'POST',
          body: JSON.stringify({
            challenge_id: data.challengeId,
            defense_proof: data.defenseProof,
            explanation: data.explanation,
          }),
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proverKeys.challenges(proverId) });
      queryClient.invalidateQueries({ queryKey: proverKeys.alerts(proverId) });
      queryClient.invalidateQueries({ queryKey: proverKeys.dashboard(proverId) });
    },
  });
}

// ==================== EXIT HOOKS ====================

export function useProverExitStatus(proverId: string) {
  return useQuery({
    queryKey: proverKeys.exitStatus(proverId),
    queryFn: async () => {
      const response = await fetchApi<{
        prover_id: string;
        status: string;
        unbonding_start?: number;
        unbonding_end?: number;
        stake_to_return: string;
        pending_rewards: string;
        can_withdraw: boolean;
        pending_challenges: number;
      }>(`/v1/prover/${proverId}/exit-status`);

      return {
        proverId: response.prover_id,
        status: response.status,
        unbondingStart: response.unbonding_start,
        unbondingEnd: response.unbonding_end,
        stakeToReturn: response.stake_to_return,
        pendingRewards: response.pending_rewards,
        canWithdraw: response.can_withdraw,
        pendingChallenges: response.pending_challenges,
      };
    },
    enabled: !!proverId,
    staleTime: 60_000,
  });
}

export function useInitiateExit(proverId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { confirmationSignature: string }) => {
      return fetchApi<{
        prover_id: string;
        unbonding_end: number;
        stake_to_return: string;
        pending_rewards: string;
      }>(`/v1/prover/${proverId}/exit`, {
        method: 'POST',
        body: JSON.stringify({ confirmation_signature: data.confirmationSignature }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proverKeys.dashboard(proverId) });
      queryClient.invalidateQueries({ queryKey: proverKeys.exitStatus(proverId) });
    },
  });
}

export function useWithdrawStake(proverId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      destinationAddress: string;
      confirmationSignature: string;
    }) => {
      return fetchApi<{
        prover_id: string;
        total_returned: string;
        destination_address: string;
        tx_hash: string;
      }>(`/v1/prover/${proverId}/withdraw`, {
        method: 'POST',
        body: JSON.stringify({
          destination_address: data.destinationAddress,
          confirmation_signature: data.confirmationSignature,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proverKeys.dashboard(proverId) });
      queryClient.invalidateQueries({ queryKey: proverKeys.exitStatus(proverId) });
    },
  });
}

// ==================== REGISTRATION HOOKS ====================

export function useRegisterProver() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      operatorAddr: string;
      sphincsPubkey: string;
      stakeAmount: string;
      hsmAttestation: string;
      multisigProof: string;
      endpoint: string;
    }) => {
      return fetchApi<{
        prover_id: string;
        status: string;
        stake_locked: string;
      }>('/v1/prover/register', {
        method: 'POST',
        body: JSON.stringify({
          operator_addr: data.operatorAddr,
          sphincs_pubkey: data.sphincsPubkey,
          stake_amount: data.stakeAmount,
          hsm_attestation: data.hsmAttestation,
          multisig_proof: data.multisigProof,
          endpoint: data.endpoint,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proverKeys.list() });
    },
  });
}

// ==================== LIST HOOKS ====================

export function useProverList(params?: { status?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: [...proverKeys.list(), params],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.set('status', params.status);
      if (params?.page) queryParams.set('page', params.page.toString());
      if (params?.limit) queryParams.set('limit', params.limit.toString());

      const url = `/v1/prover/list${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      return fetchApi<{
        data: Array<{
          prover_id: string;
          operator_addr: string;
          status: string;
          stake_amount: string;
          tier: number;
          signatures_total: number;
          success_rate: number;
        }>;
        total: number;
      }>(url);
    },
    staleTime: 60_000,
  });
}

// ==================== ALIAS HOOKS (for component compatibility) ====================

/**
 * Prover stats for dashboard - alias/wrapper for useProverDashboard
 */
export function useProverStats(proverId?: string) {
  return useQuery({
    queryKey: [...proverKeys.all, 'stats', proverId],
    queryFn: async () => {
      const response = await fetchApi<{
        pendingSignatures: number;
        urgentCount: number;
        todaysProcessed: number;
        processedChange: number;
        avgProcessed: number;
        uptime: number;
        slaMinUptime: number;
        responseTime: number;
      }>(`/v1/prover/${proverId}/stats`);

      return response;
    },
    enabled: !!proverId,
    staleTime: 30_000,
  });
}

/**
 * Prover queue - alias for dashboard component
 */
export function useProverQueue(proverId?: string) {
  return useQuery({
    queryKey: [...proverKeys.all, 'proverQueue', proverId],
    queryFn: async () => {
      const endpoint = proverId ? `/v1/prover/${proverId}/queue/dashboard` : '/v1/prover/queue/dashboard';
      const response = await fetchApi<{
        items: Array<{
          id: string;
          type: string;
          address: string;
          amount: string;
          time: string;
          urgent: boolean;
        }>;
        total: number;
      }>(endpoint);

      return response;
    },
    staleTime: 15_000,
  });
}

/**
 * Prover rewards summary - returns data compatible with ProverDashboard
 */
export function useProverRewards(proverId?: string) {
  return useQuery({
    queryKey: [...proverKeys.all, 'rewards', proverId],
    queryFn: async () => {
      const endpoint = proverId ? `/v1/prover/${proverId}/rewards` : '/v1/prover/rewards';
      const response = await fetchApi<{
        claimable: number;
        thisMonth: number;
        allTime: number;
      }>(endpoint);

      return response;
    },
    staleTime: 60_000,
  });
}

/**
 * Prover stake info - returns data compatible with ProverDashboard
 */
export function useProverStake(proverId?: string) {
  return useQuery({
    queryKey: [...proverKeys.all, 'stake', proverId],
    queryFn: async () => {
      const endpoint = proverId ? `/v1/prover/${proverId}/stake` : '/v1/prover/stake';
      const response = await fetchApi<{
        amount: number;
        usdValue: number;
        challenges: number;
      }>(endpoint);

      return response;
    },
    staleTime: 60_000,
  });
}

/**
 * Stake data hook with extended info for ProverAlerts component
 */
export function useStakeData(proverId?: string) {
  return useQuery({
    queryKey: [...proverKeys.all, 'stakeData', proverId],
    queryFn: async () => {
      const response = await fetchApi<{
        currentStake: number;
        unlockDate: string;
        daysRemaining: number;
        totalRewards: number;
        annualRate: number;
        totalSlashing: number;
        riskLevel: number;
        violations30d: number;
        slaRate: number;
        potentialSlashing: number;
      }>(`/v1/prover/${proverId}/stake-data`);

      return response;
    },
    enabled: !!proverId,
    staleTime: 60_000,
  });
}

/**
 * Enterprise contract info (for enterprise provers)
 */
export function useEnterpriseContract(proverId?: string) {
  return useQuery({
    queryKey: [...proverKeys.all, 'enterpriseContract', proverId],
    queryFn: async () => {
      const endpoint = proverId ? `/v1/prover/${proverId}/enterprise-contract` : '/v1/prover/enterprise-contract';
      const response = await fetchApi<{
        operatorName: string;
        contractId: string;
        plan: string;
        startDate: string;
        endDate: string;
        sla: string;
        guaranteedRevenue: string;
        supportLevel: string;
        infrastructureManaged: boolean;
        contactPerson: string;
      }>(endpoint);

      return response;
    },
    staleTime: 300_000,
  });
}

/**
 * Performance stats for metrics page
 */
export function usePerformanceStats(proverId?: string) {
  return useQuery({
    queryKey: [...proverKeys.all, 'performanceStats', proverId],
    queryFn: async () => {
      const response = await fetchApi<{
        uptime: { value: number; change: number };
        signatures: { value: number; change: number };
        latency: { value: number; change: number };
        violations: { value: number };
      }>(`/v1/prover/${proverId}/performance`);

      return response;
    },
    enabled: !!proverId,
    staleTime: 60_000,
  });
}

/**
 * Signature history for metrics page - returns data compatible with ProverMetrics
 */
export function useSignatureHistory(proverId?: string, params?: { days?: number }) {
  return useQuery({
    queryKey: [...proverKeys.all, 'signatureHistory', proverId, params],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (params?.days) queryParams.set('days', params.days.toString());

      const endpoint = proverId
        ? `/v1/prover/${proverId}/signature-history${queryParams.toString() ? '?' + queryParams.toString() : ''}`
        : `/v1/prover/signature-history${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await fetchApi<{
        history: Array<{
          date: string;
          count: number;
          successRate: number;
          avgTime: number;
          reward: number;
        }>;
      }>(endpoint);

      return response.history;
    },
    staleTime: 300_000,
  });
}

/**
 * Detailed metrics for metrics page - returns array for ProverMetrics
 */
export function useDetailMetrics(proverId?: string) {
  return useQuery({
    queryKey: [...proverKeys.all, 'detailMetrics', proverId],
    queryFn: async () => {
      const endpoint = proverId ? `/v1/prover/${proverId}/metrics/detail` : '/v1/prover/metrics/detail';
      const response = await fetchApi<{
        metrics: Array<{
          key: string;
          value: number;
          status: string;
        }>;
      }>(endpoint);

      return response.metrics;
    },
    staleTime: 60_000,
  });
}

/**
 * Rewards summary for metrics page - returns data compatible with ProverMetrics
 */
export function useRewardsSummary(proverId?: string) {
  return useQuery({
    queryKey: [...proverKeys.all, 'rewardsSummary', proverId],
    queryFn: async () => {
      const endpoint = proverId ? `/v1/prover/${proverId}/rewards/summary` : '/v1/prover/rewards/summary';
      const response = await fetchApi<{
        total: number;
        period: number;
      }>(endpoint);

      return response;
    },
    staleTime: 60_000,
  });
}

/**
 * Payout history for metrics page - returns array for ProverMetrics
 */
export function usePayoutHistory(proverId?: string, params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: [...proverKeys.all, 'payoutHistory', proverId, params],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.set('page', params.page.toString());
      if (params?.limit) queryParams.set('limit', params.limit.toString());

      const endpoint = proverId
        ? `/v1/prover/${proverId}/payouts${queryParams.toString() ? '?' + queryParams.toString() : ''}`
        : `/v1/prover/payouts${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await fetchApi<{
        payouts: Array<{
          date: string;
          amount: number;
          address: string;
        }>;
      }>(endpoint);

      return response.payouts;
    },
    enabled: !!proverId,
    staleTime: 60_000,
  });
}

/**
 * Verify invitation code (for enterprise prover application)
 */
export function useVerifyInvitation() {
  return useMutation({
    mutationFn: async (code: string) => {
      return fetchApi<{
        valid: boolean;
        code: string;
        operatorName: string;
        plan: string;
        expiresAt: string;
        benefits: {
          managedInfrastructure: boolean;
          dedicatedSupport: boolean;
          slaGuarantee: string;
          minRevenue: string;
        };
      }>('/v1/prover/verify-invitation', {
        method: 'POST',
        body: JSON.stringify({ code }),
      });
    },
  });
}
