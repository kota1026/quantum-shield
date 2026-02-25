import type { Meta, StoryObj } from '@storybook/react';
import { TokenHubSettings } from './index';

const meta: Meta<typeof TokenHubSettings> = {
  title: 'TokenHub/Settings',
  component: TokenHubSettings,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
    },
  },
};

export default meta;
type Story = StoryObj<typeof TokenHubSettings>;

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
    viewport: { defaultViewport: 'ipad' },
  },
};
