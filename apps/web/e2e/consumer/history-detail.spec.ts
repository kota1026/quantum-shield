import { test, expect } from '@playwright/test';

test.describe('History Detail Page - Lock Complete', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/consumer/history/1');
  });

  test.describe('Page Structure', () => {
    test('should display page title', async ({ page }) => {
      await expect(page.locator('h1')).toContainText('取引詳細');
    });

    test('should display back button with proper aria-label', async ({ page }) => {
      const backButton = page.locator('a[aria-label="履歴に戻る"]');
      await expect(backButton).toBeVisible();
    });

    test('should have main landmark with role', async ({ page }) => {
      const main = page.locator('main[role="main"]');
      await expect(main).toBeVisible();
    });
  });

  test.describe('Transaction Summary', () => {
    test('should display transaction type', async ({ page }) => {
      await expect(page.locator('h2')).toContainText('Lock');
    });

    test('should display transaction status badge', async ({ page }) => {
      await expect(page.getByText('完了')).toBeVisible();
    });

    test('should display transaction amount', async ({ page }) => {
      await expect(page.getByText('5.00 ETH')).toBeVisible();
    });
  });

  test.describe('Transaction Details Section', () => {
    test('should display section heading', async ({ page }) => {
      await expect(page.locator('#details-heading')).toContainText('取引情報');
    });

    test('should display transaction hash', async ({ page }) => {
      await expect(page.getByText('0x7a3f...9c2d')).toBeVisible();
    });

    test('should display date', async ({ page }) => {
      await expect(page.getByText('2026-01-06 14:32')).toBeVisible();
    });

    test('should display block confirmations for complete transaction', async ({ page }) => {
      await expect(page.getByText('12')).toBeVisible();
      await expect(page.getByText('ブロック')).toBeVisible();
    });

    test('should have copy button with proper aria-label', async ({ page }) => {
      const copyButton = page.locator('button[aria-label="取引IDをコピー"]');
      await expect(copyButton).toBeVisible();
    });

    test('should have external link to etherscan', async ({ page }) => {
      const externalLink = page.locator('a[aria-label="Etherscanで取引を確認"]');
      await expect(externalLink).toBeVisible();
      await expect(externalLink).toHaveAttribute('target', '_blank');
      await expect(externalLink).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  test.describe('Timeline Section', () => {
    test('should display timeline heading', async ({ page }) => {
      await expect(page.locator('#timeline-heading')).toContainText('進捗状況');
    });

    test('should display timeline with proper aria-label', async ({ page }) => {
      const timeline = page.locator('ol[aria-label="取引の進捗タイムライン"]');
      await expect(timeline).toBeVisible();
    });

    test('should display timeline steps for lock transaction', async ({ page }) => {
      await expect(page.getByText('取引開始')).toBeVisible();
      await expect(page.getByText('取引確認完了')).toBeVisible();
    });
  });

  test.describe('Actions Section', () => {
    test('should display back to history button', async ({ page }) => {
      const backButton = page.getByRole('link', { name: '履歴に戻る' });
      await expect(backButton).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      const h1 = page.locator('h1');
      await expect(h1).toHaveCount(1);

      const h2 = page.locator('h2');
      await expect(h2).toBeVisible();

      const h3 = page.locator('h3');
      const h3Count = await h3.count();
      expect(h3Count).toBeGreaterThanOrEqual(2);
    });

    test('should have definition list for details', async ({ page }) => {
      const dl = page.locator('dl');
      await expect(dl).toBeVisible();

      const dt = page.locator('dt');
      const dd = page.locator('dd');
      expect(await dt.count()).toBeGreaterThanOrEqual(3);
      expect(await dd.count()).toBeGreaterThanOrEqual(3);
    });

    test('should have visible focus indicators', async ({ page }) => {
      const copyButton = page.locator('button[aria-label="取引IDをコピー"]');
      await copyButton.focus();
      await expect(copyButton).toBeFocused();
    });
  });

  test.describe('Navigation', () => {
    test('should navigate back to history when back button is clicked', async ({ page }) => {
      const backButton = page.locator('a[aria-label="履歴に戻る"]');
      await backButton.click();
      await expect(page).toHaveURL(/\/consumer\/history$/);
    });

    test('should navigate back when bottom action button is clicked', async ({ page }) => {
      const backButton = page.getByRole('link', { name: '履歴に戻る' });
      await backButton.click();
      await expect(page).toHaveURL(/\/consumer\/history$/);
    });
  });
});

test.describe('History Detail Page - Normal Unlock Pending', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/consumer/history/2');
  });

  test('should display pending status', async ({ page }) => {
    await expect(page.getByText('24h待機中')).toBeVisible();
  });

  test('should display remaining time', async ({ page }) => {
    await expect(page.getByText('残り時間')).toBeVisible();
    await expect(page.getByText('23:41:02')).toBeVisible();
  });

  test('should display view unlock status button for pending unlock', async ({ page }) => {
    const unlockButton = page.getByRole('link', { name: 'Unlock状況を確認' });
    await expect(unlockButton).toBeVisible();
  });

  test('should display unlock-specific timeline steps', async ({ page }) => {
    await expect(page.getByText('取引開始')).toBeVisible();
    await expect(page.getByText('署名完了')).toBeVisible();
    await expect(page.getByText('24時間待機中')).toBeVisible();
    await expect(page.getByText('資産解放完了')).toBeVisible();
  });
});

