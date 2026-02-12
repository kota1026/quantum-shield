import { Page } from '@playwright/test';

/**
 * Navigate to a page and wait for the Web3Provider to finish loading.
 *
 * The app wraps all pages in ClientWeb3Provider which dynamically imports
 * wagmi + rainbowkit. Until those load, a "Loading..." spinner is shown.
 * Under parallel test load this can take 30-60s, so we use a generous timeout.
 */
export async function gotoAndWaitForApp(
  page: Page,
  url: string,
  options?: { timeout?: number }
) {
  const timeout = options?.timeout ?? 60000;
  await page.goto(url, { waitUntil: 'commit', timeout });
  // Wait for the Web3Provider loading spinner to disappear.
  // The spinner contains exact text "Loading..." - wait for it to go away.
  // Use a polling approach: first check if spinner is present, then wait for it to hide.
  const spinner = page.locator('p:text-is("Loading...")');
  try {
    // Give the spinner a moment to appear (it may already be visible)
    await spinner.waitFor({ state: 'visible', timeout: 5000 });
  } catch {
    // Spinner may have already disappeared or never appeared (cached load)
  }
  // Now wait for it to disappear
  await spinner.waitFor({ state: 'hidden', timeout });
}
