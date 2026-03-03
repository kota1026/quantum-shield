import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Governance Proposal Detail E2E Tests
 * Tests for Screen 03: Proposal Detail + Vote Interface + Vote Success
 */

test.describe('Governance Proposal Detail', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to proposal detail page
    await page.goto('/ja/governance/proposals/47');
  });

  test.describe('Page Load & Layout', () => {
    test('should display proposal detail page correctly', async ({ page }) => {
      // Check main elements are visible
      await expect(page.getByRole('main')).toBeVisible();
    });

    test('should display breadcrumb navigation', async ({ page }) => {
      const breadcrumb = page.getByRole('navigation', { name: /Breadcrumb/i });
      await expect(breadcrumb).toBeVisible();
      await expect(page.getByRole('link', { name: /提案一覧|Proposals/i })).toBeVisible();
      await expect(page.getByText('QIP-47')).toBeVisible();
    });
  });

  test.describe('Proposal Header', () => {
    test('should display proposal status badge', async ({ page }) => {
      await expect(page.getByText('投票中').first()).toBeVisible();
    });

    test('should display proposal type badge', async ({ page }) => {
      await expect(page.getByText('パラメータ変更')).toBeVisible();
    });

    test('should display proposal ID', async ({ page }) => {
      await expect(page.getByText('QIP-47')).toBeVisible();
    });

    test('should display proposal title', async ({ page }) => {
      // Verify the h1 heading is present and contains text
      const h1 = page.getByRole('heading', { level: 1 });
      await expect(h1).toBeVisible();
      await expect(h1).not.toBeEmpty();
    });

    test('should display proposer information', async ({ page }) => {
      // Verify proposer label and a truncated address are shown
      await expect(page.getByText(/提案者.*0x[a-fA-F0-9]/i)).toBeVisible();
    });

    test('should display creation date', async ({ page }) => {
      // Verify creation date label with a date value
      await expect(page.getByText(/作成日.*\d{4}-\d{2}-\d{2}/i)).toBeVisible();
    });

    test('should display comments count', async ({ page }) => {
      // Verify comment count with numeric value
      await expect(page.getByText(/\d+ コメント/)).toBeVisible();
    });
  });

  test.describe('Countdown Timer', () => {
    test('should display voting countdown', async ({ page }) => {
      await expect(page.getByText(/投票終了まで/i)).toBeVisible();
    });

    test('should display time remaining', async ({ page }) => {
      // Check for countdown format (days, hours, minutes, seconds)
      await expect(page.getByText(/\d+日.*\d+時間.*\d+分.*\d+秒/i)).toBeVisible();
    });
  });

  test.describe('Proposal Content', () => {
    test('should display proposal details section', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /提案詳細/i })).toBeVisible();
    });

    test('should display summary section', async ({ page }) => {
      await expect(page.getByText('概要')).toBeVisible();
      // Verify summary section has content text
      const summarySection = page.getByText('概要').locator('..');
      await expect(summarySection).not.toBeEmpty();
    });

    test('should display motivation section', async ({ page }) => {
      await expect(page.getByText('動機')).toBeVisible();
      // Verify motivation section has content text
      const motivationSection = page.getByText('動機').locator('..');
      await expect(motivationSection).not.toBeEmpty();
    });

    test('should display specification section', async ({ page }) => {
      await expect(page.getByText('仕様')).toBeVisible();
      // Verify specification section has content text
      const specSection = page.getByText('仕様').locator('..');
      await expect(specSection).not.toBeEmpty();
    });

    test('should display security considerations section', async ({ page }) => {
      await expect(page.getByText('セキュリティ考慮事項')).toBeVisible();
      // Verify security section has content text
      const securitySection = page.getByText('セキュリティ考慮事項').locator('..');
      await expect(securitySection).not.toBeEmpty();
    });
  });

  test.describe('Timeline', () => {
    test('should display timeline section', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /タイムライン/i })).toBeVisible();
    });

    test('should display proposal created step', async ({ page }) => {
      await expect(page.getByText('提案作成')).toBeVisible();
    });

    test('should display voting period step', async ({ page }) => {
      await expect(page.getByText('投票期間')).toBeVisible();
    });

    test('should display time lock step', async ({ page }) => {
      await expect(page.getByText('タイムロック（7日間）')).toBeVisible();
    });

    test('should display execution step', async ({ page }) => {
      await expect(page.getByText('実行').first()).toBeVisible();
    });
  });

  test.describe('Vote Card', () => {
    test('should display vote section title', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /投票する/i })).toBeVisible();
    });

    test('should display vote distribution bar', async ({ page }) => {
      const progressBar = page.getByRole('progressbar');
      await expect(progressBar).toBeVisible();
    });

    test('should display vote percentages', async ({ page }) => {
      // Verify percentage values are displayed for vote distribution
      const percentages = page.getByText(/^\d+%$/);
      expect(await percentages.count()).toBeGreaterThanOrEqual(2);
    });

    test('should display quorum progress', async ({ page }) => {
      // Verify quorum label with percentage is displayed
      await expect(page.getByText(/定足数.*\d+%/i)).toBeVisible();
      // Verify current quorum progress value
      await expect(page.getByText(/\d+\.?\d*%/).first()).toBeVisible();
    });

    test('should display quorum tooltip on hover', async ({ page }) => {
      const quorumLabel = page.getByText(/定足数.*\d+%/i);
      await quorumLabel.hover();
      await expect(page.getByRole('tooltip')).toBeVisible();
    });

    test('should display user voting power', async ({ page }) => {
      await expect(page.getByText(/あなたの投票力/i)).toBeVisible();
      // Verify voting power is displayed with veQS unit
      await expect(page.getByText(/[\d,]+ veQS/)).toBeVisible();
    });

    test('should display vote buttons', async ({ page }) => {
      await expect(page.getByRole('button', { name: /賛成/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /反対/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /棄権/i })).toBeVisible();
    });
  });

  test.describe('Vote Modal', () => {
    test('should open vote modal when clicking For button', async ({ page }) => {
      await page.getByRole('button', { name: /賛成/i }).click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByText(/投票を確認/i)).toBeVisible();
    });

    test('should display vote confirmation text', async ({ page }) => {
      await page.getByRole('button', { name: /賛成/i }).click();
      await expect(page.getByText(/QIP-47.*賛成/i)).toBeVisible();
    });

    test('should display voting power in modal', async ({ page }) => {
      await page.getByRole('button', { name: /賛成/i }).click();
      // Verify voting power with veQS unit is shown in modal
      await expect(page.getByRole('dialog').getByText(/[\d,]+ veQS/)).toBeVisible();
    });

    test('should close modal when clicking cancel', async ({ page }) => {
      await page.getByRole('button', { name: /賛成/i }).click();
      await page.getByRole('button', { name: /キャンセル/i }).click();
      await expect(page.getByRole('dialog')).not.toBeVisible();
    });

    test('should close modal when clicking X button', async ({ page }) => {
      await page.getByRole('button', { name: /賛成/i }).click();
      await page.getByRole('button', { name: /Close/i }).click();
      await expect(page.getByRole('dialog')).not.toBeVisible();
    });
  });

  test.describe('Vote Success', () => {
    test('should show success screen after voting', async ({ page }) => {
      await page.getByRole('button', { name: /賛成/i }).click();
      await page.getByRole('button', { name: /署名して投票/i }).click();
      await expect(page.getByText(/投票完了/i)).toBeVisible();
    });

    test('should display vote details in success screen', async ({ page }) => {
      await page.getByRole('button', { name: /賛成/i }).click();
      await page.getByRole('button', { name: /署名して投票/i }).click();
      // Verify proposal ID and voting power are shown in success screen
      await expect(page.getByText(/QIP-\d+/)).toBeVisible();
      await expect(page.getByText(/[\d,]+ veQS/)).toBeVisible();
    });

    test('should have back to proposals button', async ({ page }) => {
      await page.getByRole('button', { name: /賛成/i }).click();
      await page.getByRole('button', { name: /署名して投票/i }).click();
      await expect(page.getByRole('link', { name: /提案一覧に戻る/i })).toBeVisible();
    });
  });

  test.describe('Footer', () => {
    test('should display footer links', async ({ page }) => {
      const footerNav = page.getByRole('navigation', { name: /Footer navigation/i });
      await expect(footerNav).toBeVisible();

      await expect(page.getByRole('link', { name: /ガバナンスフォーラム/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /ドキュメント/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /利用規約/i })).toBeVisible();
    });

    test('should display disclaimer text', async ({ page }) => {
      await expect(page.getByText(/ガバナンスへの参加は任意です/i)).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should display properly on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      await expect(page.getByRole('main')).toBeVisible();
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.getByText('投票する')).toBeVisible();
    });

    test('should display properly on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      await expect(page.getByRole('main')).toBeVisible();
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have no accessibility violations', async ({ page }) => {
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should have proper heading hierarchy', async ({ page }) => {
      const h1 = page.getByRole('heading', { level: 1 });
      await expect(h1).toHaveCount(1);
    });

    test('should have proper ARIA landmarks', async ({ page }) => {
      await expect(page.getByRole('main')).toBeVisible();
      await expect(page.getByRole('navigation', { name: /Breadcrumb/i })).toBeVisible();
      await expect(page.getByRole('navigation', { name: /Footer navigation/i })).toBeVisible();
    });

    test('modal should have proper ARIA attributes', async ({ page }) => {
      await page.getByRole('button', { name: /賛成/i }).click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    test('vote buttons should be keyboard accessible', async ({ page }) => {
      const forButton = page.getByRole('button', { name: /賛成/i });
      await forButton.focus();
      await expect(forButton).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(page.getByRole('dialog')).toBeVisible();
    });
  });

  test.describe('i18n', () => {
    test('should display Japanese content on /ja/ path', async ({ page }) => {
      await expect(page.getByText('提案詳細')).toBeVisible();
      await expect(page.getByText('投票する')).toBeVisible();
      await expect(page.getByText('タイムライン')).toBeVisible();
    });

    test('should display English content on /en/ path', async ({ page }) => {
      await page.goto('/en/governance/proposals/47');

      await expect(page.getByText('Proposal Details')).toBeVisible();
      await expect(page.getByText('Cast Your Vote')).toBeVisible();
      await expect(page.getByText('Timeline')).toBeVisible();
    });
  });
});
