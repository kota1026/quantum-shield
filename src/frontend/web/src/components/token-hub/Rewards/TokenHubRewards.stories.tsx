import type { Meta, StoryObj } from '@storybook/react';
import { TokenHubRewards } from './index';

const meta: Meta<typeof TokenHubRewards> = {
  title: 'TokenHub/Rewards',
  component: TokenHubRewards,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
    },
  },
};

export default meta;
type Story = StoryObj<typeof TokenHubRewards>;

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
