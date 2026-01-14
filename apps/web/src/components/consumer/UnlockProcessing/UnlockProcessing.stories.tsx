import type { Meta, StoryObj } from '@storybook/react';
import { UnlockProcessing } from './index';

const meta: Meta<typeof UnlockProcessing> = {
  title: 'Consumer/UnlockProcessing',
  component: UnlockProcessing,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/consumer/unlock-processing',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof UnlockProcessing>;

export const Default: Story = {};

export const Mobile: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};
