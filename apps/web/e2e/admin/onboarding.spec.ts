import { test, expect } from '@playwright/test';
import { gotoAndWaitForApp } from '../helpers/wait-for-app';

test.describe('QS Admin Onboarding', () => {
  test.setTimeout(90000);

  test.beforeEach(async ({ page }) => {
    await gotoAndWaitForApp(page, '/ja/admin/onboarding');
  });

  test('should display welcome step initially', async ({ page }) => {
    // i18n: admin.onboarding.welcome.title = "Welcome to QS Admin"
    await expect(page.locator('h1').first()).toContainText('Welcome to QS Admin');
  });

  test('should display welcome subtitle', async ({ page }) => {
    // i18n: admin.onboarding.welcome.subtitle = "Quantum Shield 管理システムへようこそ"
    await expect(page.locator('text=Quantum Shield 管理システムへようこそ').first()).toBeVisible();
  });

  test('should have main content area', async ({ page }) => {
    const main = page.locator('[role="main"]');
    await expect(main).toBeVisible();
  });

  test('should display progress indicator with step buttons', async ({ page }) => {
    const nav = page.locator('nav').first();
    await expect(nav).toBeVisible();
  });

  test('should display user greeting', async ({ page }) => {
    await expect(page.locator('text=こんにちは、Katoさん').first()).toBeVisible();
  });

  test('should display role upgrade badge', async ({ page }) => {
    await expect(page.locator('text=Viewer → Operator').first()).toBeVisible();
  });

  test('should display Start Onboarding button', async ({ page }) => {
    await expect(page.locator('text=Start Onboarding').first()).toBeVisible();
  });

  test('should navigate to overview step on start click', async ({ page }) => {
    await page.locator('button:has-text("Start Onboarding")').click();
    // i18n: admin.onboarding.overview.title = "Quantum Shield Overview"
    await expect(page.locator('h1:has-text("Quantum Shield Overview")').first()).toBeVisible();
  });

  test('should display system cards on overview step', async ({ page }) => {
    await page.locator('button:has-text("Start Onboarding")').click();
    await expect(page.locator('text=Consumer App').first()).toBeVisible();
    await expect(page.locator('text=Prover Network').first()).toBeVisible();
    await expect(page.locator('text=Governance').first()).toBeVisible();
    await expect(page.locator('text=QS Admin').first()).toBeVisible();
  });

  test('should navigate back from overview to welcome', async ({ page }) => {
    await page.locator('button:has-text("Start Onboarding")').click();
    await page.locator('button:has-text("Back")').click();
    await expect(page.locator('h1:has-text("Welcome to QS Admin")').first()).toBeVisible();
  });

  test('should navigate to principles step', async ({ page }) => {
    await page.locator('button:has-text("Start Onboarding")').click();
    await page.locator('button:has-text("Next")').click();
    // i18n: admin.onboarding.principles.title = "Core Principles"
    await expect(page.locator('text=Core Principles').first()).toBeVisible();
  });

  test('should display 5 core principles with CP tags', async ({ page }) => {
    await page.locator('button:has-text("Start Onboarding")').click();
    await page.locator('button:has-text("Next")').click();
    await expect(page.locator('text=CP-1').first()).toBeVisible();
    await expect(page.locator('text=CP-2').first()).toBeVisible();
    await expect(page.locator('text=CP-3').first()).toBeVisible();
    await expect(page.locator('text=CP-4').first()).toBeVisible();
    await expect(page.locator('text=CP-5').first()).toBeVisible();
  });

  test('should navigate to emergency procedures step', async ({ page }) => {
    await page.locator('button:has-text("Start Onboarding")').click();
    await page.locator('button:has-text("Next")').click();
    await page.locator('button:has-text("Next")').click();
    // i18n: admin.onboarding.emergency.title = "Emergency Procedures"
    await expect(page.locator('text=Emergency Procedures').first()).toBeVisible();
  });

  test('should navigate to quiz step', async ({ page }) => {
    await page.locator('button:has-text("Start Onboarding")').click();
    await page.locator('button:has-text("Next")').click();
    await page.locator('button:has-text("Next")').click();
    await page.locator('button:has-text("Next")').click();
    // i18n: admin.onboarding.quiz.title = "Confirmation Quiz"
    await expect(page.locator('text=Confirmation Quiz').first()).toBeVisible();
  });

  test('should display quiz questions', async ({ page }) => {
    await page.locator('button:has-text("Start Onboarding")').click();
    await page.locator('button:has-text("Next")').click();
    await page.locator('button:has-text("Next")').click();
    await page.locator('button:has-text("Next")').click();
    await expect(page.locator('text=Question 1').first()).toBeVisible();
    await expect(page.locator('text=Question 2').first()).toBeVisible();
  });

  test('should complete onboarding with correct answers', async ({ page }) => {
    // Navigate to quiz
    await page.locator('button:has-text("Start Onboarding")').click();
    await page.locator('button:has-text("Next")').click();
    await page.locator('button:has-text("Next")').click();
    await page.locator('button:has-text("Next")').click();

    // Select correct answers: ECDSA (q1=c) and 24時間 (q2=b)
    await page.getByRole('radio', { name: 'ECDSA' }).click();
    await page.getByRole('radio', { name: '24時間' }).click();
    await page.locator('button:has-text("Complete Onboarding")').click();

    // Should show completion
    await expect(page.locator('text=Onboarding Complete').first()).toBeVisible();
    await expect(page.locator('text=おめでとうございます').first()).toBeVisible();
  });
});
