/**
 * Consumer App Contact Page E2E Tests
 *
 * NO auth needed — public contact form.
 * URL: /ja/consumer/contact
 * Uses standard Playwright import (no a11y fixture needed for this page).
 */

import { test, expect } from '@playwright/test';

const CONTACT_URL_JA = '/ja/consumer/contact';
const CONTACT_URL_EN = '/en/consumer/contact';

// ---------------------------------------------------------------------------
// 1. Page Structure
// ---------------------------------------------------------------------------
test.describe('Page Structure', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(CONTACT_URL_JA);
  });

  test('should render main landmark with role', async ({ page }) => {
    const main = page.locator('main[role="main"]');
    await expect(main).toBeVisible();
  });

  test('should display h1 heading', async ({ page }) => {
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
  });

  test('should display back button linking to help', async ({ page }) => {
    const backButton = page.locator('a[href*="/consumer/help"]').first();
    await expect(backButton).toBeVisible();
  });

  test('should display intro section with h2', async ({ page }) => {
    const h2 = page.locator('h2');
    await expect(h2).toBeVisible();
  });

  test('should display FAQ link', async ({ page }) => {
    const faqLink = page.locator('a[href*="/consumer/faq"]');
    await expect(faqLink).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 2. Form Fields
// ---------------------------------------------------------------------------
test.describe('Form Fields', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(CONTACT_URL_JA);
  });

  test('should display category select', async ({ page }) => {
    const categoryLabel = page.locator('label[for="category"]');
    await expect(categoryLabel).toBeVisible();

    const categorySelect = page.locator('#category');
    await expect(categorySelect).toBeVisible();
  });

  test('should display email input', async ({ page }) => {
    const emailLabel = page.locator('label[for="email"]');
    await expect(emailLabel).toBeVisible();

    const emailInput = page.locator('#email');
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveAttribute('type', 'email');
  });

  test('should display subject input', async ({ page }) => {
    const subjectLabel = page.locator('label[for="subject"]');
    await expect(subjectLabel).toBeVisible();

    const subjectInput = page.locator('#subject');
    await expect(subjectInput).toBeVisible();
  });

  test('should display message textarea', async ({ page }) => {
    const messageLabel = page.locator('label[for="message"]');
    await expect(messageLabel).toBeVisible();

    const messageTextarea = page.locator('#message');
    await expect(messageTextarea).toBeVisible();
  });

  test('should display optional wallet address input', async ({ page }) => {
    const walletLabel = page.locator('label[for="walletAddress"]');
    await expect(walletLabel).toBeVisible();

    const walletInput = page.locator('#walletAddress');
    await expect(walletInput).toBeVisible();
  });

  test('should display submit button', async ({ page }) => {
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 3. Form Validation — Empty Submit
// ---------------------------------------------------------------------------
test.describe('Validation - Empty Submit', () => {
  test('should show validation errors on empty form submit', async ({ page }) => {
    await page.goto(CONTACT_URL_JA);

    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Check for error messages (role="alert")
    const alerts = page.locator('[role="alert"]');
    const alertCount = await alerts.count();
    expect(alertCount).toBeGreaterThanOrEqual(3); // category, email, subject, message
  });
});

// ---------------------------------------------------------------------------
// 4. Form Validation — Invalid Email
// ---------------------------------------------------------------------------
test.describe('Validation - Invalid Email', () => {
  test('should show error for invalid email format', async ({ page }) => {
    await page.goto(CONTACT_URL_JA);

    await page.locator('#email').fill('invalid-email');
    await page.locator('button[type="submit"]').click();

    // Email validation error
    const emailError = page.locator('#email-error');
    await expect(emailError).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 5. Form Validation — Short Message
// ---------------------------------------------------------------------------
test.describe('Validation - Short Message', () => {
  test('should show error for message shorter than 10 characters', async ({ page }) => {
    await page.goto(CONTACT_URL_JA);

    await page.locator('#category').selectOption('general');
    await page.locator('#email').fill('test@example.com');
    await page.locator('#subject').fill('Test Subject');
    await page.locator('#message').fill('Short');
    await page.locator('button[type="submit"]').click();

    // Message too short error
    const messageError = page.locator('#message-error');
    await expect(messageError).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 6. Form Keyboard Navigation
// ---------------------------------------------------------------------------
test.describe('Keyboard Navigation', () => {
  test('should allow tab through form fields', async ({ page }) => {
    await page.goto(CONTACT_URL_JA);

    // Focus the category select directly
    const categorySelect = page.locator('#category');
    await categorySelect.focus();
    await expect(categorySelect).toBeFocused();

    await page.keyboard.press('Tab');
    const emailInput = page.locator('#email');
    await expect(emailInput).toBeFocused();
  });
});

// ---------------------------------------------------------------------------
// 7. External Links
// ---------------------------------------------------------------------------
test.describe('External Links', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(CONTACT_URL_JA);
  });

  test('should display support email', async ({ page }) => {
    await expect(page.getByText('support@quantumshield.io')).toBeVisible();
  });

  test('should display Discord link with target blank', async ({ page }) => {
    const discordLink = page.locator('a[href*="discord"]');
    await expect(discordLink).toBeVisible();
    await expect(discordLink).toHaveAttribute('target', '_blank');
    await expect(discordLink).toHaveAttribute('rel', /noopener/);
  });
});

// ---------------------------------------------------------------------------
// 8. Accessibility
// ---------------------------------------------------------------------------
test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(CONTACT_URL_JA);
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);
  });

  test('form fields should have associated labels', async ({ page }) => {
    await expect(page.locator('label[for="category"]')).toBeVisible();
    await expect(page.locator('label[for="email"]')).toBeVisible();
    await expect(page.locator('label[for="subject"]')).toBeVisible();
    await expect(page.locator('label[for="message"]')).toBeVisible();
  });

  test('invalid fields should have aria-invalid attribute', async ({ page }) => {
    await page.locator('button[type="submit"]').click();

    const categorySelect = page.locator('#category');
    await expect(categorySelect).toHaveAttribute('aria-invalid', 'true');

    const emailInput = page.locator('#email');
    await expect(emailInput).toHaveAttribute('aria-invalid', 'true');
  });
});

// ---------------------------------------------------------------------------
// 9. Responsive Design
// ---------------------------------------------------------------------------
test.describe('Responsive Design', () => {
  test('should display correctly on mobile (375x667)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(CONTACT_URL_JA);

    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('#category')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should display correctly on tablet (768x1024)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(CONTACT_URL_JA);

    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('form')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 10. English Locale
// ---------------------------------------------------------------------------
test.describe('English Locale', () => {
  test('should display English content', async ({ page }) => {
    await page.goto(CONTACT_URL_EN);

    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should display English form labels', async ({ page }) => {
    await page.goto(CONTACT_URL_EN);

    await expect(page.locator('label[for="category"]')).toBeVisible();
    await expect(page.locator('label[for="email"]')).toBeVisible();
    await expect(page.locator('label[for="subject"]')).toBeVisible();
    await expect(page.locator('label[for="message"]')).toBeVisible();
  });

  test('should display English submit button', async ({ page }) => {
    await page.goto(CONTACT_URL_EN);

    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
  });
});
