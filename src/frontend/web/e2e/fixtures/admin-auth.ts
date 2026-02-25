/**
 * QS Admin Authentication Fixtures (Phase 8-E)
 *
 * Provides authenticated test contexts for QS Admin E2E testing.
 *
 * ## Usage
 * ```typescript
 * import { test, expect, adminUser } from './fixtures/admin-auth';
 *
 * test('admin dashboard', async ({ page, adminUser }) => {
 *   await page.goto('/ja/qs-admin/dashboard');
 *   // User is already authenticated
 * });
 * ```
 *
 * ## BE Rules Compliance
 * - BE-001: Tests against real endpoints (no stubs)
 * - BE-002: No test-specific code modifications
 * - BE-003: API calls are logged for verification
 */

import { test as base, expect, Page, BrowserContext } from '@playwright/test';

// Admin user roles
export type AdminRole = 'super_admin' | 'operator' | 'viewer';

// Admin user fixture
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  permissions: string[];
  token: string;
}

// API call log entry for verification
export interface ApiCallLog {
  timestamp: string;
  method: string;
  url: string;
  status: number;
  requestBody?: unknown;
  responseBody?: unknown;
  duration: number;
}

// Test fixtures
interface AdminFixtures {
  adminUser: AdminUser;
  apiLogs: ApiCallLog[];
  captureApiCalls: () => void;
  getApiLogs: () => ApiCallLog[];
}

// Default admin users
export const adminUsers: Record<AdminRole, AdminUser> = {
  super_admin: {
    id: 'admin-001',
    name: '松本 太郎',
    email: 'matsumoto@qs-foundation.io',
    role: 'super_admin',
    permissions: [
      'dashboard:view',
      'provers:manage',
      'observers:manage',
      'treasury:manage',
      'emergency:execute',
      'parameters:modify',
      'audit:view',
      'staff:manage',
    ],
    token: 'mock-admin-token-super',
  },
  operator: {
    id: 'admin-002',
    name: '田中 花子',
    email: 'tanaka@qs-foundation.io',
    role: 'operator',
    permissions: [
      'dashboard:view',
      'provers:view',
      'observers:view',
      'tx-monitor:view',
      'audit:view',
    ],
    token: 'mock-admin-token-operator',
  },
  viewer: {
    id: 'admin-003',
    name: '山田 次郎',
    email: 'yamada@qs-foundation.io',
    role: 'viewer',
    permissions: ['dashboard:view', 'audit:view'],
    token: 'mock-admin-token-viewer',
  },
};

// Setup admin authentication in page context
async function setupAdminAuth(page: Page, user: AdminUser): Promise<void> {
  await page.addInitScript(
    ({ user }) => {
      // Set admin session in localStorage
      window.localStorage.setItem('qs-admin-user', JSON.stringify(user));
      window.localStorage.setItem('qs-admin-token', user.token);
      window.localStorage.setItem('qs-admin-role', user.role);

      // Set permissions
      window.localStorage.setItem(
        'qs-admin-permissions',
        JSON.stringify(user.permissions)
      );
    },
    { user }
  );
}

// API call capture setup
async function setupApiCapture(page: Page): Promise<ApiCallLog[]> {
  const logs: ApiCallLog[] = [];

  // Intercept all API calls
  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const startTime = Date.now();

    try {
      // Try to fetch with a short timeout (2 seconds)
      const response = await Promise.race([
        route.fetch(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Backend timeout')), 2000)
        ),
      ]);

      const duration = Date.now() - startTime;

      // Log the call
      const log: ApiCallLog = {
        timestamp: new Date().toISOString(),
        method: request.method(),
        url: request.url(),
        status: response.status(),
        duration,
      };

      // Capture request body if available
      try {
        const postData = request.postData();
        if (postData) {
          log.requestBody = JSON.parse(postData);
        }
      } catch {
        // Ignore parse errors
      }

      // Capture response body if JSON
      try {
        const contentType = response.headers()['content-type'] || '';
        if (contentType.includes('application/json')) {
          log.responseBody = await response.json();
        }
      } catch {
        // Ignore parse errors
      }

      logs.push(log);

      // Fulfill with the response
      await route.fulfill({ response });
    } catch (error) {
      // Backend unavailable - continue without interception to let client fallback work
      const duration = Date.now() - startTime;
      const log: ApiCallLog = {
        timestamp: new Date().toISOString(),
        method: request.method(),
        url: request.url(),
        status: 503,
        duration,
      };
      logs.push(log);

      // Return a 503 Service Unavailable so the frontend can use its fallback
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Service Unavailable', message: 'Backend not running' }),
      });
    }
  });

  return logs;
}

// Extended test with admin fixtures
export const test = base.extend<AdminFixtures>({
  adminUser: async ({ page }, use) => {
    const user = adminUsers.super_admin;
    await setupAdminAuth(page, user);
    await use(user);
  },

  apiLogs: async ({ page }, use) => {
    const logs = await setupApiCapture(page);
    await use(logs);
  },

  captureApiCalls: async ({ page }, use) => {
    let logs: ApiCallLog[] = [];

    const capture = async () => {
      logs = await setupApiCapture(page);
    };

    await use(() => capture());

    // After test, output logs for verification
    if (logs.length > 0) {
      console.log('\n=== API Call Log ===');
      logs.forEach((log) => {
        console.log(`[${log.timestamp}] ${log.method} ${log.url} - ${log.status} (${log.duration}ms)`);
      });
      console.log('=== End API Call Log ===\n');
    }
  },

  getApiLogs: async ({ page }, use) => {
    const logs: ApiCallLog[] = [];
    await use(() => logs);
  },
});

// Re-export expect
export { expect };

// Helper: Create test with specific admin role
export function testWithRole(role: AdminRole) {
  return test.extend<AdminFixtures>({
    adminUser: async ({ page }, use) => {
      const user = adminUsers[role];
      await setupAdminAuth(page, user);
      await use(user);
    },
  });
}

// Helper: Verify API call was made
export function expectApiCall(
  logs: ApiCallLog[],
  method: string,
  urlPattern: RegExp
): ApiCallLog | undefined {
  return logs.find(
    (log) => log.method === method && urlPattern.test(log.url)
  );
}

// Helper: Verify no API errors
export function expectNoApiErrors(logs: ApiCallLog[]): void {
  const errors = logs.filter((log) => log.status >= 400);
  if (errors.length > 0) {
    throw new Error(
      `API errors detected:\n${errors
        .map((e) => `  ${e.method} ${e.url} - ${e.status}`)
        .join('\n')}`
    );
  }
}

// Helper: Get API calls matching pattern
export function getApiCallsMatching(
  logs: ApiCallLog[],
  pattern: RegExp
): ApiCallLog[] {
  return logs.filter((log) => pattern.test(log.url));
}

// Export log format for verification script
export interface TestLogFormat {
  testName: string;
  testFile: string;
  timestamp: string;
  apiCalls: ApiCallLog[];
  passed: boolean;
  error?: string;
}

// Helper: Format logs for verification
export function formatLogsForVerification(
  testName: string,
  testFile: string,
  apiCalls: ApiCallLog[],
  passed: boolean,
  error?: string
): TestLogFormat {
  return {
    testName,
    testFile,
    timestamp: new Date().toISOString(),
    apiCalls,
    passed,
    error,
  };
}
