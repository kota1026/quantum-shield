import type { Meta, StoryObj } from '@storybook/react';
import { CookiePolicy } from './index';

const meta: Meta<typeof CookiePolicy> = {
  title: 'Consumer/CookiePolicy',
  component: CookiePolicy,
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'dark',
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof CookiePolicy>;

/**
 * Default cookie policy view
 */
export const Default: Story = {};

/**
 * Mobile view of the cookie policy page
 */
export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

/**
 * Tablet view of the cookie policy page
 */
export const Tablet: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};
