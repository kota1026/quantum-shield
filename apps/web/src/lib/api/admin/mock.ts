/**
 * QS Admin Mock Data
 *
 * Fallback data when API is unavailable during development
 */

import type {
  DashboardStats,
  ChartDataPoint,
  VolumeDataPoint,
  ActivityItem,
  AlertItem,
  ProverListItem,
  ObserverListItem,
  TreasuryOverview,
  TreasuryWallet,
  ProposalListItem,
  CouncilMember,
  SystemStatus,
  StaffMember,
  LockTransaction,
  UnlockTransaction,
  EmergencyUnlock,
  ChallengeTransaction,
} from './types';

// ============= Dashboard Mock Data =============

export const MOCK_DASHBOARD_STATS: DashboardStats = {
  totalUsers: 12847,
  totalLocked: '45,230 ETH',
  activeProvers: 24,
  activeObservers: 156,
  pendingUnlocks: 18,
  treasuryBalance: '125,000 ETH',
};

export const MOCK_TVL_DATA: ChartDataPoint[] = [
  { date: '01/21', value: 38500 },
  { date: '01/22', value: 39200 },
  { date: '01/23', value: 40100 },
  { date: '01/24', value: 41800 },
  { date: '01/25', value: 43200 },
  { date: '01/26', value: 44100 },
  { date: '01/27', value: 45230 },
];

export const MOCK_VOLUME_DATA: VolumeDataPoint[] = [
  { date: '01/21', locks: 45, unlocks: 32 },
  { date: '01/22', locks: 52, unlocks: 38 },
  { date: '01/23', locks: 48, unlocks: 42 },
  { date: '01/24', locks: 61, unlocks: 35 },
  { date: '01/25', locks: 55, unlocks: 48 },
  { date: '01/26', locks: 72, unlocks: 52 },
  { date: '01/27', locks: 68, unlocks: 58 },
];

export const MOCK_USER_GROWTH: ChartDataPoint[] = [
  { date: '01/21', value: 11800 },
  { date: '01/22', value: 12050 },
  { date: '01/23', value: 12280 },
  { date: '01/24', value: 12420 },
  { date: '01/25', value: 12580 },
  { date: '01/26', value: 12720 },
  { date: '01/27', value: 12847 },
];

export const MOCK_ACTIVITY: ActivityItem[] = [
  { id: '1', type: 'prover_request', message: 'New Prover application received', timestamp: '5 min ago' },
  { id: '2', type: 'unlock', message: 'Large unlock request (500 ETH)', timestamp: '12 min ago' },
  { id: '3', type: 'challenge', message: 'Challenge initiated on unlock #4521', timestamp: '25 min ago' },
  { id: '4', type: 'treasury', message: 'Treasury transfer approved', timestamp: '1 hour ago' },
];

export const MOCK_ALERTS: AlertItem[] = [
  { id: '1', level: 'warning', message: 'Prover node #12 response time degraded', timestamp: '10 min ago', acknowledged: false },
  { id: '2', level: 'info', message: 'System maintenance scheduled for tonight', timestamp: '2 hours ago', acknowledged: true },
];

// ============= Prover Mock Data =============

export const MOCK_PROVERS: ProverListItem[] = [
  {
    id: 'PV-001',
    name: 'Prover Alpha Corp',
    status: 'active',
    hsmConnected: true,
    stake: '100,000 QS',
    successRate: 99.8,
    responseTime: 45,
    operatorAddress: '0x1234...5678',
    tier: 'enterprise',
  },
  {
    id: 'PV-002',
    name: 'SecureSign Ltd',
    status: 'active',
    hsmConnected: true,
    stake: '75,000 QS',
    successRate: 99.5,
    responseTime: 52,
    operatorAddress: '0xabcd...ef01',
    tier: 'professional',
  },
  {
    id: 'PV-003',
    name: 'CryptoProof Inc',
    status: 'pending',
    hsmConnected: false,
    stake: '50,000 QS',
    successRate: 0,
    responseTime: 0,
    operatorAddress: '0x9876...5432',
    tier: 'standard',
  },
  {
    id: 'PV-004',
    name: 'QuantumVerify',
    status: 'suspended',
    hsmConnected: false,
    stake: '80,000 QS',
    successRate: 85.2,
    responseTime: 120,
    operatorAddress: '0xfedc...ba98',
    tier: 'professional',
  },
];

// Prover Stats
export interface ProverStats {
  totalProvers: number;
  activeProvers: number;
  totalStaked: string;
  avgUptime: string;
}

export const MOCK_PROVER_STATS: ProverStats = {
  totalProvers: 156,
  activeProvers: 142,
  totalStaked: '1,250,000 QS',
  avgUptime: '99.2%',
};

// Prover Request Stats
export interface ProverRequestStats {
  pendingRequests: number;
  approvedThisMonth: number;
  rejectedThisMonth: number;
  avgProcessTime: string;
}

export const MOCK_PROVER_REQUEST_STATS: ProverRequestStats = {
  pendingRequests: 8,
  approvedThisMonth: 12,
  rejectedThisMonth: 3,
  avgProcessTime: '2.5 days',
};

// Prover Request Detail (for application review)
export interface ProverRequestDetailData {
  id: string;
  applicant: string;
  wallet: string;
  stakeAmount: string;
  tier: string;
  submittedAt: string;
  status: string;
  infrastructure: string;
  contactEmail: string;
  website: string;
  hardwareSpecs: string;
  networkBandwidth: string;
  expectedUptime: string;
  documents: Array<{ name: string; type: string; size: string }>;
  reviewHistory: Array<{ action: string; timestamp: string; user: string }>;
}

export const MOCK_PROVER_REQUEST_DETAIL: ProverRequestDetailData = {
  id: 'PR-001',
  applicant: 'Prover Alpha Corp',
  wallet: '0x1234567890abcdef1234567890abcdef12345678',
  stakeAmount: '10,000 QS',
  tier: 'enterprise',
  submittedAt: '2024-01-27 10:00',
  status: 'pending',
  infrastructure: 'AWS Tokyo',
  contactEmail: 'admin@proveralpha.com',
  website: 'https://proveralpha.com',
  hardwareSpecs: '64 vCPU, 256GB RAM, 4TB NVMe SSD',
  networkBandwidth: '10 Gbps dedicated',
  expectedUptime: '99.99%',
  documents: [
    { name: 'Company Registration', type: 'pdf', size: '1.2 MB' },
    { name: 'Technical Whitepaper', type: 'pdf', size: '3.5 MB' },
    { name: 'Infrastructure Audit Report', type: 'pdf', size: '2.1 MB' },
    { name: 'Security Certification', type: 'pdf', size: '850 KB' },
    { name: 'Team Credentials', type: 'pdf', size: '1.8 MB' },
  ],
  reviewHistory: [
    { action: 'Application submitted', timestamp: '2024-01-27 10:00', user: 'Applicant' },
  ],
};

// ============= Observer Mock Data =============

export const MOCK_OBSERVERS: ObserverListItem[] = [
  {
    id: 'OB-001',
    walletAddress: '0x1111...2222',
    status: 'active',
    totalEarnings: '15.5 ETH',
    successfulChallenges: 42,
    failedChallenges: 3,
    registeredAt: Date.now() - 90 * 24 * 60 * 60 * 1000,
    inPracticeMode: false,
  },
  {
    id: 'OB-002',
    walletAddress: '0x3333...4444',
    status: 'practice',
    totalEarnings: '0 ETH',
    successfulChallenges: 5,
    failedChallenges: 1,
    registeredAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
    inPracticeMode: true,
  },
  {
    id: 'OB-003',
    walletAddress: '0x5555...6666',
    status: 'active',
    totalEarnings: '8.2 ETH',
    successfulChallenges: 28,
    failedChallenges: 5,
    registeredAt: Date.now() - 60 * 24 * 60 * 60 * 1000,
    inPracticeMode: false,
  },
];

// Observer Stats
export interface ObserverStats {
  totalObservers: number;
  activeObservers: number;
  totalChallenges: number;
  successRate: string;
}

export const MOCK_OBSERVER_STATS: ObserverStats = {
  totalObservers: 156,
  activeObservers: 142,
  totalChallenges: 1234,
  successRate: '94.2%',
};

