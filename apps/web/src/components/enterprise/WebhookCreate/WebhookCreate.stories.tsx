import type { Meta, StoryObj } from '@storybook/react';
import { WebhookCreate } from './index';

const meta = {
  title: 'Enterprise/WebhookCreate',
  component: WebhookCreate,
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/ja/enterprise/webhooks/create',
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
} satisfies Meta<typeof WebhookCreate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
