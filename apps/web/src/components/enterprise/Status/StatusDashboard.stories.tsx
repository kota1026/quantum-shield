import type { Meta, StoryObj } from '@storybook/react';
import { StatusDashboard } from './index';

const meta: Meta<typeof StatusDashboard> = {
  title: 'Enterprise/StatusDashboard',
  component: StatusDashboard,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof StatusDashboard>;

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
