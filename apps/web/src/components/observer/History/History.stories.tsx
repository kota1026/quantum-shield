import type { Meta, StoryObj } from '@storybook/react';
import { ChallengeHistory } from './index';

const meta: Meta<typeof ChallengeHistory> = {
  title: 'Observer/ChallengeHistory',
  component: ChallengeHistory,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
    },
  },
};

export default meta;
type Story = StoryObj<typeof ChallengeHistory>;

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
