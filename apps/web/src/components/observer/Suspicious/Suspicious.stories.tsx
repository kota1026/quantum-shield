import type { Meta, StoryObj } from '@storybook/react';
import { SuspiciousMonitor } from './index';

const meta: Meta<typeof SuspiciousMonitor> = {
  title: 'Observer/SuspiciousMonitor',
  component: SuspiciousMonitor,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
    },
  },
};

export default meta;
type Story = StoryObj<typeof SuspiciousMonitor>;

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
