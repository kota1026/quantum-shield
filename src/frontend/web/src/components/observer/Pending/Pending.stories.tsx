import type { Meta, StoryObj } from '@storybook/react';
import { PendingMonitor } from './index';

const meta: Meta<typeof PendingMonitor> = {
  title: 'Observer/PendingMonitor',
  component: PendingMonitor,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
    },
  },
};

export default meta;
type Story = StoryObj<typeof PendingMonitor>;

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
