// Governance Types and Mock Data

// ============ Types ============

export interface GovernanceStats {
  activeProposals: number;
  votingPower: number;
  participationRate: number;
  totalProposals: number;
}

export interface VotingPowerBreakdown {
  myVeqs: number;
  delegatedToMe: number;
  iDelegated: number;
  delegators: number;
  lockExpiry: string;
}

export type ProposalStatus = 'active' | 'pending' | 'passed' | 'executed' | 'defeated' | 'vetoed';
export type ProposalType = 'parameter' | 'treasury' | 'upgrade' | 'signal' | 'emergency';
export type UserVote = 'for' | 'against' | null;

export interface Proposal {
  id: string;
  title: string;
  description: string;
  status: ProposalStatus;
  type: ProposalType;
  proposer: string;
  createdAt: string;
  executedAt?: string;
  endedAt?: string;
  timeLeft?: string;
  timeLock?: string;
  forPercentage: number;
  againstPercentage: number;
  quorumPercentage?: number;
  quorumRequired?: number;
  quorumReached?: boolean;
  commentsCount: number;
  userVote: UserVote;
}

export interface ProposalSummary {
  id: string;
  title: string;
  status: 'active' | 'pending';
  timeLeft?: string;
  forPercentage: number;
}

export interface CouncilMember {
  id: string;
  name: string;
  role: 'lead' | 'member' | 'chair';
  active: boolean;
}

export interface VetoRecord {
  id: string;
  title: string;
  vetoedBy: string;
  approvalCount: string;
  reason: string;
  date: string;
  onchainRef: string;
  reasonText: string;
}

export interface SystemStatus {
  lockContract: boolean;
  starkVerifier: boolean;
  governance: boolean;
  lastCheck: string;
}

export interface CouncilData {
  securityCouncil: CouncilMember[];
  purposeCommittee: CouncilMember[];
  vetoHistory: VetoRecord[];
  systemStatus: SystemStatus;
}

export interface ActivityItem {
  id: string;
  type: 'vote' | 'delegation' | 'proposal';
  description: string;
  proposalId?: string;
  timestamp: string;
}

// ============ Mock Data ============

export const MOCK_GOVERNANCE_STATS: GovernanceStats = {
  activeProposals: 5,
  votingPower: 125000,
  participationRate: 78,
  totalProposals: 47,
};

export const MOCK_VOTING_POWER: VotingPowerBreakdown = {
  myVeqs: 100000,
  delegatedToMe: 25000,
  iDelegated: 0,
  delegators: 3,
  lockExpiry: '2028-01-15',
};

export const MOCK_DASHBOARD_PROPOSALS: ProposalSummary[] = [
  {
    id: 'QIP-47',
    title: 'Increase Prover Bond Amount from 100 ETH to 150 ETH',
    status: 'active',
    timeLeft: '2d 14h',
    forPercentage: 72,
  },
  {
    id: 'QIP-46',
    title: 'Add New Security Council Member: quantum_expert.eth',
    status: 'active',
    timeLeft: '5d 8h',
    forPercentage: 85,
  },
  {
    id: 'QIP-45',
    title: 'Upgrade STARK Verifier Contract to v2.1',
    status: 'pending',
    forPercentage: 91,
  },
];

