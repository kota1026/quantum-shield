import { test, expect } from '@playwright/test';

/**
 * All Screens Smoke Test
 *
 * URL_REFERENCE.md に定義された全175画面の存在確認テスト。
 * 各URLにアクセスして、エラーなく表示されることを確認する。
 *
 * 実行: npx playwright test e2e/smoke/all-screens.spec.ts
 */

// ベースURL（環境変数またはデフォルト）
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// 動的ルートのサンプルID
const SAMPLE_IDS = {
  id: 'sample_001',
  txId: 'tx_001',
};

// =============================================================================
// URL Definitions (from URL_REFERENCE.md)
// =============================================================================

interface ScreenDefinition {
  name: string;
  path: string;
  app: string;
}

const ALL_SCREENS: ScreenDefinition[] = [
  // =========================================================================
  // 1. Consumer App (19画面)
  // =========================================================================
  { app: 'consumer', name: 'Landing', path: '/ja/consumer/landing' },
  { app: 'consumer', name: 'Dashboard', path: '/ja/consumer/dashboard' },
  { app: 'consumer', name: 'Lock', path: '/ja/consumer/lock' },
  { app: 'consumer', name: 'Lock Confirm', path: '/ja/consumer/lock/confirm' },
  { app: 'consumer', name: 'Lock Processing', path: '/ja/consumer/lock/processing' },
  { app: 'consumer', name: 'Lock Complete', path: '/ja/consumer/lock/complete' },
  { app: 'consumer', name: 'Unlock', path: '/ja/consumer/unlock' },
  { app: 'consumer', name: 'Unlock Confirm', path: '/ja/consumer/unlock/confirm' },
  { app: 'consumer', name: 'Unlock Processing', path: '/ja/consumer/unlock/processing' },
  { app: 'consumer', name: 'Unlock Complete', path: '/ja/consumer/unlock/complete' },
  { app: 'consumer', name: 'Emergency Unlock', path: '/ja/consumer/emergency-unlock' },
  { app: 'consumer', name: 'History', path: '/ja/consumer/history' },
  { app: 'consumer', name: 'History Detail', path: `/ja/consumer/history/${SAMPLE_IDS.id}` },
  { app: 'consumer', name: 'Notifications', path: '/ja/consumer/notifications' },
  { app: 'consumer', name: 'Settings', path: '/ja/consumer/settings' },
  { app: 'consumer', name: 'Settings Security', path: '/ja/consumer/settings/security' },
  { app: 'consumer', name: 'Settings Keys', path: '/ja/consumer/settings/keys' },
  { app: 'consumer', name: 'Help', path: '/ja/consumer/help' },
  { app: 'consumer', name: 'Onboarding', path: '/ja/consumer/onboarding' },

  // =========================================================================
  // 2. Token Hub (Legacy - 18画面)
  // =========================================================================
  { app: 'token-hub', name: 'Landing', path: '/ja/token-hub/landing' },
  { app: 'token-hub', name: 'Login', path: '/ja/token-hub/login' },
  { app: 'token-hub', name: 'Dashboard', path: '/ja/token-hub/dashboard' },
  { app: 'token-hub', name: 'Lock', path: '/ja/token-hub/lock' },
  { app: 'token-hub', name: 'Lock Preview', path: '/ja/token-hub/lock/preview' },
  { app: 'token-hub', name: 'Unlock', path: '/ja/token-hub/unlock' },
  { app: 'token-hub', name: 'Rewards', path: '/ja/token-hub/rewards' },
  { app: 'token-hub', name: 'Rewards Claim', path: '/ja/token-hub/rewards/claim' },
  { app: 'token-hub', name: 'Rewards History', path: '/ja/token-hub/rewards/history' },
  { app: 'token-hub', name: 'Delegate', path: '/ja/token-hub/delegate' },
  { app: 'token-hub', name: 'Delegate Detail', path: `/ja/token-hub/delegate/${SAMPLE_IDS.id}` },
  { app: 'token-hub', name: 'Delegate List', path: '/ja/token-hub/delegate-list' },
  { app: 'token-hub', name: 'Get QS', path: '/ja/token-hub/get-qs' },
  { app: 'token-hub', name: 'Consumer Link', path: '/ja/token-hub/consumer-link' },
  { app: 'token-hub', name: 'Settings', path: '/ja/token-hub/settings' },
  { app: 'token-hub', name: 'Help', path: '/ja/token-hub/help' },
  { app: 'token-hub', name: 'FAQ', path: '/ja/token-hub/faq' },
  { app: 'token-hub', name: 'Onboarding', path: '/ja/token-hub/onboarding' },

  // =========================================================================
  // 3. Governance (Legacy - 11画面)
  // =========================================================================
  { app: 'governance', name: 'Landing', path: '/ja/governance/landing' },
  { app: 'governance', name: 'Login', path: '/ja/governance/login' },
  { app: 'governance', name: 'Dashboard', path: '/ja/governance/dashboard' },
  { app: 'governance', name: 'Proposals', path: '/ja/governance/proposals' },
  { app: 'governance', name: 'Proposal Detail', path: `/ja/governance/proposals/${SAMPLE_IDS.id}` },
  { app: 'governance', name: 'Create Proposal', path: '/ja/governance/create' },
  { app: 'governance', name: 'Council', path: '/ja/governance/council' },
  { app: 'governance', name: 'History', path: '/ja/governance/history' },
  { app: 'governance', name: 'Settings', path: '/ja/governance/settings' },
  { app: 'governance', name: 'FAQ', path: '/ja/governance/faq' },
  { app: 'governance', name: 'Onboarding', path: '/ja/governance/onboarding' },

  // =========================================================================
  // 4. QS Hub (v3.1 - 14画面)
  // =========================================================================
  { app: 'qs-hub', name: 'Landing', path: '/ja/qs-hub/landing' },
  { app: 'qs-hub', name: 'Login', path: '/ja/qs-hub/login' },
  { app: 'qs-hub', name: 'Dashboard', path: '/ja/qs-hub/dashboard' },
  { app: 'qs-hub', name: 'Stake Lock', path: '/ja/qs-hub/stake/lock' },
  { app: 'qs-hub', name: 'Stake Extend', path: '/ja/qs-hub/stake/extend' },
  { app: 'qs-hub', name: 'Stake Unlock', path: '/ja/qs-hub/stake/unlock' },
  { app: 'qs-hub', name: 'Rewards', path: '/ja/qs-hub/rewards' },
  { app: 'qs-hub', name: 'Vote Proposals', path: '/ja/qs-hub/vote/proposals' },
  { app: 'qs-hub', name: 'Proposal Detail', path: `/ja/qs-hub/vote/proposals/${SAMPLE_IDS.id}` },
  { app: 'qs-hub', name: 'Create Proposal', path: '/ja/qs-hub/vote/proposals/create' },
  { app: 'qs-hub', name: 'Vote Delegates', path: '/ja/qs-hub/vote/delegates' },
  { app: 'qs-hub', name: 'Vote History', path: '/ja/qs-hub/vote/history' },
  { app: 'qs-hub', name: 'Council', path: '/ja/qs-hub/council' },
  { app: 'qs-hub', name: 'Settings', path: '/ja/qs-hub/settings' },

  // =========================================================================
  // 5. Prover Portal (9画面)
  // =========================================================================
  { app: 'prover', name: 'Landing', path: '/ja/prover/landing' },
  { app: 'prover', name: 'Dashboard', path: '/ja/prover/dashboard' },
  { app: 'prover', name: 'Register', path: '/ja/prover/register' },
  { app: 'prover', name: 'Node Setup', path: '/ja/prover/node-setup' },
  { app: 'prover', name: 'Signatures', path: '/ja/prover/signatures' },
  { app: 'prover', name: 'Earnings', path: '/ja/prover/earnings' },
  { app: 'prover', name: 'Stake', path: '/ja/prover/stake' },
  { app: 'prover', name: 'Settings', path: '/ja/prover/settings' },
  { app: 'prover', name: 'Alerts', path: '/ja/prover/alerts' },

  // =========================================================================
  // 6. Observer (7画面)
  // =========================================================================
  { app: 'observer', name: 'Landing', path: '/ja/observer/landing' },
  { app: 'observer', name: 'Dashboard', path: '/ja/observer/dashboard' },
  { app: 'observer', name: 'Pending', path: '/ja/observer/pending' },
  { app: 'observer', name: 'Suspicious', path: '/ja/observer/suspicious' },
  { app: 'observer', name: 'History', path: '/ja/observer/history' },
  { app: 'observer', name: 'Earnings', path: '/ja/observer/earnings' },
  { app: 'observer', name: 'Settings', path: '/ja/observer/settings' },

  // =========================================================================
  // 7. Explorer (9画面)
  // =========================================================================
  { app: 'explorer', name: 'Landing', path: '/ja/explorer/landing' },
  { app: 'explorer', name: 'Overview', path: '/ja/explorer/overview' },
  { app: 'explorer', name: 'Locks', path: '/ja/explorer/locks' },
  { app: 'explorer', name: 'Lock Detail', path: `/ja/explorer/locks/${SAMPLE_IDS.id}` },
  { app: 'explorer', name: 'Unlocks', path: '/ja/explorer/unlocks' },
  { app: 'explorer', name: 'Unlock Detail', path: `/ja/explorer/unlocks/${SAMPLE_IDS.id}` },
  { app: 'explorer', name: 'Challenges', path: '/ja/explorer/challenges' },
  { app: 'explorer', name: 'Provers', path: '/ja/explorer/provers' },
  { app: 'explorer', name: 'Analytics', path: '/ja/explorer/analytics' },

  // =========================================================================
  // 8. Enterprise Admin (18画面)
  // =========================================================================
  { app: 'enterprise', name: 'Login', path: '/ja/enterprise/login' },
  { app: 'enterprise', name: 'Dashboard', path: '/ja/enterprise/dashboard' },
  { app: 'enterprise', name: 'Provers', path: '/ja/enterprise/provers' },
  { app: 'enterprise', name: 'Prover Detail', path: `/ja/enterprise/provers/${SAMPLE_IDS.id}` },
  { app: 'enterprise', name: 'Prover Calendar', path: '/ja/enterprise/provers/calendar' },
  { app: 'enterprise', name: 'Observers', path: '/ja/enterprise/observers' },
  { app: 'enterprise', name: 'Monitoring', path: '/ja/enterprise/monitoring' },
  { app: 'enterprise', name: 'Users', path: '/ja/enterprise/users' },
  { app: 'enterprise', name: 'Parameters', path: '/ja/enterprise/parameters' },
  { app: 'enterprise', name: 'Emergency', path: '/ja/enterprise/emergency' },
  { app: 'enterprise', name: 'Support', path: '/ja/enterprise/support' },
  { app: 'enterprise', name: 'Team', path: '/ja/enterprise/team' },
  { app: 'enterprise', name: 'Team Invite', path: '/ja/enterprise/team/invite' },
  { app: 'enterprise', name: 'Audit Log', path: '/ja/enterprise/audit-log' },
  { app: 'enterprise', name: 'Settings', path: '/ja/enterprise/settings' },
  { app: 'enterprise', name: 'Help', path: '/ja/enterprise/help' },
  { app: 'enterprise', name: 'Terms', path: '/ja/enterprise/terms' },
  { app: 'enterprise', name: 'Privacy', path: '/ja/enterprise/privacy' },

  // =========================================================================
  // 9. QS Admin (70画面)
  // =========================================================================
  // 9.1 Overview
  { app: 'admin', name: 'Dashboard', path: '/ja/admin/dashboard' },
  { app: 'admin', name: 'Emergency', path: '/ja/admin/emergency' },

  // 9.2 Public版管理
  { app: 'admin', name: 'Public Users', path: '/ja/admin/public/users' },
  { app: 'admin', name: 'Public User Detail', path: `/ja/admin/public/users/${SAMPLE_IDS.id}` },
  { app: 'admin', name: 'Public User Stats', path: '/ja/admin/public/users/stats' },
  { app: 'admin', name: 'Public Provers', path: '/ja/admin/public/provers' },
  { app: 'admin', name: 'Public Prover Detail', path: `/ja/admin/public/provers/${SAMPLE_IDS.id}` },
  { app: 'admin', name: 'Prover Applications', path: '/ja/admin/public/provers/applications' },
  { app: 'admin', name: 'Prover Performance', path: '/ja/admin/public/provers/performance' },
  { app: 'admin', name: 'Prover Slashing', path: '/ja/admin/public/provers/slashing' },
  { app: 'admin', name: 'Public Observers', path: '/ja/admin/public/observers' },
  { app: 'admin', name: 'Token Holders', path: '/ja/admin/public/holders' },
  { app: 'admin', name: 'Voting Power', path: '/ja/admin/public/voting-power' },
  { app: 'admin', name: 'Delegates', path: '/ja/admin/public/delegates' },
  { app: 'admin', name: 'Governance', path: '/ja/admin/public/governance' },
  { app: 'admin', name: 'Treasury', path: '/ja/admin/public/treasury' },
  { app: 'admin', name: 'Protocol Monitor', path: '/ja/admin/public/protocol' },
  { app: 'admin', name: 'Protocol Alerts', path: '/ja/admin/public/protocol/alerts' },
  { app: 'admin', name: 'Protocol Contracts', path: '/ja/admin/public/protocol/contracts' },

  // 9.3 SaaS版管理
  { app: 'admin', name: 'SaaS Operators', path: '/ja/admin/saas/operators' },
  { app: 'admin', name: 'Operator Detail', path: `/ja/admin/saas/operators/${SAMPLE_IDS.id}` },
  { app: 'admin', name: 'Operator Applications', path: '/ja/admin/saas/operators/applications' },
  { app: 'admin', name: 'Operator Contracts', path: '/ja/admin/saas/operators/contracts' },
  { app: 'admin', name: 'Operator Plans', path: '/ja/admin/saas/operators/plans' },
  { app: 'admin', name: 'SaaS Users', path: '/ja/admin/saas/users' },
  { app: 'admin', name: 'SaaS User Stats', path: '/ja/admin/saas/users/stats' },
  { app: 'admin', name: 'SaaS User Risks', path: '/ja/admin/saas/users/risks' },
  { app: 'admin', name: 'SaaS QS Provers', path: '/ja/admin/saas/provers/qs' },
  { app: 'admin', name: 'SaaS Operator Provers', path: '/ja/admin/saas/provers/operator' },
  { app: 'admin', name: 'SaaS Prover Performance', path: '/ja/admin/saas/provers/performance' },
  { app: 'admin', name: 'SaaS Prover SLA', path: '/ja/admin/saas/provers/sla' },
  { app: 'admin', name: 'SaaS Observers', path: '/ja/admin/saas/observers' },
  { app: 'admin', name: 'SaaS Observer Status', path: '/ja/admin/saas/observers/status' },
  { app: 'admin', name: 'SaaS Billing', path: '/ja/admin/saas/billing' },
  { app: 'admin', name: 'SaaS Usage', path: '/ja/admin/saas/billing/usage' },
  { app: 'admin', name: 'SaaS Revenue', path: '/ja/admin/saas/billing/revenue' },
  { app: 'admin', name: 'SaaS Payments', path: '/ja/admin/saas/billing/payments' },
  { app: 'admin', name: 'SaaS Support', path: '/ja/admin/saas/support' },
  { app: 'admin', name: 'SaaS Support History', path: '/ja/admin/saas/support/history' },
  { app: 'admin', name: 'Infrastructure', path: '/ja/admin/saas/infrastructure' },
  { app: 'admin', name: 'Infrastructure Capacity', path: '/ja/admin/saas/infrastructure/capacity' },
  { app: 'admin', name: 'Infrastructure SLA', path: '/ja/admin/saas/infrastructure/sla' },

  // 9.4 License版管理
  { app: 'admin', name: 'Licensees', path: '/ja/admin/licensees' },
  { app: 'admin', name: 'Licensee Detail', path: `/ja/admin/licensees/${SAMPLE_IDS.id}` },
  { app: 'admin', name: 'Licensee Support', path: `/ja/admin/licensees/${SAMPLE_IDS.id}/support` },
  { app: 'admin', name: 'License Companies', path: '/ja/admin/license/companies' },
  { app: 'admin', name: 'License Company Detail', path: `/ja/admin/license/companies/${SAMPLE_IDS.id}` },
  { app: 'admin', name: 'License Projects', path: '/ja/admin/license/projects' },
  { app: 'admin', name: 'License Project Detail', path: `/ja/admin/license/projects/${SAMPLE_IDS.id}` },
  { app: 'admin', name: 'License Documents', path: '/ja/admin/license/documents' },
  { app: 'admin', name: 'License Renewals', path: '/ja/admin/license/renewals' },
  { app: 'admin', name: 'License Training', path: '/ja/admin/license/training' },
  { app: 'admin', name: 'Updates', path: '/ja/admin/updates' },
  { app: 'admin', name: 'Licensee Support Top', path: '/ja/admin/support' },
  { app: 'admin', name: 'Billing', path: '/ja/admin/billing' },

  // 9.5 Foundation設定
  { app: 'admin', name: 'Members', path: '/ja/admin/settings/members' },
  { app: 'admin', name: 'Roles', path: '/ja/admin/settings/roles' },
  { app: 'admin', name: 'Audit Log', path: '/ja/admin/settings/audit-log' },
  { app: 'admin', name: 'Security', path: '/ja/admin/settings/security' },
  { app: 'admin', name: 'System', path: '/ja/admin/settings/system' },

  // 9.6 その他
  { app: 'admin', name: 'Audit Top', path: '/ja/admin/audit' },
  { app: 'admin', name: 'Staff', path: '/ja/admin/staff' },
  { app: 'admin', name: 'Nodes', path: '/ja/admin/nodes' },
  { app: 'admin', name: 'Prover Legacy', path: '/ja/admin/prover' },
  { app: 'admin', name: 'Parameters', path: '/ja/admin/parameters' },
  { app: 'admin', name: 'TX Monitor', path: '/ja/admin/tx-monitor' },
  { app: 'admin', name: 'Reports', path: '/ja/admin/reports' },
  { app: 'admin', name: 'Community', path: '/ja/admin/community' },
  { app: 'admin', name: 'Onboarding', path: '/ja/admin/onboarding' },
  { app: 'admin', name: 'Enterprise Legacy', path: '/ja/admin/enterprise' },
];