// Observer Detail Data (extended for UI)
export interface ObserverDetailData {
  id: string;
  wallet: string;
  challenges: number;
  successRate: string;
  earnings: string;
  bond: string;
  lastChallenge: string;
  status: string;
  successfulChallenges: number;
  failedChallenges: number;
  registeredAt: string;
  avgResponseTime: string;
  recentChallenges: Array<{
    id: string;
    type: string;
    target: string;
    result: string;
    timestamp: string;
    reward: string;
  }>;
}

export const MOCK_OBSERVER_DETAIL: ObserverDetailData = {
  id: 'OB-001',
  wallet: '0x1234567890abcdef1234567890abcdef12345678',
  challenges: 125,
  successRate: '98.4%',
  earnings: '2,450 QS',
  bond: '500 QS',
  lastChallenge: '2024-01-27 14:30',
  status: 'active',
  successfulChallenges: 123,
  failedChallenges: 2,
  registeredAt: '2023-06-15 10:00',
  avgResponseTime: '1.2s',
  recentChallenges: [
    { id: 'CH-125', type: 'unlock', target: 'UL-789', result: 'success', timestamp: '2024-01-27 14:30', reward: '20 QS' },
    { id: 'CH-124', type: 'unlock', target: 'UL-788', result: 'success', timestamp: '2024-01-27 12:15', reward: '20 QS' },
    { id: 'CH-123', type: 'unlock', target: 'UL-787', result: 'failed', timestamp: '2024-01-27 09:00', reward: '0 QS' },
    { id: 'CH-122', type: 'unlock', target: 'UL-786', result: 'success', timestamp: '2024-01-26 16:45', reward: '20 QS' },
    { id: 'CH-121', type: 'unlock', target: 'UL-785', result: 'success', timestamp: '2024-01-26 11:30', reward: '20 QS' },
  ],
};

// ============= Treasury Mock Data =============

export const MOCK_TREASURY_OVERVIEW: TreasuryOverview = {
  totalBalance: '125,000 ETH',
  walletCount: 5,
  pendingTransfers: 2,
  todayRevenue: '12.5 ETH',
  monthlyRevenue: '450 ETH',
};

export const MOCK_TREASURY_WALLETS: TreasuryWallet[] = [
  {
    id: 'TW-001',
    name: 'Operational Wallet',
    walletType: 'operational',
    address: '0xOper...ational',
    balance: '25,000 ETH',
    currency: 'ETH',
    multisigThreshold: 2,
    signers: ['0xSigner1', '0xSigner2', '0xSigner3'],
  },
  {
    id: 'TW-002',
    name: 'Reserve Fund',
    walletType: 'reserve',
    address: '0xReser...veFund',
    balance: '80,000 ETH',
    currency: 'ETH',
    multisigThreshold: 3,
    signers: ['0xSigner1', '0xSigner2', '0xSigner3', '0xSigner4', '0xSigner5'],
  },
  {
    id: 'TW-003',
    name: 'Rewards Pool',
    walletType: 'rewards',
    address: '0xRewar...dsPool',
    balance: '15,000 ETH',
    currency: 'ETH',
    multisigThreshold: 2,
    signers: ['0xSigner1', '0xSigner2', '0xSigner3'],
  },
];

// Extended Treasury Wallets for WalletsList component
export interface TreasuryWalletExtended {
  id: string;
  name: string;
  address: string;
  balance: string;
  usdValue: string;
  signers: number;
  threshold: number;
  status: string;
  lastActivity: string;
  signerList: string[];
}

export const MOCK_TREASURY_WALLETS_EXTENDED: TreasuryWalletExtended[] = [
  { id: 'main', name: 'main', address: '0xMAIN...1234', balance: '75,000 ETH', usdValue: '$187,500,000', signers: 5, threshold: 3, status: 'active', lastActivity: '2024-01-27 14:30', signerList: ['admin@qs.foundation', 'treasury@qs.foundation', 'cfo@qs.foundation', 'security@qs.foundation', 'ops@qs.foundation'] },
  { id: 'operational', name: 'operational', address: '0xOPER...5678', balance: '25,000 ETH', usdValue: '$62,500,000', signers: 3, threshold: 2, status: 'active', lastActivity: '2024-01-27 13:15', signerList: ['treasury@qs.foundation', 'ops@qs.foundation', 'finance@qs.foundation'] },
  { id: 'grants', name: 'grants', address: '0xGRNT...9012', balance: '15,000 ETH', usdValue: '$37,500,000', signers: 5, threshold: 3, status: 'active', lastActivity: '2024-01-26 10:00', signerList: ['grants@qs.foundation', 'admin@qs.foundation', 'community@qs.foundation', 'legal@qs.foundation', 'treasury@qs.foundation'] },
  { id: 'insurance', name: 'insurance', address: '0xINSR...3456', balance: '8,000 ETH', usdValue: '$20,000,000', signers: 7, threshold: 5, status: 'active', lastActivity: '2024-01-25 16:45', signerList: ['insurance@qs.foundation', 'admin@qs.foundation', 'security@qs.foundation', 'legal@qs.foundation', 'cfo@qs.foundation', 'audit@qs.foundation', 'treasury@qs.foundation'] },
  { id: 'emergency', name: 'emergency', address: '0xEMRG...7890', balance: '2,000 ETH', usdValue: '$5,000,000', signers: 3, threshold: 2, status: 'active', lastActivity: '2024-01-24 09:20', signerList: ['admin@qs.foundation', 'security@qs.foundation', 'treasury@qs.foundation'] },
];

// Treasury Wallets Stats
export interface TreasuryWalletStats {
  totalBalance: string;
  totalBalanceUsd: string;
  activeWallets: number;
  totalSigners: number;
  avgThresholdPercent: number;
}

export const MOCK_TREASURY_WALLET_STATS: TreasuryWalletStats = {
  totalBalance: '125,000 ETH',
  totalBalanceUsd: '$312,500,000',
  activeWallets: 5,
  totalSigners: 23,
  avgThresholdPercent: 63,
};

// Transfer Stats
export interface TransferStats {
  pendingApprovals: number;
  transfersThisMonth: number;
  totalVolume: string;
  avgTransferSize: string;
}

export const MOCK_TRANSFER_STATS: TransferStats = {
  pendingApprovals: 2,
  transfersThisMonth: 15,
  totalVolume: '12,500 ETH',
  avgTransferSize: '833 ETH',
};

// Treasury Transfers
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

export const MOCK_TREASURY_TRANSFERS: TreasuryTransfer[] = [
  { id: 'TXF-001', from: 'operational', to: 'grants', amount: '500 ETH', initiator: 'admin@qs.foundation', approvals: 1, required: 2, status: 'pending', timestamp: '2024-01-27 14:30', purpose: 'Q1 Grant Distribution' },
  { id: 'TXF-002', from: 'main', to: '0x1234...5678', amount: '1,000 ETH', initiator: 'treasury@qs.foundation', approvals: 2, required: 3, status: 'pending', timestamp: '2024-01-27 13:15', purpose: 'Ecosystem Investment' },
  { id: 'TXF-003', from: 'main', to: 'operational', amount: '5,000 ETH', initiator: 'cfo@qs.foundation', approvals: 3, required: 3, status: 'completed', timestamp: '2024-01-26 10:30', purpose: 'Monthly Operations Budget' },
  { id: 'TXF-004', from: 'operational', to: '0x2345...6789', amount: '200 ETH', initiator: 'ops@qs.foundation', approvals: 2, required: 2, status: 'completed', timestamp: '2024-01-25 16:45', purpose: 'Vendor Payment' },
  { id: 'TXF-005', from: 'grants', to: '0x3456...7890', amount: '100 ETH', initiator: 'grants@qs.foundation', approvals: 3, required: 3, status: 'completed', timestamp: '2024-01-24 09:20', purpose: 'Developer Grant' },
  { id: 'TXF-006', from: 'emergency', to: 'operational', amount: '50 ETH', initiator: 'security@qs.foundation', approvals: 1, required: 2, status: 'rejected', timestamp: '2024-01-23 11:00', purpose: 'Security Audit' },
];

