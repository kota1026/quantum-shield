import type { Meta, StoryObj } from '@storybook/react';
import { GovernanceDashboard } from './GovernanceDashboard';

const meta: Meta<typeof GovernanceDashboard> = {
  title: 'Governance/Dashboard',
  component: GovernanceDashboard,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Governance Dashboard - Main landing page for the Quantum Shield governance system. Displays voting power, active proposals, quorum requirements, and recent activity.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof GovernanceDashboard>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Default view of the Governance Dashboard with all sections visible.',
      },
    },
  },
};

export const Mobile: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    docs: {
      description: {
        story: 'Mobile responsive view of the Governance Dashboard.',
      },
    },
  },
};

export const Tablet: Story = {
  parameters: {
    viewport: { defaultViewport: 'tablet' },
    docs: {
      description: {
        story: 'Tablet responsive view of the Governance Dashboard.',
      },
    },
  },
};
