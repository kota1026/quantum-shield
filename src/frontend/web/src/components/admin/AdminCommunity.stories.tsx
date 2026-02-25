import type { Meta, StoryObj } from '@storybook/react';
import { AdminCommunity } from './AdminCommunity';

const meta: Meta<typeof AdminCommunity> = {
  title: 'Admin/Community',
  component: AdminCommunity,
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
    },
  },
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-background">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AdminCommunity>;

export const Default: Story = {};

export const Japanese: Story = {
  parameters: {
    locale: 'ja',
  },
};

export const English: Story = {
  parameters: {
    locale: 'en',
  },
};
