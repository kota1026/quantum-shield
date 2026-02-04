/**
 * Enterprise App Mock Data
 *
 * Provides fallback data for Enterprise components when API is unavailable.
 * All components should use hooks with fallback pattern:
 *
 * const { data: apiData } = useApiKeys();
 * const apiKeys = apiData?.api_keys ?? MOCK_API_KEYS;
 */

// ==================== API KEYS ====================

export type KeyEnvironment = 'production' | 'test';

export interface MockApiKey {
  id: string;
  name: string;
  environment: KeyEnvironment;
  maskedKey: string;
  isActive: boolean;
  createdAt: string;
  expiresAt?: string;
  revokedAt?: string;
  callsToday: number;
  createdBy: string;
}

export const MOCK_API_KEYS: MockApiKey[] = [
  {
    id: 'key_001',
    name: 'Production Key #1',
    environment: 'production',
    maskedKey: 'qs_live_••••••••••••••••7a3f',
    isActive: true,
    createdAt: '2025-12-01',
    expiresAt: '2026-01-18',
    callsToday: 12345,
    createdBy: '佐藤',
  },
  {
    id: 'key_002',
    name: 'Production Key #2',
    environment: 'production',
    maskedKey: 'qs_live_••••••••••••••••9c2d',
    isActive: true,
    createdAt: '2026-01-05',
    expiresAt: '2026-07-05',
    callsToday: 8234,
    createdBy: '田中',
  },
  {
    id: 'key_003',
    name: 'Test Key #1',
    environment: 'test',
    maskedKey: 'qs_test_••••••••••••••••4b2a',
    isActive: true,
    createdAt: '2026-01-10',
    expiresAt: '2026-04-10',
    callsToday: 3567,
    createdBy: '佐藤',
  },
  {
    id: 'key_004',
    name: 'Legacy Key (Deprecated)',
    environment: 'test',
    maskedKey: 'qs_test_••••••••••••••••1e3f',
    isActive: false,
    createdAt: '2025-06-01',
    revokedAt: '2026-01-01',
    callsToday: 0,
    createdBy: '鈴木',
  },
];

// ==================== WEBHOOKS ====================

export interface MockWebhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
  createdAt: string;
  lastTriggered?: string;
  successRate: number;
}

export const MOCK_WEBHOOKS: MockWebhook[] = [
  {
    id: 'wh_001',
    name: 'Transaction Notifications',
    url: 'https://api.example.com/webhooks/quantum-shield',
    events: ['lock.created', 'unlock.completed', 'unlock.failed'],
    isActive: true,
    createdAt: '2025-12-01',
    lastTriggered: '2026-01-15T10:30:00Z',
    successRate: 99.5,
  },
  {
    id: 'wh_002',
    name: 'Security Alerts',
    url: 'https://alerts.example.com/qs-security',
    events: ['challenge.created', 'emergency.triggered'],
    isActive: true,
    createdAt: '2026-01-05',
    lastTriggered: '2026-01-14T15:22:00Z',
    successRate: 100,
  },
  {
    id: 'wh_003',
    name: 'Analytics Pipeline',
    url: 'https://analytics.example.com/ingest',
    events: ['lock.created', 'unlock.completed'],
    isActive: false,
    createdAt: '2025-11-20',
    successRate: 95.2,
  },
];

// ==================== USERS ====================

export type UserRole = 'owner' | 'admin' | 'member' | 'viewer';
export type UserStatus = 'active' | 'invited' | 'suspended';

export interface MockUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  joinedAt: string;
  lastActive?: string;
  twoFactorEnabled: boolean;
}

export const MOCK_USERS: MockUser[] = [
  {
    id: 'user_001',
    name: '佐藤 太郎',
    email: 'sato@example.com',
    role: 'owner',
    status: 'active',
    joinedAt: '2025-06-01',
    lastActive: '2026-01-15T10:30:00Z',
    twoFactorEnabled: true,
  },
  {
    id: 'user_002',
    name: '田中 花子',
    email: 'tanaka@example.com',
    role: 'admin',
    status: 'active',
    joinedAt: '2025-08-15',
    lastActive: '2026-01-15T09:45:00Z',
    twoFactorEnabled: true,
  },
  {
    id: 'user_003',
    name: '鈴木 一郎',
    email: 'suzuki@example.com',
    role: 'member',
    status: 'active',
    joinedAt: '2025-11-01',
    lastActive: '2026-01-14T18:20:00Z',
    twoFactorEnabled: false,
  },
  {
    id: 'user_004',
    name: 'Mike Johnson',
    email: 'mike@partner.com',
    role: 'viewer',
    status: 'invited',
    joinedAt: '2026-01-10',
    twoFactorEnabled: false,
  },
  {
    id: 'user_005',
    name: '山田 次郎',
    email: 'yamada@example.com',
    role: 'member',
    status: 'suspended',
    joinedAt: '2025-09-20',
    lastActive: '2025-12-20T14:00:00Z',
    twoFactorEnabled: true,
  },
];

