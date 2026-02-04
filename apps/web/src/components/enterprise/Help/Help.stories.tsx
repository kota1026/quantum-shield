import type { Meta, StoryObj } from '@storybook/react';
import { Help } from './index';

const meta = {
  title: 'Enterprise/Help',
  component: Help,
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/ja/enterprise/help',
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
} satisfies Meta<typeof Help>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
