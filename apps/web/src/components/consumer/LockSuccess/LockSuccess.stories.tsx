import type { Meta, StoryObj } from '@storybook/react';
import { LockSuccess } from './index';

const meta: Meta<typeof LockSuccess> = {
  title: 'Consumer/LockSuccess',
  component: LockSuccess,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/consumer/lock-success',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof LockSuccess>;

export const Default: Story = {};

export const Mobile: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};
