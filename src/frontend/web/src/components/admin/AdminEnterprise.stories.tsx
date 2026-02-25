import type { Meta, StoryObj } from '@storybook/react';
import { AdminEnterprise } from './AdminEnterprise';

const meta: Meta<typeof AdminEnterprise> = {
  title: 'Admin/Enterprise',
  component: AdminEnterprise,
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
type Story = StoryObj<typeof AdminEnterprise>;

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
