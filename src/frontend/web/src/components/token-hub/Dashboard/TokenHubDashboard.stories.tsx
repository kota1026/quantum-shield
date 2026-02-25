import type { Meta, StoryObj } from '@storybook/react';
import { TokenHubDashboard } from './index';

const meta: Meta<typeof TokenHubDashboard> = {
  title: 'TokenHub/Dashboard',
  component: TokenHubDashboard,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
    },
  },
};

export default meta;
type Story = StoryObj<typeof TokenHubDashboard>;

export const Default: Story = {};

export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const Tablet: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};
