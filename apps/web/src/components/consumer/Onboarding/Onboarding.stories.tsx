import type { Meta, StoryObj } from '@storybook/react';
import { Onboarding } from './index';

const meta: Meta<typeof Onboarding> = {
  title: 'Consumer/Onboarding',
  component: Onboarding,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
    },
  },
};

export default meta;
type Story = StoryObj<typeof Onboarding>;

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
