import type { Meta, StoryObj } from '@storybook/react';
import { RewardsHistory } from './RewardsHistory';

const meta: Meta<typeof RewardsHistory> = {
  title: 'TokenHub/Rewards/RewardsHistory',
  component: RewardsHistory,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
    },
  },
};

export default meta;
type Story = StoryObj<typeof RewardsHistory>;

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
