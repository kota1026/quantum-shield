import { test, expect } from '@playwright/test';

test.describe('Admin Protocol Parameters Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/admin/parameters');
  });

  test('should display page header correctly', async ({ page }) => {
    // Check main heading
    await expect(page.getByRole('heading', { name: 'Protocol Parameters', level: 1 })).toBeVisible();

    // Check subtitle
    await expect(page.getByText('プロトコルパラメータ管理・変更リクエスト')).toBeVisible();
  });

  test('should have accessible main landmark', async ({ page }) => {
    const main = page.getByRole('main', { name: 'プロトコルパラメータページ' });
    await expect(main).toBeVisible();
  });

  test('should display Request Change button', async ({ page }) => {
    const button = page.getByRole('button', { name: /Request Change/i });
    await expect(button).toBeVisible();
  });

  test('should display info banner about governance approval', async ({ page }) => {
    const alert = page.getByRole('alert');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText('ガバナンス承認が必要');
  });

  test('should display all four parameter categories', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Time Lock Parameters' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Prover Parameters' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Fee Parameters' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Security Parameters' })).toBeVisible();
  });

  test('should display Time Lock parameters', async ({ page }) => {
    await expect(page.getByText('Minimum Lock Period')).toBeVisible();
    await expect(page.getByText('Maximum Lock Period')).toBeVisible();
    await expect(page.getByText('Early Unlock Penalty')).toBeVisible();
  });

  test('should display Prover parameters', async ({ page }) => {
    await expect(page.getByText('Minimum Stake')).toBeVisible();
    await expect(page.getByText('SLA Target')).toBeVisible();
    await expect(page.getByText('Slashing Rate')).toBeVisible();
  });

  test('should display Fee parameters', async ({ page }) => {
    await expect(page.getByText('Lock Fee')).toBeVisible();
    await expect(page.getByText('Unlock Fee')).toBeVisible();
    await expect(page.getByText('Enterprise Discount')).toBeVisible();
  });

  test('should display Security parameters', async ({ page }) => {
    await expect(page.getByText('Challenge Period')).toBeVisible();
    await expect(page.getByText('Multi-sig Threshold')).toBeVisible();
    await expect(page.getByText('Quantum Algorithm')).toBeVisible();
  });

  test('should display Locked badges for immutable parameters', async ({ page }) => {
    // Count locked badges - should have 6 (minLock, earlyUnlock, slashing, multiSig, quantum, slashing)
    const lockedBadges = page.getByText('Locked');
    await expect(lockedBadges.first()).toBeVisible();
  });

  test('should display Adjustable badges for changeable parameters', async ({ page }) => {
    const adjustableBadges = page.getByText('Adjustable');
    await expect(adjustableBadges.first()).toBeVisible();
  });

  test('should display parameter values', async ({ page }) => {
    // Protocol-defined parameter labels and their values should be visible
    // These are static protocol constants, not dynamic data
    await expect(page.getByText('Dilithium')).toBeVisible(); // Quantum algorithm (protocol constant)
    await expect(page.getByText('3/5')).toBeVisible(); // Multi-sig threshold (protocol constant)
  });

  test('should display parameter units', async ({ page }) => {
    await expect(page.getByText('days').first()).toBeVisible();
    await expect(page.getByText('USDC')).toBeVisible();
    await expect(page.getByText('uptime')).toBeVisible();
    await expect(page.getByText('signers')).toBeVisible();
    await expect(page.getByText('NIST approved')).toBeVisible();
  });

  test('should have History links in each category', async ({ page }) => {
    const historyLinks = page.getByText('History →');
    await expect(historyLinks).toHaveCount(4);
  });

  test('should have keyboard accessible parameter items', async ({ page }) => {
    const paramItem = page.locator('[role="button"]').first();
    await expect(paramItem).toHaveAttribute('tabindex', '0');
  });

  test('should have hover state on parameter items', async ({ page }) => {
    const paramItem = page.locator('[role="button"]').first();
    await expect(paramItem).toHaveCSS('cursor', 'pointer');
  });

  test('should work in English locale', async ({ page }) => {
    await page.goto('/en/admin/parameters');

    await expect(page.getByRole('heading', { name: 'Protocol Parameters', level: 1 })).toBeVisible();
    await expect(page.getByText('Protocol Parameter Management & Change Requests')).toBeVisible();
    await expect(page.getByText('Parameter changes require governance approval')).toBeVisible();
  });
});
