import { test, expect } from '@playwright/test';
import { gotoAndWaitForApp } from '../helpers/wait-for-app';

/**
 * Governance Create Proposal E2E Tests
 * Tests for the CreateProposal component at /governance/create
 *
 * 3-step wizard: Type -> Details -> Preview -> Success
 * Type options: Parameter Change, Contract Upgrade, Signal Proposal
 */

test.describe('Governance Create Proposal', () => {
  test.setTimeout(90000);

  test.beforeEach(async ({ page }) => {
    await gotoAndWaitForApp(page, '/ja/governance/create');
  });

  test.describe('Page Load & Layout', () => {
    test('should display create proposal page correctly', async ({ page }) => {
      await expect(page.getByRole('main')).toBeVisible();
    });

    test('should display page header with title', async ({ page }) => {
      const h1 = page.getByRole('heading', { level: 1 });
      await expect(h1).toBeVisible();
      await expect(h1).toContainText(/提案作成|Create Proposal/);
    });

    test('should display stepper with 3 steps', async ({ page }) => {
      // t('stepper.type') = "タイプ", t('stepper.details') = "詳細", t('stepper.preview') = "プレビュー"
      await expect(page.getByText(/タイプ|Type/).first()).toBeVisible();
      await expect(page.getByText(/詳細|Details/).first()).toBeVisible();
      await expect(page.getByText(/プレビュー|Preview/).first()).toBeVisible();
    });
  });

  test.describe('Step 1: Type Selection', () => {
    test('should display step 1 title', async ({ page }) => {
      // t('step1.title') = "提案タイプを選択"
      await expect(page.getByText(/提案タイプを選択|Select Proposal Type/).first()).toBeVisible();
    });

    test('should display 3 type cards', async ({ page }) => {
      // The 3 types: parameter, upgrade, signal
      await expect(page.getByText(/パラメータ変更|Parameter Change/).first()).toBeVisible();
      await expect(page.getByText(/コントラクトアップグレード|Contract Upgrade/).first()).toBeVisible();
      await expect(page.getByText(/シグナル提案|Signal Proposal/).first()).toBeVisible();
    });

    test('should display quorum for each type', async ({ page }) => {
      // t('step1.types.parameter.quorum') = "定足数: 4%"
      await expect(page.getByText(/定足数: 4%|Quorum: 4%/).first()).toBeVisible();
      await expect(page.getByText(/定足数: 8%|Quorum: 8%/).first()).toBeVisible();
      await expect(page.getByText(/定足数: 3%|Quorum: 3%/).first()).toBeVisible();
    });

    test('should display proposal requirement box', async ({ page }) => {
      // t('step1.requirement.title') = "提案要件"
      await expect(page.getByText(/提案要件|Proposal Requirement/).first()).toBeVisible();
      await expect(page.getByText(/10,000 veQS/).first()).toBeVisible();
    });

    test('should display user veQS balance', async ({ page }) => {
      await expect(page.getByText(/125,000 veQS/).first()).toBeVisible();
    });

    test('Next button should be disabled initially', async ({ page }) => {
      // t('step1.next') = "次へ: 詳細入力"
      const nextButton = page.getByRole('button', { name: /次へ|Next/ });
      await expect(nextButton).toBeDisabled();
    });

    test('should enable Next button after selecting type', async ({ page }) => {
      const paramButton = page.getByRole('button', { name: /パラメータ変更|Parameter Change/ });
      await paramButton.click();
      const nextButton = page.getByRole('button', { name: /次へ|Next/ });
      await expect(nextButton).toBeEnabled();
    });

    test('type card should be highlighted when selected', async ({ page }) => {
      const paramButton = page.getByRole('button', { name: /パラメータ変更|Parameter Change/ });
      await paramButton.click();
      await expect(paramButton).toHaveAttribute('aria-pressed', 'true');
    });

    test('should have Cancel button', async ({ page }) => {
      // t('step1.cancel') = "キャンセル"
      await expect(page.getByRole('link', { name: /キャンセル|Cancel/ })).toBeVisible();
    });
  });

  test.describe('Step 2: Details', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to step 2 - click type card then next
      const paramButton = page.getByRole('button', { name: /パラメータ変更|Parameter Change/ });
      await paramButton.click();
      await page.getByRole('button', { name: /次へ|Next/ }).click();
    });

    test('should display step 2 title', async ({ page }) => {
      // t('step2.title') = "提案の詳細"
      await expect(page.getByText(/提案の詳細|Proposal Details/).first()).toBeVisible({ timeout: 10000 });
    });

    test('should display title input', async ({ page }) => {
      // Label: t('step2.titleLabel') = "タイトル"
      await expect(page.getByLabel(/タイトル|Title/)).toBeVisible();
    });

    test('should display description textarea', async ({ page }) => {
      // Label: t('step2.summaryLabel') = "説明"
      await expect(page.getByLabel(/説明|Description/)).toBeVisible();
    });

    test('should display forum link input', async ({ page }) => {
      // Label: t('step2.forumLinkLabel') = "フォーラムリンク"
      await expect(page.getByLabel(/フォーラムリンク|Forum/)).toBeVisible();
    });

    test('should show character count for title', async ({ page }) => {
      const titleInput = page.getByLabel(/タイトル|Title/);
      await titleInput.fill('Test Title');
      await expect(page.getByText('10/100')).toBeVisible();
    });

    test('Next button should be disabled without required fields', async ({ page }) => {
      // t('step2.next') = "次へ: プレビュー"
      const nextButton = page.getByRole('button', { name: /次へ.*プレビュー|Next.*Preview/ });
      await expect(nextButton).toBeDisabled();
    });

    test('should enable Next button when required fields are filled', async ({ page }) => {
      await page.getByLabel(/タイトル|Title/).fill('Test Proposal Title');
      await page.getByLabel(/説明|Description/).fill('This is a test proposal description');
      const nextButton = page.getByRole('button', { name: /次へ.*プレビュー|Next.*Preview/ });
      await expect(nextButton).toBeEnabled();
    });

    test('should go back to step 1 when clicking Back', async ({ page }) => {
      // t('step2.back') = "戻る"
      await page.getByRole('button', { name: /戻る|Back/ }).click();
      await expect(page.getByText(/提案タイプを選択|Select Proposal Type/).first()).toBeVisible();
    });

    test('should display markdown hint', async ({ page }) => {
      // t('step2.summaryHint') = "Markdown形式に対応しています"
      await expect(page.getByText(/Markdown/).first()).toBeVisible();
    });
  });

  test.describe('Step 3: Preview', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to step 3
      const paramButton = page.getByRole('button', { name: /パラメータ変更|Parameter Change/ });
      await paramButton.click();
      await page.getByRole('button', { name: /次へ|Next/ }).click();
      await page.getByLabel(/タイトル|Title/).fill('Test Proposal Title');
      await page.getByLabel(/説明|Description/).fill('This is a test proposal description');
      await page.getByRole('button', { name: /次へ.*プレビュー|Next.*Preview/ }).click();
    });

    test('should display step 3 title', async ({ page }) => {
      // t('step3.title') = "確認して提出"
      await expect(page.getByText(/確認して提出|Review & Submit/).first()).toBeVisible({ timeout: 10000 });
    });

    test('should display summary grid labels', async ({ page }) => {
      // t('step3.summary.*')
      await expect(page.getByText(/提案タイプ|Proposal Type/).first()).toBeVisible();
      await expect(page.getByText(/必要定足数|Required Quorum/).first()).toBeVisible();
      await expect(page.getByText(/投票期間|Voting Period/).first()).toBeVisible();
      await expect(page.getByText(/タイムロック|Time Lock/).first()).toBeVisible();
    });

    test('should display preview title', async ({ page }) => {
      await expect(page.getByText('Test Proposal Title').first()).toBeVisible();
    });

    test('should display preview description', async ({ page }) => {
      await expect(page.getByText('This is a test proposal description').first()).toBeVisible();
    });

    test('should display warning box', async ({ page }) => {
      // t('step3.warning.title') = "重要なお知らせ"
      const warning = page.getByText(/重要なお知らせ|Important Notice/).first();
      await warning.scrollIntoViewIfNeeded();
      await expect(warning).toBeVisible({ timeout: 10000 });
    });

    test('should have submit button', async ({ page }) => {
      // t('step3.submit') = "署名して提案を提出"
      const submit = page.getByRole('button', { name: /署名して提案を提出|Sign & Submit Proposal/ });
      await submit.scrollIntoViewIfNeeded();
      await expect(submit).toBeVisible({ timeout: 10000 });
    });

    test('should show success screen after submit', async ({ page }) => {
      const submit = page.getByRole('button', { name: /署名して提案を提出|Sign & Submit Proposal/ });
      await submit.scrollIntoViewIfNeeded();
      await submit.click();
      // t('success.title') = "提案が作成されました！"
      await expect(page.getByText(/提案が作成されました|Proposal Created/).first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Success Screen', () => {
    test.beforeEach(async ({ page }) => {
      // Complete the wizard
      const paramButton = page.getByRole('button', { name: /パラメータ変更|Parameter Change/ });
      await paramButton.click();
      await page.getByRole('button', { name: /次へ|Next/ }).click();
      await page.getByLabel(/タイトル|Title/).fill('Test Proposal Title');
      await page.getByLabel(/説明|Description/).fill('This is a test proposal description');
      await page.getByRole('button', { name: /次へ.*プレビュー|Next.*Preview/ }).click();
      const submit = page.getByRole('button', { name: /署名して提案を提出|Sign & Submit Proposal/ });
      await submit.scrollIntoViewIfNeeded();
      await submit.click();
    });

    test('should display success message', async ({ page }) => {
      await expect(page.getByText(/提案が作成されました|Proposal Created/).first()).toBeVisible({ timeout: 10000 });
    });

    test('should display proposal ID', async ({ page }) => {
      await expect(page.getByText('QIP-48').first()).toBeVisible({ timeout: 10000 });
    });

    test('should have View Proposal link', async ({ page }) => {
      // t('success.viewProposal') = "提案を見る"
      await expect(page.getByRole('link', { name: /提案を見る|View Proposal/ })).toBeVisible();
    });

    test('should have Back to Proposals link', async ({ page }) => {
      // t('success.backToProposals') = "提案一覧に戻る"
      await expect(page.getByRole('link', { name: /提案一覧に戻る|Back to Proposals/ })).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should display properly on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await expect(page.getByRole('main')).toBeVisible();
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

    test('type cards should be visible on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await expect(page.getByText(/パラメータ変更|Parameter Change/).first()).toBeVisible();
      await expect(page.getByText(/コントラクトアップグレード|Contract Upgrade/).first()).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      const h1 = page.getByRole('heading', { level: 1 });
      await expect(h1).toHaveCount(1);
    });

    test('form inputs should have labels', async ({ page }) => {
      const paramButton = page.getByRole('button', { name: /パラメータ変更|Parameter Change/ });
      await paramButton.click();
      await page.getByRole('button', { name: /次へ|Next/ }).click();

      const titleInput = page.getByLabel(/タイトル|Title/);
      await expect(titleInput).toBeVisible();

      const summaryInput = page.getByLabel(/説明|Description/);
      await expect(summaryInput).toBeVisible();
    });

    test('type cards should be keyboard accessible', async ({ page }) => {
      const paramCard = page.getByRole('button', { name: /パラメータ変更|Parameter Change/ });
      await paramCard.focus();
      await expect(paramCard).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(paramCard).toHaveAttribute('aria-pressed', 'true');
    });
  });

  test.describe('i18n', () => {
    test('should display Japanese content on /ja/ path', async ({ page }) => {
      await expect(page.getByText(/提案作成/).first()).toBeVisible();
      await expect(page.getByText(/提案タイプを選択/).first()).toBeVisible();
    });

    test('should display English content on /en/ path', async ({ page }) => {
      await gotoAndWaitForApp(page, '/en/governance/create');

      await expect(page.getByText('Create Proposal').first()).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('Select Proposal Type').first()).toBeVisible({ timeout: 10000 });
    });
  });
});
