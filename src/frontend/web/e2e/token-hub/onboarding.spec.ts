import { test, expect } from '@playwright/test';

test.describe('Token Hub Onboarding Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/token-hub/onboarding');
  });

  test('should display page title and hero section', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/トークノミクス/);

    // Check hero section
    await expect(page.getByText('トークノミクスガイド')).toBeVisible();
    await expect(page.getByRole('heading', { name: /QSトークノミクスを理解する/ })).toBeVisible();
  });

  test('should display QS Token explanation section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'QSトークンとは？' })).toBeVisible();
    await expect(page.getByText('総供給量')).toBeVisible();
    await expect(page.getByText('1,000,000,000 QS')).toBeVisible();
    await expect(page.getByText('Ethereum (L1)')).toBeVisible();
    await expect(page.getByText('ERC-20')).toBeVisible();
  });

  test('should display veQS explanation with formula', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'veQSとは？' })).toBeVisible();
    await expect(page.getByText('veQS計算式')).toBeVisible();
    await expect(page.getByText(/veQS = QS × \(lock_period \/ 4/)).toBeVisible();
  });

  test('should display lock examples table', async ({ page }) => {
    const table = page.getByRole('table', { name: /veQS計算を示す/ });
    await expect(table).toBeVisible();

    // Check table headers
    await expect(page.getByRole('columnheader', { name: 'ロック期間' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '倍率' })).toBeVisible();

    // Check lock period rows
    await expect(page.getByText('6ヶ月')).toBeVisible();
    await expect(page.getByText('1年')).toBeVisible();
    await expect(page.getByText('2年')).toBeVisible();
    await expect(page.getByText('4年')).toBeVisible();
  });

  test('should display timeline steps', async ({ page }) => {
    await expect(page.getByRole('heading', { name: '仕組み' })).toBeVisible();

    const timeline = page.getByRole('list', { name: /Token Hubに参加/ });
    await expect(timeline).toBeVisible();

    // Check all steps
    await expect(page.getByText('STEP 1')).toBeVisible();
    await expect(page.getByText('QSを入手')).toBeVisible();
    await expect(page.getByText('STEP 2')).toBeVisible();
    await expect(page.getByText('QSをロック')).toBeVisible();
    await expect(page.getByText('STEP 3')).toBeVisible();
    await expect(page.getByText('投票')).toBeVisible();
    await expect(page.getByText('STEP 4')).toBeVisible();
    await expect(page.getByText('報酬を獲得')).toBeVisible();
  });

  test('should display benefits section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'ロックのメリット' })).toBeVisible();
    await expect(page.getByText('ガバナンス権')).toBeVisible();
    await expect(page.getByText('プロトコル報酬')).toBeVisible();
    await expect(page.getByText('報酬ブースト')).toBeVisible();
    await expect(page.getByText('ネットワークセキュリティ')).toBeVisible();
  });

  test('should display decay explanation', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'veQSの減衰について' })).toBeVisible();
    await expect(page.getByText('ロック開始')).toBeVisible();
    await expect(page.getByText('ロック終了')).toBeVisible();
    await expect(page.getByText(/ロックを延長してveQS残高を回復/)).toBeVisible();
  });

  test('should have working CTA buttons', async ({ page }) => {
    // Check CTA section
    await expect(page.getByRole('heading', { name: '始める準備はできましたか？' })).toBeVisible();

    // Lock QS button
    const lockButton = page.getByRole('button', { name: '今すぐQSをロック' });
    await expect(lockButton).toBeVisible();
    await lockButton.click();
    await expect(page).toHaveURL(/\/token-hub\/lock/);
  });

  test('should navigate to Get QS page', async ({ page }) => {
    const getQSButton = page.getByRole('button', { name: 'QSトークンを入手' });
    await expect(getQSButton).toBeVisible();
    await getQSButton.click();
    await expect(page).toHaveURL(/\/token-hub\/get-qs/);
  });

  test('should have link to FAQ page', async ({ page }) => {
    const faqLink = page.getByRole('link', { name: 'よくある質問を見る' });
    await expect(faqLink).toBeVisible();
    await faqLink.click();
    await expect(page).toHaveURL(/\/token-hub\/faq/);
  });

  test('should display footer with navigation links', async ({ page }) => {
    await expect(page.getByRole('link', { name: '利用規約' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'プライバシーポリシー' })).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Hero should still be visible
    await expect(page.getByRole('heading', { name: /QSトークノミクス/ })).toBeVisible();

    // Timeline should stack vertically
    const timeline = page.getByRole('list', { name: /Token Hubに参加/ });
    await expect(timeline).toBeVisible();

    // CTA buttons should stack
    await expect(page.getByRole('button', { name: '今すぐQSをロック' })).toBeVisible();
  });

  test('should have proper accessibility', async ({ page }) => {
    // Check main landmark
    await expect(page.getByRole('main')).toBeVisible();

    // Check headings hierarchy
    const headings = page.getByRole('heading');
    const count = await headings.count();
    expect(count).toBeGreaterThan(5);

    // Check aria labels on interactive elements
    const lockButton = page.getByRole('button', { name: '今すぐQSをロック' });
    await expect(lockButton).toHaveAttribute('aria-label', '今すぐQSをロック');
  });

  test('should support keyboard navigation', async ({ page }) => {
    // Tab through interactive elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Verify focus is visible on focusable elements
    const activeElement = page.locator(':focus');
    await expect(activeElement).toBeVisible();
  });

  test('should work in English locale', async ({ page }) => {
    await page.goto('/en/token-hub/onboarding');

    await expect(page).toHaveTitle(/Tokenomics/);
    await expect(page.getByText('Tokenomics Guide')).toBeVisible();
    await expect(page.getByRole('heading', { name: /Understanding QS Tokenomics/ })).toBeVisible();
    await expect(page.getByText('What is QS Token?')).toBeVisible();
    await expect(page.getByText('What is veQS?')).toBeVisible();
  });
});