test.describe('History Detail Page - Emergency Unlock Pending', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/consumer/history/3');
  });

  test('should display emergency unlock type', async ({ page }) => {
    await expect(page.locator('h2')).toContainText('Emergency Unlock');
  });

  test('should display 7-day pending status', async ({ page }) => {
    await expect(page.getByText('7日待機中')).toBeVisible();
  });

  test('should display bond amount', async ({ page }) => {
    await expect(page.getByText('Bond（保証金）')).toBeVisible();
    await expect(page.getByText('0.5 ETH')).toBeVisible();
  });

  test('should display emergency-specific timeline steps', async ({ page }) => {
    await expect(page.getByText('取引開始')).toBeVisible();
    await expect(page.getByText('Bond預け入れ完了')).toBeVisible();
    await expect(page.getByText('Challenge期間（7日間）')).toBeVisible();
    await expect(page.getByText('資産解放完了')).toBeVisible();
  });
});

test.describe('History Detail Page - Unlock Complete', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/consumer/history/4');
  });

  test('should display unlock complete type', async ({ page }) => {
    await expect(page.locator('h2')).toContainText('Unlock Complete');
  });

  test('should display complete status', async ({ page }) => {
    await expect(page.getByText('完了')).toBeVisible();
  });

  test('should display block confirmations', async ({ page }) => {
    await expect(page.getByText('12')).toBeVisible();
    await expect(page.getByText('ブロック')).toBeVisible();
  });

  test('should NOT display view unlock status button for complete unlock', async ({ page }) => {
    const unlockButton = page.getByRole('link', { name: 'Unlock状況を確認' });
    await expect(unlockButton).not.toBeVisible();
  });
});

test.describe('History Detail Page (English)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/consumer/history/1');
  });

  test('should display content in English', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Transaction Details');
    await expect(page.locator('#details-heading')).toContainText('Transaction Information');
    await expect(page.locator('#timeline-heading')).toContainText('Progress');
  });

  test('should display status in English', async ({ page }) => {
    await expect(page.getByText('Complete')).toBeVisible();
  });

  test('should display action button in English', async ({ page }) => {
    const backButton = page.getByRole('link', { name: 'Back to History' });
    await expect(backButton).toBeVisible();
  });
});

test.describe('History Detail Page - 404 Handling', () => {
  test('should show 404 for non-existent transaction', async ({ page }) => {
    const response = await page.goto('/ja/consumer/history/999');
    expect(response?.status()).toBe(404);
  });
});

test.describe('History Detail Page - Copy Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/consumer/history/1');
  });

  test('should show copy feedback when copy button is clicked', async ({ page }) => {
    // Grant clipboard permissions
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

    const copyButton = page.locator('button[aria-label="取引IDをコピー"]');
    await copyButton.click();

    // Check for visual feedback (Check icon appears)
    // Note: This depends on the component implementation showing feedback
    await expect(page.getByText('コピーしました')).toBeVisible({ timeout: 1000 });
  });
});

test.describe('History Detail Page - Responsive Design', () => {
  test('should display properly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/ja/consumer/history/1');

    // Header should be visible
    await expect(page.locator('h1')).toBeVisible();

    // Summary card should be visible
    await expect(page.locator('h2')).toBeVisible();

    // Details section should be visible
    await expect(page.locator('#details-heading')).toBeVisible();

    // Timeline should be visible
    await expect(page.locator('#timeline-heading')).toBeVisible();

    // Action buttons should be visible
    await expect(page.getByRole('link', { name: '履歴に戻る' })).toBeVisible();
  });

  test('should display properly on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/ja/consumer/history/1');

    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('main[role="main"]')).toBeVisible();
  });
});
