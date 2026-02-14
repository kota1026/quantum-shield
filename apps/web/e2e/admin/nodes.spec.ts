import { test, expect } from '@playwright/test';
import { gotoAndWaitForApp } from '../helpers/wait-for-app';

test.describe('QS Admin L3 Nodes', () => {
  test.setTimeout(90000);

  test.beforeEach(async ({ page }) => {
    await gotoAndWaitForApp(page, '/ja/admin/nodes');
  });

  test('should display page header with title', async ({ page }) => {
    // i18n: admin.nodes.title = "L3 Node Management"
    await expect(page.locator('h1').first()).toContainText('L3 Node Management');
  });

  test('should display subtitle', async ({ page }) => {
    // i18n: admin.nodes.subtitle = "Aegis L3 ネットワークノード管理"
    await expect(page.locator('text=Aegis L3').first()).toBeVisible();
  });

  test('should have main content area', async ({ page }) => {
    const main = page.locator('[role="main"]');
    await expect(main).toBeVisible();
  });

  test('should display stat labels', async ({ page }) => {
    await expect(page.locator('text=Total Nodes').first()).toBeVisible();
    await expect(page.locator('text=Healthy').first()).toBeVisible();
    await expect(page.locator('text=Current Block').first()).toBeVisible();
    await expect(page.locator('text=Avg TPS').first()).toBeVisible();
  });

  test('should display Active Nodes card', async ({ page }) => {
    // i18n: admin.nodes.card.title = "Active Nodes"
    await expect(page.locator('text=Active Nodes').first()).toBeVisible();
  });

  test('should display node cards in a list', async ({ page }) => {
    const nodeList = page.locator('[role="list"]');
    await expect(nodeList.first()).toBeVisible();
    const nodeItems = nodeList.first().locator('[role="listitem"]');
    const count = await nodeItems.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('should display node metric labels', async ({ page }) => {
    // i18n: admin.nodes.node.metrics
    await expect(page.locator('text=Block:').first()).toBeVisible();
    await expect(page.locator('text=Peers:').first()).toBeVisible();
    await expect(page.locator('text=CPU:').first()).toBeVisible();
    await expect(page.locator('text=Memory:').first()).toBeVisible();
  });

  test('should display node status badges', async ({ page }) => {
    // i18n: admin.nodes.status.healthy = "Healthy"
    await expect(page.locator('text=Healthy').first()).toBeVisible();
  });

  test('node cards should be clickable', async ({ page }) => {
    // Node cards use role="button" with tabindex="0"
    const nodeButton = page.locator('[role="button"][tabindex="0"]').first();
    await expect(nodeButton).toBeVisible();
  });
});