// Budget Data
export interface BudgetData {
  totalBudget: string;
  allocated: string;
  spent: string;
  remaining: string;
  period: string;
}

export const MOCK_BUDGET_DATA: BudgetData = {
  totalBudget: '50,000 ETH',
  allocated: '42,500 ETH',
  spent: '28,750 ETH',
  remaining: '21,250 ETH',
  period: 'Q1 2024',
};

export interface BudgetCategory {
  name: string;
  allocated: number;
  spent: number;
  color: string;
}

export const MOCK_BUDGET_CATEGORIES: BudgetCategory[] = [
  { name: 'Operations', allocated: 15000, spent: 12500, color: 'bg-hinomaru' },
  { name: 'Development', allocated: 10000, spent: 6200, color: 'bg-info' },
  { name: 'Marketing', allocated: 5000, spent: 3800, color: 'bg-success' },
  { name: 'Grants', allocated: 8000, spent: 4500, color: 'bg-warning' },
  { name: 'Security', allocated: 3000, spent: 1500, color: 'bg-danger' },
  { name: 'Legal', allocated: 1500, spent: 250, color: 'bg-foreground-tertiary' },
];

export interface MonthlyBudget {
  month: string;
  budget: number;
  spent: number;
}

export const MOCK_MONTHLY_BUDGET: MonthlyBudget[] = [
  { month: 'January', budget: 16000, spent: 14200 },
  { month: 'February', budget: 16000, spent: 10500 },
  { month: 'March', budget: 18000, spent: 4050 },
];

// Audit Log Stats
export interface AuditLogStats {
  totalLogs: number;
  logsThisWeek: number;
  criticalEvents: number;
  pendingReviews: number;
}

export const MOCK_AUDIT_LOG_STATS: AuditLogStats = {
  totalLogs: 1234,
  logsThisWeek: 89,
  criticalEvents: 2,
  pendingReviews: 5,
};

// Audit Log Entries
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

export const MOCK_AUDIT_LOGS: AuditLogEntry[] = [
  { id: 'AUD-001', action: 'transfer_initiated', actor: 'admin@qs.foundation', target: 'TXF-001', details: 'Initiated transfer of 500 ETH from operational to grants', severity: 'info', timestamp: '2024-01-27 14:30:00', ip: '192.168.1.100' },
  { id: 'AUD-002', action: 'transfer_approved', actor: 'treasury@qs.foundation', target: 'TXF-002', details: 'Approved transfer of 1,000 ETH to external wallet', severity: 'info', timestamp: '2024-01-27 13:15:00', ip: '192.168.1.101' },
  { id: 'AUD-003', action: 'signer_added', actor: 'admin@qs.foundation', target: 'main', details: 'Added new signer security@qs.foundation to main wallet', severity: 'warning', timestamp: '2024-01-27 10:00:00', ip: '192.168.1.100' },
  { id: 'AUD-004', action: 'threshold_changed', actor: 'cfo@qs.foundation', target: 'operational', details: 'Changed threshold from 2 to 3 signatures', severity: 'critical', timestamp: '2024-01-26 16:45:00', ip: '192.168.1.102' },
  { id: 'AUD-005', action: 'transfer_rejected', actor: 'admin@qs.foundation', target: 'TXF-006', details: 'Rejected transfer from emergency wallet - insufficient justification', severity: 'warning', timestamp: '2024-01-26 12:30:00', ip: '192.168.1.100' },
  { id: 'AUD-006', action: 'budget_updated', actor: 'cfo@qs.foundation', target: 'Q1-2024', details: 'Updated Q1 2024 budget allocation', severity: 'info', timestamp: '2024-01-25 09:00:00', ip: '192.168.1.102' },
  { id: 'AUD-007', action: 'login_failed', actor: 'unknown@qs.foundation', target: '-', details: 'Failed login attempt - invalid credentials', severity: 'critical', timestamp: '2024-01-24 23:45:00', ip: '203.0.113.50' },
  { id: 'AUD-008', action: 'wallet_created', actor: 'admin@qs.foundation', target: 'emergency', details: 'Created new emergency response wallet', severity: 'info', timestamp: '2024-01-24 10:00:00', ip: '192.168.1.100' },
];

// ============= Governance Mock Data =============

export const MOCK_PROPOSALS: ProposalListItem[] = [
  {
    id: 'PROP-001',
    title: 'Increase Prover Stake Requirement',
    proposer: '0xProposer1',
    status: 'active',
    votesFor: '1,250,000 QS',
    votesAgainst: '450,000 QS',
    votesAbstain: '100,000 QS',
    quorum: '2,000,000 QS',
    startTime: Date.now() - 3 * 24 * 60 * 60 * 1000,
    endTime: Date.now() + 4 * 24 * 60 * 60 * 1000,
    createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'PROP-002',
    title: 'Add New Emergency Unlock Fee Tier',
    proposer: '0xProposer2',
    status: 'passed',
    votesFor: '2,100,000 QS',
    votesAgainst: '300,000 QS',
    votesAbstain: '50,000 QS',
    quorum: '2,000,000 QS',
    createdAt: Date.now() - 14 * 24 * 60 * 60 * 1000,
  },
];

// Extended Governance types and mock data for component integration
export interface GovernanceStats {
  activeProposals: number;
  totalVotes: number;
  participation: string;
  passedProposals: number;
}

export const MOCK_GOVERNANCE_STATS: GovernanceStats = {
  activeProposals: 3,
  totalVotes: 45230,
  participation: '72.5%',
  passedProposals: 28,
};

export interface GovernanceProposal {
  id: string;
  title: string;
  proposer: string;
  status: 'active' | 'passed' | 'rejected' | 'pending' | 'executed';
  votes: number;
  forVotes: number;
  againstVotes: number;
  turnout: string;
  startDate: string;
  endDate: string;
}

export const MOCK_GOVERNANCE_PROPOSALS: GovernanceProposal[] = [
  { id: 'QIP-042', title: 'Increase Prover Rewards by 15%', proposer: '0x1234...5678', status: 'active', votes: 12500, forVotes: 9800, againstVotes: 2700, turnout: '68.5%', startDate: '2024-01-20', endDate: '2024-02-01' },
  { id: 'QIP-041', title: 'Add New Supported Token: WBTC', proposer: '0x2345...6789', status: 'active', votes: 8900, forVotes: 7200, againstVotes: 1700, turnout: '52.3%', startDate: '2024-01-18', endDate: '2024-01-30' },
  { id: 'QIP-040', title: 'Reduce Emergency Unlock Time to 12h', proposer: '0x3456...7890', status: 'passed', votes: 15600, forVotes: 14200, againstVotes: 1400, turnout: '85.2%', startDate: '2024-01-05', endDate: '2024-01-20' },
  { id: 'QIP-039', title: 'Increase Observer Challenge Reward', proposer: '0x4567...8901', status: 'passed', votes: 11200, forVotes: 9500, againstVotes: 1700, turnout: '71.8%', startDate: '2024-01-01', endDate: '2024-01-15' },
  { id: 'QIP-038', title: 'Change Voting Period to 14 Days', proposer: '0x5678...9012', status: 'rejected', votes: 9800, forVotes: 3900, againstVotes: 5900, turnout: '62.4%', startDate: '2023-12-25', endDate: '2024-01-10' },
  { id: 'QIP-037', title: 'Treasury Reserve Policy Update', proposer: '0x6789...0123', status: 'executed', votes: 18200, forVotes: 16500, againstVotes: 1700, turnout: '92.1%', startDate: '2023-12-15', endDate: '2024-01-01' },
];

export interface RecentVote {
  voter: string;
  vote: 'for' | 'against';
  amount: string;
  timestamp: string;
}

export interface ProposalDetail extends GovernanceProposal {
  description: string;
  category: string;
  quorum: number;
  requiredVotes: number;
  daysRemaining: number;
  recentVotes: RecentVote[];
}

