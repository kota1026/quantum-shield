import type { Meta, StoryObj } from '@storybook/react';
import { EnterpriseDashboard } from './index';

const meta: Meta<typeof EnterpriseDashboard> = {
  title: 'Enterprise/Dashboard',
  component: EnterpriseDashboard,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof EnterpriseDashboard>;

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
