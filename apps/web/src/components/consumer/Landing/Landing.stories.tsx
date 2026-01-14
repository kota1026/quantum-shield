import type { Meta, StoryObj } from '@storybook/react';
import { NextIntlClientProvider } from 'next-intl';
import { Landing } from './index';
import jaMessages from '../../../../messages/ja/consumer.json';
import enMessages from '../../../../messages/en/consumer.json';

const meta: Meta<typeof Landing> = {
  title: 'Consumer/Landing',
  component: Landing,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
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
  name: 'Default (Japanese)',
};

export const English: Story = {
  name: 'English',
  globals: {
    locale: 'en',
  },
};

export const Mobile: Story = {
  name: 'Mobile View',
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};

export const Tablet: Story = {
  name: 'Tablet View',
  parameters: {
    viewport: { defaultViewport: 'ipad' },
  },
};

export const DarkMode: Story = {
  name: 'Dark Mode',
  parameters: {
    backgrounds: { default: 'dark' },
  },
};
