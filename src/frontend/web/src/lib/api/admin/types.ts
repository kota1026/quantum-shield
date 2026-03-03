/**
 * QS Admin API Type Definitions
 *
 * TypeScript interfaces matching the Rust backend response types
 */

// ============= Common =============

export interface ApiError {
  code: number;
  message: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
}

// ============= Auth =============

export interface LoginRequest {
  walletAddress: string;
  signature: string;
  message: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AdminUser;
  twoFactorRequired: boolean;
}

export interface AdminUser {
  id: string;
  walletAddress: string;
  email?: string;
  name: string;
  role: string;
  status?: string;
  twoFactorEnabled?: boolean;
  lastLogin?: number;
}

export type AdminRole = 'super_admin' | 'admin' | 'operator' | 'viewer';

// ============= Dashboard =============

export interface DashboardStats {
  totalUsers: number;
  totalLocked: string;
  activeProvers: number;
  activeObservers: number;
  pendingUnlocks: number;
  treasuryBalance: string;
}

export interface DashboardMetrics {
  tvl: number;
  tvlChange24h: number;
  totalLocks: number;
  totalUnlocks: number;
  activeChallenges: number;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'critical';
  l3Status: 'online' | 'offline';
  l1Status: 'online' | 'offline';
  proverHealth: number;
  observerHealth: number;
}

