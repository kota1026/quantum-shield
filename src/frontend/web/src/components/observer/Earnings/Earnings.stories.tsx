import type { Meta, StoryObj } from '@storybook/react';
import { Earnings } from './index';

const meta: Meta<typeof Earnings> = {
  title: 'Observer/Earnings',
  component: Earnings,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
    },
  },
};

export default meta;
type Story = StoryObj<typeof Earnings>;

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
