import type { Meta, StoryObj } from '@storybook/react';
import { ObserverDashboard } from './index';

const meta: Meta<typeof ObserverDashboard> = {
  title: 'Observer/Dashboard',
  component: ObserverDashboard,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
    },
  },
};

export default meta;
type Story = StoryObj<typeof ObserverDashboard>;

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
