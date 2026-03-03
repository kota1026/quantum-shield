/**
 * Enterprise Dashboard Page E2E Tests
 *
 * URL: /ja/enterprise/dashboard
 * Tests page structure, sidebar navigation, KPI grid, transactions table,
 * activity list, system status, accessibility, and responsive design.
 * Uses structural assertions rather than hardcoded mock data values.
 *
 * Requires: Frontend on :3000
 */

import { test, expect } from '@playwright/test';

test.describe('Enterprise Dashboard Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/enterprise/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Page Structure', () => {
    test('should display the page title', async ({ page }) => {
      const h1 = page.getByRole('heading', { level: 1 });
      await expect(h1).toBeVisible();
      const text = await h1.textContent();
      expect(text?.trim().length).toBeGreaterThan(0);
    });

    test('should display sidebar navigation', async ({ page }) => {
      // Sidebar contains navigation links
      await expect(page.getByRole('navigation').first()).toBeVisible();
    });

    test('should display main content area', async ({ page }) => {
      await expect(page.getByRole('main')).toBeVisible();
    });
  });

  test.describe('Sidebar Navigation', () => {
    test('should display ENTERPRISE EDITION badge', async ({ page }) => {
      await expect(page.getByText('ENTERPRISE EDITION')).toBeVisible();
    });

    test('should have dashboard link', async ({ page }) => {
      const dashboardLink = page.locator('a[href*="/enterprise/dashboard"]');
      await expect(dashboardLink.first()).toBeVisible();
    });

    test('should have infrastructure section links', async ({ page }) => {
      // Sidebar should have at least one infrastructure-related link
      const infraLinks = page.locator('a[href*="/enterprise/provers"], a[href*="/enterprise/observers"]');
      expect(await infraLinks.count()).toBeGreaterThanOrEqual(1);
    });

    test('should have users link', async ({ page }) => {
      const usersLink = page.locator('a[href*="/enterprise/users"]');
      await expect(usersLink.first()).toBeVisible();
    });

    test('should have settings link', async ({ page }) => {
      const settingsLink = page.locator('a[href*="/enterprise/settings"]');
      await expect(settingsLink).toBeVisible();
    });
  });

  test.describe('KPI Grid', () => {
    test('should display KPI cards with numeric values', async ({ page }) => {
      // KPI grid should have visible numeric content
      const mainContent = page.getByRole('main');
      const mainText = await mainContent.textContent();
      // Dashboard should contain numbers (KPI values)
      expect(mainText).toMatch(/\d/);
    });
  });

  test.describe('Recent Transactions Table', () => {
    test('should display the transactions table', async ({ page }) => {
      const table = page.getByRole('table');
      await expect(table).toBeVisible();
    });

    test('should display table headers', async ({ page }) => {
      // Check structural table headers
      const headers = page.getByRole('columnheader');
      expect(await headers.count()).toBeGreaterThanOrEqual(3);
    });

    test('should display at least one transaction row', async ({ page }) => {
      const rows = page.locator('table tbody tr');
      expect(await rows.count()).toBeGreaterThanOrEqual(1);
    });
  });

  test.describe('Recent Activity List', () => {
    test('should display activity section', async ({ page }) => {
      await expect(page.getByText(/最近のアクティビティ|Recent Activity/)).toBeVisible();
    });
  });

  test.describe('System Status List', () => {
    test('should display system status section', async ({ page }) => {
      await expect(page.getByText(/システムステータス|System Status/)).toBeVisible();
    });

    test('should display status items', async ({ page }) => {
      // System status section should list infrastructure components
      // The text may be localized or dynamic
      const statusSection = page.locator('section, div').filter({
        hasText: /システムステータス|System Status/,
      }).first();
      await expect(statusSection).toBeVisible();
    });
  });

  test.describe('Top Bar', () => {
    test('should display search input', async ({ page }) => {
      const searchInput = page.getByRole('searchbox');
      await expect(searchInput).toBeVisible();
    });

    test('should display user info area', async ({ page }) => {
      // Top bar has user information (avatar, name, or menu)
      const topBar = page.locator('header, [role="banner"]').first();
      await expect(topBar).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      const h1 = await page.locator('h1').count();
      expect(h1).toBe(1);

      const h2s = page.locator('h2');
      await expect(h2s.first()).toBeVisible();
    });

    test('should have accessible landmarks', async ({ page }) => {
      await expect(page.getByRole('navigation').first()).toBeVisible();
      await expect(page.getByRole('main')).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should adapt layout for tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await expect(page.getByRole('main')).toBeVisible();
    });

    test('should adapt layout for desktop viewport', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await expect(page.getByRole('main')).toBeVisible();
    });
  });
});

test.describe('Enterprise Dashboard - English', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/enterprise/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('should display English content', async ({ page }) => {
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toBeVisible();
    await expect(page).toHaveURL(/\/en\//);
  });
});
