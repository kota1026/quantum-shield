import { test, expect } from '@playwright/test';
import { gotoAndWaitForApp } from '../helpers/wait-for-app';

test.setTimeout(90000);

test.describe('Token Hub Onboarding', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAndWaitForApp(page, '/ja/token-hub/onboarding');
  });

  test.describe('Page Load & Layout', () => {
    test('should display main content area', async ({ page }) => {
      await expect(page.getByRole('main')).toBeVisible();
    });

    test('should display hero badge', async ({ page }) => {
      await expect(page.getByText('トークノミクスガイド')).toBeVisible();
    });

    test('should display hero title', async ({ page }) => {
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

    test('should display header with navigation', async ({ page }) => {
      await expect(page.getByText('Quantum Shield').first()).toBeVisible();
    });
  });

  test.describe('Breadcrumb', () => {
    test('should display breadcrumb navigation', async ({ page }) => {
      const breadcrumb = page.getByRole('navigation', { name: 'パンくずリストナビゲーション' });
      await expect(breadcrumb).toBeVisible();
    });

    test('should display current page in breadcrumb', async ({ page }) => {
      const current = page.locator('[aria-current="page"]');
      await expect(current).toBeVisible();
    });
  });

  test.describe('Quantum Shield Overview', () => {
    test('should display overview section', async ({ page }) => {
      await expect(page.getByText('Quantum Shieldとは？')).toBeVisible();
    });

    test('should display three pillars', async ({ page }) => {
      await expect(page.getByText('量子耐性保護')).toBeVisible();
    });

    test('should display quantum resistance tags', async ({ page }) => {
      await expect(page.getByText('Dilithium署名')).toBeVisible();
      await expect(page.getByText('STARK証明')).toBeVisible();
    });
  });

  test.describe('QS Token Section', () => {
    test('should display QS Token heading', async ({ page }) => {
      await expect(page.getByText('QSトークンとは？')).toBeVisible();
    });

    test('should display total supply', async ({ page }) => {
      await expect(page.getByText('総供給量')).toBeVisible();
      await expect(page.getByText('1,000,000,000 QS')).toBeVisible();
    });

    test('should display network info', async ({ page }) => {
      await expect(page.getByText('Ethereum (L1)')).toBeVisible();
      await expect(page.getByText('ERC-20')).toBeVisible();
    });
  });

  test.describe('veQS Section', () => {
    test('should display veQS heading', async ({ page }) => {
      await expect(page.getByText('veQSとは？')).toBeVisible();
    });

    test('should display formula', async ({ page }) => {
      await expect(page.getByText('veQS計算式')).toBeVisible();
      await expect(page.getByText(/veQS = QS/)).toBeVisible();
    });

    test('should display lock examples table', async ({ page }) => {
      const table = page.getByRole('table');
      await expect(table).toBeVisible();
    });
  });

  test.describe('Timeline', () => {
    test('should display timeline heading', async ({ page }) => {
      await expect(page.getByText('仕組み')).toBeVisible();
    });

    test('should display timeline steps', async ({ page }) => {
      const timelineList = page.locator('[role="list"]').first();
      await expect(timelineList).toBeVisible();
      await expect(page.getByText('STEP 1').first()).toBeVisible();
    });
  });

  test.describe('Benefits', () => {
    test('should display benefits heading', async ({ page }) => {
      await expect(page.getByText('ロックのメリット')).toBeVisible();
    });

    test('should display benefit items', async ({ page }) => {
      await expect(page.getByText('ガバナンス権')).toBeVisible();
      await expect(page.getByText('プロトコル報酬')).toBeVisible();
    });
  });

  test.describe('Decay Section', () => {
    test('should display decay heading', async ({ page }) => {
      await expect(page.getByText('veQSの減衰について')).toBeVisible();
    });

    test('should display decay visual', async ({ page }) => {
      await expect(page.getByText('ロック開始')).toBeVisible();
      await expect(page.getByText('ロック終了')).toBeVisible();
    });
  });

  test.describe('Prover Section', () => {
    test('should display prover heading', async ({ page }) => {
      await expect(page.getByText('Proverになる')).toBeVisible();
    });
  });

  test.describe('CTA Section', () => {
    test('should display CTA heading', async ({ page }) => {
      await expect(page.getByText('始める準備はできましたか？')).toBeVisible();
    });

    test('should display lock button', async ({ page }) => {
      await expect(page.getByText('今すぐQSをロック')).toBeVisible();
    });

    test('should display get QS button', async ({ page }) => {
      await expect(page.getByText('QSトークンを入手')).toBeVisible();
    });
  });

  test.describe('FAQ Preview', () => {
    test('should display FAQ link', async ({ page }) => {
      await expect(page.getByText('よくある質問を見る')).toBeVisible();
    });
  });

  test.describe('Footer', () => {
    test('should display footer links', async ({ page }) => {
      await expect(page.getByText('利用規約')).toBeVisible();
      await expect(page.getByText('プライバシーポリシー')).toBeVisible();
    });

    test('should display disclaimer', async ({ page }) => {
      await expect(page.getByText(/本サービスは投資助言ではありません/)).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await expect(page.getByRole('main')).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA landmarks', async ({ page }) => {
      await expect(page.getByRole('main')).toBeVisible();
    });

    test('should have breadcrumb with aria-label', async ({ page }) => {
      const breadcrumb = page.getByRole('navigation', { name: 'パンくずリストナビゲーション' });
      await expect(breadcrumb).toBeVisible();
    });

    test('should have timeline list with aria-label', async ({ page }) => {
      const timelineList = page.locator('[role="list"][aria-label]').first();
      await expect(timelineList).toBeVisible();
    });

    test('should have table with proper role', async ({ page }) => {
      const table = page.getByRole('table');
      await expect(table).toBeVisible();
    });
  });
});
