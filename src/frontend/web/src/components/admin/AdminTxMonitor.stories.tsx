import type { Meta, StoryObj } from '@storybook/react';
import { AdminTxMonitor } from './AdminTxMonitor';

const meta: Meta<typeof AdminTxMonitor> = {
  title: 'Admin/TxMonitor',
  component: AdminTxMonitor,
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
type Story = StoryObj<typeof AdminTxMonitor>;

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
