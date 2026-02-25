import type { Meta, StoryObj } from '@storybook/react';
import { EmergencyBond } from './index';

const meta: Meta<typeof EmergencyBond> = {
  title: 'Consumer/EmergencyBond',
  component: EmergencyBond,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Consumer App Emergency Unlock Bond - Confirm bond payment for emergency unlock',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof EmergencyBond>;

// Full Emergency Bond Page
export const Default: Story = {};

// Mobile View
export const Mobile: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};

// Tablet View
export const Tablet: Story = {
  parameters: {
    viewport: { defaultViewport: 'tablet' },
  },
};
