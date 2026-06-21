import type { Meta, StoryObj } from '@storybook/react';
import { Terms } from './index';

const meta: Meta<typeof Terms> = {
  title: 'Consumer/Terms',
  component: Terms,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Consumer App Terms of Service - Legal terms and conditions',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Terms>;

// Full Terms Page
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