export interface ActivityItem {
  id: string;
  type: 'lock' | 'unlock' | 'challenge' | 'prover_request' | 'treasury' | 'governance';
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface AlertItem {
  id: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

export interface ChartDataPoint {
  date: string;
  value: number;
}

export interface VolumeDataPoint {
  date: string;
  locks: number;
  unlocks: number;
}

// ============= Prover =============

export type ProverStatus = 'active' | 'pending' | 'suspended' | 'exiting' | 'exited' | 'slashed';
export type ProverTier = 'standard' | 'professional' | 'enterprise';

export interface ProverListItem {
  id: string;
  name: string;
  status: ProverStatus;
  hsmConnected: boolean;
  stake: string;
  successRate: number;
  responseTime: number;
  operatorAddress: string;
  tier?: ProverTier;
}

export interface ProverDetail extends ProverListItem {
  registeredAt: number;
  approvedAt?: number;
  metrics?: ProverMetrics;
  exitInfo?: ProverExitInfo;
}

export interface ProverMetrics {
  totalSignatures: number;
  signatures24h: number;
  signatures7d: number;
  avgResponseTimeMs: number;
  successRate: number;
  uptimePercentage: number;
  totalRewards: string;
}

export interface ProverExitInfo {
  requestedAt: number;
  exitableAt: number;
  reason?: string;
}

export interface ProverApplication {
  id: string;
  applicantAddress: string;
  organizationName: string;
  tier: ProverTier;
  stakeAmount?: string;
  infrastructure?: string;
  submittedAt: number;
  status: 'pending' | 'approved' | 'rejected';
  documents?: string[] | number;
}

// ============= Observer =============

export type ObserverStatus = 'active' | 'inactive' | 'suspended' | 'practice';

export interface ObserverListItem {
  id: string;
  walletAddress: string;
  status: ObserverStatus;
  totalEarnings: string;
  successfulChallenges: number;
  failedChallenges: number;
  registeredAt: number;
  inPracticeMode: boolean;
}

export interface ObserverDetail extends ObserverListItem {
  practiceModeUntil?: number;
  practiceModeEarnings: string;
  challengeSuccessRate: number;
  recentChallenges?: ObserverChallenge[];
}

export interface ObserverChallenge {
  id: string;
  unlockId: string;
  status: 'pending' | 'successful' | 'failed';
  reward?: string;
  createdAt: number;
  resolvedAt?: number;
}

// ============= Treasury =============

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
  walletType: 'operational' | 'reserve' | 'rewards' | 'development';
  address: string;
  balance: string;
  currency: string;
  multisigThreshold: number;
  signers: string[];
}

export interface TreasuryTransfer {
  id: string;
  walletId: string;
  txType: 'internal' | 'external' | 'reward' | 'operational';
  amount: string;
  currency: string;
  fromAddress?: string;
  toAddress?: string;
  purpose?: string;
  status: 'pending' | 'approved' | 'executed' | 'rejected' | 'failed';
  createdAt: number;
  executedAt?: number;
  approvals: TransferApproval[];
}

export interface TransferApproval {
  signer: string;
  approvedAt: number;
  signature?: string;
}

export interface BudgetItem {
  id: string;
  category: string;
  allocated: string;
  spent: string;
  remaining: string;
  period: string;
}

// ============= Governance =============

export type ProposalStatus = 'draft' | 'active' | 'passed' | 'rejected' | 'executed' | 'cancelled';

export interface ProposalListItem {
  id: string;
  title: string;
  proposer: string;
  status: ProposalStatus;
  votesFor: string;
  votesAgainst: string;
  votesAbstain: string;
  quorum: string;
  startTime?: number;
  endTime?: number;
  createdAt: number;
}

export interface ProposalDetail extends ProposalListItem {
  description: string;
  actions: ProposalAction[];
  timeline: ProposalEvent[];
}

export interface ProposalAction {
  target: string;
  value: string;
  calldata: string;
  description: string;
}

export interface ProposalEvent {
  type: 'created' | 'voting_started' | 'voting_ended' | 'executed' | 'cancelled';
  timestamp: number;
  txHash?: string;
}

export interface CouncilMember {
  id: string;
  walletAddress: string;
  name?: string;
  role: string;
  votingPower: string;
  status: 'active' | 'inactive';
  joinedAt: number;
  lastActive?: number;
}

export interface VoteRecord {
  id: string;
  proposalId: string;
  proposalTitle: string;
  voter: string;
  vote: 'for' | 'against' | 'abstain';
  votingPower: string;
  timestamp: number;
}

// ============= Transactions =============

export type LockStatus = 'pending' | 'confirmed' | 'active' | 'unlocking' | 'unlocked';
export type UnlockStatus = 'pending' | 'waiting' | 'ready' | 'challenged' | 'completed' | 'cancelled';
export type ChallengeStatus = 'pending' | 'investigating' | 'resolved' | 'escalated';

export interface LockTransaction {
  id: string;
  userAddress: string;
  amount: string;
  currency: string;
  status: LockStatus;
  l1TxHash?: string;
  l3TxHash?: string;
  createdAt: number;
  confirmedAt?: number;
}

export interface UnlockTransaction {
  id: string;
  lockId: string;
  userAddress: string;
  amount: string;
  currency: string;
  status: UnlockStatus;
  timelockEnd?: number;
  challengeWindow?: number;
  l1TxHash?: string;
  l3TxHash?: string;
  createdAt: number;
  completedAt?: number;
}

export interface EmergencyUnlock extends UnlockTransaction {
  reason: string;
  approvedBy?: string;
  emergencyFee: string;
}

export interface ChallengeTransaction {
  id: string;
  unlockId: string;
  challengerAddress: string;
  reason: string;
  status: ChallengeStatus;
  evidence?: string;
  resolution?: string;
  reward?: string;
  createdAt: number;
  resolvedAt?: number;
}

// ============= Users =============

export interface UserListItem {
  id: string;
  walletAddress: string;
  status: 'active' | 'suspended' | 'banned';
  totalLocked: string;
  totalUnlocked: string;
  lockCount: number;
  unlockCount: number;
  registeredAt: number;
  lastActive?: number;
}

export interface UserDetail extends UserListItem {
  locks: LockTransaction[];
  unlocks: UnlockTransaction[];
  suspensionHistory?: SuspensionRecord[];
}

export interface SuspensionRecord {
  id: string;
  reason: string;
  suspendedAt: number;
  suspendedBy: string;
  liftedAt?: number;
  liftedBy?: string;
}

// ============= System =============

export interface SystemStatus {
  status: 'active' | 'paused' | 'maintenance';
  pausedAt?: number;
  pausedBy?: string;
  pauseReason?: string;
  components: ComponentStatus[];
}

export interface ComponentStatus {
  name: string;
  status: 'online' | 'degraded' | 'offline';
  lastCheck: number;
  message?: string;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  actor: string;
  target?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  timestamp: number;
}

export interface MaintenanceWindow {
  id: string;
  title: string;
  description: string;
  scheduledStart: number;
  scheduledEnd: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
}

// ============= Support =============

export type TicketStatus = 'open' | 'in_progress' | 'waiting_user' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  userAddress: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: string;
  assignedTo?: string;
  createdAt: number;
  updatedAt: number;
  resolvedAt?: number;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  sender: 'user' | 'admin';
  senderAddress: string;
  message: string;
  attachments?: string[];
  timestamp: number;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
  published: boolean;
  createdAt: number;
  updatedAt: number;
}

