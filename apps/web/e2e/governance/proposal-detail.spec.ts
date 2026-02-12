import { test, expect } from '@playwright/test';
import { gotoAndWaitForApp } from '../helpers/wait-for-app';

/**
 * Governance Proposal Detail E2E Tests
 * Tests for the ProposalDetail component at /governance/proposals/[id]
 *
 * The component uses hardcoded mock data with the URL param as proposalId.
 * Key mock data: title = "Increase Prover Bond Amount from 100 ETH to 150 ETH"
 */

test.describe('Governance Proposal Detail', () => {
  test.setTimeout(90000);

  test.beforeEach(async ({ page }) => {
    await gotoAndWaitForApp(page, '/ja/qs-hub/vote/proposals/47');
  });

  test.describe('Page Load & Layout', () => {
    test('should display proposal detail page correctly', async ({ page }) => {
      await expect(page.getByRole('main')).toBeVisible();
    });

    test('should display breadcrumb navigation', async ({ page }) => {
      const breadcrumb = page.getByRole('navigation', { name: /Breadcrumb/ });
      await expect(breadcrumb).toBeVisible();
      // Breadcrumb has link to proposals list: t('breadcrumb.proposals') = "提案一覧"
      await expect(page.getByRole('link', { name: /提案一覧|Proposals/ })).toBeVisible();
    });
  });

  test.describe('Proposal Header', () => {
    test('should display proposal status badge', async ({ page }) => {
      // Status is 'active' -> t('status.active') = "投票中"
      await expect(page.getByText(/投票中|Active/).first()).toBeVisible();
    });

    test('should display proposal type badge', async ({ page }) => {
      // Type is 'parameter' -> t('types.parameter') = "パラメータ変更"
      await expect(page.getByText(/パラメータ変更|Parameter Change/).first()).toBeVisible();
    });

    test('should display proposal ID', async ({ page }) => {
      await expect(page.getByText('47').first()).toBeVisible();
    });

    test('should display proposal title', async ({ page }) => {
      await expect(
        page.getByRole('heading', { level: 1 })
      ).toContainText('Increase Prover Bond Amount');
    });

    test('should display proposer information', async ({ page }) => {
      await expect(page.getByText('0xabc...def')).toBeVisible();
    });

    test('should display creation date', async ({ page }) => {
      await expect(page.getByText('2026-01-08').first()).toBeVisible();
    });

    test('should display comments count', async ({ page }) => {
      await expect(page.getByText(/24/).first()).toBeVisible();
    });
  });

  test.describe('Countdown Timer', () => {
    test('should display voting countdown label', async ({ page }) => {
      // t('countdown.label') = "投票終了まで"
      await expect(page.getByText(/投票終了まで|Voting ends in/).first()).toBeVisible();
    });

    test('should display time remaining', async ({ page }) => {
      // Countdown format uses t('countdown.days') = "日" etc
      await expect(page.getByText(/\d+日|\d+d/).first()).toBeVisible();
    });
  });

  test.describe('Proposal Content', () => {
    test('should display proposal details heading', async ({ page }) => {
      // t('content.title') = "提案詳細"
      const heading = page.getByText(/提案詳細|Proposal Details/).first();
      await heading.scrollIntoViewIfNeeded();
      await expect(heading).toBeVisible({ timeout: 10000 });
    });

    test('should display summary section', async ({ page }) => {
      // t('content.summary') = "概要"
      const summary = page.getByText(/概要|Summary/).first();
      await summary.scrollIntoViewIfNeeded();
      await expect(summary).toBeVisible({ timeout: 10000 });
    });

    test('should display motivation section', async ({ page }) => {
      // t('content.motivation') = "動機"
      const motivation = page.getByText(/動機|Motivation/).first();
      await motivation.scrollIntoViewIfNeeded();
      await expect(motivation).toBeVisible({ timeout: 10000 });
    });

    test('should display specification section', async ({ page }) => {
      // t('content.specification') = "仕様"
      const spec = page.getByText(/仕様|Specification/).first();
      await spec.scrollIntoViewIfNeeded();
      await expect(spec).toBeVisible({ timeout: 10000 });
    });

    test('should display security considerations section', async ({ page }) => {
      // t('content.securityConsiderations') = "セキュリティ考慮事項"
      const security = page.getByText(/セキュリティ考慮事項|Security Considerations/).first();
      await security.scrollIntoViewIfNeeded();
      await expect(security).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Timeline', () => {
    test('should display timeline heading', async ({ page }) => {
      // t('timeline.title') = "タイムライン"
      const timeline = page.getByText(/タイムライン|Timeline/).first();
      await timeline.scrollIntoViewIfNeeded();
      await expect(timeline).toBeVisible({ timeout: 10000 });
    });

    test('should display proposal created step', async ({ page }) => {
      // t('timeline.proposalCreated') = "提案作成"
      const step = page.getByText(/提案作成|Proposal Created/).first();
      await step.scrollIntoViewIfNeeded();
      await expect(step).toBeVisible({ timeout: 10000 });
    });

    test('should display voting period step', async ({ page }) => {
      // t('timeline.votingPeriod') = "投票期間"
      const step = page.getByText(/投票期間|Voting Period/).first();
      await step.scrollIntoViewIfNeeded();
      await expect(step).toBeVisible({ timeout: 10000 });
    });

    test('should display time lock step', async ({ page }) => {
      // t('timeline.timeLock') = "タイムロック（7日間）"
      const step = page.getByText(/タイムロック|Time Lock/).first();
      await step.scrollIntoViewIfNeeded();
      await expect(step).toBeVisible({ timeout: 10000 });
    });

    test('should display execution step', async ({ page }) => {
      // t('timeline.execution') = "実行"
      const step = page.getByText(/実行|Execution/).first();
      await step.scrollIntoViewIfNeeded();
      await expect(step).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Vote Card', () => {
    test('should display vote section title', async ({ page }) => {
      // t('vote.title') = "投票する"
      await expect(page.getByText(/投票する|Cast Your Vote/).first()).toBeVisible({ timeout: 10000 });
    });

    test('should display vote distribution bar', async ({ page }) => {
      const progressBar = page.getByRole('progressbar');
      await expect(progressBar.first()).toBeVisible();
    });

    test('should display vote percentages', async ({ page }) => {
      await expect(page.getByText('72%').first()).toBeVisible();
      await expect(page.getByText('23%').first()).toBeVisible();
      await expect(page.getByText('5%').first()).toBeVisible();
    });

    test('should display user voting power', async ({ page }) => {
      // t('vote.yourPower') = "あなたの投票力"
      await expect(page.getByText(/あなたの投票力|Your Voting Power/).first()).toBeVisible({ timeout: 10000 });
      await expect(page.getByText(/125,000 veQS/).first()).toBeVisible({ timeout: 10000 });
    });

    test('should display vote buttons', async ({ page }) => {
      // t('vote.for') = "賛成", t('vote.against') = "反対", t('vote.abstain') = "棄権"
      await expect(page.getByRole('button', { name: /賛成|For/ }).first()).toBeVisible();
      await expect(page.getByRole('button', { name: /反対|Against/ }).first()).toBeVisible();
      await expect(page.getByRole('button', { name: /棄権|Abstain/ }).first()).toBeVisible();
    });
  });

  test.describe('Vote Modal', () => {
    test('should open vote modal when clicking For button', async ({ page }) => {
      await page.getByRole('button', { name: /賛成|For/ }).first().click();
      await expect(page.getByRole('dialog')).toBeVisible();
      // t('voteModal.title') = "投票を確認"
      await expect(page.getByText(/投票を確認|Confirm Your Vote/).first()).toBeVisible();
    });

    test('should display voting power in modal', async ({ page }) => {
      await page.getByRole('button', { name: /賛成|For/ }).first().click();
      await expect(page.getByText(/125,000 veQS/).first()).toBeVisible();
    });

    test('should close modal when clicking cancel', async ({ page }) => {
      await page.getByRole('button', { name: /賛成|For/ }).first().click();
      // t('voteModal.cancel') = "キャンセル"
      await page.getByRole('button', { name: /キャンセル|Cancel/ }).click();
      await expect(page.getByRole('dialog')).not.toBeVisible();
    });

    test('should close modal when clicking X button', async ({ page }) => {
      await page.getByRole('button', { name: /賛成|For/ }).first().click();
      await page.getByRole('button', { name: /Close/ }).click();
      await expect(page.getByRole('dialog')).not.toBeVisible();
    });
  });

  test.describe('Vote Success', () => {
    test('should show success screen after voting', async ({ page }) => {
      await page.getByRole('button', { name: /賛成|For/ }).first().click();
      // t('voteModal.submit') = "署名して投票"
      await page.getByRole('button', { name: /署名して投票|Sign & Submit Vote/ }).click();
      // t('voteSuccess.title') = "投票完了！"
      await expect(page.getByText(/投票完了|Vote Submitted/).first()).toBeVisible();
    });

    test('should display vote details in success screen', async ({ page }) => {
      await page.getByRole('button', { name: /賛成|For/ }).first().click();
      await page.getByRole('button', { name: /署名して投票|Sign & Submit Vote/ }).click();
      await expect(page.getByText(/125,000 veQS/).first()).toBeVisible();
    });

    test('should have back to proposals link', async ({ page }) => {
      await page.getByRole('button', { name: /賛成|For/ }).first().click();
      await page.getByRole('button', { name: /署名して投票|Sign & Submit Vote/ }).click();
      // t('voteSuccess.backToProposals') = "提案一覧に戻る"
      await expect(page.getByRole('link', { name: /提案一覧に戻る|Back to Proposals/ })).toBeVisible();
    });
  });

  test.describe('Footer', () => {
    test('should display footer navigation', async ({ page }) => {
      const footerNav = page.getByRole('navigation', { name: /Footer/ });
      await footerNav.scrollIntoViewIfNeeded();
      await expect(footerNav).toBeVisible({ timeout: 10000 });
    });

    test('should display footer links', async ({ page }) => {
      const forum = page.getByText(/ガバナンスフォーラム|Governance Forum/).first();
      await forum.scrollIntoViewIfNeeded();
      await expect(forum).toBeVisible({ timeout: 10000 });
    });

    test('should display disclaimer text', async ({ page }) => {
      const disclaimer = page.getByText(/ガバナンスへの参加は任意です|Governance participation/).first();
      await disclaimer.scrollIntoViewIfNeeded();
      await expect(disclaimer).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Responsive Design', () => {
    test('should display properly on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await expect(page.getByRole('main')).toBeVisible();
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

    test('should display properly on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await expect(page.getByRole('main')).toBeVisible();
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      const h1 = page.getByRole('heading', { level: 1 });
      await expect(h1).toHaveCount(1);
    });

    test('should have proper ARIA landmarks', async ({ page }) => {
      await expect(page.getByRole('main')).toBeVisible();
      await expect(page.getByRole('navigation', { name: /Breadcrumb/ })).toBeVisible();
    });

    test('modal should have proper ARIA attributes', async ({ page }) => {
      await page.getByRole('button', { name: /賛成|For/ }).first().click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    test('vote buttons should be keyboard accessible', async ({ page }) => {
      const forButton = page.getByRole('button', { name: /賛成|For/ }).first();
      await forButton.focus();
      await expect(forButton).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(page.getByRole('dialog')).toBeVisible();
    });
  });

  test.describe('i18n', () => {
    test('should display Japanese content on /ja/ path', async ({ page }) => {
      const details = page.getByText('提案詳細').first();
      await details.scrollIntoViewIfNeeded();
      await expect(details).toBeVisible({ timeout: 10000 });
      await expect(page.getByText(/投票する/).first()).toBeVisible({ timeout: 10000 });
    });

    test('should display English content on /en/ path', async ({ page }) => {
      await gotoAndWaitForApp(page, '/en/qs-hub/vote/proposals/47');

      const details = page.getByText('Proposal Details').first();
      await details.scrollIntoViewIfNeeded();
      await expect(details).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('Cast Your Vote').first()).toBeVisible({ timeout: 10000 });
      const timeline = page.getByText('Timeline').first();
      await timeline.scrollIntoViewIfNeeded();
      await expect(timeline).toBeVisible({ timeout: 10000 });
    });
  });
});