// ==================== USER DETAIL ====================

export interface MockUserData {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  joinedAt: string;
  lastActive?: string;
  twoFactorEnabled: boolean;
  permissions: string[];
  is_active: boolean;
  kyc_status: 'verified' | 'pending' | 'rejected' | 'not_submitted';
  aml_status: 'cleared' | 'review' | 'flagged' | 'not_checked';
  risk_score: number;
}

export const MOCK_USER_DETAIL: MockUserData = {
  id: 'user_001',
  name: '佐藤 太郎',
  email: 'sato@example.com',
  role: 'owner',
  status: 'active',
  joinedAt: '2025-06-01',
  lastActive: '2026-01-15T10:30:00Z',
  twoFactorEnabled: true,
  permissions: ['read', 'write', 'admin', 'billing'],
  is_active: true,
  kyc_status: 'verified',
  aml_status: 'cleared',
  risk_score: 12,
};

export interface MockActivityEvent {
  id: string;
  type: 'login' | 'createApiKey' | 'inviteUser' | 'updateSettings';
  description: string;
  timestamp: string;
  time: string;
  ip?: string;
}

export const MOCK_USER_ACTIVITY: MockActivityEvent[] = [
  {
    id: 'act_001',
    type: 'login',
    description: 'ログイン成功',
    timestamp: '2026-01-15T10:30:00Z',
    time: '2分前',
    ip: '192.168.1.100',
  },
  {
    id: 'act_002',
    type: 'createApiKey',
    description: 'API キー作成',
    timestamp: '2026-01-15T10:25:00Z',
    time: '1時間前',
  },
  {
    id: 'act_003',
    type: 'updateSettings',
    description: 'Webhook URL 更新',
    timestamp: '2026-01-14T15:20:00Z',
    time: '3時間前',
  },
  {
    id: 'act_004',
    type: 'inviteUser',
    description: 'mike@partner.com を招待',
    timestamp: '2026-01-10T11:00:00Z',
    time: '昨日',
  },
];

// ==================== AUDIT LOG ====================

export type AuditCategory = 'auth' | 'transactions' | 'users' | 'api' | 'settings' | 'security';

export interface MockAuditEvent {
  id: string;
  category: AuditCategory;
  action: string;
  actor: string;
  target?: string;
  timestamp: string;
  ip_address: string;
  details: string;
  severity?: 'info' | 'warning' | 'critical';
}

export const MOCK_AUDIT_EVENTS: MockAuditEvent[] = [
  {
    id: 'audit_001',
    category: 'auth',
    action: 'login',
    actor: '佐藤 太郎',
    timestamp: '2026-01-11 14:32:15',
    ip_address: '203.0.113.42',
    details: 'Browser: Chrome 120 • OS: macOS',
  },
  {
    id: 'audit_002',
    category: 'transactions',
    action: 'lockTx',
    actor: 'API',
    timestamp: '2026-01-11 14:32:00',
    ip_address: '198.51.100.10',
    details: 'TX: 0x7a3f...9c2d • Amount: 5.00 ETH • API Key: qs_live_...7a3f',
  },
  {
    id: 'audit_003',
    category: 'users',
    action: 'inviteUser',
    actor: '佐藤 太郎',
    timestamp: '2026-01-11 13:45:22',
    ip_address: '203.0.113.42',
    details: 'Email: yamamoto@acme.co.jp • Role: Member',
  },
  {
    id: 'audit_004',
    category: 'api',
    action: 'createApiKey',
    actor: '田中 花子',
    timestamp: '2026-01-11 11:20:05',
    ip_address: '203.0.113.55',
    details: 'Key: qs_live_...9c2d • Environment: Production',
  },
  {
    id: 'audit_005',
    category: 'settings',
    action: 'updateSettings',
    actor: '佐藤 太郎',
    timestamp: '2026-01-11 10:15:33',
    ip_address: '203.0.113.42',
    details: 'Changed: Session timeout (15min → 30min)',
  },
  {
    id: 'audit_006',
    category: 'security',
    action: 'blockedLogin',
    actor: 'System',
    timestamp: '2026-01-11 09:45:12',
    ip_address: '192.0.2.99',
    details: 'Email: sato@acme.co.jp • Reason: Unknown IP address',
    severity: 'warning',
  },
  {
    id: 'audit_007',
    category: 'transactions',
    action: 'unlockTx',
    actor: 'API',
    timestamp: '2026-01-11 09:15:00',
    ip_address: '198.51.100.10',
    details: 'TX: 0x3b2e...1f4a • Amount: 2.50 ETH • API Key: qs_live_...7a3f',
  },
  {
    id: 'audit_008',
    category: 'auth',
    action: 'enabled2fa',
    actor: '鈴木 一郎',
    timestamp: '2026-01-10 16:30:45',
    ip_address: '203.0.113.78',
    details: 'Method: TOTP (Authenticator App)',
  },
];

