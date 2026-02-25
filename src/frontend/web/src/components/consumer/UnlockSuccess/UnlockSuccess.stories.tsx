import type { Meta, StoryObj } from '@storybook/react';
import { UnlockSuccess } from './index';

const meta: Meta<typeof UnlockSuccess> = {
  title: 'Consumer/UnlockSuccess',
  component: UnlockSuccess,
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'dark',
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof UnlockSuccess>;

/**
 * Default unlock success state showing 24h countdown
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