// ============= Announcements =============

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'maintenance' | 'feature';
  targetAudience: 'all' | 'provers' | 'observers' | 'users';
  published: boolean;
  publishedAt?: number;
  expiresAt?: number;
  createdAt: number;
  createdBy: string;
}

// ============= Analytics =============

export interface AnalyticsOverview {
  totalUsers: number;
  activeUsers24h: number;
  newUsers7d: number;
  tvl: string;
  tvlChange24h: number;
  totalTransactions: number;
  transactions24h: number;
}

export interface UserAnalytics {
  period: string;
  newUsers: number;
  activeUsers: number;
  retentionRate: number;
  avgLockedAmount: string;
}

export interface RevenueAnalytics {
  period: string;
  totalRevenue: string;
  lockFees: string;
  unlockFees: string;
  emergencyFees: string;
  challengeRewards: string;
}

// ============= Members =============

export interface StaffMember {
  id: string;
  walletAddress: string;
  email: string;
  name: string;
  role: AdminRole;
  status: 'active' | 'inactive' | 'pending';
  permissions: string[];
  createdAt: number;
  lastLogin?: number;
}

export interface RoleDefinition {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  memberCount: number;
}

// ============= Stats Types (from hooks) =============

export interface ProverStats {
  totalProvers: number;
  activeProvers: number;
  totalStaked: string;
  avgUptime: string;
}

export interface ProverRequestStats {
  pendingRequests: number;
  approvedThisMonth: number;
  rejectedThisMonth: number;
  avgProcessTime: string;
}

export interface ObserverStats {
  totalObservers: number;
  activeObservers: number;
  totalChallenges: number;
  successRate: string;
}

export interface TransactionStats {
  totalTransactions: number;
  lockVolume: string;
  unlockVolume: string;
  pendingUnlocks: number;
  emergencyUnlocks: number;
  activeChallenges: number;
}

export interface LockStats {
  totalLocks: number;
  lockVolume: string;
  avgLockAmount: string;
  avgLockDuration: string;
}

export interface UnlockStats {
  totalUnlocks: number;
  unlockVolume: string;
  pendingUnlocks: number;
  avgWaitTime: string;
}

export interface EmergencyStats {
  totalEmergency: number;
  activeEmergency: number;
  approvedRate: string;
  avgProcessTime: string;
}

export interface ChallengeStats {
  totalChallenges: number;
  activeChallenges: number;
  successRate: string;
  totalSlashed: string;
}

export interface UsersStats {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  lockedVolume: string;
}

export interface WalletsStats {
  totalWallets: number;
  walletsWithLocks: number;
  totalLocked: string;
  avgLockAmount: string;
}

export interface MembersStats {
  totalMembers: number;
  activeMembers: number;
  roles: number;
  pendingInvites: number;
}

export interface SupportStats {
  totalTickets: number;
  openTickets: number;
  avgResponseTime: string;
  satisfaction: string;
}

// ============= Slashing Types =============

export interface SlashingEvent {
  id: string;
  proverId: string;
  operator: string;
  type: 'sla_violation' | 'downtime' | 'invalid_signature';
  amount: string;
  reason: string;
  status: 'pending' | 'reviewing' | 'executed' | 'appealed' | 'rejected';
  createdAt: string;
  executedAt: string | null;
  challengeId?: string;
  challengerReward?: string;
  insuranceAmount?: string;
  burnAmount?: string;
}

export interface SlashingStats {
  totalSlashed: string;
  pendingCount: number;
  appealsCount: number;
  executedThisMonth: number;
  rejectedThisMonth: number;
}

export interface SlashingConfig {
  slaThreshold: number;
  slaViolationPenalty: string;
  downtimePenalty: string;
  invalidSignaturePenalty: string;
  appealPeriod: string;
  gracePeriod: string;
}

