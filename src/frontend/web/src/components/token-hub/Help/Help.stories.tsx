import type { Meta, StoryObj } from '@storybook/react';
import { TokenHubHelp } from './index';

const meta: Meta<typeof TokenHubHelp> = {
  title: 'TokenHub/Help',
  component: TokenHubHelp,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
    },
  },
};

export default meta;
type Story = StoryObj<typeof TokenHubHelp>;

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
