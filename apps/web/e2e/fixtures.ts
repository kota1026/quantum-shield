import { test as base, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { setupConsumerAuth, getTestWalletAddress } from './helpers/consumer-auth';

type Fixtures = {
  a11y: AxeBuilder;
  mockWallet: {
    address: string;
    connect: () => Promise<void>;
  };
  /** Authenticated page with real JWT from SIWE + live backend API */
  authenticatedPage: {
    address: string;
    accessToken: string;
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
      address: getTestWalletAddress(),
      connect: async () => {
        await page.evaluate((addr) => {
          window.localStorage.setItem('mockWalletAddress', addr);
        }, wallet.address);
      },
    };
    await use(wallet);
  },
  authenticatedPage: async ({ page }, use) => {
    const { address, accessToken } = await setupConsumerAuth(page);
    await use({ address, accessToken });
  },
});

export { expect };
