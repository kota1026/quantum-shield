import type { Meta, StoryObj } from '@storybook/react';
import { Notifications } from './index';

const meta: Meta<typeof Notifications> = {
  title: 'Consumer/Notifications',
  component: Notifications,
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'dark',
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Notifications>;

/**
 * Default notifications list with demo data
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
