import type { Meta, StoryObj } from '@storybook/react';
import { LockProcessing } from './index';

const meta: Meta<typeof LockProcessing> = {
  title: 'Consumer/LockProcessing',
  component: LockProcessing,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/consumer/lock-processing',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof LockProcessing>;

export const Default: Story = {};

export const Mobile: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};
