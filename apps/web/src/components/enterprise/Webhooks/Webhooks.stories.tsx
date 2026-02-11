import type { Meta, StoryObj } from '@storybook/react';
import { Webhooks } from './index';

const meta = {
  title: 'Enterprise/Webhooks',
  component: Webhooks,
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/ja/enterprise/webhooks',
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
} satisfies Meta<typeof Webhooks>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithClassName: Story = {
  args: {
    className: 'custom-class',
  },
};
