/**
 * Prover API Types
 *
 * Type definitions for Prover Portal API responses and data models.
 */

// ==================== BASIC TYPES ====================

export type ProverType = 'public' | 'enterprise';

export type AlertType = 'critical' | 'warning' | 'info';

export type ApplicationStatusType = 'pending' | 'in_review' | 'approved' | 'rejected';

export type PayoutStatusType = 'completed' | 'pending' | 'failed';

export type StakeStatusType = 'safe' | 'at_risk';

export type TrendDirection = 'up' | 'down';

// ==================== DASHBOARD TYPES ====================

export interface ProverStats {
  pendingSignatures: number;
  urgentCount: number;
  todaysProcessed: number;
  avgProcessed: number;
  processedChange: number;
  responseTime: number;
  responseTimeChange: number;
  slaMaxTime: number;
  uptime: number;
  slaMinUptime: number;
}

export interface QueueItem {
  id: string;
  type: 'unlock' | 'emergency';
  address: string;
  route: string;
  amount: string;
  time: string;
  urgent: boolean;
}

export interface QueueResponse {
  items: QueueItem[];
  total: number;
}

// ==================== REWARDS TYPES ====================

export interface ProverRewards {
  claimable: number;
  pending: number;
  thisMonth: number;
  allTime: number;
}

export interface RewardsSummary {
  total: number;
  period: number;
}

export interface RewardBreakdownItem {
  key: string;
  icon: string;
  count?: number;
  rate?: number;
  description?: string;
  amount: number;
}

export interface PayoutHistoryItem {
  date: string;
  type: 'withdrawal' | 'reward';
  amount: number;
  address: string;
  status: PayoutStatusType;
}

export interface EnterpriseRewards {
  contract: {
    operatorName: string;
    plan: string;
    contractPeriod: string;
  };
  guaranteedRevenue: {
    monthly: number;
    received: number;
    remaining: number;
  };
  performanceBonus: {
    eligible: boolean;
    currentRate: number;
    earnedThisMonth: number;
    totalEarned: number;
  };
  additionalIncentives: {
    key: string;
    amount: number;
    description: string;
  }[];
  totalEarned: number;
}

// ==================== STAKE TYPES ====================

export interface ProverStake {
  amount: number;
  usdValue: number;
  status: StakeStatusType;
  challenges: number;
}

export interface StakeData {
  currentStake: number;
  unlockDate: string;
  daysRemaining: number;
  totalRewards: number;
  annualRate: number;
  totalSlashing: number;
  violations30d: number;
  slaRate: number;
  potentialSlashing: number;
  riskLevel: number;
}

// ==================== PERFORMANCE TYPES ====================

export interface PerformanceMetric {
  value: number;
  change: number;
  trend: TrendDirection;
}

export interface PerformanceStats {
  uptime: PerformanceMetric;
  signatures: PerformanceMetric;
  latency: PerformanceMetric;
  violations: { value: number };
}

export interface SignatureHistoryItem {
  date: string;
  count: number;
  successRate: number;
  avgTime: number;
  reward: number;
}

export interface DetailMetric {
  key: string;
  value: number;
  status: 'success' | 'warning' | 'danger' | 'gold';
}

// ==================== ENTERPRISE TYPES ====================

export interface EnterpriseContract {
  operatorName: string;
  contractId: string;
  plan: string;
  startDate: string;
  endDate: string;
  sla: string;
  guaranteedRevenue: number;
  supportLevel: string;
  infrastructureManaged: boolean;
  contactPerson: string;
  contactEmail: string;
}

export interface ProverInvitation {
  code: string;
  operatorName: string;
  plan: string;
  benefits: {
    managedInfra: boolean;
    dedicatedSupport: boolean;
    slaGuarantee: string;
    minRevenue: string;
  };
  expiresAt: string;
  contactPerson: string;
  contactEmail: string;
}

// ==================== ALERT TYPES ====================

export interface ProverAlert {
  id: number;
  type: AlertType;
  title: string;
  timestamp: string;
  description: string;
  resolved: boolean;
  requestId?: string;
  remainingTime?: number;
  server?: string;
  cpuUsage?: number;
}

// ==================== APPLICATION TYPES ====================

export interface ApplicationFormData {
  organizationName: string;
  country: string;
  website: string;
  contactEmail: string;
  validatorExperience: string;
  hsmProvider: string;
  infrastructureLocation: string;
  hsmConfirmed: boolean;
  uptimeConfirmed: boolean;
  responseTimeConfirmed: boolean;
  multisigConfirmed: boolean;
  businessRegistrationNumber: string;
  documentUploaded: boolean;
  agreeTerms: boolean;
  agreeKyb: boolean;
  agreeStake: boolean;
  stakeAmount: string;
  walletConnected: boolean;
  stakeConfirmed: boolean;
}

export interface ApplicationStatus {
  id: string;
  status: ApplicationStatusType;
  submittedAt: string;
  reviewStartedAt?: string;
  completedAt?: string;
  currentStep: number;
  totalSteps: number;
  notes?: string;
}

// ==================== API RESPONSE TYPES ====================

export interface ProverDashboardResponse {
  stats: ProverStats;
  rewards: ProverRewards;
  stake: ProverStake;
}

export interface ProverSignRequest {
  requestId: string;
  signature: string;
}

export interface ProverSignResponse {
  success: boolean;
  txHash?: string;
}
