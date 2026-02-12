import { test, expect } from '@playwright/test';
import { gotoAndWaitForApp } from '../helpers/wait-for-app';

/**
 * Governance Council E2E Tests
 * Tests for the Council component at /governance/council
 *
 * The component uses useCouncil() hook with FALLBACK_COUNCIL:
 * - securityCouncil: [] (empty array)
 * - purposeCommittee: [] (empty array)
 * - vetoHistory: [] (empty array)
 * - systemStatus: { lockContract: false, starkVerifier: false, governance: false, lastCheck: '-' }
 */

test.describe('Governance Council', () => {
  test.setTimeout(90000);

  test.beforeEach(async ({ page }) => {
    await gotoAndWaitForApp(page, '/ja/qs-hub/council');
  });

  test.describe('Page Load & Layout', () => {
    test('should display council page correctly', async ({ page }) => {
      await expect(page.getByRole('main')).toBeVisible();
    });

    test('should display page header with title', async ({ page }) => {
      const h1 = page.getByRole('heading', { level: 1 });
      await expect(h1).toBeVisible();
      await expect(h1).toContainText(/評議会|Council/);
    });

    test('should display page subtitle', async ({ page }) => {
      // t('pageSubtitle') = "セキュリティ評議会と目的委員会の監督機能"
      await expect(
        page.getByText(/セキュリティ評議会と目的委員会|Security Council and Purpose Committee/).first()
      ).toBeVisible({ timeout: 10000 });
    });

    test('should have back to dashboard link', async ({ page }) => {
      // t('backToDashboard') = "ダッシュボードに戻る"
      await expect(page.getByText(/ダッシュボードに戻る|Back to Dashboard/).first()).toBeVisible();
    });
  });

  test.describe('Info Box', () => {
    test('should display info box title', async ({ page }) => {
      // t('infoBox.title') = "評議会拒否権（CP-3）"
      await expect(page.getByText(/評議会拒否権|Council Veto Rights/).first()).toBeVisible();
    });

    test('should display info box description', async ({ page }) => {
      await expect(
        page.getByText(/セキュリティ評議会はセキュリティリスクのある提案を拒否できます|Security Council can veto/).first()
      ).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Security Council Card', () => {
    test('should display Security Council title', async ({ page }) => {
      // t('securityCouncil.title') = "セキュリティ評議会"
      await expect(page.getByText(/セキュリティ評議会|Security Council/).first()).toBeVisible();
    });

    test('should display Security Council status badge', async ({ page }) => {
      // Fallback has empty array, so status is "0/0 アクティブ" or "0/0 Active"
      await expect(page.getByText(/0\/0/).first()).toBeVisible();
    });

    test('should display Security Council description', async ({ page }) => {
      // t('securityCouncil.description') = "プロトコルセキュリティを担当..."
      await expect(page.getByText(/プロトコルセキュリティを担当|Responsible for protocol security/).first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Purpose Committee Card', () => {
    test('should display Purpose Committee title', async ({ page }) => {
      // t('purposeCommittee.title') = "目的委員会"
      await expect(page.getByText(/目的委員会|Purpose Committee/).first()).toBeVisible();
    });

    test('should display Purpose Committee description', async ({ page }) => {
      // t('purposeCommittee.description') = "コア原則..."
      await expect(page.getByText(/コア原則|Core Principles/).first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Tabs Navigation', () => {
    test('should display System Status tab as default', async ({ page }) => {
      // t('tabs.status') = "システムステータス"
      const statusTab = page.getByRole('tab', { name: /システムステータス|System Status/ });
      await expect(statusTab).toHaveAttribute('aria-selected', 'true');
    });

    test('should display Veto History tab', async ({ page }) => {
      // t('tabs.vetoHistory') = "拒否履歴"
      const vetoTab = page.getByRole('tab', { name: /拒否履歴|Veto History/ });
      await expect(vetoTab).toBeVisible();
    });

    test('should switch to Veto History tab on click', async ({ page }) => {
      const vetoTab = page.getByRole('tab', { name: /拒否履歴|Veto History/ });
      await vetoTab.click();
      await expect(vetoTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  test.describe('System Status Tab', () => {
    test('should display all systems operational message', async ({ page }) => {
      // t('systemStatus.allOperational') = "すべてのシステムが正常稼働中"
      await expect(page.getByText(/すべてのシステムが正常稼働中|All Systems Operational/).first()).toBeVisible({ timeout: 10000 });
    });

    test('should display last check time', async ({ page }) => {
      // t('systemStatus.lastCheck') with lastCheck = '-'
      await expect(page.getByText(/最終チェック|Last.*check/).first()).toBeVisible({ timeout: 10000 });
    });

    test('should display Lock Contract status', async ({ page }) => {
      // t('systemStatus.systems.lockContract') = "ロックコントラクト"
      await expect(page.getByText(/ロックコントラクト|Lock Contract/).first()).toBeVisible({ timeout: 10000 });
    });

    test('should display STARK Verifier status', async ({ page }) => {
      // t('systemStatus.systems.starkVerifier') = "STARK検証器"
      await expect(page.getByText(/STARK検証器|STARK Verifier/).first()).toBeVisible({ timeout: 10000 });
    });

    test('should display system status title', async ({ page }) => {
      // t('systemStatus.title') = "緊急システムステータス"
      await expect(page.getByText(/緊急システムステータス|Emergency System Status/).first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Veto History Tab', () => {
    test.beforeEach(async ({ page }) => {
      await page.getByRole('tab', { name: /拒否履歴|Veto History/ }).click();
    });

    test('should display veto history section', async ({ page }) => {
      // t('vetoHistory.title') = "拒否履歴"
      await expect(page.getByText(/拒否履歴|Veto History/).first()).toBeVisible();
    });

    test('should display empty state or veto count', async ({ page }) => {
      // Fallback has empty vetoHistory array
      const hasEmpty = await page.getByText(/拒否履歴はありません|No veto history/).isVisible().catch(() => false);
      const hasCount = await page.getByText(/0件|0 total/).isVisible().catch(() => false);
      const hasVetos = await page.locator('[aria-expanded]').count() > 0;
      expect(hasEmpty || hasCount || hasVetos).toBeTruthy();
    });
  });

  test.describe('Responsive Design', () => {
    test('should display properly on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await expect(page.getByRole('main')).toBeVisible();
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

    test('council cards should be visible on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await expect(page.getByText(/セキュリティ評議会|Security Council/).first()).toBeVisible();
      await expect(page.getByText(/目的委員会|Purpose Committee/).first()).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      const h1 = page.getByRole('heading', { level: 1 });
      await expect(h1).toHaveCount(1);
    });

    test('tabs should have proper ARIA attributes', async ({ page }) => {
      const tablist = page.getByRole('tablist');
      await expect(tablist).toBeVisible();

      const statusTab = page.getByRole('tab', { name: /システムステータス|System Status/ });
      await expect(statusTab).toHaveAttribute('aria-selected', 'true');
      await expect(statusTab).toHaveAttribute('aria-controls', 'status-panel');

      const vetoTab = page.getByRole('tab', { name: /拒否履歴|Veto History/ });
      await expect(vetoTab).toHaveAttribute('aria-selected', 'false');
    });

    test('tabs should be keyboard accessible', async ({ page }) => {
      const statusTab = page.getByRole('tab', { name: /システムステータス|System Status/ });
      await statusTab.focus();
      await expect(statusTab).toBeFocused();
    });

    test('tab panels should have proper role', async ({ page }) => {
      const statusPanel = page.locator('#status-panel');
      await expect(statusPanel).toHaveAttribute('role', 'tabpanel');
    });
  });

  test.describe('Footer', () => {
    test('should display footer disclaimer', async ({ page }) => {
      // t('footer.disclaimer') = "評議会のアクションはCP-5..."
      const disclaimer = page.getByText(/評議会のアクションはCP-5|Council actions are recorded/).first();
      await disclaimer.scrollIntoViewIfNeeded();
      await expect(disclaimer).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('i18n', () => {
    test('should display Japanese content on /ja/ path', async ({ page }) => {
      await expect(page.getByText(/評議会/).first()).toBeVisible();
      await expect(page.getByText(/セキュリティ評議会/).first()).toBeVisible();
      await expect(page.getByText(/システムステータス/).first()).toBeVisible();
    });

    test('should display English content on /en/ path', async ({ page }) => {
      await gotoAndWaitForApp(page, '/en/qs-hub/council');

      await expect(page.getByText('Council').first()).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('Security Council').first()).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('System Status').first()).toBeVisible({ timeout: 10000 });
    });
  });
});
