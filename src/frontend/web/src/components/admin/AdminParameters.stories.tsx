import type { Meta, StoryObj } from '@storybook/react';
import { AdminParameters } from './AdminParameters';

const meta: Meta<typeof AdminParameters> = {
  title: 'Admin/Parameters',
  component: AdminParameters,
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
type Story = StoryObj<typeof AdminParameters>;

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
