import type { Meta, StoryObj } from '@storybook/react';
import { Privacy } from './index';

const meta = {
  title: 'Enterprise/Privacy',
  component: Privacy,
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/ja/enterprise/privacy',
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
} satisfies Meta<typeof Privacy>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
