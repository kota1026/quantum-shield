import type { Meta, StoryObj } from '@storybook/react';
import { UnlockSign } from './index';

const meta: Meta<typeof UnlockSign> = {
  title: 'Consumer/UnlockSign',
  component: UnlockSign,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/consumer/unlock-sign',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof UnlockSign>;

export const Default: Story = {};

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