// ==================== ENVIRONMENTS ====================

export type EnvironmentType = 'production' | 'staging' | 'test';
export type EnvironmentStatus = 'active' | 'inactive';

export interface MockEnvironment {
  id: string;
  name: string;
  type: EnvironmentType;
  endpoint: string;
  api_key: string;
  status: EnvironmentStatus;
  created_at: string;
}

export const MOCK_ENVIRONMENTS: MockEnvironment[] = [
  {
    id: 'env_001',
    name: 'Production',
    type: 'production',
    endpoint: 'https://api.quantumshield.io/v1',
    api_key: 'qs_live_7a3f9c2d8e1b5a4f',
    status: 'active',
    created_at: '2025-01-01',
  },
  {
    id: 'env_002',
    name: 'Staging',
    type: 'staging',
    endpoint: 'https://staging-api.quantumshield.io/v1',
    api_key: 'qs_staging_3b2e1f4a9c8d7e6f',
    status: 'active',
    created_at: '2025-01-15',
  },
  {
    id: 'env_003',
    name: 'Test',
    type: 'test',
    endpoint: 'https://test-api.quantumshield.io/v1',
    api_key: 'qs_test_5d4c3b2a1e9f8g7h',
    status: 'active',
    created_at: '2025-02-01',
  },
];

// ==================== LICENSE / AUDIT REPORTS ====================

export type LicenseReportStatus = 'submitted' | 'pending' | 'overdue';

export interface MockAuditReport {
  id: string;
  name: string;
  period: string;
  status: LicenseReportStatus;
  submitted_at: string | null;
  due_date: string;
}

export const MOCK_AUDIT_REPORTS: MockAuditReport[] = [
  {
    id: 'report_001',
    name: 'Q4 2025 Compliance Report',
    period: '2025-Q4',
    status: 'submitted',
    submitted_at: '2026-01-05',
    due_date: '2026-01-15',
  },
  {
    id: 'report_002',
    name: 'Q1 2026 Compliance Report',
    period: '2026-Q1',
    status: 'pending',
    submitted_at: null,
    due_date: '2026-04-15',
  },
];

// ==================== REPORTS ====================

export interface MockReportStats {
  total_transactions: { value: number; change: number };
  total_volume: { value: string; change: number };
  avg_tvl: { value: string; change: number };
  active_users: { value: number; change: number };
}

export const MOCK_REPORT_STATS: MockReportStats = {
  total_transactions: { value: 1234, change: 12 },
  total_volume: { value: '$47.2M', change: 8.7 },
  avg_tvl: { value: '$118.4M', change: 5.2 },
  active_users: { value: 847, change: 23 },
};

export interface MockTransactionSummary {
  type: string;
  count: number;
  volume: string;
  avg_size: string;
  percentage: string;
}

export const MOCK_TRANSACTION_SUMMARY: MockTransactionSummary[] = [
  { type: 'lock', count: 847, volume: '$32.4M', avg_size: '$38,252', percentage: '68.6%' },
  { type: 'normalUnlock', count: 342, volume: '$12.8M', avg_size: '$37,426', percentage: '27.7%' },
  { type: 'emergencyUnlock', count: 45, volume: '$2.0M', avg_size: '$44,444', percentage: '3.7%' },
];

export interface MockTopUser {
  address: string;
  transactions: number;
  volume: string;
}

export const MOCK_TOP_USERS: MockTopUser[] = [
  { address: '0x1234...5678', transactions: 47, volume: '$4.2M' },
  { address: '0x9abc...def0', transactions: 35, volume: '$3.1M' },
  { address: '0x5678...9012', transactions: 28, volume: '$2.8M' },
];
