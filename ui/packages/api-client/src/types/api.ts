// Common types
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Auth types
export interface NonceResponse {
  nonce: string;
}

export interface VerifyRequest {
  message: string;
  signature: string;
}

export interface AuthSession {
  address: string;
  chainId: number;
  expiresAt: string;
  token: string;
}

// User types
export interface User {
  address: string;
  dilithiumPublicKey?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserLock {
  lockId: string;
  amount: string;
  dilithiumPublicKey: string;
  lockedAt: string;
  status: 'active' | 'unlocking' | 'unlocked';
}

export interface UserUnlock {
  unlockId: string;
  lockId: string;
  amount: string;
  requestedAt: string;
  unlockTime: string;
  isEmergency: boolean;
  status: 'pending' | 'ready' | 'completed' | 'challenged' | 'cancelled';
}

// Lock types
export interface LockRequest {
  amount: string;
  dilithiumPublicKey: string;
  userSignature: string;
}

export interface LockResponse {
  lockId: string;
  txHash: string;
}

export interface UnlockRequest {
  lockId: string;
  amount: string;
  dilithiumSignature: string;
}

export interface EmergencyUnlockRequest {
  lockId: string;
  amount: string;
  bondAmount: string;
}

export interface UnlockResponse {
  unlockId: string;
  txHash: string;
  unlockTime: string;
}

// Prover types
export interface Prover {
  address: string;
  name: string;
  sphincsPublicKey: string;
  stakeAmount: string;
  status: 'pending' | 'active' | 'suspended' | 'exiting';
  performance: {
    signaturesProcessed: number;
    averageResponseTime: number;
    uptime: number;
  };
  createdAt: string;
}

export interface ProverApplication {
  id: string;
  address: string;
  companyName: string;
  contactEmail: string;
  technicalSpecs: {
    hsmType: string;
    infrastructure: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
}

export interface SignatureRequest {
  id: string;
  lockId: string;
  unlockId: string;
  messageHash: string;
  createdAt: string;
  status: 'pending' | 'signed' | 'expired';
}

// Explorer types
export interface ExplorerStats {
  totalValueLocked: string;
  totalLocks: number;
  totalUnlocks: number;
  activeLocks: number;
  pendingUnlocks: number;
  activeProvers: number;
}

export interface ExplorerLock {
  lockId: string;
  owner: string;
  amount: string;
  lockedAt: string;
  txHash: string;
}

export interface ExplorerUnlock {
  unlockId: string;
  lockId: string;
  amount: string;
  requestedAt: string;
  unlockTime: string;
  isEmergency: boolean;
  status: string;
  txHash: string;
}

// ============================================================================
// Token Hub Types (TASK-P5-021)
// ============================================================================

export interface LockPosition {
  amount: string;
  startTime: number;
  unlockTime: number;
  lockDuration: number;
  veqsValue: string;
  multiplier: number;
  timeRemaining: string;
}

export interface TokenHubDashboardResponse {
  address: string;
  qsBalance: string;
  lockedQs: string;
  veqsBalance: string;
  votingPowerPercent: number;
  lockPosition: LockPosition | null;
  delegationsCount: number;
  pendingRewards: string;
}

export interface TokenHubLockRequest {
  amount: string;
  lockDuration: number;
}

export interface TokenHubLockResponse {
  success: boolean;
  txHash: string | null;
  lockPosition: LockPosition;
  estimatedGas: string;
}

export interface TokenHubLocksResponse {
  activeLock: LockPosition | null;
  history: HistoricalLock[];
}

export interface HistoricalLock {
  amount: string;
  startTime: number;
  unlockTime: number;
  unlockedAt: number;
  veqsEarned: string;
}

export interface TokenHubExtendRequest {
  newUnlockTime: number;
}

export interface TokenHubExtendResponse {
  success: boolean;
  txHash: string | null;
  lockPosition: LockPosition;
}

export interface DelegateInfo {
  address: string;
  name: string | null;
  totalVeqs: string;
  delegatorsCount: number;
  participationRate: number;
  recentVotes: number;
}

export interface TokenHubDelegatesResponse {
  delegates: DelegateInfo[];
  total: number;
}

export interface TokenHubDelegateRequest {
  delegatee: string;
}

export interface TokenHubDelegateResponse {
  success: boolean;
  txHash: string | null;
  delegatee: string;
  veqsDelegated: string;
}

export interface TokenHubRewardsResponse {
  claimable: string;
  claimed: string;
  total: string;
  epochs: RewardEpoch[];
  history: RewardHistory[];
}

export interface RewardEpoch {
  epoch: number;
  amount: string;
  status: 'claimable' | 'claimed' | 'expired';
}

export interface RewardHistory {
  epoch: number;
  amount: string;
  claimedAt: number;
  txHash: string;
}

export interface TokenHubClaimRequest {
  epochs?: number[];
}

export interface TokenHubClaimResponse {
  success: boolean;
  txHash: string | null;
  amountClaimed: string;
  epochsClaimed: number[];
}

export interface MyDelegation {
  delegatee: string;
  delegateeName: string | null;
  veqsAmount: string;
  percentOfTotal: number;
  delegatedAt: number;
}

export interface TokenHubMyDelegationsResponse {
  delegations: MyDelegation[];
  totalDelegated: string;
  selfRetained: string;
}

// ============================================================================
// Governance Types (TASK-P5-023)
// ============================================================================

export type ProposalStatus =
  | 'active'
  | 'passed'
  | 'defeated'
  | 'pending'
  | 'executed'
  | 'cancelled'
  | 'vetoed';

export type VoteType = 'for' | 'against' | 'abstain';

export type ProposalType = 'parameter' | 'treasury' | 'upgrade' | 'signal' | 'emergency';

export interface GovernanceStats {
  totalProposals: number;
  totalVotes: number;
  participationRate: number;
  averageTurnout: number;
}

export interface ProposalSummary {
  id: string;
  title: string;
  type: ProposalType;
  status: ProposalStatus;
  endTime: number;
  forVotes: string;
  againstVotes: string;
}

export interface GovernanceDashboardResponse {
  votingPower: string;
  veQsBalance: string;
  delegatedPower: string;
  activeProposals: number;
  pendingVotes: number;
  recentProposals: ProposalSummary[];
  stats: GovernanceStats;
}

export interface ProposalListItem {
  id: string;
  title: string;
  description: string;
  type: ProposalType;
  status: ProposalStatus;
  proposer: string;
  createdAt: number;
  startTime: number;
  endTime: number;
  forVotes: string;
  againstVotes: string;
  abstainVotes: string;
  quorum: string;
  quorumReached: boolean;
}

export interface ProposalsListResponse {
  proposals: ProposalListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface VoteRecord {
  voter: string;
  voteType: VoteType;
  votingPower: string;
  timestamp: number;
  reason: string | null;
}

export interface ProposalDetailResponse {
  id: string;
  title: string;
  description: string;
  fullDescription: string;
  type: ProposalType;
  status: ProposalStatus;
  proposer: string;
  proposerVeQs: string;
  createdAt: number;
  startTime: number;
  endTime: number;
  forVotes: string;
  againstVotes: string;
  abstainVotes: string;
  quorum: string;
  quorumReached: boolean;
  userVote: VoteType | null;
  userVotingPower: string;
  recentVotes: VoteRecord[];
  executionParams: Record<string, unknown> | null;
}

export interface CreateProposalRequest {
  title: string;
  description: string;
  fullDescription: string;
  type: ProposalType;
  votingDuration?: number;
  executionParams?: Record<string, unknown>;
  signature: string;
}

export interface CreateProposalResponse {
  proposalId: string;
  status: ProposalStatus;
  startTime: number;
  endTime: number;
  message: string;
}

export interface VoteRequest {
  proposalId: string;
  voteType: VoteType;
  reason?: string;
  signature: string;
}

export interface VoteResponse {
  voteId: string;
  proposalId: string;
  voteType: VoteType;
  votingPower: string;
  timestamp: number;
  message: string;
}

export interface VoteDetailResponse {
  voteId: string;
  proposalId: string;
  proposalTitle: string;
  voter: string;
  voteType: VoteType;
  votingPower: string;
  timestamp: number;
  reason: string | null;
  txHash: string;
}

export interface UserVote {
  proposalId: string;
  proposalTitle: string;
  voteType: VoteType;
  votingPower: string;
  timestamp: number;
  proposalStatus: ProposalStatus;
}

export interface UserProposal {
  proposalId: string;
  title: string;
  status: ProposalStatus;
  createdAt: number;
  forVotes: string;
  againstVotes: string;
}

export interface DelegationInfo {
  delegator: string;
  votingPower: string;
  delegatedAt: number;
}

export interface ActivityResponse {
  votes: UserVote[];
  proposals: UserProposal[];
  delegationsReceived: DelegationInfo[];
  totalVotes: number;
  totalProposals: number;
}

export interface CouncilMember {
  address: string;
  name: string | null;
  joinedAt: number;
  actionsCount: number;
}

export interface EmergencyAction {
  id: string;
  actionType: string;
  description: string;
  executedAt: number;
  signers: string[];
}

export interface VetoRecord {
  proposalId: string;
  proposalTitle: string;
  vetoedAt: number;
  reason: string;
  signers: string[];
}

export interface CouncilResponse {
  members: CouncilMember[];
  threshold: number;
  totalMembers: number;
  emergencyActions: EmergencyAction[];
  vetoHistory: VetoRecord[];
}

// ============================================================================
// Observer Types (TASK-P5-019)
// ============================================================================

export type ChallengeStatus =
  | 'pending'
  | 'under_review'
  | 'succeeded'
  | 'failed'
  | 'expired';

export type SuspicionLevel = 'low' | 'medium' | 'high' | 'critical';

export type UnlockType = 'normal' | 'emergency';

export interface ObserverNetworkStats {
  totalValueLocked: string;
  networkPendingUnlocks: number;
  networkChallenges: number;
  networkSuccessRate: number;
}

export interface ObserverActivityItem {
  id: string;
  type: string;
  description: string;
  timestamp: number;
  amount: string | null;
}

export interface ObserverDashboardResponse {
  totalEarnings: string;
  unclaimedEarnings: string;
  totalChallenges: number;
  successfulChallenges: number;
  successRate: number;
  pendingUnlocksCount: number;
  activeChallenges: number;
  recentActivity: ObserverActivityItem[];
  stats: ObserverNetworkStats;
}

export interface PendingUnlockItem {
  lockId: string;
  owner: string;
  amount: string;
  token: string;
  unlockType: UnlockType;
  unlockRequestedAt: number;
  timeRemaining: number;
  suspicionLevel: SuspicionLevel;
  riskIndicators: string[];
  canChallenge: boolean;
}

export interface PendingUnlocksResponse {
  unlocks: PendingUnlockItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface RiskFactor {
  name: string;
  description: string;
  severity: string;
  weight: number;
}

export interface RiskAnalysis {
  score: number;
  factors: RiskFactor[];
  summary: string;
}

export interface SuspiciousTransaction {
  lockId: string;
  owner: string;
  amount: string;
  suspicionLevel: SuspicionLevel;
  riskAnalysis: RiskAnalysis;
  recommendedAction: string;
  challengeBond: string;
  detectedAt: number;
}

export interface SuspiciousTxsResponse {
  transactions: SuspiciousTransaction[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ObserverHistoryItem {
  id: string;
  type: string;
  lockId: string;
  amount: string;
  status: string;
  timestamp: number;
  txHash: string | null;
}

export interface ObserverHistoryResponse {
  history: ObserverHistoryItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface SubmitChallengeRequest {
  lockId: string;
  challenger: string;
  fraudProof: string;
  bond: string;
  reason: string;
}

export interface SubmitChallengeResponse {
  challengeId: string;
  lockId: string;
  fraudProofHash: string;
  bond: string;
  defenseDeadline: number;
  status: ChallengeStatus;
  estimatedReward: string;
}

export interface DefenseInfo {
  defender: string;
  defenseProofHash: string;
  submittedAt: number;
}

export interface ResolutionInfo {
  winner: string;
  resolvedAt: number;
  slashedAmount: string | null;
  rewardAmount: string | null;
}

export interface ChallengeEvent {
  type: string;
  description: string;
  timestamp: number;
  txHash: string | null;
}

export interface ChallengeDetailResponse {
  challengeId: string;
  lockId: string;
  challenger: string;
  fraudProofHash: string;
  bond: string;
  status: ChallengeStatus;
  submittedAt: number;
  defenseDeadline: number;
  defense: DefenseInfo | null;
  resolution: ResolutionInfo | null;
  timeline: ChallengeEvent[];
}

export interface EarningsBreakdown {
  fromChallenges: string;
  winningChallenges: number;
}

export interface EarningItem {
  id: string;
  challengeId: string;
  amount: string;
  timestamp: number;
  claimed: boolean;
  txHash: string | null;
}

export interface EarningsResponse {
  totalEarnings: string;
  claimedEarnings: string;
  unclaimedEarnings: string;
  breakdown: EarningsBreakdown;
  history: EarningItem[];
}

export interface ClaimEarningsRequest {
  observer: string;
  earningIds?: string[];
}

export interface ClaimEarningsResponse {
  claimId: string;
  amountClaimed: string;
  earningsClaimed: number;
  txHash: string;
  status: string;
}

// ============================================================================
// Admin Types (TASK-P5-015)
// ============================================================================

export interface AdminDashboardResponse {
  totalValueLocked: string;
  totalTransactions: number;
  activeNodes: number;
  pendingApprovals: number;
  alerts: AdminAlert[];
  recentActivity: AdminActivityItem[];
}

export interface AdminAlert {
  id: string;
  level: 'info' | 'warning' | 'error';
  message: string;
  timestamp: number;
}

export interface AdminActivityItem {
  id: string;
  type: string;
  actor: string;
  description: string;
  timestamp: number;
}

export interface AdminTransaction {
  id: string;
  type: string;
  amount: string;
  from: string;
  to: string;
  status: string;
  timestamp: number;
  txHash: string;
}

export interface AdminTransactionsResponse {
  transactions: AdminTransaction[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminNode {
  id: string;
  address: string;
  name: string;
  status: 'active' | 'inactive' | 'syncing';
  lastSeen: number;
  version: string;
  metrics: {
    cpu: number;
    memory: number;
    peers: number;
  };
}

export interface AdminNodesResponse {
  nodes: AdminNode[];
  total: number;
}

export interface StaffMember {
  id: string;
  address: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
  createdAt: number;
  lastLogin: number | null;
}

export interface AdminStaffResponse {
  staff: StaffMember[];
  total: number;
}

export interface CreateStaffRequest {
  address: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
}

export interface CreateStaffResponse {
  id: string;
  success: boolean;
  message: string;
}

export interface AdminReport {
  id: string;
  type: string;
  name: string;
  generatedAt: number;
  url: string;
}

export interface AdminReportsResponse {
  reports: AdminReport[];
  total: number;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  actor: string;
  target: string;
  details: Record<string, unknown>;
  timestamp: number;
  ipAddress: string;
}

export interface AdminAuditLogResponse {
  entries: AuditLogEntry[];
  total: number;
  page: number;
  pageSize: number;
}

export interface SystemParameter {
  key: string;
  value: string;
  description: string;
  updatedAt: number;
  updatedBy: string;
}

export interface AdminParametersResponse {
  parameters: SystemParameter[];
}

export interface ParameterChangeRequest {
  key: string;
  newValue: string;
  reason: string;
  signature: string;
}

export interface ParameterChangeResponse {
  requestId: string;
  status: 'pending' | 'approved' | 'rejected';
  message: string;
}

export interface EnterpriseAccount {
  id: string;
  companyName: string;
  status: string;
  tier: string;
  createdAt: number;
  tvl: string;
}

export interface EnterpriseAccountsResponse {
  accounts: EnterpriseAccount[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateEnterpriseAccountRequest {
  companyName: string;
  contactEmail: string;
  tier: string;
}

export interface CreateEnterpriseAccountResponse {
  id: string;
  success: boolean;
  message: string;
}

// ============================================================================
// Enterprise Types (TASK-P5-016/017)
// ============================================================================

export interface EnterpriseDashboardOverview {
  companyName: string;
  tier: string;
  tvl: string;
  volume24h: string;
  transactionCount: number;
  activeUsers: number;
  apiCallsToday: number;
}

export interface ChartDataPoint {
  timestamp: string;
  value: string;
}

export interface EnterpriseTVLResponse {
  current: string;
  change24h: number;
  data: ChartDataPoint[];
}

export interface EnterpriseVolumeResponse {
  total: string;
  change24h: number;
  data: ChartDataPoint[];
}

export interface EnterpriseTransaction {
  id: string;
  type: string;
  amount: string;
  user: string;
  status: string;
  timestamp: number;
  txHash: string;
}

export interface EnterpriseTransactionsResponse {
  transactions: EnterpriseTransaction[];
  total: number;
  page: number;
  pageSize: number;
}

export interface EnterpriseTransactionDetail {
  id: string;
  type: string;
  amount: string;
  user: string;
  status: string;
  timestamp: number;
  txHash: string;
  details: Record<string, unknown>;
}

export interface ExportTransactionsRequest {
  format: 'csv' | 'xlsx';
  startDate?: string;
  endDate?: string;
  status?: string;
}

export interface ExportTransactionsResponse {
  downloadUrl: string;
  expiresAt: number;
}

export interface EnterpriseUser {
  id: string;
  address: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'pending' | 'suspended';
  createdAt: number;
  lastLogin: number | null;
}

export interface EnterpriseUsersResponse {
  users: EnterpriseUser[];
  total: number;
  page: number;
  pageSize: number;
}

export interface EnterpriseUserDetail extends EnterpriseUser {
  permissions: string[];
  transactionCount: number;
  lastActivity: number | null;
}

export interface CreateEnterpriseUserRequest {
  address: string;
  name: string;
  email: string;
  role: string;
}

export interface CreateEnterpriseUserResponse {
  id: string;
  success: boolean;
  message: string;
}

export interface InviteUserRequest {
  email: string;
  role: string;
  message?: string;
}

export interface InviteUserResponse {
  inviteId: string;
  success: boolean;
  message: string;
}

export interface UpdateUserRoleRequest {
  role: string;
}

export interface UpdateUserRoleResponse {
  success: boolean;
  message: string;
}

export interface EnterpriseApiKey {
  id: string;
  name: string;
  prefix: string;
  permissions: string[];
  createdAt: number;
  lastUsed: number | null;
  expiresAt: number | null;
}

export interface EnterpriseApiKeysResponse {
  apiKeys: EnterpriseApiKey[];
  total: number;
}

export interface CreateApiKeyRequest {
  name: string;
  permissions: string[];
  expiresIn?: number;
}

export interface CreateApiKeyResponse {
  id: string;
  key: string;
  success: boolean;
  message: string;
}

export interface ApiKeyUsageResponse {
  keyId: string;
  totalCalls: number;
  callsToday: number;
  callsThisMonth: number;
  lastUsed: number | null;
  usageByEndpoint: Record<string, number>;
}

export interface EnterpriseSettings {
  companyName: string;
  contactEmail: string;
  webhookUrl: string | null;
  ipWhitelist: string[];
  notifications: {
    email: boolean;
    webhook: boolean;
  };
}

export interface EnterpriseSettingsResponse extends EnterpriseSettings {
  updatedAt: number;
}

export interface UpdateEnterpriseSettingsRequest {
  companyName?: string;
  contactEmail?: string;
  webhookUrl?: string | null;
  ipWhitelist?: string[];
  notifications?: {
    email?: boolean;
    webhook?: boolean;
  };
}

export interface UpdateEnterpriseSettingsResponse {
  success: boolean;
  message: string;
}

export interface EnterpriseSecuritySettingsResponse {
  mfaRequired: boolean;
  ipWhitelistEnabled: boolean;
  ipWhitelist: string[];
  sessionTimeout: number;
  apiKeyRotationDays: number;
}

export interface EnterpriseReport {
  id: string;
  type: string;
  name: string;
  generatedAt: number;
  url: string;
}

export interface EnterpriseReportsResponse {
  reports: EnterpriseReport[];
  total: number;
}

export interface EnterpriseAuditEntry {
  id: string;
  action: string;
  actor: string;
  target: string;
  details: Record<string, unknown>;
  timestamp: number;
  ipAddress: string;
}

export interface EnterpriseAuditLogResponse {
  entries: EnterpriseAuditEntry[];
  total: number;
  page: number;
  pageSize: number;
}

export interface EnterpriseApplicationRequest {
  companyName: string;
  contactName: string;
  contactEmail: string;
  phone?: string;
  expectedTvl: string;
  useCase: string;
  additionalNotes?: string;
}

export interface EnterpriseApplicationResponse {
  applicationId: string;
  status: 'submitted' | 'under_review' | 'approved' | 'rejected';
  message: string;
}

export interface ApplicationStatusResponse {
  applicationId: string;
  status: 'submitted' | 'under_review' | 'approved' | 'rejected';
  submittedAt: number;
  reviewedAt: number | null;
  reviewer: string | null;
  notes: string | null;
  nextSteps: string[];
}

export interface SignContractRequest {
  applicationId: string;
  signature: string;
  acceptedTerms: boolean;
}

export interface SignContractResponse {
  success: boolean;
  contractId: string;
  message: string;
}

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  completedAt: number | null;
}

export interface OnboardingStatusResponse {
  applicationId: string;
  contractSigned: boolean;
  steps: OnboardingStep[];
  progress: number;
  completedAt: number | null;
}
