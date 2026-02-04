import type { Meta, StoryObj } from '@storybook/react';
import { NextIntlClientProvider } from 'next-intl';
import { LockDetail } from './LockDetail';
import jaMessages from '../../../locales/ja/explorer.json';
import enMessages from '../../../locales/en/explorer.json';

const meta: Meta<typeof LockDetail> = {
  title: 'Explorer/LockDetail',
  component: LockDetail,
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
        pathname: '/ja/explorer/locks/0x7a3f',
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
type Story = StoryObj<typeof LockDetail>;

export const ActiveLock: Story = {
  args: {
    locale: 'ja',
    lockId: '0x7a3f8b2c4d5e6f...e821d4f9',
  },
};

export const UnlockingLock: Story = {
  args: {
    locale: 'ja',
    lockId: '0x4d8e9f0a1b2c3d...a923b4c5',
  },
};

export const UnlockedLock: Story = {
  args: {
    locale: 'ja',
    lockId: '0x8c3d4e5f6a7b8c...b156c2d3',
  },
};

export const NotFound: Story = {
  args: {
    locale: 'ja',
    lockId: 'invalid-lock-id',
  },
};

export const English: Story = {
  args: {
    locale: 'en',
    lockId: '0x7a3f8b2c4d5e6f...e821d4f9',
  },
};

export const Mobile: Story = {
  args: {
    locale: 'ja',
    lockId: '0x7a3f8b2c4d5e6f...e821d4f9',
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};
