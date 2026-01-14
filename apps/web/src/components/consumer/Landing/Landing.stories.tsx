import type { Meta, StoryObj } from '@storybook/react';
import { NextIntlClientProvider } from 'next-intl';
import { Landing } from './index';
import jaMessages from '../../../../locales/ja/consumer.json';
import enMessages from '../../../../locales/en/consumer.json';

const meta: Meta<typeof Landing> = {
  title: 'Consumer/Landing',
  component: Landing,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
    },
  },
  decorators: [
    (Story, context) => {
      const locale = context.globals.locale || 'ja';
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
type Story = StoryObj<typeof Landing>;

export const Default: Story = {
  args: {},
};

export const Japanese: Story = {
  parameters: {
    globals: {
      locale: 'ja',
    },
  },
};

export const English: Story = {
  parameters: {
    globals: {
      locale: 'en',
    },
  },
  decorators: [
    (Story) => (
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <Story />
      </NextIntlClientProvider>
    ),
  ],
};

export const Mobile: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};

export const Tablet: Story = {
  parameters: {
    viewport: { defaultViewport: 'tablet' },
  },
};
