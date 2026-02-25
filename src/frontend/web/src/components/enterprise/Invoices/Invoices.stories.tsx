import type { Meta, StoryObj } from '@storybook/react';
import { Invoices } from './index';

const meta: Meta<typeof Invoices> = {
  title: 'Enterprise/Invoices',
  component: Invoices,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Enterprise invoices page displaying invoice history with download and view actions.',
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
        story: 'Default invoices page showing invoice history.',
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
        story: 'Invoices page on mobile devices.',
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
        story: 'Invoices page on tablet devices.',
      },
    },
  },
};
