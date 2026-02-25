import type { Meta, StoryObj } from '@storybook/react';
import { ReportDetail } from './index';

const meta = {
  title: 'Enterprise/ReportDetail',
  component: ReportDetail,
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/ja/enterprise/reports/compliance',
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
} satisfies Meta<typeof ReportDetail>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