export const MOCK_PROPOSAL_DETAIL: ProposalDetail = {
  id: 'QIP-042',
  title: 'Increase Prover Rewards by 15%',
  proposer: '0x1234567890abcdef1234567890abcdef12345678',
  status: 'active',
  votes: 12500,
  forVotes: 9800,
  againstVotes: 2700,
  turnout: '68.5%',
  startDate: '2024-01-20',
  endDate: '2024-02-01',
  description: 'This proposal aims to increase the rewards distributed to provers by 15% to incentivize more node operators to join the network and improve overall security and decentralization.',
  category: 'Economics',
  quorum: 10000,
  requiredVotes: 15000,
  daysRemaining: 5,
  recentVotes: [
    { voter: '0xabcd...1234', vote: 'for', amount: '1,500 veQS', timestamp: '2024-01-27 14:30' },
    { voter: '0xbcde...2345', vote: 'for', amount: '2,200 veQS', timestamp: '2024-01-27 12:15' },
    { voter: '0xcdef...3456', vote: 'against', amount: '800 veQS', timestamp: '2024-01-27 09:00' },
    { voter: '0xdef0...4567', vote: 'for', amount: '1,100 veQS', timestamp: '2024-01-26 16:45' },
    { voter: '0xef01...5678', vote: 'for', amount: '950 veQS', timestamp: '2024-01-26 11:30' },
  ],
};

export interface VotingStats {
  activeVotes: number;
  totalVoters: number;
  avgTurnout: string;
  endingSoon: number;
}

export const MOCK_VOTING_STATS: VotingStats = {
  activeVotes: 2,
  totalVoters: 8450,
  avgTurnout: '72.5%',
  endingSoon: 1,
};

export interface ActiveVote {
  id: string;
  title: string;
  forVotes: number;
  againstVotes: number;
  totalVoters: number;
  turnout: string;
  endDate: string;
  daysLeft: number;
}

export const MOCK_ACTIVE_VOTES: ActiveVote[] = [
  { id: 'QIP-042', title: 'Increase Prover Rewards by 15%', forVotes: 9800, againstVotes: 2700, totalVoters: 8450, turnout: '68.5%', endDate: '2024-02-01', daysLeft: 4 },
  { id: 'QIP-041', title: 'Add New Supported Token: WBTC', forVotes: 7200, againstVotes: 1700, totalVoters: 8450, turnout: '52.3%', endDate: '2024-01-30', daysLeft: 2 },
];

export const MOCK_COUNCIL: CouncilMember[] = [
  {
    id: 'CM-001',
    walletAddress: '0xCouncil1',
    name: 'Alice',
    role: 'Chair',
    votingPower: '500,000 QS',
    status: 'active',
    joinedAt: Date.now() - 365 * 24 * 60 * 60 * 1000,
    lastActive: Date.now() - 1 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'CM-002',
    walletAddress: '0xCouncil2',
    name: 'Bob',
    role: 'Member',
    votingPower: '300,000 QS',
    status: 'active',
    joinedAt: Date.now() - 200 * 24 * 60 * 60 * 1000,
    lastActive: Date.now() - 2 * 24 * 60 * 60 * 1000,
  },
];

// ============= System Mock Data =============

export const MOCK_SYSTEM_STATUS: SystemStatus = {
  status: 'active',
  components: [
    { name: 'L3 Aegis Network', status: 'online', lastCheck: Date.now() - 60000 },
    { name: 'L1 Ethereum', status: 'online', lastCheck: Date.now() - 60000 },
    { name: 'Prover Network', status: 'online', lastCheck: Date.now() - 60000 },
    { name: 'Observer Network', status: 'online', lastCheck: Date.now() - 60000 },
    { name: 'API Gateway', status: 'online', lastCheck: Date.now() - 60000 },
  ],
};

// ============= Members Mock Data =============

export const MOCK_STAFF: StaffMember[] = [
  {
    id: 'STAFF-001',
    walletAddress: '0xAdmin1',
    email: 'admin@qsfoundation.io',
    name: 'Admin User',
    role: 'super_admin',
    status: 'active',
    permissions: ['*'],
    createdAt: Date.now() - 365 * 24 * 60 * 60 * 1000,
    lastLogin: Date.now() - 3600000,
  },
  {
    id: 'STAFF-002',
    walletAddress: '0xOp1',
    email: 'operator@qsfoundation.io',
    name: 'Operator User',
    role: 'operator',
    status: 'active',
    permissions: ['provers:read', 'provers:approve', 'observers:read'],
    createdAt: Date.now() - 180 * 24 * 60 * 60 * 1000,
    lastLogin: Date.now() - 7200000,
  },
];

// ============= Transaction Mock Data =============

export interface TransactionStats {
  totalTransactions: number;
  lockVolume: string;
  unlockVolume: string;
  pendingUnlocks: number;
  emergencyUnlocks: number;
  activeChallenges: number;
}

export const MOCK_TRANSACTION_STATS: TransactionStats = {
  totalTransactions: 45230,
  lockVolume: '125,000 ETH',
  unlockVolume: '45,230 ETH',
  pendingUnlocks: 18,
  emergencyUnlocks: 3,
  activeChallenges: 5,
};

export interface LockStats {
  totalLocks: number;
  lockVolume: string;
  avgLockAmount: string;
  avgLockDuration: string;
}

export const MOCK_LOCK_STATS: LockStats = {
  totalLocks: 12450,
  lockVolume: '125,000 ETH',
  avgLockAmount: '10.04 ETH',
  avgLockDuration: '45 days',
};

export interface UnlockStats {
  totalUnlocks: number;
  unlockVolume: string;
  pendingUnlocks: number;
  avgWaitTime: string;
}

export const MOCK_UNLOCK_STATS: UnlockStats = {
  totalUnlocks: 8920,
  unlockVolume: '45,230 ETH',
  pendingUnlocks: 18,
  avgWaitTime: '23.5 hours',
};

export interface EmergencyStats {
  totalEmergency: number;
  activeEmergency: number;
  approvedRate: string;
  avgProcessTime: string;
}

export const MOCK_EMERGENCY_STATS: EmergencyStats = {
  totalEmergency: 156,
  activeEmergency: 3,
  approvedRate: '92.3%',
  avgProcessTime: '4.2 hours',
};

export interface ChallengeStats {
  totalChallenges: number;
  activeChallenges: number;
  successRate: string;
  totalSlashed: string;
}

export const MOCK_CHALLENGE_STATS: ChallengeStats = {
  totalChallenges: 342,
  activeChallenges: 5,
  successRate: '87.4%',
  totalSlashed: '125.5 QS',
};

export const MOCK_LOCK_TRANSACTIONS: LockTransaction[] = [
  {
    id: 'LK-001234',
    userAddress: '0x1234...5678',
    amount: '10.5 ETH',
    currency: 'ETH',
    status: 'active',
    l1TxHash: '0xabc123...',
    l3TxHash: '0xdef456...',
    createdAt: Date.now() - 3600000,
    confirmedAt: Date.now() - 3500000,
  },
  {
    id: 'LK-001235',
    userAddress: '0x2345...6789',
    amount: '25.0 ETH',
    currency: 'ETH',
    status: 'confirmed',
    l1TxHash: '0x123abc...',
    createdAt: Date.now() - 7200000,
    confirmedAt: Date.now() - 7100000,
  },
  {
    id: 'LK-001236',
    userAddress: '0x3456...7890',
    amount: '100.0 ETH',
    currency: 'ETH',
    status: 'pending',
    createdAt: Date.now() - 1800000,
  },
  {
    id: 'LK-001237',
    userAddress: '0x4567...8901',
    amount: '50.0 ETH',
    currency: 'ETH',
    status: 'active',
    l1TxHash: '0x456def...',
    l3TxHash: '0x789ghi...',
    createdAt: Date.now() - 86400000,
    confirmedAt: Date.now() - 86300000,
  },
  {
    id: 'LK-001238',
    userAddress: '0x5678...9012',
    amount: '5.0 ETH',
    currency: 'ETH',
    status: 'active',
    l1TxHash: '0x789jkl...',
    l3TxHash: '0xabc012...',
    createdAt: Date.now() - 172800000,
    confirmedAt: Date.now() - 172700000,
  },
];

