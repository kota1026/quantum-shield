import type { Meta, StoryObj } from '@storybook/react';
import { Contact } from './index';

const meta: Meta<typeof Contact> = {
  title: 'Consumer/Contact',
  component: Contact,
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'dark',
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Contact>;

/**
 * Default contact form view
 */
export const Default: Story = {};

/**
 * Mobile view of the contact page
 */
export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

/**
 * Tablet view of the contact page
 */
export const Tablet: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};
