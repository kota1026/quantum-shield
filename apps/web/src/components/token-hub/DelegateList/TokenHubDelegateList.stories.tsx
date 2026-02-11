import type { Meta, StoryObj } from '@storybook/react';
import { TokenHubDelegateList } from './index';

const meta: Meta<typeof TokenHubDelegateList> = {
  title: 'Token Hub/DelegateList',
  component: TokenHubDelegateList,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
    },
  },
};

export default meta;
type Story = StoryObj<typeof TokenHubDelegateList>;

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
