import type { Meta, StoryObj } from '@storybook/react';
import { ChallengeForm } from './index';

const meta: Meta<typeof ChallengeForm> = {
  title: 'Observer/ChallengeForm',
  component: ChallengeForm,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
    },
  },
};

export default meta;
type Story = StoryObj<typeof ChallengeForm>;

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
