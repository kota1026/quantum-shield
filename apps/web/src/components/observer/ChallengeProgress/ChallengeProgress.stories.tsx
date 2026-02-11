import type { Meta, StoryObj } from '@storybook/react';
import { ChallengeProgress } from './index';

const meta: Meta<typeof ChallengeProgress> = {
  title: 'Observer/ChallengeProgress',
  component: ChallengeProgress,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
    },
  },
};

export default meta;
type Story = StoryObj<typeof ChallengeProgress>;

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