export const MOCK_PROPOSALS: Proposal[] = [
  {
    id: 'QIP-47',
    title: 'Increase Prover Bond Amount from 100 ETH to 150 ETH',
    description: 'This proposal seeks to increase the minimum bond requirement for Provers from 100 ETH to 150 ETH to improve network security and reduce the risk of malicious behavior.',
    status: 'active',
    type: 'parameter',
    proposer: '0xabc...def',
    createdAt: '2026-01-08',
    timeLeft: '2d 14h 32m',
    forPercentage: 72,
    againstPercentage: 28,
    quorumPercentage: 65,
    quorumRequired: 4,
    quorumReached: true,
    commentsCount: 24,
    userVote: 'for',
  },
  {
    id: 'QIP-46',
    title: 'Add New Security Council Member: quantum_expert.eth',
    description: 'Nominate quantum_expert.eth as a new Security Council member. This individual has extensive experience in post-quantum cryptography and has contributed to multiple audits.',
    status: 'active',
    type: 'signal',
    proposer: '0x123...456',
    createdAt: '2026-01-05',
    timeLeft: '5d 8h 15m',
    forPercentage: 85,
    againstPercentage: 15,
    quorumPercentage: 78,
    quorumRequired: 15,
    quorumReached: true,
    commentsCount: 47,
    userVote: null,
  },
  {
    id: 'QIP-45',
    title: 'Upgrade STARK Verifier Contract to v2.1',
    description: 'Upgrade the STARK verifier contract to version 2.1 which includes optimized proof verification and reduced gas costs for on-chain verification.',
    status: 'pending',
    type: 'upgrade',
    proposer: '0x789...abc',
    createdAt: '2026-01-02',
    timeLock: '5d remaining',
    forPercentage: 91,
    againstPercentage: 9,
    quorumPercentage: 12,
    quorumRequired: 8,
    quorumReached: true,
    commentsCount: 89,
    userVote: 'for',
  },
  {
    id: 'QIP-44',
    title: 'Reduce Challenge Period from 14 days to 7 days',
    description: "Based on the network's stability and proven security track record, this proposal reduces the challenge period from 14 days to 7 days to improve capital efficiency.",
    status: 'executed',
    type: 'parameter',
    proposer: '0xdef...123',
    createdAt: '2025-12-20',
    executedAt: '2025-12-28',
    forPercentage: 88,
    againstPercentage: 12,
    commentsCount: 156,
    userVote: 'for',
  },
  {
    id: 'QIP-40',
    title: 'Decrease Minimum Lock Period from 30 days to 7 days',
    description: 'Proposal to reduce the minimum lock period for QS tokens to increase accessibility. This proposal was defeated due to concerns about governance stability.',
    status: 'defeated',
    type: 'parameter',
    proposer: '0x555...666',
    createdAt: '2025-12-01',
    endedAt: '2025-12-15',
    forPercentage: 35,
    againstPercentage: 65,
    commentsCount: 234,
    userVote: 'against',
  },
];

export const MOCK_COUNCIL_DATA: CouncilData = {
  securityCouncil: [
    { id: 'S1', name: 'security.eth', role: 'lead', active: true },
    { id: 'S2', name: 'audit_pro.eth', role: 'member', active: true },
    { id: 'S3', name: 'crypto_sec.eth', role: 'member', active: true },
    { id: 'S4', name: 'quantum_ex.eth', role: 'member', active: true },
    { id: 'S5', name: 'stark_dev.eth', role: 'member', active: true },
    { id: 'S6', name: 'zk_expert.eth', role: 'member', active: false },
    { id: 'S7', name: 'security_7.eth', role: 'member', active: false },
  ],
  purposeCommittee: [
    { id: 'P1', name: 'founder.eth', role: 'chair', active: true },
    { id: 'P2', name: 'advisor.eth', role: 'member', active: true },
    { id: 'P3', name: 'community.eth', role: 'member', active: true },
  ],
  vetoHistory: [
    {
      id: 'QIP-32',
      title: 'Remove Time Lock for Parameter Changes',
      vetoedBy: 'Purpose Committee',
      approvalCount: '2/3',
      reason: 'cp3',
      date: '2025-09-20',
      onchainRef: '0x7a8b9c0d...ef12',
      reasonText:
        'This proposal was vetoed because it directly violates Core Principle 3 (CP-3: Security First). The Time Lock mechanism is a critical security feature that provides the community with time to review and respond to governance decisions. Removing it would significantly reduce the protocol\'s security posture and eliminate an important safeguard against malicious proposals.',
    },
  ],
  systemStatus: {
    lockContract: true,
    starkVerifier: true,
    governance: true,
    lastCheck: '2026-01-17 15:30 UTC',
  },
};

export const MOCK_ACTIVITY: ActivityItem[] = [
  {
    id: '1',
    type: 'vote',
    description: 'Voted FOR on QIP-47',
    proposalId: '47',
    timestamp: '2h ago',
  },
  {
    id: '2',
    type: 'delegation',
    description: 'Received delegation from 0x456...789',
    timestamp: '1d ago',
  },
  {
    id: '3',
    type: 'proposal',
    description: 'QIP-45 passed with 91%',
    proposalId: '45',
    timestamp: '3d ago',
  },
];
