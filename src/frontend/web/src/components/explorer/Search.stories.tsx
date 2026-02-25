import type { Meta, StoryObj } from '@storybook/react';
import { NextIntlClientProvider } from 'next-intl';
import { ExplorerSearch } from './Search';
import jaMessages from '../../../locales/ja/explorer.json';
import enMessages from '../../../locales/en/explorer.json';

const meta: Meta<typeof ExplorerSearch> = {
  title: 'Explorer/Search',
  component: ExplorerSearch,
  tags: ['autodocs'],
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
        pathname: '/ja/explorer/search',
        query: { q: '0x7a3f' },
      },
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
type Story = StoryObj<typeof ExplorerSearch>;

export const Default: Story = {
  args: {
    locale: 'ja',
    initialQuery: '0x7a3f',
  },
};

export const English: Story = {
  args: {
    locale: 'en',
    initialQuery: '0x7a3f',
  },
};

export const EmptyQuery: Story = {
  args: {
    locale: 'ja',
    initialQuery: '',
  },
};

export const Mobile: Story = {
  args: {
    locale: 'ja',
    initialQuery: '0x7a3f',
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};
