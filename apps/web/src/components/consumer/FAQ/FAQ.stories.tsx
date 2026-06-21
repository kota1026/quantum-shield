import type { Meta, StoryObj } from '@storybook/react';
import { FAQ } from './index';

const meta: Meta<typeof FAQ> = {
  title: 'Consumer/FAQ',
  component: FAQ,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/consumer/faq',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof FAQ>;

export const Default: Story = {
  args: {},
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
