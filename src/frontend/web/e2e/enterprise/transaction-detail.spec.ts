import { test, expect } from '@playwright/test';

test.describe('Enterprise Transaction Detail', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/enterprise/transactions/1');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Page Structure', () => {
    test('should display the page title', async ({ page }) => {
      await expect(page.getByRole('heading', { level: 1, name: 'トランザクション詳細' })).toBeVisible();
    });

    test('should display back button', async ({ page }) => {
      await expect(page.getByRole('link', { name: '一覧に戻る' })).toBeVisible();
    });

    test('should display export PDF button', async ({ page }) => {
      await expect(page.getByRole('button', { name: /PDF出力/ })).toBeVisible();
    });

    test('should display main content area', async ({ page }) => {
      await expect(page.getByRole('main', { name: 'トランザクション詳細ページ' })).toBeVisible();
    });
  });

  test.describe('Transaction Information', () => {
    test('should display transaction info card', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'トランザクション情報' })).toBeVisible();
    });

    test('should display status badge', async ({ page }) => {
      await expect(page.getByRole('status').first()).toBeVisible();
      await expect(page.getByText('完了')).toBeVisible();
    });

    test('should display TX Hash', async ({ page }) => {
      await expect(page.getByText('TXハッシュ')).toBeVisible();
      await expect(page.getByText(/0x7a3f/)).toBeVisible();
    });

    test('should display amount', async ({ page }) => {
      await expect(page.getByText('金額')).toBeVisible();
      await expect(page.getByText('5.00 ETH')).toBeVisible();
    });

    test('should display USD value', async ({ page }) => {
      await expect(page.getByText('USD換算')).toBeVisible();
      await expect(page.getByText('$12,450.00')).toBeVisible();
    });

    test('should display quantum protected badge', async ({ page }) => {
      await expect(page.getByText('量子耐性保護')).toBeVisible();
      await expect(page.getByText(/CRYSTALS-Dilithium/)).toBeVisible();
    });
  });

  test.describe('Timeline', () => {
    test('should display timeline card', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'タイムライン' })).toBeVisible();
    });

    test('should display timeline events', async ({ page }) => {
      await expect(page.getByText('トランザクション送信')).toBeVisible();
      await expect(page.getByText('量子署名検証完了')).toBeVisible();
      await expect(page.getByText('Prover証明')).toBeVisible();
      await expect(page.getByText('ブロック確認')).toBeVisible();
      await expect(page.getByText('トランザクション完了')).toBeVisible();
    });

    test('should display timestamps', async ({ page }) => {
      await expect(page.getByText(/2026-01-11 14:32/)).toBeVisible();
    });
  });

  test.describe('Prover Attestation', () => {
    test('should display prover card', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Prover証明' })).toBeVisible();
    });

    test('should display prover details', async ({ page }) => {
      await expect(page.getByText('Prover ID')).toBeVisible();
      await expect(page.getByText('prover_001')).toBeVisible();
      await expect(page.getByText('ステーク額')).toBeVisible();
      await expect(page.getByText('100 ETH')).toBeVisible();
    });
  });

  test.describe('Audit Trail', () => {
    test('should display audit trail card', async ({ page }) => {
      await expect(page.getByRole('heading', { name: '監査証跡' })).toBeVisible();
    });

    test('should display audit details', async ({ page }) => {
      await expect(page.getByText('組織')).toBeVisible();
      await expect(page.getByText('Acme Corp')).toBeVisible();
      await expect(page.getByText('IPアドレス')).toBeVisible();
      await expect(page.getByText('203.0.113.42')).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      const h1 = await page.locator('h1').count();
      expect(h1).toBe(1);

      const h2s = page.locator('h2');
      await expect(h2s).toHaveCount(4);
    });

    test('should have accessible sections', async ({ page }) => {
      await expect(page.locator('#tx-info-title')).toBeVisible();
      await expect(page.locator('#timeline-title')).toBeVisible();
      await expect(page.locator('#prover-title')).toBeVisible();
      await expect(page.locator('#audit-title')).toBeVisible();
    });

    test('should have accessible navigation', async ({ page }) => {
      await expect(page.getByRole('navigation')).toBeVisible();
      await expect(page.getByRole('main')).toBeVisible();
      await expect(page.getByRole('banner')).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should adapt layout for tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await expect(page.getByRole('heading', { name: 'トランザクション詳細' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'トランザクション情報' })).toBeVisible();
    });

    test('should stack columns for mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await expect(page.getByRole('heading', { name: 'トランザクション情報' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'タイムライン' })).toBeVisible();
    });
  });
});

test.describe('Enterprise Transaction Detail - English', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/enterprise/transactions/1');
    await page.waitForLoadState('networkidle');
  });

  test('should display English content', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1, name: 'Transaction Detail' })).toBeVisible();
  });

  test('should display English section titles', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Transaction Information' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Timeline' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Prover Attestation' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Audit Trail' })).toBeVisible();
  });

  test('should display English timeline events', async ({ page }) => {
    await expect(page.getByText('Transaction Submitted')).toBeVisible();
    await expect(page.getByText('Quantum Signature Verified')).toBeVisible();
    await expect(page.getByText('Transaction Complete')).toBeVisible();
  });

  test('should display English buttons', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Back to transaction list' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Export PDF/ })).toBeVisible();
  });
});