export const MOCK_UNLOCK_TRANSACTIONS: UnlockTransaction[] = [
  {
    id: 'UL-001001',
    lockId: 'LK-001234',
    userAddress: '0x1234...5678',
    amount: '5.0 ETH',
    currency: 'ETH',
    status: 'pending',
    timelockEnd: Date.now() + 86400000,
    challengeWindow: Date.now() + 172800000,
    createdAt: Date.now() - 3600000,
  },
  {
    id: 'UL-001002',
    lockId: 'LK-001237',
    userAddress: '0x4567...8901',
    amount: '25.0 ETH',
    currency: 'ETH',
    status: 'waiting',
    timelockEnd: Date.now() + 43200000,
    challengeWindow: Date.now() + 86400000,
    createdAt: Date.now() - 7200000,
  },
  {
    id: 'UL-001003',
    lockId: 'LK-001238',
    userAddress: '0x5678...9012',
    amount: '5.0 ETH',
    currency: 'ETH',
    status: 'completed',
    l1TxHash: '0xcomp123...',
    createdAt: Date.now() - 259200000,
    completedAt: Date.now() - 86400000,
  },
];

export const MOCK_EMERGENCY_UNLOCKS: EmergencyUnlock[] = [
  {
    id: 'EM-001001',
    lockId: 'LK-001236',
    userAddress: '0x3456...7890',
    amount: '100.0 ETH',
    currency: 'ETH',
    status: 'pending',
    reason: 'Critical security incident',
    emergencyFee: '1.0 ETH',
    createdAt: Date.now() - 1800000,
  },
  {
    id: 'EM-001002',
    lockId: 'LK-001235',
    userAddress: '0x2345...6789',
    amount: '10.0 ETH',
    currency: 'ETH',
    status: 'completed',
    reason: 'Wallet compromise detected',
    approvedBy: '0xAdmin1',
    emergencyFee: '0.1 ETH',
    l1TxHash: '0xemerg123...',
    createdAt: Date.now() - 172800000,
    completedAt: Date.now() - 86400000,
  },
];

export const MOCK_CHALLENGES: ChallengeTransaction[] = [
  {
    id: 'CH-001001',
    unlockId: 'UL-001001',
    challengerAddress: '0xObs001...',
    reason: 'Suspicious unlock pattern detected',
    status: 'pending',
    evidence: 'Transaction analysis report #123',
    createdAt: Date.now() - 3600000,
  },
  {
    id: 'CH-001002',
    unlockId: 'UL-001002',
    challengerAddress: '0xObs002...',
    reason: 'Possible replay attack',
    status: 'investigating',
    evidence: 'L3 signature verification failed',
    createdAt: Date.now() - 7200000,
  },
  {
    id: 'CH-001003',
    unlockId: 'UL-001003',
    challengerAddress: '0xObs001...',
    reason: 'Timing anomaly',
    status: 'resolved',
    evidence: 'Manual verification complete',
    resolution: 'False positive - legitimate unlock',
    reward: '0.01 ETH',
    createdAt: Date.now() - 259200000,
    resolvedAt: Date.now() - 172800000,
  },
];

// Combined transaction list for overview
export const MOCK_ALL_TRANSACTIONS = [
  ...MOCK_LOCK_TRANSACTIONS.map(tx => ({ ...tx, type: 'lock' as const })),
  ...MOCK_UNLOCK_TRANSACTIONS.map(tx => ({ ...tx, type: 'unlock' as const })),
  ...MOCK_EMERGENCY_UNLOCKS.map(tx => ({ ...tx, type: 'emergency' as const })),
  ...MOCK_CHALLENGES.map(tx => ({ ...tx, type: 'challenge' as const })),
].sort((a, b) => b.createdAt - a.createdAt);

// ============= Users Mock Data =============

export interface UsersStats {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  lockedVolume: string;
}

export const MOCK_USERS_STATS: UsersStats = {
  totalUsers: 12847,
  activeUsers: 8234,
  newUsers: 1256,
  lockedVolume: '45,230 ETH',
};

export interface User {
  id: string;
  wallet: string;
  email?: string | null;
  joined: string;
  lastActive: string;
  locked: string;
  unlocked?: string;
  transactions?: number;
  status: 'active' | 'inactive' | 'suspended';
}

export const MOCK_USERS: User[] = [
  { id: '1', wallet: '0x1234...5678', email: 'user1@example.com', joined: '2024-01-15', lastActive: '2024-01-27 14:30', locked: '125.5 ETH', unlocked: '50.0 ETH', transactions: 45, status: 'active' },
  { id: '2', wallet: '0x2345...6789', email: 'user2@example.com', joined: '2024-01-10', lastActive: '2024-01-27 12:15', locked: '50.0 ETH', unlocked: '20.0 ETH', transactions: 23, status: 'active' },
  { id: '3', wallet: '0x3456...7890', email: 'user3@example.com', joined: '2024-01-05', lastActive: '2024-01-20 09:00', locked: '0 ETH', unlocked: '100.0 ETH', transactions: 12, status: 'inactive' },
  { id: '4', wallet: '0x4567...8901', email: 'user4@example.com', joined: '2023-12-20', lastActive: '2024-01-26 16:45', locked: '500.0 ETH', unlocked: '0 ETH', transactions: 89, status: 'active' },
  { id: '5', wallet: '0x5678...9012', email: 'user5@example.com', joined: '2023-11-15', lastActive: '2024-01-15 08:30', locked: '25.0 ETH', unlocked: '75.0 ETH', transactions: 34, status: 'suspended' },
  { id: '6', wallet: '0x6789...0123', email: 'user6@example.com', joined: '2023-10-01', lastActive: '2024-01-27 10:00', locked: '200.0 ETH', unlocked: '30.0 ETH', transactions: 67, status: 'active' },
  { id: '7', wallet: '0x7890...1234', email: 'user7@example.com', joined: '2023-09-15', lastActive: '2024-01-25 16:20', locked: '75.0 ETH', unlocked: '25.0 ETH', transactions: 28, status: 'active' },
  { id: '8', wallet: '0x8901...2345', email: null, joined: '2024-01-20', lastActive: '2024-01-27 08:45', locked: '10.0 ETH', unlocked: '5.0 ETH', transactions: 5, status: 'active' },
];

export interface UserTransaction {
  id: string;
  type: 'lock' | 'unlock';
  amount: string;
  timestamp: string;
  status: string;
  txHash?: string | null; // L1 transaction hash for Etherscan link
}

export const MOCK_USER_TRANSACTIONS: UserTransaction[] = [
  { id: 'LK-001234', type: 'lock', amount: '10.5 ETH', timestamp: '2024-01-27 14:30', status: 'completed' },
  { id: 'UL-001235', type: 'unlock', amount: '5.0 ETH', timestamp: '2024-01-25 10:00', status: 'completed' },
  { id: 'LK-001236', type: 'lock', amount: '50.0 ETH', timestamp: '2024-01-20 08:00', status: 'completed' },
  { id: 'LK-001237', type: 'lock', amount: '25.0 ETH', timestamp: '2024-01-15 16:00', status: 'completed' },
  { id: 'UL-001238', type: 'unlock', amount: '15.0 ETH', timestamp: '2024-01-10 12:00', status: 'completed' },
  { id: 'LK-001239', type: 'lock', amount: '8.0 ETH', timestamp: '2024-01-05 09:30', status: 'completed' },
  { id: 'LK-001240', type: 'lock', amount: '12.0 ETH', timestamp: '2023-12-28 11:00', status: 'completed' },
  { id: 'UL-001241', type: 'unlock', amount: '20.0 ETH', timestamp: '2023-12-20 15:45', status: 'completed' },
  { id: 'LK-001242', type: 'lock', amount: '35.0 ETH', timestamp: '2023-12-15 08:00', status: 'completed' },
  { id: 'UL-001243', type: 'unlock', amount: '10.0 ETH', timestamp: '2023-12-10 14:30', status: 'completed' },
];

export interface UserDetail {
  id: string;
  wallet: string;
  email?: string | null;
  joined: string;
  lastActive: string;
  locked: string;
  unlocked: string;
  totalValue: string;
  transactions: number;
  status: 'active' | 'inactive' | 'suspended';
}

