import type { Meta, StoryObj } from '@storybook/react';
import { Team } from './index';

const meta: Meta<typeof Team> = {
  title: 'Enterprise/Team',
  component: Team,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Team management page displaying role cards with permissions overview.',
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
        story: 'Default team management page showing Admin, Member, and Viewer roles.',
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
        story: 'Team page on mobile devices with stacked role cards.',
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
        story: 'Team page on tablet devices.',
      },
    },
  },
};
