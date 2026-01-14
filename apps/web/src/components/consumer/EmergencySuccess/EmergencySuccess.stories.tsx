import type { Meta, StoryObj } from '@storybook/react';
import { EmergencySuccess } from './index';

const meta: Meta<typeof EmergencySuccess> = {
  title: 'Consumer/EmergencySuccess',
  component: EmergencySuccess,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Consumer App Emergency Unlock Success - Shows success state with countdown timer',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof EmergencySuccess>;

// Full Emergency Success Page
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
