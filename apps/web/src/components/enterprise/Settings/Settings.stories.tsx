import type { Meta, StoryObj } from '@storybook/react';
import { Settings } from './index';

const meta = {
  title: 'Enterprise/Settings',
  component: Settings,
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/ja/enterprise/settings',
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
} satisfies Meta<typeof Settings>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
