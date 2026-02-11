import { test, expect } from '@playwright/test';

test.describe('Token Hub FAQ Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/token-hub/faq');
  });

  test('should display page title and header', async ({ page }) => {
    await expect(page).toHaveTitle(/よくある質問/);
    await expect(page.getByRole('heading', { name: 'よくある質問' })).toBeVisible();
    await expect(page.getByText('ヘルプセンター')).toBeVisible();
  });

  test('should display breadcrumb navigation', async ({ page }) => {
    const breadcrumb = page.getByRole('navigation', { name: /パンくず/ });
    await expect(breadcrumb).toBeVisible();
    await expect(page.getByRole('link', { name: 'ダッシュボード' })).toBeVisible();
  });

  test('should display category tabs', async ({ page }) => {
    const tablist = page.getByRole('tablist', { name: /FAQカテゴリー/ });
    await expect(tablist).toBeVisible();

    // Check all category tabs
    await expect(page.getByRole('tab', { name: '一般' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'ロック' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'veQS' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'ガバナンス' })).toBeVisible();
    await expect(page.getByRole('tab', { name: '報酬' })).toBeVisible();
  });

  test('should default to general category', async ({ page }) => {
    const generalTab = page.getByRole('tab', { name: '一般' });
    await expect(generalTab).toHaveAttribute('aria-selected', 'true');

    // Check general questions are visible
    await expect(page.getByText('Token Hubとは何ですか？')).toBeVisible();
    await expect(page.getByText('誰がToken Hubに参加できますか？')).toBeVisible();
  });

  test('should switch between categories', async ({ page }) => {
    // Click on Locking category
    await page.getByRole('tab', { name: 'ロック' }).click();
    await expect(page.getByText('QSトークンをロックするにはどうすればよいですか？')).toBeVisible();
    await expect(page.getByText('最低ロック量はありますか？')).toBeVisible();

    // Click on veQS category
    await page.getByRole('tab', { name: 'veQS' }).click();
    await expect(page.getByText('veQSとは何ですか？')).toBeVisible();
    await expect(page.getByText('veQSはどのように計算されますか？')).toBeVisible();

    // Click on Governance category
    await page.getByRole('tab', { name: 'ガバナンス' }).click();
    await expect(page.getByText('ガバナンス投票とは何ですか？')).toBeVisible();

    // Click on Rewards category
    await page.getByRole('tab', { name: '報酬' }).click();
    await expect(page.getByText('報酬はどのように機能しますか？')).toBeVisible();
  });

  test('should expand and collapse FAQ items', async ({ page }) => {
    const firstQuestion = page.getByRole('button', { name: /Token Hubとは何ですか？/ });

    // Initially collapsed
    const answer = page.getByText(/ガバナンスおよびステーキングプラットフォーム/);
    await expect(answer).not.toBeVisible();

    // Expand
    await firstQuestion.click();
    await expect(firstQuestion).toHaveAttribute('aria-expanded', 'true');
    await expect(answer).toBeVisible();

    // Collapse
    await firstQuestion.click();
    await expect(firstQuestion).toHaveAttribute('aria-expanded', 'false');
    await expect(answer).not.toBeVisible();
  });

  test('should display important notice', async ({ page }) => {
    const notice = page.getByRole('alert');
    await expect(notice).toBeVisible();
    await expect(page.getByText('重要なお知らせ')).toBeVisible();
    await expect(page.getByText(/金融アドバイスを構成するものではありません/)).toBeVisible();
  });

  test('should display quick links', async ({ page }) => {
    await expect(page.getByRole('link', { name: /トークノミクスを学ぶ/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /QSをロック/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /QSトークンを入手/ })).toBeVisible();
  });

  test('should navigate to onboarding from quick links', async ({ page }) => {
    await page.getByRole('link', { name: /トークノミクスを学ぶ/ }).click();
    await expect(page).toHaveURL(/\/token-hub\/onboarding/);
  });

  test('should navigate to lock from quick links', async ({ page }) => {
    await page.getByRole('link', { name: /QSをロック/ }).click();
    await expect(page).toHaveURL(/\/token-hub\/lock/);
  });

  test('should have proper accessibility', async ({ page }) => {
    // Check main landmark
    await expect(page.getByRole('main')).toBeVisible();

    // Check tablist accessibility
    const tablist = page.getByRole('tablist');
    await expect(tablist).toBeVisible();

    // Check expandable buttons have aria-expanded
    const questionButtons = page.getByRole('button', { name: /？$/ });
    const firstButton = questionButtons.first();
    await expect(firstButton).toHaveAttribute('aria-expanded');
  });

  test('should support keyboard navigation', async ({ page }) => {
    // Focus first tab
    await page.getByRole('tab', { name: '一般' }).focus();

    // Navigate through tabs
    await page.keyboard.press('Tab');

    // First question should be focusable
    const activeElement = page.locator(':focus');
    await expect(activeElement).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Title should be visible
    await expect(page.getByRole('heading', { name: 'よくある質問' })).toBeVisible();

    // Category tabs should wrap
    await expect(page.getByRole('tab', { name: '一般' })).toBeVisible();
    await expect(page.getByRole('tab', { name: '報酬' })).toBeVisible();

    // FAQ items should be expandable
    const firstQuestion = page.getByRole('button', { name: /Token Hubとは何ですか？/ });
    await firstQuestion.click();
    await expect(page.getByText(/ガバナンスおよびステーキングプラットフォーム/)).toBeVisible();
  });

  test('should work in English locale', async ({ page }) => {
    await page.goto('/en/token-hub/faq');

    await expect(page).toHaveTitle(/FAQ/);
    await expect(page.getByRole('heading', { name: 'Frequently Asked Questions' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'General' })).toBeVisible();
    await expect(page.getByText('What is Token Hub?')).toBeVisible();
  });
});