export const MOCK_USER_DETAIL: UserDetail = {
  id: '1',
  wallet: '0x1234567890abcdef1234567890abcdef12345678',
  email: 'user1@example.com',
  joined: '2024-01-15',
  lastActive: '2024-01-27 14:30',
  locked: '125.5 ETH',
  unlocked: '50.0 ETH',
  totalValue: '175.5 ETH',
  transactions: 45,
  status: 'active',
};

export interface WalletsStats {
  totalWallets: number;
  walletsWithLocks: number;
  totalLocked: string;
  avgLockAmount: string;
}

export const MOCK_WALLETS_STATS: WalletsStats = {
  totalWallets: 12847,
  walletsWithLocks: 8234,
  totalLocked: '45,230 ETH',
  avgLockAmount: '5.5 ETH',
};

export interface UserWallet {
  address: string;
  shortAddress: string;
  locked: string;
  unlocking: string;
  pendingUnlocks: number;
  lastTx: string;
  totalTx: number;
}

export const MOCK_USER_WALLETS: UserWallet[] = [
  { address: '0x1234567890abcdef1234567890abcdef12345678', shortAddress: '0x1234...5678', locked: '125.5 ETH', unlocking: '0 ETH', pendingUnlocks: 0, lastTx: '2024-01-27 14:30', totalTx: 45 },
  { address: '0x2345678901bcdef12345678901bcdef123456789', shortAddress: '0x2345...6789', locked: '50.0 ETH', unlocking: '10.0 ETH', pendingUnlocks: 1, lastTx: '2024-01-27 12:15', totalTx: 23 },
  { address: '0x3456789012cdef123456789012cdef1234567890', shortAddress: '0x3456...7890', locked: '0 ETH', unlocking: '0 ETH', pendingUnlocks: 0, lastTx: '2024-01-20 09:00', totalTx: 12 },
  { address: '0x4567890123def1234567890123def12345678901', shortAddress: '0x4567...8901', locked: '500.0 ETH', unlocking: '50.0 ETH', pendingUnlocks: 2, lastTx: '2024-01-26 16:45', totalTx: 89 },
  { address: '0x5678901234ef12345678901234ef123456789012', shortAddress: '0x5678...9012', locked: '25.0 ETH', unlocking: '0 ETH', pendingUnlocks: 0, lastTx: '2024-01-15 08:30', totalTx: 34 },
  { address: '0x6789012345f123456789012345f1234567890123', shortAddress: '0x6789...0123', locked: '200.0 ETH', unlocking: '25.0 ETH', pendingUnlocks: 1, lastTx: '2024-01-27 10:00', totalTx: 67 },
  { address: '0x7890123456012345678901234560123456789012', shortAddress: '0x7890...1234', locked: '75.0 ETH', unlocking: '0 ETH', pendingUnlocks: 0, lastTx: '2024-01-25 16:20', totalTx: 28 },
  { address: '0x8901234567123456789012345671234567890123', shortAddress: '0x8901...2345', locked: '10.0 ETH', unlocking: '5.0 ETH', pendingUnlocks: 1, lastTx: '2024-01-27 08:45', totalTx: 5 },
];

// ============= Members Mock Data =============

export interface MembersStats {
  totalMembers: number;
  activeMembers: number;
  roles: number;
  pendingInvites: number;
}

export const MOCK_MEMBERS_STATS: MembersStats = {
  totalMembers: 12,
  activeMembers: 10,
  roles: 4,
  pendingInvites: 2,
};

export interface Member {
  id: number;
  name: string;
  email: string;
  role: 'superadmin' | 'admin' | 'operator' | 'viewer';
  status: 'active' | 'inactive' | 'pending';
  lastActive: string;
  joined: string;
}

export const MOCK_MEMBERS: Member[] = [
  { id: 1, name: 'Admin Superuser', email: 'admin@qsfoundation.io', role: 'superadmin', status: 'active', lastActive: '2024-01-27 14:30', joined: '2023-06-15' },
  { id: 2, name: 'John Operations', email: 'john@qsfoundation.io', role: 'admin', status: 'active', lastActive: '2024-01-27 12:00', joined: '2023-08-20' },
  { id: 3, name: 'Sarah Finance', email: 'sarah@qsfoundation.io', role: 'operator', status: 'active', lastActive: '2024-01-27 10:45', joined: '2023-09-10' },
  { id: 4, name: 'Mike Support', email: 'mike@qsfoundation.io', role: 'operator', status: 'active', lastActive: '2024-01-26 18:30', joined: '2023-10-05' },
  { id: 5, name: 'New Member', email: 'new@qsfoundation.io', role: 'viewer', status: 'pending', lastActive: '-', joined: '2024-01-25' },
  { id: 6, name: 'Inactive User', email: 'inactive@qsfoundation.io', role: 'viewer', status: 'inactive', lastActive: '2024-01-10 09:00', joined: '2023-11-15' },
];

export interface Permission {
  id: string;
  name: string;
}

export interface PermissionCategory {
  category: string;
  permissions: Permission[];
}

export const MOCK_PERMISSION_CATEGORIES: PermissionCategory[] = [
  {
    category: 'Dashboard',
    permissions: [
      { id: 'dashboard.view', name: 'View Dashboard' },
      { id: 'dashboard.export', name: 'Export Data' },
    ],
  },
  {
    category: 'Users',
    permissions: [
      { id: 'users.view', name: 'View Users' },
      { id: 'users.manage', name: 'Manage Users' },
      { id: 'users.suspend', name: 'Suspend Users' },
    ],
  },
  {
    category: 'Prover',
    permissions: [
      { id: 'prover.view', name: 'View Provers' },
      { id: 'prover.approve', name: 'Approve Applications' },
      { id: 'prover.suspend', name: 'Suspend Provers' },
    ],
  },
  {
    category: 'Observer',
    permissions: [
      { id: 'observer.view', name: 'View Observers' },
      { id: 'observer.manage', name: 'Manage Observers' },
    ],
  },
  {
    category: 'Treasury',
    permissions: [
      { id: 'treasury.view', name: 'View Treasury' },
      { id: 'treasury.transfer', name: 'Initiate Transfers' },
      { id: 'treasury.approve', name: 'Approve Transfers' },
    ],
  },
  {
    category: 'Analytics',
    permissions: [
      { id: 'analytics.view', name: 'View Analytics' },
      { id: 'analytics.export', name: 'Export Reports' },
    ],
  },
];

export interface Role {
  id: string;
  name: string;
  description: string;
  members: number;
  permissions: string[];
}

export const MOCK_ROLES: Role[] = [
  {
    id: 'superadmin',
    name: 'Superadmin',
    description: 'Full access to all features',
    members: 1,
    permissions: ['all'],
  },
  {
    id: 'admin',
    name: 'Admin',
    description: 'Manage users, view analytics, approve requests',
    members: 3,
    permissions: ['users.manage', 'analytics.view', 'prover.approve', 'observer.manage'],
  },
  {
    id: 'operator',
    name: 'Operator',
    description: 'Handle day-to-day operations',
    members: 5,
    permissions: ['transactions.view', 'support.manage', 'announcements.create'],
  },
  {
    id: 'viewer',
    name: 'Viewer',
    description: 'Read-only access to dashboard',
    members: 3,
    permissions: ['dashboard.view', 'analytics.view'],
  },
];

// ============= Support Mock Data =============

export interface SupportStats {
  totalTickets: number;
  openTickets: number;
  avgResponseTime: string;
  satisfaction: string;
}

export const MOCK_SUPPORT_STATS: SupportStats = {
  totalTickets: 156,
  openTickets: 23,
  avgResponseTime: '2.5h',
  satisfaction: '94%',
};

export interface Ticket {
  id: string;
  subject: string;
  user: string;
  category: 'transaction' | 'technical' | 'account' | 'other';
  priority: 'high' | 'medium' | 'low';
  status: 'open' | 'pending' | 'resolved' | 'closed';
  created: string;
  updated: string;
  messages?: number;
}

