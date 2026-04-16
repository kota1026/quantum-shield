import type { Meta, StoryObj } from '@storybook/react';
import { EmergencyProcessing } from './index';

const meta: Meta<typeof EmergencyProcessing> = {
  title: 'Consumer/EmergencyProcessing',
  component: EmergencyProcessing,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Consumer App Emergency Unlock Processing - Shows processing animation and steps',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof EmergencyProcessing>;

// Full Emergency Processing Page
export const Default: Story = {};

// Mobile View
export const Mobile: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};
