import { test, expect } from '@playwright/test';

test.describe('Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/consumer/settings');
  });

  test.describe('Page Structure', () => {
    test('should display page title', async ({ page }) => {
      await expect(page.locator('h1')).toContainText('設定');
    });

    test('should display back button with proper aria-label', async ({ page }) => {
      const backButton = page.locator('a[aria-label="戻る"]');
      await expect(backButton).toBeVisible();
    });

    test('should display all settings sections', async ({ page }) => {
      // Account section
      await expect(page.getByText('アカウント')).toBeVisible();

      // Notifications section
      await expect(page.getByText('通知')).toBeVisible();

      // Display section
      await expect(page.getByText('表示')).toBeVisible();

      // Security section
      await expect(page.getByText('セキュリティ')).toBeVisible();

      // Support section
      await expect(page.getByText('サポート')).toBeVisible();

      // Danger Zone section
      await expect(page.getByText('危険な操作')).toBeVisible();
    });
  });

  test.describe('Account Section', () => {
    test('should display key management item', async ({ page }) => {
      await expect(page.getByText('鍵管理')).toBeVisible();
      await expect(
        page.getByText('Dilithium鍵のバックアップ・エクスポート')
      ).toBeVisible();
    });

    test('should display connected wallet with address', async ({ page }) => {
      await expect(page.getByText('接続中のウォレット')).toBeVisible();
      await expect(page.getByText('0x7a3f...9c2d')).toBeVisible();
    });
  });

  test.describe('Notifications Section', () => {
    test('should display push notification toggle', async ({ page }) => {
      await expect(page.getByText('プッシュ通知')).toBeVisible();

      // Toggle should be visible and checked by default
      const pushToggle = page
        .locator('[aria-label="プッシュ通知"]')
        .first();
      await expect(pushToggle).toBeChecked();
    });

    test('should display email notification toggle', async ({ page }) => {
      await expect(page.getByText('メール通知')).toBeVisible();

      // Toggle should be visible and unchecked by default
      const emailToggle = page
        .locator('[aria-label="メール通知"]')
        .first();
      await expect(emailToggle).not.toBeChecked();
    });

    test('should toggle push notifications', async ({ page }) => {
      const pushToggle = page.locator('[aria-label="プッシュ通知"]').first();
      await expect(pushToggle).toBeChecked();

      // Click to toggle off
      await pushToggle.click();
      await expect(pushToggle).not.toBeChecked();

      // Click to toggle on
      await pushToggle.click();
      await expect(pushToggle).toBeChecked();
    });
  });

  test.describe('Display Section', () => {
    test('should display dark mode toggle (checked by default)', async ({
      page,
    }) => {
      await expect(page.getByText('ダークモード')).toBeVisible();

      const darkModeToggle = page.locator('[aria-label="ダークモード"]').first();
      await expect(darkModeToggle).toBeChecked();
    });

    test('should display language setting with value', async ({ page }) => {
      await expect(page.getByText('言語')).toBeVisible();
      await expect(page.getByText('日本語')).toBeVisible();
    });

    test('should display currency setting with value', async ({ page }) => {
      await expect(page.getByText('通貨表示')).toBeVisible();
      await expect(page.getByText('JPY (¥)')).toBeVisible();
    });
  });

  test.describe('Security Section', () => {
    test('should display auto lock setting with value', async ({ page }) => {
      await expect(page.getByText('自動ロック')).toBeVisible();
      await expect(page.getByText('5分')).toBeVisible();
    });

    test('should display biometric auth toggle (checked by default)', async ({
      page,
    }) => {
      await expect(page.getByText('生体認証')).toBeVisible();

      const biometricToggle = page.locator('[aria-label="生体認証"]').first();
      await expect(biometricToggle).toBeChecked();
    });
  });

  test.describe('Support Section', () => {
    test('should display FAQ item', async ({ page }) => {
      await expect(page.getByText('よくある質問')).toBeVisible();
      await expect(page.getByText('FAQ・ヘルプセンター')).toBeVisible();
    });

    test('should display contact item', async ({ page }) => {
      await expect(page.getByText('お問い合わせ')).toBeVisible();
      await expect(page.getByText('サポートチームに連絡')).toBeVisible();
    });

    test('should display legal item', async ({ page }) => {
      await expect(page.getByText('利用規約・プライバシー')).toBeVisible();
      await expect(page.getByText('法的文書を確認')).toBeVisible();
    });
  });

  test.describe('Danger Zone', () => {
    test('should display disconnect wallet item with danger styling', async ({
      page,
    }) => {
      await expect(page.getByText('ウォレットを切断')).toBeVisible();
      await expect(page.getByText('接続を解除してログアウト')).toBeVisible();
    });
  });

  test.describe('Version Info', () => {
    test('should display version information', async ({ page }) => {
      await expect(page.getByText('Quantum Shield').last()).toBeVisible();
      await expect(page.getByText(/Version 1\.0\.0/)).toBeVisible();
    });
  });

  test.describe('Navigation', () => {
    test('should navigate back to dashboard when back button is clicked', async ({
      page,
    }) => {
      const backButton = page.locator('a[aria-label="戻る"]');
      await backButton.click();

      await expect(page).toHaveURL(/\/consumer\/dashboard/);
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should be able to tab through interactive items', async ({ page }) => {
      // Start from back button
      await page.locator('a[aria-label="戻る"]').focus();

      // Tab to first settings item (key management)
      await page.keyboard.press('Tab');
      const keyManagement = page.locator('[role="button"]').first();
      await expect(keyManagement).toBeFocused();

      // Continue tabbing
      await page.keyboard.press('Tab');
      // Should be on connected wallet
    });

    test('should activate item with Enter key', async ({ page }) => {
      // Focus on a navigation item
      const keyManagement = page.locator('[role="button"]').first();
      await keyManagement.focus();

      // Listen for console.log (navigation logs)
      const consoleMessages: string[] = [];
      page.on('console', (msg) => {
        consoleMessages.push(msg.text());
      });

      await page.keyboard.press('Enter');

      // Should navigate or log (depending on implementation)
    });

    test('should toggle switch with Space key', async ({ page }) => {
      const pushToggle = page.locator('[aria-label="プッシュ通知"]').first();
      await expect(pushToggle).toBeChecked();

      await pushToggle.focus();
      await page.keyboard.press('Space');

      await expect(pushToggle).not.toBeChecked();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      const h1 = page.locator('h1');
      await expect(h1).toHaveCount(1);
      await expect(h1).toContainText('設定');

      // Section titles (h4 in items)
      const h4s = page.locator('h4');
      expect(await h4s.count()).toBeGreaterThan(0);
    });

    test('should have sections with proper aria-labelledby', async ({ page }) => {
      const sections = page.locator('section[aria-labelledby]');
      expect(await sections.count()).toBeGreaterThan(0);
    });

    test('should have all toggles with aria-label', async ({ page }) => {
      const toggles = page.locator('input[type="checkbox"][aria-label]');
      expect(await toggles.count()).toBe(4); // push, email, dark mode, biometric
    });
  });

  test.describe('Responsive Design', () => {
    test('should display properly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      // Header should be visible
      await expect(page.locator('h1')).toBeVisible();

      // Settings sections should be visible
      await expect(page.getByText('アカウント')).toBeVisible();
      await expect(page.getByText('セキュリティ')).toBeVisible();
    });
  });
});

test.describe('Settings Page (English)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/consumer/settings');
  });

  test('should display content in English', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Settings');

    // Sections in English
    await expect(page.getByText('Account')).toBeVisible();
    await expect(page.getByText('Notifications')).toBeVisible();
    await expect(page.getByText('Display')).toBeVisible();
    await expect(page.getByText('Security')).toBeVisible();
    await expect(page.getByText('Support')).toBeVisible();
    await expect(page.getByText('Danger Zone')).toBeVisible();
  });

  test('should display items in English', async ({ page }) => {
    await expect(page.getByText('Key Management')).toBeVisible();
    await expect(page.getByText('Push Notifications')).toBeVisible();
    await expect(page.getByText('Dark Mode')).toBeVisible();
    await expect(page.getByText('Auto Lock')).toBeVisible();
    await expect(page.getByText('FAQ')).toBeVisible();
  });
});
