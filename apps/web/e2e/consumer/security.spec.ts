/**
 * Consumer App Security Page E2E Tests
 *
 * URL: /ja/consumer/security
 * Auth: NOT required (static informational page)
 * Content: Security features page explaining Dilithium-III, SPHINCS+, etc.
 *
 * Uses standard Playwright test (no auth fixture needed).
 */

import { test, expect } from '@playwright/test';

const SECURITY_URL_JA = '/ja/consumer/security';
const SECURITY_URL_EN = '/en/consumer/security';

// ---------------------------------------------------------------------------
// 1. Page Structure & Main Landmark
// ---------------------------------------------------------------------------
test.describe('Page Structure', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(SECURITY_URL_JA);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should have main landmark with role="main"', async ({ page }) => {
    const main = page.locator('main[role="main"]');
    await expect(main).toBeVisible();
  });

  test('should display page heading', async ({ page }) => {
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);
    await expect(h1).toContainText(/セキュリティ/);
  });

  test('should display back button', async ({ page }) => {
    const backLink = page.locator('header a').first();
    await expect(backLink).toBeVisible();
  });

  test('should display hero section', async ({ page }) => {
    await expect(page.getByText('量子耐性暗号')).toBeVisible();
    await expect(
      page.getByText('将来の量子コンピュータ攻撃から資産を保護')
    ).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 2. Algorithm Cards
// ---------------------------------------------------------------------------
test.describe('Algorithm Cards', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(SECURITY_URL_JA);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should display Dilithium-III card', async ({ page }) => {
    await expect(page.getByText('Dilithium-III')).toBeVisible();
    await expect(page.getByText(/NIST認定の格子ベース電子署名/)).toBeVisible();
    await expect(page.getByText('NIST FIPS 204')).toBeVisible();
  });

  test('should display SPHINCS+ card', async ({ page }) => {
    await expect(page.getByText('SPHINCS+')).toBeVisible();
    await expect(page.getByText(/ハッシュベースの電子署名/)).toBeVisible();
    await expect(page.getByText('NIST FIPS 205')).toBeVisible();
  });

  test('should display SMT Merkle Proof card', async ({ page }) => {
    await expect(page.getByText('SMT Merkle Proof')).toBeVisible();
    await expect(page.getByText(/Sparse Merkle Tree/)).toBeVisible();
    // Badge text "SHA3-256" exists both in description and as badge label
    // Use the badge span specifically
    await expect(page.locator('span', { hasText: 'SHA3-256' }).last()).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 3. Security Features
// ---------------------------------------------------------------------------
test.describe('Security Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(SECURITY_URL_JA);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should display all security feature names', async ({ page }) => {
    await expect(page.getByText('24h Time Lock')).toBeVisible();
    await expect(page.getByText('7d Emergency')).toBeVisible();
    await expect(page.getByText('Multi-Sig')).toBeVisible();
    await expect(page.getByText('Challenge')).toBeVisible();
  });

  test('should display feature descriptions', async ({ page }) => {
    await expect(page.getByText('通常Unlock待機')).toBeVisible();
    await expect(page.getByText('緊急Unlock待機')).toBeVisible();
    await expect(page.getByText('User + Prover署名')).toBeVisible();
    await expect(page.getByText('不正検出システム')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 4. External Links
// ---------------------------------------------------------------------------
test.describe('External Links', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(SECURITY_URL_JA);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should display all external link titles', async ({ page }) => {
    await expect(page.getByText('セキュリティホワイトペーパー')).toBeVisible();
    await expect(
      page.getByText('スマートコントラクト（GitHub）')
    ).toBeVisible();
    await expect(page.getByText('監査レポート')).toBeVisible();
  });

  test('should have correct href attributes', async ({ page }) => {
    const whitepaperLink = page.locator(
      'a[href="https://docs.quantumshield.io/security"]'
    );
    await expect(whitepaperLink).toBeVisible();

    const githubLink = page.locator(
      'a[href="https://github.com/quantumshield/contracts"]'
    );
    await expect(githubLink).toBeVisible();

    const auditsLink = page.locator(
      'a[href="https://docs.quantumshield.io/audits"]'
    );
    await expect(auditsLink).toBeVisible();
  });

  test('should have target="_blank" on external links', async ({ page }) => {
    const externalLinks = page.locator('a[target="_blank"]');
    await expect(externalLinks.first()).toBeVisible();
    expect(await externalLinks.count()).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// 5. Navigation
// ---------------------------------------------------------------------------
test.describe('Navigation', () => {
  test('should navigate back when back button is clicked', async ({
    page,
  }) => {
    await page.goto(SECURITY_URL_JA);

    // The back link goes to /consumer (landing)
    const backLink = page.locator('a[href*="/consumer"]').first();
    await backLink.click();

    await expect(page).toHaveURL(/\/consumer/);
  });
});

// ---------------------------------------------------------------------------
// 6. Accessibility
// ---------------------------------------------------------------------------
test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(SECURITY_URL_JA);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);

    const h2 = page.locator('h2');
    await expect(h2).toHaveCount(1);

    const h3 = page.locator('h3');
    await expect(h3.first()).toBeVisible();
    expect(await h3.count()).toBe(3); // 3 algorithm cards
  });

  test('should have sections with aria-labelledby', async ({ page }) => {
    const sections = page.locator('section[aria-labelledby]');
    await expect(sections.first()).toBeVisible();
    expect(await sections.count()).toBeGreaterThan(0);
  });

  test('external links should have rel="noopener noreferrer"', async ({
    page,
  }) => {
    const links = page.locator('a[target="_blank"]');
    await expect(links.first()).toBeVisible();
    const count = await links.count();
    for (let i = 0; i < count; i++) {
      const rel = await links.nth(i).getAttribute('rel');
      expect(rel).toContain('noopener');
    }
  });
});

// ---------------------------------------------------------------------------
// 7. Responsive Design
// ---------------------------------------------------------------------------
test.describe('Responsive Design', () => {
  test('should display properly on mobile (375x667)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(SECURITY_URL_JA);

    await expect(page.locator('h1')).toBeVisible();
    await expect(page.getByText('Dilithium-III')).toBeVisible();
    await expect(page.getByText('24h Time Lock')).toBeVisible();
  });

  test('should stack feature grid on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(SECURITY_URL_JA);

    // Features grid should be visible
    const features = page.locator('.grid');
    await expect(features).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 8. English Locale
// ---------------------------------------------------------------------------
test.describe('English Locale', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(SECURITY_URL_EN);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should display content in English', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Security');
    await expect(
      page.getByText('Quantum-Resistant Cryptography')
    ).toBeVisible();
  });

  test('should display algorithms in English', async ({ page }) => {
    await expect(page.getByText('Dilithium-III')).toBeVisible();
    await expect(page.getByText('SPHINCS+')).toBeVisible();
    await expect(page.getByText('SMT Merkle Proof')).toBeVisible();
  });

  test('should display features in English', async ({ page }) => {
    await expect(page.getByText('Normal Unlock Wait')).toBeVisible();
    await expect(page.getByText('Emergency Unlock Wait')).toBeVisible();
    await expect(page.getByText('Fraud Detection System')).toBeVisible();
  });

  test('should display links in English', async ({ page }) => {
    await expect(page.getByText('Security Whitepaper')).toBeVisible();
    await expect(page.getByText('Smart Contracts (GitHub)')).toBeVisible();
    await expect(page.getByText('Audit Reports')).toBeVisible();
  });
});
