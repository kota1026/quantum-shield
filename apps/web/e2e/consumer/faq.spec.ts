import { test, expect } from '@playwright/test';

test.describe('FAQ Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/consumer/faq');
  });

  test.describe('Page Structure', () => {
    test('should display page title', async ({ page }) => {
      await expect(page.locator('h1')).toContainText('よくある質問');
    });

    test('should display back button', async ({ page }) => {
      const backButton = page.locator('a[aria-label="設定に戻る"]');
      await expect(backButton).toBeVisible();
    });

    test('should display all sections', async ({ page }) => {
      await expect(page.getByText('基本')).toBeVisible();
      await expect(page.getByText('Lock / Unlock')).toBeVisible();
      await expect(page.getByText('セキュリティ')).toBeVisible();
    });
  });

  test.describe('FAQ Accordion', () => {
    test('should display FAQ questions', async ({ page }) => {
      await expect(
        page.getByText('Quantum Shieldとは何ですか？')
      ).toBeVisible();
      await expect(
        page.getByText('なぜ量子耐性が重要なのですか？')
      ).toBeVisible();
      await expect(page.getByText('Lockとは何ですか？')).toBeVisible();
    });

    test('should toggle FAQ item when clicked', async ({ page }) => {
      // Click on first FAQ item
      const firstQuestion = page.getByText('Quantum Shieldとは何ですか？');
      await firstQuestion.click();

      // Answer should be visible
      await expect(
        page.getByText(/量子コンピュータからデジタル資産を守る/)
      ).toBeVisible();

      // Click again to close
      await firstQuestion.click();

      // Answer should be hidden (max-h-0)
      const answer = page.locator('[role="region"]').first();
      await expect(answer).toHaveClass(/max-h-0/);
    });

    test('should expand multiple items', async ({ page }) => {
      // Open first question
      await page.getByText('Quantum Shieldとは何ですか？').click();

      // Open second question
      await page.getByText('なぜ量子耐性が重要なのですか？').click();

      // Both answers should be visible
      await expect(
        page.getByText(/NIST認定のDilithium-III/)
      ).toBeVisible();
      await expect(
        page.getByText(/「今収集して後で解読」攻撃/)
      ).toBeVisible();
    });
  });

  test.describe('Navigation', () => {
    test('should navigate back to settings', async ({ page }) => {
      const backButton = page.locator('a[aria-label="設定に戻る"]');
      await backButton.click();

      await expect(page).toHaveURL(/\/consumer\/settings/);
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should toggle FAQ with Enter key', async ({ page }) => {
      // Focus on first FAQ button
      const firstButton = page.locator('button[aria-expanded]').first();
      await firstButton.focus();

      // Press Enter to open
      await page.keyboard.press('Enter');

      // Should be expanded
      await expect(firstButton).toHaveAttribute('aria-expanded', 'true');

      // Press Enter to close
      await page.keyboard.press('Enter');

      // Should be collapsed
      await expect(firstButton).toHaveAttribute('aria-expanded', 'false');
    });

    test('should tab through FAQ items', async ({ page }) => {
      // Focus on back button
      await page.locator('a[aria-label="設定に戻る"]').focus();

      // Tab to first FAQ
      await page.keyboard.press('Tab');
      const firstFaq = page.locator('button[aria-expanded]').first();
      await expect(firstFaq).toBeFocused();

      // Tab to second FAQ
      await page.keyboard.press('Tab');
      const secondFaq = page.locator('button[aria-expanded]').nth(1);
      await expect(secondFaq).toBeFocused();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      const h1 = page.locator('h1');
      await expect(h1).toHaveCount(1);
    });

    test('should have aria-expanded on FAQ buttons', async ({ page }) => {
      const faqButtons = page.locator('button[aria-expanded]');
      expect(await faqButtons.count()).toBe(6);
    });

    test('should have aria-controls linking to regions', async ({ page }) => {
      const faqButtons = page.locator('button[aria-controls]');
      expect(await faqButtons.count()).toBe(6);
    });

    test('should have role="region" on answer sections', async ({ page }) => {
      const regions = page.locator('[role="region"]');
      expect(await regions.count()).toBe(6);
    });
  });

  test.describe('Responsive Design', () => {
    test('should display properly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      await expect(page.locator('h1')).toBeVisible();
      await expect(page.getByText('基本')).toBeVisible();
      await expect(
        page.getByText('Quantum Shieldとは何ですか？')
      ).toBeVisible();
    });
  });
});

test.describe('FAQ Page (English)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/consumer/faq');
  });

  test('should display content in English', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('FAQ');
    await expect(page.getByText('Basics')).toBeVisible();
    await expect(page.getByText('Lock / Unlock')).toBeVisible();
    await expect(page.getByText('Security')).toBeVisible();
  });

  test('should display questions in English', async ({ page }) => {
    await expect(page.getByText('What is Quantum Shield?')).toBeVisible();
    await expect(
      page.getByText('Why is quantum resistance important?')
    ).toBeVisible();
    await expect(page.getByText('What is Lock?')).toBeVisible();
  });
});
