import type { Meta, StoryObj } from '@storybook/react';
import { TeamInvite } from './index';

const meta: Meta<typeof TeamInvite> = {
  title: 'Enterprise/TeamInvite',
  component: TeamInvite,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'User invitation form with email inputs, role selection, and pending invitations list.',
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
        story: 'Default user invitation form.',
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
        story: 'Invitation form on mobile devices.',
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
        story: 'Invitation form on tablet devices.',
      },
    },
  },
};
