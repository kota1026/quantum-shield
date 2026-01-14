import type { Meta, StoryObj } from '@storybook/react';
import { KeyManagement } from './index';

const meta: Meta<typeof KeyManagement> = {
  title: 'Consumer/KeyManagement',
  component: KeyManagement,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/consumer/key-management',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof KeyManagement>;

export const Default: Story = {
  args: {},
};

export const Mobile: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};

export const Tablet: Story = {
  parameters: {
    viewport: { defaultViewport: 'tablet' },
  },
};
