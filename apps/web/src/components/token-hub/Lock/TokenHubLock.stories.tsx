import type { Meta, StoryObj } from '@storybook/react';
import { TokenHubLock } from './index';

const meta: Meta<typeof TokenHubLock> = {
  title: 'TokenHub/Lock',
  component: TokenHubLock,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/ja/token-hub/lock',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof TokenHubLock>;

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
