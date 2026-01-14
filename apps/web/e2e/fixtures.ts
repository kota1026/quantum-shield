import { test as base, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

type Fixtures = {
  a11y: AxeBuilder;
  mockWallet: {
    address: string;
    connect: () => Promise<void>;
  };
};

export const test = base.extend<Fixtures>({
  a11y: async ({ page }, use) => {
    const axe = new AxeBuilder({ page }).withTags([
      'wcag2a',
      'wcag2aa',
      'wcag21aa',
    ]);
    await use(axe);
  },
  mockWallet: async ({ page }, use) => {
    const wallet = {
      address: '0x1234567890abcdef1234567890abcdef12345678',
      connect: async () => {
        await page.evaluate((addr) => {
          window.localStorage.setItem('mockWalletAddress', addr);
        }, wallet.address);
      },
    };
    await use(wallet);
  },
});

export { expect };
