import type { Meta, StoryObj } from '@storybook/react';
import { SLA } from './index';

const meta = {
  title: 'Enterprise/SLA',
  component: SLA,
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/ja/enterprise/sla',
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
} satisfies Meta<typeof SLA>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
