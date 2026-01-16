import { test, expect, Page } from '@playwright/test';

/**
 * E2E Test: Critical Path - Lock → Unlock Flow
 * 
 * This tests the primary user journey:
 * 1. Landing page → Dashboard
 * 2. Lock assets (with simulated wallet)
 * 3. View lock in dashboard
 * 4. Request unlock
 * 5. Wait for time lock (simulated)
 * 6. Execute unlock
 * 
 * Note: Actual wallet interactions require MetaMask fixtures
 * This test uses UI-only validation without real transactions
 */

test.describe('Critical Path: Lock → Unlock Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app
    await page.goto('/');
  });

  test('Landing page displays correctly', async ({ page }) => {
    // Check landing page content
    await expect(page.getByRole('heading', { name: /Quantum Shield/i })).toBeVisible();
    await expect(page.getByText(/quantum-resistant/i)).toBeVisible();
    
    // Check navigation links
    await expect(page.getByRole('link', { name: /How It Works/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Security/i })).toBeVisible();
  });

  test('Navigation to public pages', async ({ page }) => {
    // How It Works
    await page.getByRole('link', { name: /How It Works/i }).click();
    await expect(page.getByRole('heading', { name: /How It Works/i })).toBeVisible();
    await expect(page.getByText(/Dilithium/i)).toBeVisible();
    
    // Security page
    await page.goto('/security');
    await expect(page.getByText(/NIST/i)).toBeVisible();
    
    // FAQ
    await page.goto('/faq');
    await expect(page.getByText(/What is Quantum Shield/i)).toBeVisible();
  });

  test('Lock page shows connect wallet prompt when disconnected', async ({ page }) => {
    await page.goto('/lock');
    
    // Should show connect prompt (since no wallet mock in E2E by default)
    await expect(page.getByText(/Connect Your Wallet/i)).toBeVisible();
  });

  test('Dashboard shows connect prompt when disconnected', async ({ page }) => {
    await page.goto('/dashboard');
    
    await expect(page.getByText(/Connect Your Wallet/i)).toBeVisible();
  });
});

test.describe('Lock Flow UI', () => {
  // These tests validate UI structure without wallet
  
  test('Lock input page structure', async ({ page }) => {
    await page.goto('/lock');
    
    // Page should render (even if showing connect prompt)
    await expect(page).toHaveTitle(/Quantum Shield/i);
  });

  test('Lock confirm page accepts amount parameter', async ({ page }) => {
    await page.goto('/lock/confirm?amount=1.5');
    
    // Should display the amount from URL
    await expect(page.getByText(/1.5/)).toBeVisible();
  });

  test('Lock success page displays after processing', async ({ page }) => {
    await page.goto('/lock/success?amount=1.5&txHash=0x123456789');
    
    // Should show success indicators
    await expect(page.getByText(/success/i)).toBeVisible();
    await expect(page.getByText(/1.5/)).toBeVisible();
  });
});

test.describe('Unlock Flow UI', () => {
  test('Unlock selection page structure', async ({ page }) => {
    await page.goto('/unlock');
    
    await expect(page).toHaveTitle(/Quantum Shield/i);
  });

  test('Unlock method selection shows normal and emergency options', async ({ page }) => {
    await page.goto('/unlock/method?lockId=1');
    
    // Should show both unlock options
    await expect(page.getByText(/Normal Unlock/i)).toBeVisible();
    await expect(page.getByText(/Emergency Unlock/i)).toBeVisible();
    await expect(page.getByText(/24 hours/i)).toBeVisible();
    await expect(page.getByText(/7 days/i)).toBeVisible();
  });

  test('Emergency bond page shows bond calculation', async ({ page }) => {
    await page.goto('/unlock/emergency/bond?lockId=1&amount=1.5');
    
    // Should show bond formula (SEQ#3 compliant)
    await expect(page.getByText(/Emergency Bond/i)).toBeVisible();
    await expect(page.getByText(/0\.5 ETH|5%/)).toBeVisible();
  });

  test('Countdown page shows time remaining', async ({ page }) => {
    await page.goto('/unlock/countdown?lockId=1');
    
    // Should show countdown timer
    await expect(page.getByText(/Time Remaining/i)).toBeVisible();
  });

  test('Unlock complete page shows transaction details', async ({ page }) => {
    await page.goto('/unlock/complete?lockId=1&amount=1.5&txHash=0x123');
    
    await expect(page.getByText(/Unlock Complete/i)).toBeVisible();
    await expect(page.getByText(/1.5/)).toBeVisible();
  });
});

test.describe('Settings & Utility Pages', () => {
  test('History page renders', async ({ page }) => {
    await page.goto('/history');
    
    await expect(page.getByText(/History/i)).toBeVisible();
  });

  test('Settings page renders with options', async ({ page }) => {
    await page.goto('/settings');
    
    await expect(page.getByText(/Settings/i)).toBeVisible();
    await expect(page.getByText(/Notifications/i)).toBeVisible();
  });

  test('Keys page renders with security info', async ({ page }) => {
    await page.goto('/keys');
    
    await expect(page.getByText(/Key Management/i)).toBeVisible();
    await expect(page.getByText(/Dilithium/i)).toBeVisible();
  });

  test('Disconnect page shows confirmation', async ({ page }) => {
    await page.goto('/disconnect');
    
    await expect(page.getByText(/Disconnect/i)).toBeVisible();
  });
});

test.describe('Mobile Responsiveness', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('Landing page is mobile-friendly', async ({ page }) => {
    await page.goto('/');
    
    // Content should be visible without horizontal scroll
    await expect(page.getByRole('heading', { name: /Quantum Shield/i })).toBeVisible();
  });

  test('Lock page is mobile-friendly', async ({ page }) => {
    await page.goto('/lock/confirm?amount=1.5');
    
    // Form should be usable on mobile
    await expect(page.locator('form, .card, [role="main"]')).toBeVisible();
  });
});

test.describe('Core Principles Verification', () => {
  test('CP-3: Time Lock values are displayed correctly', async ({ page }) => {
    await page.goto('/unlock/method?lockId=1');
    
    // Normal unlock = 24 hours
    await expect(page.getByText(/24 hours/i)).toBeVisible();
    
    // Emergency = 7 days
    await expect(page.getByText(/7 days/i)).toBeVisible();
  });

  test('CP-5: Etherscan links are present for transparency', async ({ page }) => {
    await page.goto('/lock/success?amount=1.5&txHash=0x123');
    
    // Should have Etherscan link
    const etherscanLink = page.locator('a[href*="etherscan.io"]');
    await expect(etherscanLink).toBeVisible();
  });

  test('Security page explains quantum resistance (CP-1)', async ({ page }) => {
    await page.goto('/security');
    
    await expect(page.getByText(/Dilithium/i)).toBeVisible();
    await expect(page.getByText(/SPHINCS/i)).toBeVisible();
    await expect(page.getByText(/NIST/i)).toBeVisible();
  });
});