export interface SlashingListResponse {
  events: SlashingEvent[];
  total: number;
  stats: SlashingStats;
}

// ============= Emergency Pause Types =============

export type PauseState = 'active' | 'paused' | 'extension_pending';
export type PauseScope = 'full' | 'locks_only' | 'unlocks_only';

export interface EmergencyStatusResponse {
  state: PauseState;
  scope: PauseScope | null;
  reason: string | null;
  pausedAt: string | null;
  pauseExpiresAt: string | null;
  pausedBy: string | null;
  history: PauseHistoryItem[];
}

export interface PauseHistoryItem {
  type: 'pause' | 'unpause' | 'extension';
  reason: string;
  timestamp: string;
  duration?: string;
  executedBy: string;
}

export interface EmergencyPauseRequest {
  scope: PauseScope;
  reason: string;
  duration?: number;
}

export interface EmergencyUnpauseRequest {
  reason: string;
}

// ============= User Types (simplified for list views) =============
// Note: These are simplified mock types used in UI components
// For API response types, use UserListItem and UserDetail above

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

export interface UserDetailSimple {
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
  kycStatus?: 'verified' | 'pending' | 'rejected' | 'none';
  riskScore?: 'low' | 'medium' | 'high';
  notes?: string;
}

export interface UserTransaction {
  id: string;
  type: 'lock' | 'unlock';
  amount: string;
  timestamp: string;
  status: string;
  txHash?: string | null; // L1 transaction hash for Etherscan link
}

export interface UserWallet {
  address: string;
  shortAddress: string;
  locked: string;
  unlocking: string;
  pendingUnlocks: number;
  lastTx: string;
  totalTx: number;
}

// ============= Member Types =============

export interface Member {
  id: number;
  name: string;
  email: string;
  role: 'superadmin' | 'admin' | 'operator' | 'viewer';
  status: 'active' | 'inactive' | 'pending';
  lastActive: string;
  joined: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  members: number;
  permissions: string[];
}

// ============= Support Types =============

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

// ============= Licensee Types =============

export type LicenseStatus = 'active' | 'suspended' | 'pending' | 'expired';
export type LicenseType = 'standard' | 'enterprise';

export interface LicenseeListItem {
  id: string;
  companyName: string;
  country: string;
  type: LicenseType;
  status: LicenseStatus;
  contractDate: string;
  expiryDate: string;
  proverNodes: number;
  observerNodes: number;
  monthlyFee: number;
  lastSyncDate: string;
  supportTickets: number;
}

export interface LicenseeContact {
  name: string;
  email: string;
  phone: string;
}

export interface LicenseeTechnical {
  explorerUrl: string;
  apiEndpoint: string;
  version: string;
  lastUpdate: string;
}

export interface LicenseeCompliance {
  explorerPublic: boolean;
  auditReportSubmitted: boolean;
  lastAuditDate: string;
  designSystemCompliant: boolean;
}

export interface LicenseeProverNode {
  id: string;
  status: 'online' | 'warning' | 'offline';
  uptime: number;
  lastActive: string;
}

export interface LicenseeObserverNode {
  id: string;
  status: 'online' | 'offline';
  challenges: number;
  lastActive: string;
}

export interface LicenseeNodes {
  provers: LicenseeProverNode[];
  observers: LicenseeObserverNode[];
}

export interface LicenseeActivity {
  type: string;
  message: string;
  date: string;
}

export interface LicenseeDetail extends LicenseeListItem {
  contact: LicenseeContact;
  technical: LicenseeTechnical;
  compliance: LicenseeCompliance;
  nodes: LicenseeNodes;
  recentActivity: LicenseeActivity[];
}

export interface LicenseeStats {
  total: number;
  active: number;
  suspended: number;
  pending: number;
  totalRevenue: number;
}

export interface LicenseeSupportTicket {
  id: string;
  subject: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  updatedAt: string;
  assignee: string;
}

export interface LicenseeSupportMessage {
  id: string;
  sender: 'licensee' | 'support';
  senderName: string;
  content: string;
  timestamp: string;
  attachments?: string[];
}
