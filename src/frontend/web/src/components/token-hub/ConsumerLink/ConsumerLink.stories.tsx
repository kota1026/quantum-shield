import type { Meta, StoryObj } from '@storybook/react';
import { ConsumerLink } from './index';

const meta: Meta<typeof ConsumerLink> = {
  title: 'TokenHub/ConsumerLink',
  component: ConsumerLink,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
    },
  },
};

export default meta;
type Story = StoryObj<typeof ConsumerLink>;

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
