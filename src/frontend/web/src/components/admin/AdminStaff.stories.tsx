import type { Meta, StoryObj } from '@storybook/react';
import { AdminStaff } from './AdminStaff';

const meta: Meta<typeof AdminStaff> = {
  title: 'Admin/Staff',
  component: AdminStaff,
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
type Story = StoryObj<typeof AdminStaff>;

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
