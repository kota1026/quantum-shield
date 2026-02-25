import type { Meta, StoryObj } from '@storybook/react';
import { AdminAudit } from './AdminAudit';

const meta: Meta<typeof AdminAudit> = {
  title: 'Admin/Audit',
  component: AdminAudit,
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
type Story = StoryObj<typeof AdminAudit>;

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
