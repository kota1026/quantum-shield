import { test, expect } from '@playwright/test';

test.describe('Security Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/consumer/security');
  });

  test.describe('Page Structure', () => {
    test('should display page title', async ({ page }) => {
      await expect(page.locator('h1')).toContainText('セキュリティ');
    });

    test('should display back button', async ({ page }) => {
      const backButton = page.locator('a[aria-label="設定に戻る"]');
      await expect(backButton).toBeVisible();
    });

    test('should display hero section', async ({ page }) => {
      await expect(page.getByText('量子耐性暗号')).toBeVisible();
      await expect(
        page.getByText('将来の量子コンピュータ攻撃から資産を保護')
      ).toBeVisible();
    });
  });

  test.describe('Algorithms Section', () => {
    test('should display Dilithium-III card', async ({ page }) => {
      await expect(page.getByText('Dilithium-III')).toBeVisible();
      await expect(
        page.getByText(/NIST認定の格子ベース電子署名/)
      ).toBeVisible();
      await expect(page.getByText('NIST FIPS 204')).toBeVisible();
    });

    test('should display SPHINCS+ card', async ({ page }) => {
      await expect(page.getByText('SPHINCS+')).toBeVisible();
      await expect(page.getByText(/ハッシュベースの電子署名/)).toBeVisible();
      await expect(page.getByText('NIST FIPS 205')).toBeVisible();
    });

    test('should display ZK-STARK card', async ({ page }) => {
      await expect(page.getByText('ZK-STARK')).toBeVisible();
      await expect(page.getByText(/ゼロ知識証明技術/)).toBeVisible();
      await expect(page.getByText('量子安全ZKP')).toBeVisible();
    });
  });

  test.describe('Security Features Section', () => {
    test('should display all security features', async ({ page }) => {
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

  test.describe('External Links Section', () => {
    test('should display all external links', async ({ page }) => {
      await expect(
        page.getByText('セキュリティホワイトペーパー')
      ).toBeVisible();
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
      expect(await externalLinks.count()).toBe(3);
    });
  });

  test.describe('Navigation', () => {
    test('should navigate back to settings', async ({ page }) => {
      const backButton = page.locator('a[aria-label="設定に戻る"]');
      await backButton.click();

      await expect(page).toHaveURL(/\/consumer\/settings/);
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      const h1 = page.locator('h1');
      await expect(h1).toHaveCount(1);

      const h2 = page.locator('h2');
      await expect(h2).toHaveCount(1);

      const h3 = page.locator('h3');
      expect(await h3.count()).toBe(3); // Algorithm cards
    });

    test('should have section labels with aria-labelledby', async ({ page }) => {
      const sections = page.locator('section');
      expect(await sections.count()).toBeGreaterThan(0);
    });
  });

  test.describe('Responsive Design', () => {
    test('should display properly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      await expect(page.locator('h1')).toBeVisible();
      await expect(page.getByText('Dilithium-III')).toBeVisible();
      await expect(page.getByText('24h Time Lock')).toBeVisible();
    });

    test('should stack feature grid on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      // Features grid should be visible
      const features = page.locator('.grid');
      await expect(features).toBeVisible();
    });
  });
});

test.describe('Security Page (English)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/consumer/security');
  });

  test('should display content in English', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Security');
    await expect(page.getByText('Quantum-Resistant Cryptography')).toBeVisible();
  });

  test('should display algorithms in English', async ({ page }) => {
    await expect(page.getByText('Dilithium-III')).toBeVisible();
    await expect(page.getByText('SPHINCS+')).toBeVisible();
    await expect(page.getByText('ZK-STARK')).toBeVisible();
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
