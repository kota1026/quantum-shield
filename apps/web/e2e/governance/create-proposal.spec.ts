import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Governance Create Proposal E2E Tests
 * Tests for Screen 04: Create Proposal (3-step wizard)
 */

test.describe('Governance Create Proposal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/governance/create');
  });

  test.describe('Page Load & Layout', () => {
    test('should display create proposal page correctly', async ({ page }) => {
      await expect(page.getByRole('main')).toBeVisible();
    });

    test('should display page header with title', async ({ page }) => {
      await expect(page.getByRole('heading', { level: 1, name: /提案作成/i })).toBeVisible();
    });

    test('should display stepper with 3 steps', async ({ page }) => {
      await expect(page.getByText('タイプ')).toBeVisible();
      await expect(page.getByText('詳細')).toBeVisible();
      await expect(page.getByText('プレビュー')).toBeVisible();
    });
  });

  test.describe('Step 1: Type Selection', () => {
    test('should display step 1 title', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /提案タイプを選択/i })).toBeVisible();
    });

    test('should display 3 type cards', async ({ page }) => {
      await expect(page.getByText('パラメータ変更').first()).toBeVisible();
      await expect(page.getByText('コントラクトアップグレード')).toBeVisible();
      await expect(page.getByText('評議会変更')).toBeVisible();
    });

    test('should display quorum for each type', async ({ page }) => {
      await expect(page.getByText('定足数: 4%')).toBeVisible();
      await expect(page.getByText('定足数: 8%')).toBeVisible();
      await expect(page.getByText('定足数: 15%')).toBeVisible();
    });

    test('should display proposal requirement box', async ({ page }) => {
      await expect(page.getByText('提案要件')).toBeVisible();
      await expect(page.getByText(/10,000 veQS/i)).toBeVisible();
    });

    test('should display user veQS balance', async ({ page }) => {
      await expect(page.getByText(/125,000 veQS/i)).toBeVisible();
    });

    test('Next button should be disabled initially', async ({ page }) => {
      const nextButton = page.getByRole('button', { name: /次へ/i });
      await expect(nextButton).toBeDisabled();
    });

    test('should enable Next button after selecting type', async ({ page }) => {
      await page.getByText('パラメータ変更').first().click();
      const nextButton = page.getByRole('button', { name: /次へ/i });
      await expect(nextButton).toBeEnabled();
    });

    test('type card should be highlighted when selected', async ({ page }) => {
      const paramCard = page.getByText('パラメータ変更').first().locator('..');
      await paramCard.click();
      await expect(paramCard).toHaveAttribute('aria-pressed', 'true');
    });
  });

  test.describe('Step 2: Details', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to step 2
      await page.getByText('パラメータ変更').first().click();
      await page.getByRole('button', { name: /次へ/i }).click();
    });

    test('should display step 2 title', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /提案の詳細/i })).toBeVisible();
    });

    test('should display title input', async ({ page }) => {
      await expect(page.getByLabel(/タイトル/i)).toBeVisible();
    });

    test('should display description textarea', async ({ page }) => {
      await expect(page.getByLabel(/説明/i)).toBeVisible();
    });

    test('should display forum link input', async ({ page }) => {
      await expect(page.getByLabel(/フォーラムリンク/i)).toBeVisible();
    });

    test('should show character count for title', async ({ page }) => {
      const titleInput = page.getByLabel(/タイトル/i);
      await titleInput.fill('Test Title');
      await expect(page.getByText('10/100')).toBeVisible();
    });

    test('Next button should be disabled without required fields', async ({ page }) => {
      const nextButton = page.getByRole('button', { name: /次へ: プレビュー/i });
      await expect(nextButton).toBeDisabled();
    });

    test('should enable Next button when required fields are filled', async ({ page }) => {
      await page.getByLabel(/タイトル/i).fill('Test Proposal Title');
      await page.getByLabel(/説明/i).fill('This is a test proposal description');
      const nextButton = page.getByRole('button', { name: /次へ: プレビュー/i });
      await expect(nextButton).toBeEnabled();
    });

    test('should go back to step 1 when clicking Back', async ({ page }) => {
      await page.getByRole('button', { name: /戻る/i }).click();
      await expect(page.getByRole('heading', { name: /提案タイプを選択/i })).toBeVisible();
    });
  });

  test.describe('Step 3: Preview', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to step 3
      await page.getByText('パラメータ変更').first().click();
      await page.getByRole('button', { name: /次へ/i }).click();
      await page.getByLabel(/タイトル/i).fill('Test Proposal Title');
      await page.getByLabel(/説明/i).fill('This is a test proposal description');
      await page.getByRole('button', { name: /次へ: プレビュー/i }).click();
    });

    test('should display step 3 title', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /確認して提出/i })).toBeVisible();
    });

    test('should display summary grid', async ({ page }) => {
      await expect(page.getByText('提案タイプ')).toBeVisible();
      await expect(page.getByText('必要定足数')).toBeVisible();
      await expect(page.getByText('投票期間')).toBeVisible();
      await expect(page.getByText('タイムロック')).toBeVisible();
    });

    test('should display preview title', async ({ page }) => {
      await expect(page.getByText('Test Proposal Title')).toBeVisible();
    });

    test('should display preview description', async ({ page }) => {
      await expect(page.getByText('This is a test proposal description')).toBeVisible();
    });

    test('should display warning box', async ({ page }) => {
      await expect(page.getByText('重要なお知らせ')).toBeVisible();
    });

    test('should have submit button', async ({ page }) => {
      await expect(page.getByRole('button', { name: /署名して提案を提出/i })).toBeVisible();
    });

    test('should show success screen after submit', async ({ page }) => {
      await page.getByRole('button', { name: /署名して提案を提出/i }).click();
      await expect(page.getByText(/提案が作成されました/i)).toBeVisible();
    });
  });

  test.describe('Success Screen', () => {
    test.beforeEach(async ({ page }) => {
      // Complete the wizard
      await page.getByText('パラメータ変更').first().click();
      await page.getByRole('button', { name: /次へ/i }).click();
      await page.getByLabel(/タイトル/i).fill('Test Proposal Title');
      await page.getByLabel(/説明/i).fill('This is a test proposal description');
      await page.getByRole('button', { name: /次へ: プレビュー/i }).click();
      await page.getByRole('button', { name: /署名して提案を提出/i }).click();
    });

    test('should display success message', async ({ page }) => {
      await expect(page.getByText(/提案が作成されました/i)).toBeVisible();
    });

    test('should display proposal ID', async ({ page }) => {
      await expect(page.getByText('QIP-48')).toBeVisible();
    });

    test('should have View Proposal button', async ({ page }) => {
      await expect(page.getByRole('link', { name: /提案を見る/i })).toBeVisible();
    });

    test('should have Back to Proposals button', async ({ page }) => {
      await expect(page.getByRole('link', { name: /提案一覧に戻る/i })).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should display properly on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await expect(page.getByRole('main')).toBeVisible();
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

    test('type cards should stack on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await expect(page.getByText('パラメータ変更').first()).toBeVisible();
      await expect(page.getByText('コントラクトアップグレード')).toBeVisible();
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

    test('form inputs should have labels', async ({ page }) => {
      await page.getByText('パラメータ変更').first().click();
      await page.getByRole('button', { name: /次へ/i }).click();

      const titleInput = page.getByLabel(/タイトル/i);
      await expect(titleInput).toBeVisible();

      const summaryInput = page.getByLabel(/説明/i);
      await expect(summaryInput).toBeVisible();
    });

    test('type cards should be keyboard accessible', async ({ page }) => {
      const paramCard = page.getByRole('button', { name: /パラメータ変更/i });
      await paramCard.focus();
      await expect(paramCard).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(paramCard).toHaveAttribute('aria-pressed', 'true');
    });
  });

  test.describe('i18n', () => {
    test('should display Japanese content on /ja/ path', async ({ page }) => {
      await expect(page.getByText('提案作成')).toBeVisible();
      await expect(page.getByText('提案タイプを選択')).toBeVisible();
    });

    test('should display English content on /en/ path', async ({ page }) => {
      await page.goto('/en/governance/create');
      await expect(page.getByText('Create Proposal')).toBeVisible();
      await expect(page.getByText('Select Proposal Type')).toBeVisible();
    });
  });
});
