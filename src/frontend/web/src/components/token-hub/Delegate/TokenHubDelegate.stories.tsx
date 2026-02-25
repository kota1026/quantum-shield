import type { Meta, StoryObj } from '@storybook/react';
import { NextIntlClientProvider } from 'next-intl';
import { TokenHubDelegate } from './index';

// Import Japanese translations
import jaMessages from '../../../../locales/ja/token-hub.json';
import enMessages from '../../../../locales/en/token-hub.json';

const meta: Meta<typeof TokenHubDelegate> = {
  title: 'Token Hub/Delegate',
  component: TokenHubDelegate,
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#0a0a0c' },
      ],
    },
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/ja/token-hub/delegate',
      },
    },
  },
  decorators: [
    (Story, context) => {
      const locale = context.globals?.locale || 'ja';
      const messages = locale === 'ja' ? jaMessages : enMessages;
      return (
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Story />
        </NextIntlClientProvider>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof TokenHubDelegate>;

/**
 * Default view showing the delegate list with all delegates
 */
export const Default: Story = {
  name: 'Default View (Japanese)',
};

/**
 * English version of the delegate list
 */
export const English: Story = {
  name: 'English Version',
  globals: {
    locale: 'en',
  },
};

/**
 * Mobile responsive view
 */
export const Mobile: Story = {
  name: 'Mobile View',
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

/**
 * Tablet responsive view
 */
export const Tablet: Story = {
  name: 'Tablet View',
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};
