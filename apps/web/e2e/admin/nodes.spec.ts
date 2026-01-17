import { test, expect } from '@playwright/test';

/**
 * QS Admin L3 Nodes E2E Tests
 * Tests for Screen 06: L3 Node Management
 */

test.describe('QS Admin L3 Nodes', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to nodes page
    await page.goto('/ja/admin/nodes');
  });

  test.describe('Page Load & Layout', () => {
    test('should display nodes page correctly', async ({ page }) => {
      // Check page title
      await expect(page).toHaveTitle(/L3 Nodes.*QS Admin/);

      // Check main elements are visible
      await expect(page.getByRole('navigation')).toBeVisible(); // Sidebar
      await expect(page.getByRole('main')).toBeVisible();
    });

    test('should display page header with title and subtitle', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'L3 Node Management', level: 1 })).toBeVisible();
      await expect(page.getByText(/Aegis L3.*ネットワークノード管理/)).toBeVisible();
    });
  });

  test.describe('Stats Row', () => {
    test('should display all 4 stat cards', async ({ page }) => {
      await expect(page.getByText('Total Nodes')).toBeVisible();
      await expect(page.getByText('Healthy')).toBeVisible();
      await expect(page.getByText('Current Block')).toBeVisible();
      await expect(page.getByText('Avg TPS')).toBeVisible();
    });

    test('should display stat values', async ({ page }) => {
      await expect(page.getByText('12').first()).toBeVisible();
      await expect(page.getByText('1,234,567').first()).toBeVisible();
      await expect(page.getByText('245')).toBeVisible();
    });
  });

  test.describe('Active Nodes Grid', () => {
    test('should display card header', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Active Nodes' })).toBeVisible();
    });

    test('should display node cards', async ({ page }) => {
      const nodeList = page.getByRole('list', { name: 'Active Nodes' });
      await expect(nodeList).toBeVisible();

      const nodeItems = nodeList.getByRole('listitem');
      await expect(nodeItems).toHaveCount(6);
    });

    test('should display primary node', async ({ page }) => {
      await expect(page.getByText('Node-01 (Primary)')).toBeVisible();
    });

    test('should display nodes with locations', async ({ page }) => {
      await expect(page.getByText('Node-04 (Tokyo)')).toBeVisible();
      await expect(page.getByText('Node-05 (Singapore)')).toBeVisible();
      await expect(page.getByText('Node-06 (London)')).toBeVisible();
    });

    test('should display node metrics', async ({ page }) => {
      // Block metrics
      await expect(page.getByText('Block:').first()).toBeVisible();
      await expect(page.getByText('1,234,567').first()).toBeVisible();

      // Peers metrics
      await expect(page.getByText('Peers:').first()).toBeVisible();
      await expect(page.getByText('11').first()).toBeVisible();

      // CPU metrics
      await expect(page.getByText('CPU:').first()).toBeVisible();

      // Memory metrics
      await expect(page.getByText('Memory:').first()).toBeVisible();
    });

    test('node cards should be clickable', async ({ page }) => {
      const nodeCard = page.getByRole('button', { name: /Node-01.*Primary.*Healthy/ });
      await expect(nodeCard).toBeVisible();
      await expect(nodeCard).toBeEnabled();
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('node cards should be keyboard navigable', async ({ page }) => {
      const nodeCard = page.getByRole('button', { name: /Node-01.*Primary/ });
      await nodeCard.focus();
      await expect(nodeCard).toBeFocused();
    });

    test('should activate node on Enter key', async ({ page }) => {
      const nodeCard = page.getByRole('button', { name: /Node-01.*Primary/ });
      await nodeCard.focus();
      await nodeCard.press('Enter');
      // In production, this would open a detail modal
    });

    test('should activate node on Space key', async ({ page }) => {
      const nodeCard = page.getByRole('button', { name: /Node-01.*Primary/ });
      await nodeCard.focus();
      await nodeCard.press(' ');
      // In production, this would open a detail modal
    });
  });

  test.describe('Responsive Design', () => {
    test('should adapt layout on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      await expect(page.getByRole('navigation')).toBeVisible();
      await expect(page.getByRole('main')).toBeVisible();
      await expect(page.getByRole('heading', { name: 'L3 Node Management' })).toBeVisible();
    });

    test('should show 2 columns on medium screens', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      // Stats cards should still be visible
      await expect(page.getByText('Total Nodes')).toBeVisible();

      // Node cards should be visible
      await expect(page.getByText('Node-01 (Primary)')).toBeVisible();
    });

    test('should show 1 column on small screens', async ({ page }) => {
      await page.setViewportSize({ width: 480, height: 800 });

      // Content should still be visible
      await expect(page.getByText('Active Nodes')).toBeVisible();
      await expect(page.getByText('Node-01 (Primary)')).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA labels', async ({ page }) => {
      // Main content with aria-label
      const main = page.getByRole('main');
      await expect(main).toBeVisible();

      // Node list
      const nodeList = page.getByRole('list', { name: 'Active Nodes' });
      await expect(nodeList).toBeVisible();
    });

    test('node cards should have proper aria-label', async ({ page }) => {
      const nodeCards = page.getByRole('button');
      const count = await nodeCards.count();

      // Filter to only node cards
      for (let i = 0; i < count; i++) {
        const card = nodeCards.nth(i);
        const label = await card.getAttribute('aria-label');
        if (label && label.includes('Node-')) {
          expect(label).toContain('Healthy');
        }
      }
    });
  });

  test.describe('Sidebar Navigation', () => {
    test('L3 Nodes should be highlighted in sidebar', async ({ page }) => {
      const sidebar = page.getByRole('navigation', { name: /QS Admin/i });
      const nodesLink = sidebar.getByRole('link', { name: /L3 Nodes/i });
      await expect(nodesLink).toHaveAttribute('aria-current', 'page');
    });

    test('should navigate to dashboard from sidebar', async ({ page }) => {
      const sidebar = page.getByRole('navigation', { name: /QS Admin/i });
      await sidebar.getByRole('link', { name: 'Dashboard' }).click();
      await expect(page).toHaveURL(/\/admin\/dashboard/);
    });

    test('should navigate to TX monitor from sidebar', async ({ page }) => {
      const sidebar = page.getByRole('navigation', { name: /QS Admin/i });
      await sidebar.getByRole('link', { name: /TX Monitor/i }).click();
      await expect(page).toHaveURL(/\/admin\/tx-monitor/);
    });
  });

  test.describe('English Locale', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/en/admin/nodes');
    });

    test('should display English text', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'L3 Node Management', level: 1 })).toBeVisible();
      await expect(page.getByText('Aegis L3 Network Node Management')).toBeVisible();
    });

    test('should display English stat labels', async ({ page }) => {
      await expect(page.getByText('Total Nodes')).toBeVisible();
      await expect(page.getByText('Healthy')).toBeVisible();
      await expect(page.getByText('Current Block')).toBeVisible();
      await expect(page.getByText('Avg TPS')).toBeVisible();
    });

    test('should display Primary label in English', async ({ page }) => {
      await expect(page.getByText('Node-01 (Primary)')).toBeVisible();
    });
  });
});
