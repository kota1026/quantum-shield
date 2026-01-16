import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E configuration for Consumer App
 *
 * Test Categories:
 * - UI Tests: Basic UI component and flow tests (./e2e/*.spec.ts)
 * - Integration Tests: Full E2E with API/STARK integration (./e2e/integration/*.spec.ts)
 *
 * @see TASK-P5-034 E2E Test Implementation
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list'],
  ],

  // Global test timeout
  timeout: 30000,

  // Expect timeout for assertions
  expect: {
    timeout: 10000,
  },

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    // Default viewport
    viewport: { width: 1280, height: 720 },

    // Accept downloads
    acceptDownloads: true,

    // Ignore HTTPS errors in development
    ignoreHTTPSErrors: true,
  },

  projects: [
    // =========================================================================
    // UI Tests (Chromium only for speed)
    // =========================================================================
    {
      name: 'ui-chromium',
      testMatch: /^(?!.*integration).*\.spec\.ts$/,
      use: { ...devices['Desktop Chrome'] },
    },

    // =========================================================================
    // Integration Tests (Full E2E with API mocks)
    // =========================================================================
    {
      name: 'integration',
      testDir: './e2e/integration',
      testMatch: /.*\.spec\.ts$/,
      use: {
        ...devices['Desktop Chrome'],
        // Longer timeout for integration tests
        actionTimeout: 15000,
        navigationTimeout: 30000,
      },
      // Run integration tests sequentially for stability
      fullyParallel: false,
    },

    // =========================================================================
    // Cross-browser Tests (UI only)
    // =========================================================================
    {
      name: 'firefox',
      testMatch: /^(?!.*integration).*\.spec\.ts$/,
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      testMatch: /^(?!.*integration).*\.spec\.ts$/,
      use: { ...devices['Desktop Safari'] },
    },

    // =========================================================================
    // Mobile Tests
    // =========================================================================
    {
      name: 'mobile-chrome',
      testMatch: /^(?!.*integration).*\.spec\.ts$/,
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      testMatch: /^(?!.*integration).*\.spec\.ts$/,
      use: { ...devices['iPhone 12'] },
    },

    // =========================================================================
    // Real STARK Prover Tests (requires prover service)
    // =========================================================================
    {
      name: 'stark-integration',
      testDir: './e2e/integration',
      testMatch: /stark-proof\.spec\.ts$/,
      use: {
        ...devices['Desktop Chrome'],
        // Extended timeout for real proof generation
        actionTimeout: 60000,
        navigationTimeout: 60000,
      },
      // Only run when explicitly enabled
      grep: /@real-prover/,
    },
  ],

  // Web server configuration
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    stdout: 'pipe',
    stderr: 'pipe',
  },

  // Output directories
  outputDir: 'test-results',

  // Global setup/teardown (optional)
  // globalSetup: './e2e/global-setup.ts',
  // globalTeardown: './e2e/global-teardown.ts',
});
