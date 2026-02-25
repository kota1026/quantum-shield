import type { Meta, StoryObj } from '@storybook/react';
import { NextIntlClientProvider } from 'next-intl';
import { ExplorerOverview } from './Overview';
import jaMessages from '../../../locales/ja/explorer.json';
import enMessages from '../../../locales/en/explorer.json';

const meta: Meta<typeof ExplorerOverview> = {
  title: 'Explorer/Overview',
  component: ExplorerOverview,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#0a0a0c' },
      ],
    },
  },
  decorators: [
    (Story, context) => {
      const locale = context.args.locale || 'ja';
      const messages = locale === 'ja' ? jaMessages : enMessages;
      return (
        <NextIntlClientProvider locale={locale} messages={{ explorer: messages }}>
          <Story />
        </NextIntlClientProvider>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof ExplorerOverview>;

export const Default: Story = {
  args: {
    locale: 'ja',
  },
};

export const English: Story = {
  args: {
    locale: 'en',
  },
};

export const Mobile: Story = {
  args: {
    locale: 'ja',
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const Tablet: Story = {
  args: {
    locale: 'ja',
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};
