import type { Meta, StoryObj } from '@storybook/react';
import { Billing } from './index';

const meta: Meta<typeof Billing> = {
  title: 'Enterprise/Billing',
  component: Billing,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Enterprise billing management page displaying current plan, usage metrics, and recent charges.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: 'Default',
  parameters: {
    docs: {
      description: {
        story: 'Default billing page showing enterprise plan details and usage.',
      },
    },
  },
};

export const Mobile: Story = {
  name: 'Mobile View',
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Billing page on mobile devices.',
      },
    },
  },
};

export const Tablet: Story = {
  name: 'Tablet View',
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
    docs: {
      description: {
        story: 'Billing page on tablet devices.',
      },
    },
  },
};
