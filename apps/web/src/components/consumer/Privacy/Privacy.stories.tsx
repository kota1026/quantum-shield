import type { Meta, StoryObj } from '@storybook/react';
import { Privacy } from './index';

const meta: Meta<typeof Privacy> = {
  title: 'Consumer/Privacy',
  component: Privacy,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Consumer App Privacy Policy - Privacy and data handling information',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Privacy>;

// Full Privacy Page
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
