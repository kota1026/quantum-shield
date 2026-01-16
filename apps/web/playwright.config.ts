import { defineConfig, devices } from '@playwright/test';

/**
 * Quantum Shield Phase 6 - Playwright Configuration
 * With AI Agent support for self-healing tests
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
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    // Desktop browsers
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    // Mobile viewports
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 13'] },
    },
    // Accessibility testing project
    {
      name: 'accessibility',
      use: {
        ...devices['Desktop Chrome'],
      },
      testMatch: '**/*.a11y.spec.ts',
    },
  ],

  webServer: process.env.NO_SERVER
    ? undefined
    : {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
      },

  // Global timeout
  timeout: 30000,
  expect: {
    timeout: 5000,
  },
});

/**
 * AI Agent Configuration (for Claude Computer Use integration)
 *
 * These settings are used when running tests with AI-powered
 * self-healing capabilities via the Healer Agent.
 */
export const aiAgentConfig = {
  healer: {
    enabled: true,
    model: 'claude-sonnet-4-20250514',
    maxRetries: 3,
    strategies: [
      'update-locator',      // Update element locators
      'adjust-wait',         // Adjust wait times
      'alternative-path',    // Find alternative interaction paths
      'semantic-match',      // Match elements semantically
    ],
    reportPath: './test-results/healer-report.json',
  },
  generator: {
    enabled: true,
    model: 'claude-sonnet-4-20250514',
    outputDir: './e2e/generated',
    basePrompt: '../../docs_new/02_agents_prompt/02_prompts/37_e2e_test.md',
  },
  visualVerification: {
    enabled: true,
    screenshotOnStep: false,
    screenshotOnFailure: true,
    compareBaseline: true,
    baselineDir: './e2e/baselines',
  },
};
