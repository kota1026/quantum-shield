import type { Meta, StoryObj } from '@storybook/react';
import { AuditLog } from './index';

const meta = {
  title: 'Enterprise/AuditLog',
  component: AuditLog,
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/ja/enterprise/audit-log',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-background">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AuditLog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithClassName: Story = {
  args: {
    className: 'custom-class',
  },
};
