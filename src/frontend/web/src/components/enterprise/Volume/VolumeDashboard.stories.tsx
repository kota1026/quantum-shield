import type { Meta, StoryObj } from '@storybook/react';
import { VolumeDashboard } from './index';

const meta: Meta<typeof VolumeDashboard> = {
  title: 'Enterprise/VolumeDashboard',
  component: VolumeDashboard,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof VolumeDashboard>;

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
