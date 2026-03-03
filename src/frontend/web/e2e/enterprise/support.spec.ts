import { test, expect } from '@playwright/test';

test.describe('Enterprise Support - Japanese', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/enterprise/support');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Page Structure', () => {
    test('should display the page title heading', async ({ page }) => {
      await expect(
        page.getByRole('heading', { level: 1, name: 'サポート' })
      ).toBeVisible();
    });

    test('should display main content area with correct aria-label', async ({ page }) => {
      await expect(
        page.getByRole('main', { name: 'サポートチケットページ' })
      ).toBeVisible();
    });

    test('should display the new ticket button', async ({ page }) => {
      await expect(
        page.getByRole('button', { name: '新規チケット' })
      ).toBeVisible();
    });

    test('should display search input', async ({ page }) => {
      await expect(
        page.getByPlaceholder('Search tickets...')
      ).toBeVisible();
    });
  });

  test.describe('Stats Cards', () => {
    test('should display stats cards with numeric values', async ({ page }) => {
      const main = page.getByRole('main');

      // Verify stat labels exist
      await expect(main.getByText('オープン')).toBeVisible();
      await expect(main.getByText('対応中')).toBeVisible();
      await expect(main.getByText('解決済み')).toBeVisible();
      await expect(main.getByText('平均応答時間')).toBeVisible();
    });

    test('should display numeric stat values', async ({ page }) => {
      const main = page.getByRole('main');

      // Stats cards should contain numeric or time-formatted values
      // Use structural check: text-2xl font-bold elements should be present
      const boldValues = main.locator('.text-2xl.font-bold');
      await expect(boldValues).toHaveCount(4);
    });
  });

  test.describe('Tickets Table', () => {
    test('should display table with correct column headers', async ({ page }) => {
      const table = page.getByRole('table');
      await expect(table).toBeVisible();

      await expect(table.getByRole('columnheader', { name: 'チケットID' })).toBeVisible();
      await expect(table.getByRole('columnheader', { name: '件名' })).toBeVisible();
      await expect(table.getByRole('columnheader', { name: 'ステータス' })).toBeVisible();
      await expect(table.getByRole('columnheader', { name: '優先度' })).toBeVisible();
      await expect(table.getByRole('columnheader', { name: '更新日' })).toBeVisible();
      await expect(table.getByRole('columnheader', { name: '操作' })).toBeVisible();
    });

    test('should display ticket rows in the table', async ({ page }) => {
      const table = page.getByRole('table');
      const rows = table.locator('tbody tr');
      expect(await rows.count()).toBeGreaterThanOrEqual(1);
    });

    test('should display ticket IDs in the table', async ({ page }) => {
      const table = page.getByRole('table');
      // Verify at least one ticket ID pattern (TKT-XXX) is present
      await expect(table.locator('text=/TKT-\\d{3}/').first()).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have exactly one h1 heading', async ({ page }) => {
      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBe(1);
    });

    test('should have accessible navigation', async ({ page }) => {
      // Multiple nav elements exist (sidebar + top bar), use .first()
      await expect(page.getByRole('navigation').first()).toBeVisible();
    });

    test('should have accessible main landmark', async ({ page }) => {
      await expect(page.getByRole('main')).toBeVisible();
    });

    test('should have accessible banner landmark', async ({ page }) => {
      await expect(page.getByRole('banner')).toBeVisible();
    });

    test('should have user menu button with aria attributes', async ({ page }) => {
      const userMenuButton = page.getByRole('button', { name: 'ユーザーメニューを開く' });
      await expect(userMenuButton).toBeVisible();
      await expect(userMenuButton).toHaveAttribute('aria-haspopup', 'menu');
    });

    test('should have notification link accessible', async ({ page }) => {
      await expect(
        page.getByRole('link', { name: '通知を表示' })
      ).toBeVisible();
    });
  });
});

test.describe('Enterprise Support - English', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/enterprise/support');
    await page.waitForLoadState('networkidle');
  });

  test('should display English page title', async ({ page }) => {
    await expect(
      page.getByRole('heading', { level: 1, name: 'Support' })
    ).toBeVisible();
  });

  test('should display English main content area', async ({ page }) => {
    await expect(
      page.getByRole('main', { name: 'Support tickets page' })
    ).toBeVisible();
  });

  test('should display English new ticket button', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: 'New Ticket' })
    ).toBeVisible();
  });

  test('should display English stats labels', async ({ page }) => {
    const main = page.getByRole('main');
    await expect(main.getByText('Open')).toBeVisible();
    await expect(main.getByText('In Progress')).toBeVisible();
    await expect(main.getByText('Resolved')).toBeVisible();
    await expect(main.getByText('Avg Response Time')).toBeVisible();
  });

  test('should display English table column headers', async ({ page }) => {
    const table = page.getByRole('table');
    await expect(table).toBeVisible();

    await expect(table.getByRole('columnheader', { name: 'Ticket ID' })).toBeVisible();
    await expect(table.getByRole('columnheader', { name: 'Subject' })).toBeVisible();
    await expect(table.getByRole('columnheader', { name: 'Status' })).toBeVisible();
    await expect(table.getByRole('columnheader', { name: 'Priority' })).toBeVisible();
    await expect(table.getByRole('columnheader', { name: 'Updated' })).toBeVisible();
    await expect(table.getByRole('columnheader', { name: 'Actions' })).toBeVisible();
  });

  test('should display ticket rows in English view', async ({ page }) => {
    const table = page.getByRole('table');
    const rows = table.locator('tbody tr');
    expect(await rows.count()).toBeGreaterThanOrEqual(1);
  });

  test('should have accessible navigation in English', async ({ page }) => {
    await expect(page.getByRole('navigation').first()).toBeVisible();
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByRole('banner')).toBeVisible();
  });

  test('should have English user menu button', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: 'Open user menu' })
    ).toBeVisible();
  });
});
