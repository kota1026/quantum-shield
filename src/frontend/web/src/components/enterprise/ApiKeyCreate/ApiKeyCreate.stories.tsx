import type { Meta, StoryObj } from '@storybook/react';
import { ApiKeyCreate } from './index';

const meta = {
  title: 'Enterprise/ApiKeyCreate',
  component: ApiKeyCreate,
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/ja/enterprise/api-keys/create',
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
} satisfies Meta<typeof ApiKeyCreate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithClassName: Story = {
  args: {
    className: 'custom-class',
  },
};
