import type { Meta, StoryObj } from '@storybook/react';
import { Terms } from './index';

const meta = {
  title: 'Enterprise/Terms',
  component: Terms,
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/ja/enterprise/terms',
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
} satisfies Meta<typeof Terms>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
