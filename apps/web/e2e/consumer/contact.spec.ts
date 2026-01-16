import { test, expect } from '@playwright/test';

/**
 * Consumer App Contact E2E Tests
 * Tests for Screen 15: contact
 */

test.describe('Contact Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/consumer/contact');
  });

  test.describe('Page Structure', () => {
    test('should display page title', async ({ page }) => {
      await expect(page.locator('h1')).toContainText('お問い合わせ');
    });

    test('should display back button', async ({ page }) => {
      const backButton = page.locator('a[aria-label="戻る"]');
      await expect(backButton).toBeVisible();
      await expect(backButton).toHaveAttribute('href', '/consumer/help');
    });

    test('should have main landmark', async ({ page }) => {
      const main = page.locator('main[role="main"]');
      await expect(main).toBeVisible();
    });

    test('should display intro section', async ({ page }) => {
      await expect(page.locator('h2')).toContainText('サポートチームにご連絡ください');
    });

    test('should display FAQ link', async ({ page }) => {
      const faqLink = page.locator('a[href="/consumer/faq"]');
      await expect(faqLink).toBeVisible();
    });
  });

  test.describe('Contact Form', () => {
    test('should display category select', async ({ page }) => {
      const categoryLabel = page.locator('label[for="category"]');
      await expect(categoryLabel).toContainText('カテゴリ');

      const categorySelect = page.locator('#category');
      await expect(categorySelect).toBeVisible();
    });

    test('should display email input', async ({ page }) => {
      const emailLabel = page.locator('label[for="email"]');
      await expect(emailLabel).toContainText('メールアドレス');

      const emailInput = page.locator('#email');
      await expect(emailInput).toBeVisible();
      await expect(emailInput).toHaveAttribute('type', 'email');
    });

    test('should display subject input', async ({ page }) => {
      const subjectLabel = page.locator('label[for="subject"]');
      await expect(subjectLabel).toContainText('件名');

      const subjectInput = page.locator('#subject');
      await expect(subjectInput).toBeVisible();
    });

    test('should display message textarea', async ({ page }) => {
      const messageLabel = page.locator('label[for="message"]');
      await expect(messageLabel).toContainText('内容');

      const messageTextarea = page.locator('#message');
      await expect(messageTextarea).toBeVisible();
    });

    test('should display optional wallet address input', async ({ page }) => {
      const walletLabel = page.locator('label[for="walletAddress"]');
      await expect(walletLabel).toContainText('ウォレットアドレス');

      const walletInput = page.locator('#walletAddress');
      await expect(walletInput).toBeVisible();
    });

    test('should display submit button', async ({ page }) => {
      const submitButton = page.locator('button[type="submit"]');
      await expect(submitButton).toBeVisible();
      await expect(submitButton).toContainText('送信する');
    });
  });

  test.describe('Form Validation', () => {
    test('should show error when submitting empty form', async ({ page }) => {
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      // Check for validation errors
      await expect(page.getByText('カテゴリを選択してください')).toBeVisible();
      await expect(page.getByText('メールアドレスを入力してください')).toBeVisible();
      await expect(page.getByText('件名を入力してください')).toBeVisible();
      await expect(page.getByText('内容を入力してください')).toBeVisible();
    });

    test('should show error for invalid email', async ({ page }) => {
      const emailInput = page.locator('#email');
      await emailInput.fill('invalid-email');

      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      await expect(page.getByText('有効なメールアドレスを入力してください')).toBeVisible();
    });

    test('should show error for short message', async ({ page }) => {
      const categorySelect = page.locator('#category');
      await categorySelect.selectOption('general');

      const emailInput = page.locator('#email');
      await emailInput.fill('test@example.com');

      const subjectInput = page.locator('#subject');
      await subjectInput.fill('Test Subject');

      const messageTextarea = page.locator('#message');
      await messageTextarea.fill('Short');

      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      await expect(page.getByText('内容は10文字以上で入力してください')).toBeVisible();
    });
  });

  test.describe('Form Submission', () => {
    test('should submit form successfully with valid data', async ({ page }) => {
      // Fill in the form
      const categorySelect = page.locator('#category');
      await categorySelect.selectOption('general');

      const emailInput = page.locator('#email');
      await emailInput.fill('test@example.com');

      const subjectInput = page.locator('#subject');
      await subjectInput.fill('Test Subject');

      const messageTextarea = page.locator('#message');
      await messageTextarea.fill('This is a test message for the contact form.');

      // Submit
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      // Wait for success state
      await expect(page.getByText('お問い合わせを受け付けました')).toBeVisible({ timeout: 5000 });
      await expect(page.getByText('お問い合わせ番号')).toBeVisible();
    });

    test('should display ticket ID after successful submission', async ({ page }) => {
      // Fill in the form
      await page.locator('#category').selectOption('technical');
      await page.locator('#email').fill('test@example.com');
      await page.locator('#subject').fill('Technical Issue');
      await page.locator('#message').fill('I have a technical problem with the application.');

      await page.locator('button[type="submit"]').click();

      // Wait for success and check ticket ID format
      await expect(page.getByText('お問い合わせ番号')).toBeVisible({ timeout: 5000 });
      const ticketId = page.locator('.font-mono.font-semibold.text-gold');
      await expect(ticketId).toBeVisible();
      await expect(ticketId).toContainText(/QS-/);
    });
  });

  test.describe('Other Contact Methods', () => {
    test('should display email contact option', async ({ page }) => {
      await expect(page.getByText('support@quantumshield.io')).toBeVisible();
    });

    test('should display Discord link', async ({ page }) => {
      const discordLink = page.locator('a[href*="discord"]');
      await expect(discordLink).toBeVisible();
      await expect(discordLink).toHaveAttribute('target', '_blank');
    });
  });

  test.describe('Navigation', () => {
    test('should navigate back to help', async ({ page }) => {
      const backButton = page.locator('a[aria-label="戻る"]');
      await backButton.click();
      await expect(page).toHaveURL(/\/consumer\/help$/);
    });

    test('should navigate to FAQ from link', async ({ page }) => {
      const faqLink = page.locator('a[href="/consumer/faq"]');
      await faqLink.click();
      await expect(page).toHaveURL(/\/consumer\/faq$/);
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      const h1 = page.locator('h1');
      await expect(h1).toHaveCount(1);

      const h2 = page.locator('h2');
      await expect(h2).toHaveCount(1);

      const h3 = page.locator('h3');
      const h3Count = await h3.count();
      expect(h3Count).toBeGreaterThan(0);
    });

    test('form fields should have proper labels', async ({ page }) => {
      const categoryLabel = page.locator('label[for="category"]');
      await expect(categoryLabel).toBeVisible();

      const emailLabel = page.locator('label[for="email"]');
      await expect(emailLabel).toBeVisible();

      const subjectLabel = page.locator('label[for="subject"]');
      await expect(subjectLabel).toBeVisible();

      const messageLabel = page.locator('label[for="message"]');
      await expect(messageLabel).toBeVisible();
    });

    test('invalid fields should have aria-invalid attribute', async ({ page }) => {
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      const categorySelect = page.locator('#category');
      await expect(categorySelect).toHaveAttribute('aria-invalid', 'true');

      const emailInput = page.locator('#email');
      await expect(emailInput).toHaveAttribute('aria-invalid', 'true');
    });

    test('form should be keyboard navigable', async ({ page }) => {
      // Tab through the form
      await page.keyboard.press('Tab'); // Back button
      await page.keyboard.press('Tab'); // FAQ link
      await page.keyboard.press('Tab'); // Category select

      const categorySelect = page.locator('#category');
      await expect(categorySelect).toBeFocused();

      await page.keyboard.press('Tab');
      const emailInput = page.locator('#email');
      await expect(emailInput).toBeFocused();
    });
  });

  test.describe('Responsive Design', () => {
    test('should display properly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('#category')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('should display properly on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('form')).toBeVisible();
    });
  });
});

test.describe('Contact Page (English)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/consumer/contact');
  });

  test('should display content in English', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Contact Us');
    await expect(page.locator('h2')).toContainText('Get in touch with our support team');
  });

  test('should display form labels in English', async ({ page }) => {
    await expect(page.locator('label[for="category"]')).toContainText('Category');
    await expect(page.locator('label[for="email"]')).toContainText('Email Address');
    await expect(page.locator('label[for="subject"]')).toContainText('Subject');
    await expect(page.locator('label[for="message"]')).toContainText('Message');
  });

  test('should display submit button in English', async ({ page }) => {
    await expect(page.locator('button[type="submit"]')).toContainText('Submit');
  });
});
