/**
 * Prover Portal Mock Data
 *
 * Provides mock data and types for Prover Portal components.
 * Used as fallback when API is unavailable.
 */

// ==================== TYPES ====================

export type ProverType = 'public' | 'enterprise';

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

export interface ProverRewards {
  claimable: number;
  pending: number;
  thisMonth: number;
  allTime: number;
}

export interface ProverStake {
  amount: number;
  usdValue: number;
  status: 'safe' | 'at_risk';
  challenges: number;
}

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

export interface PerformanceStats {
  uptime: { value: number; change: number; trend: 'up' | 'down' };
  signatures: { value: number; change: number; trend: 'up' | 'down' };
  latency: { value: number; change: number; trend: 'up' | 'down' };
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
  status: 'completed' | 'pending' | 'failed';
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

export type AlertType = 'critical' | 'warning' | 'info';

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
  status: 'pending' | 'in_review' | 'approved' | 'rejected';
  submittedAt: string;
  reviewStartedAt?: string;
  completedAt?: string;
  currentStep: number;
  totalSteps: number;
  notes?: string;
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

// ==================== MOCK DATA ====================

export const MOCK_PROVER_STATS: ProverStats = {
  pendingSignatures: 12,
  urgentCount: 4,
  todaysProcessed: 847,
  avgProcessed: 720,
  processedChange: 18,
  responseTime: 28.2,
  responseTimeChange: 2.1,
  slaMaxTime: 30,
  uptime: 99.97,
  slaMinUptime: 99.9,
};

export const MOCK_QUEUE_ITEMS: QueueItem[] = [
  {
    id: 'req-001',
    type: 'unlock',
    address: '0x7a3f...9c2d',
    route: 'L1→L3',
    amount: '5.25',
    time: '2m 34s',
    urgent: true,
  },
  {
    id: 'req-002',
    type: 'unlock',
    address: '0x8b2c...1e5a',
    route: 'L1→L3',
    amount: '12.00',
    time: '4m 12s',
    urgent: true,
  },
  {
    id: 'req-003',
    type: 'emergency',
    address: '0x3d9f...7c4b',
    route: 'Emergency',
    amount: '2.50',
    time: '8m 45s',
    urgent: true,
  },
];

export const MOCK_PROVER_REWARDS: ProverRewards = {
  claimable: 4.82,
  pending: 1.24,
  thisMonth: 12.45,
  allTime: 156.8,
};

export const MOCK_PROVER_STAKE: ProverStake = {
  amount: 150.0,
  usdValue: 412500,
  status: 'safe',
  challenges: 0,
};

export const MOCK_ENTERPRISE_CONTRACT: EnterpriseContract = {
  operatorName: 'ACME Corporation',
  contractId: 'ENT-2026-001234',
  plan: 'Enterprise Plus',
  startDate: '2025-06-01',
  endDate: '2026-05-31',
  sla: '99.99%',
  guaranteedRevenue: 24.0,
  supportLevel: '24/7 Premium',
  infrastructureManaged: true,
  contactPerson: '山田 太郎',
  contactEmail: 'yamada@acme.co.jp',
};

export const MOCK_PERFORMANCE_STATS: PerformanceStats = {
  uptime: { value: 99.97, change: 2.3, trend: 'up' },
  signatures: { value: 12847, change: 5.2, trend: 'up' },
  latency: { value: 124, change: -15, trend: 'down' },
  violations: { value: 0 },
};

export const MOCK_SIGNATURE_HISTORY: SignatureHistoryItem[] = [
  { date: '2026/01/17', count: 487, successRate: 100, avgTime: 118, reward: 2435 },
  { date: '2026/01/16', count: 523, successRate: 100, avgTime: 125, reward: 2615 },
  { date: '2026/01/15', count: 412, successRate: 99.8, avgTime: 132, reward: 2060 },
  { date: '2026/01/14', count: 389, successRate: 100, avgTime: 121, reward: 1945 },
  { date: '2026/01/13', count: 445, successRate: 100, avgTime: 128, reward: 2225 },
];

export const MOCK_DETAIL_METRICS: DetailMetric[] = [
  { key: 'sphincsSignature', value: 100, status: 'success' },
  { key: 'verificationRate', value: 99.9, status: 'success' },
  { key: 'slaCompliance', value: 100, status: 'gold' },
  { key: 'availability', value: 99.97, status: 'success' },
  { key: 'responseTime', value: 85, status: 'gold' },
];

export const MOCK_REWARDS_SUMMARY: RewardsSummary = {
  total: 47520,
  period: 90,
};

export const MOCK_PAYOUT_HISTORY: PayoutHistoryItem[] = [
  { date: '2026/03/01', type: 'withdrawal', amount: 15240, address: '0x742d...8bD34', status: 'completed' },
  { date: '2026/02/01', type: 'withdrawal', amount: 14890, address: '0x742d...8bD34', status: 'completed' },
  { date: '2026/01/01', type: 'withdrawal', amount: 13560, address: '0x742d...8bD34', status: 'completed' },
];

export const MOCK_PROVER_ALERTS: ProverAlert[] = [
  {
    id: 1,
    type: 'critical',
    title: 'signatureTimeout',
    timestamp: '2026/01/17 15:32',
    requestId: 'REQ-789012',
    description: 'signatureTimeoutDesc',
    remainingTime: 45,
    resolved: false,
  },
  {
    id: 2,
    type: 'warning',
    title: 'systemResource',
    timestamp: '2026/01/17 14:15',
    server: 'prover-node-01',
    description: 'systemResourceDesc',
    cpuUsage: 82,
    resolved: false,
  },
  {
    id: 3,
    type: 'info',
    title: 'maintenanceComplete',
    timestamp: '2026/01/16 03:00',
    description: 'maintenanceCompleteDesc',
    resolved: true,
  },
];

export const MOCK_STAKE_DATA: StakeData = {
  currentStake: 400000,
  unlockDate: '2026/09/20',
  daysRemaining: 183,
  totalRewards: 47520,
  annualRate: 15.8,
  totalSlashing: 0,
  violations30d: 0,
  slaRate: 100,
  potentialSlashing: 0,
  riskLevel: 5,
};

export const MOCK_PROVER_INVITATION: ProverInvitation = {
  code: 'ENT-INV-2026-ACME',
  operatorName: 'ACME Corporation',
  plan: 'Enterprise Plus',
  benefits: {
    managedInfra: true,
    dedicatedSupport: true,
    slaGuarantee: '99.99%',
    minRevenue: '24 ETH/mo',
  },
  expiresAt: '2026-02-28',
  contactPerson: '山田 太郎',
  contactEmail: 'yamada@acme.co.jp',
};

export const MOCK_APPLICATION_STATUS: ApplicationStatus = {
  id: 'PRV-2026-0001',
  status: 'in_review',
  submittedAt: '2026-01-15 10:30:00',
  reviewStartedAt: '2026-01-16 09:00:00',
  currentStep: 2,
  totalSteps: 4,
};

export const MOCK_REWARDS_BREAKDOWN: RewardBreakdownItem[] = [
  { key: 'signatureRewards', icon: 'PenTool', count: 12847, rate: 3.5, amount: 44964.5 },
  { key: 'performanceBonus', icon: 'Star', description: 'SLA 100%', amount: 2248.5 },
  { key: 'earlyAdopterBonus', icon: 'Trophy', description: 'Phase 1', amount: 307 },
];

export const MOCK_ENTERPRISE_REWARDS: EnterpriseRewards = {
  contract: {
    operatorName: 'ACME Corporation',
    plan: 'Enterprise Plus',
    contractPeriod: '2025-06-01 〜 2026-05-31',
  },
  guaranteedRevenue: {
    monthly: 24.0,
    received: 168.0,
    remaining: 120.0,
  },
  performanceBonus: {
    eligible: true,
    currentRate: 15,
    earnedThisMonth: 3.6,
    totalEarned: 25.2,
  },
  additionalIncentives: [
    { key: 'earlyAdopter', amount: 10.0, description: 'Phase 1参加ボーナス' },
    { key: 'perfectUptime', amount: 5.0, description: '3ヶ月連続100%稼働' },
    { key: 'referral', amount: 2.0, description: '新規Prover紹介' },
  ],
  totalEarned: 210.2,
};

// ==================== MOCK ENDPOINTS ====================

export const PROVER_MOCK_ENDPOINTS: Record<string, unknown> = {
  '/api/prover/stats': { stats: MOCK_PROVER_STATS },
  '/api/prover/queue': { items: MOCK_QUEUE_ITEMS, total: MOCK_QUEUE_ITEMS.length },
  '/api/prover/rewards': { rewards: MOCK_PROVER_REWARDS },
  '/api/prover/stake': { stake: MOCK_PROVER_STAKE },
  '/api/prover/enterprise/contract': { contract: MOCK_ENTERPRISE_CONTRACT },
  '/api/prover/performance': { stats: MOCK_PERFORMANCE_STATS },
  '/api/prover/signature-history': { history: MOCK_SIGNATURE_HISTORY },
  '/api/prover/detail-metrics': { metrics: MOCK_DETAIL_METRICS },
  '/api/prover/rewards-summary': { summary: MOCK_REWARDS_SUMMARY },
  '/api/prover/payout-history': { history: MOCK_PAYOUT_HISTORY },
  '/api/prover/alerts': { alerts: MOCK_PROVER_ALERTS },
  '/api/prover/stake-data': { data: MOCK_STAKE_DATA },
  '/api/prover/application-status': { status: MOCK_APPLICATION_STATUS },
};
