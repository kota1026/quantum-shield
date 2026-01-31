import type { Meta, StoryObj } from '@storybook/react';
import { TVLDashboard } from './index';

const meta: Meta<typeof TVLDashboard> = {
  title: 'Enterprise/TVLDashboard',
  component: TVLDashboard,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof TVLDashboard>;

export const Default: Story = {
  args: {},
};

export const Desktop: Story = {
  parameters: {
    viewport: { defaultViewport: 'desktop' },
  },
};

export const Tablet: Story = {
  parameters: {
    viewport: { defaultViewport: 'tablet' },
  },
};
