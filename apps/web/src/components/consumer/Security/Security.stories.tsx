import type { Meta, StoryObj } from '@storybook/react';
import { Security } from './index';

const meta: Meta<typeof Security> = {
  title: 'Consumer/Security',
  component: Security,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/consumer/security',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Security>;

export const Default: Story = {};

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