export const MOCK_TICKETS: Ticket[] = [
  { id: 'TKT-001', subject: 'Cannot complete unlock', user: '0x1234...5678', category: 'transaction', priority: 'high', status: 'open', created: '2024-01-27 10:30', updated: '2024-01-27 14:30', messages: 3 },
  { id: 'TKT-002', subject: 'Wallet connection issue', user: '0x2345...6789', category: 'technical', priority: 'medium', status: 'pending', created: '2024-01-27 09:15', updated: '2024-01-27 12:00', messages: 2 },
  { id: 'TKT-003', subject: 'Question about lock duration', user: '0x3456...7890', category: 'account', priority: 'low', status: 'resolved', created: '2024-01-26 16:45', updated: '2024-01-27 10:00', messages: 5 },
  { id: 'TKT-004', subject: 'Emergency unlock not working', user: '0x4567...8901', category: 'transaction', priority: 'high', status: 'open', created: '2024-01-26 14:00', updated: '2024-01-27 09:30', messages: 4 },
  { id: 'TKT-005', subject: 'Need help with staking', user: '0x5678...9012', category: 'other', priority: 'low', status: 'closed', created: '2024-01-25 11:30', updated: '2024-01-26 15:00', messages: 6 },
  { id: 'TKT-006', subject: 'Fee calculation question', user: '0x6789...0123', category: 'account', priority: 'medium', status: 'pending', created: '2024-01-25 09:00', updated: '2024-01-26 11:30', messages: 2 },
  { id: 'TKT-007', subject: 'Transaction stuck', user: '0x7890...1234', category: 'transaction', priority: 'high', status: 'open', created: '2024-01-24 16:00', updated: '2024-01-27 08:00', messages: 8 },
];

export interface FAQ {
  id: number;
  question: string;
  answer: string;
  views: number;
  updated: string;
}

export interface FAQCategory {
  id: string;
  name: string;
  faqs: FAQ[];
}

export const MOCK_FAQ_CATEGORIES: FAQCategory[] = [
  {
    id: 'getting-started',
    name: 'Getting Started',
    faqs: [
      { id: 1, question: 'How do I connect my wallet?', answer: 'Click the "Connect Wallet" button...', views: 1250, updated: '2024-01-20' },
      { id: 2, question: 'What tokens can I lock?', answer: 'Currently supported tokens include ETH, WETH...', views: 980, updated: '2024-01-18' },
    ],
  },
  {
    id: 'locking',
    name: 'Locking Assets',
    faqs: [
      { id: 3, question: 'What is the minimum lock amount?', answer: 'The minimum lock amount is 0.01 ETH...', views: 2100, updated: '2024-01-25' },
      { id: 4, question: 'How long does the lock process take?', answer: 'Lock transactions typically complete...', views: 1560, updated: '2024-01-22' },
      { id: 5, question: 'Can I add more to an existing lock?', answer: 'Yes, you can add more assets...', views: 890, updated: '2024-01-15' },
    ],
  },
  {
    id: 'unlocking',
    name: 'Unlocking Assets',
    faqs: [
      { id: 6, question: 'Why is there a 24-hour waiting period?', answer: 'The 24-hour waiting period is a security measure...', views: 3200, updated: '2024-01-26' },
      { id: 7, question: 'What is an emergency unlock?', answer: 'Emergency unlock allows you to bypass...', views: 1890, updated: '2024-01-23' },
    ],
  },
  {
    id: 'security',
    name: 'Security',
    faqs: [
      { id: 8, question: 'How is my wallet protected?', answer: 'Your wallet is protected by quantum-resistant...', views: 2450, updated: '2024-01-24' },
      { id: 9, question: 'What is Dilithium encryption?', answer: 'Dilithium is a post-quantum digital signature...', views: 1670, updated: '2024-01-21' },
    ],
  },
];

// ============= Mock Response Handler =============

type MockResponseMap = Record<string, unknown>;

