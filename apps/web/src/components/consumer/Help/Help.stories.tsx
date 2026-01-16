import type { Meta, StoryObj } from '@storybook/react';
import { Help } from './index';

const meta: Meta<typeof Help> = {
  title: 'Consumer/Help',
  component: Help,
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'dark',
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Help>;

/**
 * Default help center view
 */
export const Default: Story = {};

/**
 * Mobile viewport
 */
export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

/**
 * Tablet viewport
 */
export const Tablet: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};
