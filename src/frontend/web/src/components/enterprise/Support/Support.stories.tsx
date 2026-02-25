import type { Meta, StoryObj } from '@storybook/react';
import { Support } from './index';

const meta = {
  title: 'Enterprise/Support',
  component: Support,
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/ja/enterprise/support',
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
} satisfies Meta<typeof Support>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