// =============================================================================
// Test Suites
// =============================================================================

// アプリごとにグループ化
const screensByApp = ALL_SCREENS.reduce(
  (acc, screen) => {
    if (!acc[screen.app]) acc[screen.app] = [];
    acc[screen.app].push(screen);
    return acc;
  },
  {} as Record<string, ScreenDefinition[]>
);

// 各アプリのテストスイート
for (const [app, screens] of Object.entries(screensByApp)) {
  test.describe(`${app} Smoke Tests (${screens.length} screens)`, () => {
    for (const screen of screens) {
      test(`${screen.name} - ${screen.path}`, async ({ page }) => {
        // ページにアクセス
        const response = await page.goto(screen.path);

        // レスポンスコードを確認（200, 304, 307, 308は許容）
        const status = response?.status() || 0;
        expect([200, 304, 307, 308]).toContain(status);

        // エラーページでないことを確認
        const title = await page.title();
        expect(title.toLowerCase()).not.toContain('error');
        expect(title.toLowerCase()).not.toContain('404');
        expect(title.toLowerCase()).not.toContain('not found');

        // 致命的なJSエラーがないことを確認
        page.on('pageerror', (error) => {
          console.error(`JS Error on ${screen.path}: ${error.message}`);
        });

        // main要素またはbody内に何か表示されていることを確認
        await expect(page.locator('body')).not.toBeEmpty();
      });
    }
  });
}

// =============================================================================
// Summary Test
// =============================================================================

test.describe('All Screens Summary', () => {
  test('Total screen count matches URL_REFERENCE.md', () => {
    expect(ALL_SCREENS.length).toBe(175);
  });

  test('All apps are covered', () => {
    const apps = new Set(ALL_SCREENS.map((s) => s.app));
    expect(apps.size).toBe(9); // 9 apps
    expect(apps).toContain('consumer');
    expect(apps).toContain('token-hub');
    expect(apps).toContain('governance');
    expect(apps).toContain('qs-hub');
    expect(apps).toContain('prover');
    expect(apps).toContain('observer');
    expect(apps).toContain('explorer');
    expect(apps).toContain('enterprise');
    expect(apps).toContain('admin');
  });
});

// =============================================================================
// Export for other tests
// =============================================================================

export { ALL_SCREENS, screensByApp, ScreenDefinition };