const mockResponses: MockResponseMap = {
  // Dashboard
  '/api/admin/dashboard/stats': { stats: MOCK_DASHBOARD_STATS },
  '/api/admin/dashboard/alerts': { alerts: MOCK_ALERTS },
  '/api/admin/dashboard/activity': { activity: MOCK_ACTIVITY },
  '/api/admin/dashboard/tvl': { data: MOCK_TVL_DATA },
  '/api/admin/dashboard/volume': { data: MOCK_VOLUME_DATA },
  '/api/admin/dashboard/users': { data: MOCK_USER_GROWTH },

  // Provers
  '/api/admin/provers': { provers: MOCK_PROVERS, total: MOCK_PROVERS.length },
  '/api/admin/provers/stats': { stats: MOCK_PROVER_STATS },
  '/api/admin/provers/requests': { applications: [], total: 0 },
  '/api/admin/provers/requests/stats': { stats: MOCK_PROVER_REQUEST_STATS },
  '/api/admin/provers/requests/PR-001': MOCK_PROVER_REQUEST_DETAIL,
  '/api/admin/provers/requests/PR-002': { ...MOCK_PROVER_REQUEST_DETAIL, id: 'PR-002', applicant: 'Node Runner Ltd', status: 'under_review' },
  '/api/admin/provers/requests/PR-003': { ...MOCK_PROVER_REQUEST_DETAIL, id: 'PR-003', applicant: 'Quantum Nodes Inc', status: 'approved' },
  '/api/admin/provers/PV-001': MOCK_PROVERS[0],
  '/api/admin/provers/PV-002': MOCK_PROVERS[1],

  // Observers
  '/api/admin/observers': { observers: MOCK_OBSERVERS, total: MOCK_OBSERVERS.length },
  '/api/admin/observers/stats': { stats: MOCK_OBSERVER_STATS },
  '/api/admin/observers/OB-001': MOCK_OBSERVER_DETAIL,
  '/api/admin/observers/OB-002': { ...MOCK_OBSERVER_DETAIL, id: 'OB-002', status: 'warning', successRate: '85.0%' },
  '/api/admin/observers/OB-003': { ...MOCK_OBSERVER_DETAIL, id: 'OB-003', status: 'inactive' },
  '/api/admin/observers/OB-001/challenges': { challenges: MOCK_OBSERVER_DETAIL.recentChallenges, total: 125 },

  // Treasury
  '/api/admin/treasury/overview': MOCK_TREASURY_OVERVIEW,
  '/api/admin/treasury/wallets': { wallets: MOCK_TREASURY_WALLETS_EXTENDED },
  '/api/admin/treasury/wallets/stats': { stats: MOCK_TREASURY_WALLET_STATS },
  '/api/admin/treasury/wallets/main': MOCK_TREASURY_WALLETS_EXTENDED[0],
  '/api/admin/treasury/wallets/operational': MOCK_TREASURY_WALLETS_EXTENDED[1],
  '/api/admin/treasury/transfers/stats': { stats: MOCK_TRANSFER_STATS },
  '/api/admin/treasury/transfers': { transfers: MOCK_TREASURY_TRANSFERS, total: MOCK_TREASURY_TRANSFERS.length },
  '/api/admin/treasury/transfers/TXF-001': MOCK_TREASURY_TRANSFERS[0],
  '/api/admin/treasury/transfers/TXF-002': MOCK_TREASURY_TRANSFERS[1],
  '/api/admin/treasury/budget': { budget: { ...MOCK_BUDGET_DATA, categories: MOCK_BUDGET_CATEGORIES, monthly: MOCK_MONTHLY_BUDGET } },
  '/api/admin/treasury/audit/stats': { stats: MOCK_AUDIT_LOG_STATS },
  '/api/admin/treasury/audit': { logs: MOCK_AUDIT_LOGS, total: MOCK_AUDIT_LOGS.length },

  // Governance
  '/api/admin/governance/stats': { stats: MOCK_GOVERNANCE_STATS },
  '/api/admin/governance/proposals': { proposals: MOCK_GOVERNANCE_PROPOSALS, total: MOCK_GOVERNANCE_PROPOSALS.length },
  '/api/admin/governance/proposals/QIP-042': { proposal: MOCK_PROPOSAL_DETAIL },
  '/api/admin/governance/proposals/QIP-041': { proposal: { ...MOCK_PROPOSAL_DETAIL, id: 'QIP-041', title: 'Add New Supported Token: WBTC', status: 'active', votes: 8900, forVotes: 7200, againstVotes: 1700, turnout: '52.3%' } },
  '/api/admin/governance/proposals/QIP-040': { proposal: { ...MOCK_PROPOSAL_DETAIL, id: 'QIP-040', title: 'Reduce Emergency Unlock Time to 12h', status: 'passed', votes: 15600, forVotes: 14200, againstVotes: 1400, turnout: '85.2%' } },
  '/api/admin/governance/voting/stats': { stats: MOCK_VOTING_STATS },
  '/api/admin/governance/voting/active': { votes: MOCK_ACTIVE_VOTES, total: MOCK_ACTIVE_VOTES.length },
  '/api/admin/governance/council': { members: MOCK_COUNCIL },

  // System
  '/api/admin/system/status': MOCK_SYSTEM_STATUS,

  // Support
  '/api/admin/support/stats': { stats: MOCK_SUPPORT_STATS },
  '/api/admin/support/tickets': { tickets: MOCK_TICKETS, total: MOCK_TICKETS.length },
  '/api/admin/support/tickets/TKT-001': { ticket: MOCK_TICKETS[0] },
  '/api/admin/support/tickets/TKT-002': { ticket: MOCK_TICKETS[1] },
  '/api/admin/support/tickets/TKT-003': { ticket: MOCK_TICKETS[2] },
  '/api/admin/support/faq/categories': { categories: MOCK_FAQ_CATEGORIES },
  '/api/admin/support/faq/1': { faq: MOCK_FAQ_CATEGORIES[0].faqs[0] },
  '/api/admin/support/faq/2': { faq: MOCK_FAQ_CATEGORIES[0].faqs[1] },

  // Members
  '/api/admin/members/stats': { stats: MOCK_MEMBERS_STATS },
  '/api/admin/members': { members: MOCK_MEMBERS, total: MOCK_MEMBERS.length },
  '/api/admin/members/roles': { roles: MOCK_ROLES },
  '/api/admin/members/roles/superadmin': { role: MOCK_ROLES[0] },
  '/api/admin/members/roles/admin': { role: MOCK_ROLES[1] },
  '/api/admin/members/roles/operator': { role: MOCK_ROLES[2] },
  '/api/admin/members/roles/viewer': { role: MOCK_ROLES[3] },
  '/api/admin/members/staff': { members: MOCK_STAFF, total: MOCK_STAFF.length },

  // Transactions
  '/api/admin/transactions/stats': { stats: MOCK_TRANSACTION_STATS },
  '/api/admin/transactions': { transactions: MOCK_ALL_TRANSACTIONS, total: MOCK_ALL_TRANSACTIONS.length },
  '/api/admin/transactions/locks/stats': { stats: MOCK_LOCK_STATS },
  '/api/admin/transactions/locks': { transactions: MOCK_LOCK_TRANSACTIONS, total: MOCK_LOCK_TRANSACTIONS.length },
  '/api/admin/transactions/unlocks/stats': { stats: MOCK_UNLOCK_STATS },
  '/api/admin/transactions/unlocks': { transactions: MOCK_UNLOCK_TRANSACTIONS, total: MOCK_UNLOCK_TRANSACTIONS.length },
  '/api/admin/transactions/emergency/stats': { stats: MOCK_EMERGENCY_STATS },
  '/api/admin/transactions/emergency': { transactions: MOCK_EMERGENCY_UNLOCKS, total: MOCK_EMERGENCY_UNLOCKS.length },
  '/api/admin/transactions/challenges/stats': { stats: MOCK_CHALLENGE_STATS },
  '/api/admin/transactions/challenges': { transactions: MOCK_CHALLENGES, total: MOCK_CHALLENGES.length },

  // Users
  '/api/admin/users/stats': { stats: MOCK_USERS_STATS },
  '/api/admin/users': { users: MOCK_USERS, total: MOCK_USERS.length },
  '/api/admin/users/1': { user: MOCK_USER_DETAIL },
  '/api/admin/users/2': { user: { ...MOCK_USER_DETAIL, id: '2', wallet: '0x2345678901bcdef12345678901bcdef123456789', email: 'user2@example.com', locked: '50.0 ETH', unlocked: '20.0 ETH', totalValue: '70.0 ETH', transactions: 23 } },
  '/api/admin/users/3': { user: { ...MOCK_USER_DETAIL, id: '3', wallet: '0x3456789012cdef123456789012cdef1234567890', email: 'user3@example.com', locked: '0 ETH', unlocked: '100.0 ETH', totalValue: '100.0 ETH', transactions: 12, status: 'inactive' } },
  '/api/admin/users/1/transactions': { transactions: MOCK_USER_TRANSACTIONS, total: MOCK_USER_TRANSACTIONS.length },
  '/api/admin/users/wallets/stats': { stats: MOCK_WALLETS_STATS },
  '/api/admin/users/wallets': { wallets: MOCK_USER_WALLETS, total: MOCK_USER_WALLETS.length },
};

/**
 * Get mock response for endpoint
 */
export function getMockResponse(endpoint: string): unknown | null {
  // Exact match
  if (mockResponses[endpoint]) {
    return mockResponses[endpoint];
  }

  // Pattern match for dynamic routes (e.g., /api/admin/provers/PV-001)
  for (const [pattern, data] of Object.entries(mockResponses)) {
    if (endpoint.startsWith(pattern.replace(/\/[^/]+$/, '/'))) {
      return data;
    }
  }

  return null;
}

// Export all mock data for direct use in components during development
export const mockData = {
  dashboard: {
    stats: MOCK_DASHBOARD_STATS,
    tvl: MOCK_TVL_DATA,
    volume: MOCK_VOLUME_DATA,
    userGrowth: MOCK_USER_GROWTH,
    activity: MOCK_ACTIVITY,
    alerts: MOCK_ALERTS,
  },
  provers: MOCK_PROVERS,
  observers: MOCK_OBSERVERS,
  treasury: {
    overview: MOCK_TREASURY_OVERVIEW,
    wallets: MOCK_TREASURY_WALLETS,
    walletsExtended: MOCK_TREASURY_WALLETS_EXTENDED,
    walletStats: MOCK_TREASURY_WALLET_STATS,
    transferStats: MOCK_TRANSFER_STATS,
    transfers: MOCK_TREASURY_TRANSFERS,
    budget: MOCK_BUDGET_DATA,
    budgetCategories: MOCK_BUDGET_CATEGORIES,
    monthlyBudget: MOCK_MONTHLY_BUDGET,
    auditStats: MOCK_AUDIT_LOG_STATS,
    auditLogs: MOCK_AUDIT_LOGS,
  },
  governance: {
    stats: MOCK_GOVERNANCE_STATS,
    proposals: MOCK_GOVERNANCE_PROPOSALS,
    proposalDetail: MOCK_PROPOSAL_DETAIL,
    votingStats: MOCK_VOTING_STATS,
    activeVotes: MOCK_ACTIVE_VOTES,
    council: MOCK_COUNCIL,
    legacyProposals: MOCK_PROPOSALS,
  },
  system: MOCK_SYSTEM_STATUS,
  staff: MOCK_STAFF,
  members: {
    stats: MOCK_MEMBERS_STATS,
    list: MOCK_MEMBERS,
    roles: MOCK_ROLES,
    permissionCategories: MOCK_PERMISSION_CATEGORIES,
  },
  support: {
    stats: MOCK_SUPPORT_STATS,
    tickets: MOCK_TICKETS,
    faqCategories: MOCK_FAQ_CATEGORIES,
  },
  transactions: {
    stats: MOCK_TRANSACTION_STATS,
    all: MOCK_ALL_TRANSACTIONS,
    locks: MOCK_LOCK_TRANSACTIONS,
    unlocks: MOCK_UNLOCK_TRANSACTIONS,
    emergency: MOCK_EMERGENCY_UNLOCKS,
    challenges: MOCK_CHALLENGES,
  },
  users: {
    stats: MOCK_USERS_STATS,
    list: MOCK_USERS,
    detail: MOCK_USER_DETAIL,
    transactions: MOCK_USER_TRANSACTIONS,
    walletsStats: MOCK_WALLETS_STATS,
    wallets: MOCK_USER_WALLETS,
  },
};
