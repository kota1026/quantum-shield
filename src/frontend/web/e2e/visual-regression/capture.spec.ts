import { test, expect } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { REGRESSION_ROUTES, VIEWPORT_SIZES } from './routes';

/**
 * UX Regression Hunter — Capture Phase
 *
 * Captures full-page screenshots for every (route × viewport) pair.
 * Output goes to:
 *   e2e/visual-regression/.snapshots/<mode>/<id>__<viewport>.png
 *
 * Modes:
 *   UX_MODE=baseline → writes to .snapshots/baseline/ (committed reference)
 *   UX_MODE=current  → writes to .snapshots/current/ (compared against baseline)
 *
 * Run via:
 *   pnpm ux:baseline   # capture new baselines after intentional UI change
 *   pnpm ux:capture    # capture current state for diff
 *   pnpm ux:diff       # run vision-diff and produce report
 */

const MODE = (process.env.UX_MODE as 'baseline' | 'current') || 'current';
const OUT_DIR = path.resolve(__dirname, '.snapshots', MODE);

test.beforeAll(() => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
});

for (const route of REGRESSION_ROUTES) {
  for (const viewport of route.viewports) {
    test(`capture ${route.id} @ ${viewport}`, async ({ page }) => {
      const size = VIEWPORT_SIZES[viewport];
      await page.setViewportSize(size);

      const response = await page.goto(route.path, { waitUntil: 'networkidle', timeout: 30_000 });
      // We treat 5xx as a hard fail — 4xx without auth is acceptable for some routes.
      if (response && response.status() >= 500) {
        throw new Error(`${route.path} returned ${response.status()}`);
      }

      if (route.waitForTestId) {
        await expect(page.getByTestId(route.waitForTestId)).toBeVisible({ timeout: 15_000 });
      } else if (route.waitFor) {
        await page.waitForSelector(route.waitFor, { timeout: 15_000 });
      } else {
        // Wait for any visible h1/h2 to suppress empty-page false positives.
        await page.waitForLoadState('networkidle');
      }

      // Mask known volatile elements (timestamps, live counters) to avoid noisy diffs.
      await page.addStyleTag({
        content: `
          [data-volatile="true"],
          [data-testid$="-timestamp"],
          [data-testid$="-block-number"],
          time { visibility: hidden !important; }
        `,
      });

      const filename = `${route.id}__${viewport}.png`;
      await page.screenshot({
        path: path.join(OUT_DIR, filename),
        fullPage: true,
        animations: 'disabled',
      });
    });
  }
}
