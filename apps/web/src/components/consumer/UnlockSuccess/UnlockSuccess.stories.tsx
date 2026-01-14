import type { Meta, StoryObj } from '@storybook/react';
import { UnlockSuccess } from './index';

const meta: Meta<typeof UnlockSuccess> = {
  title: 'Consumer/UnlockSuccess',
  component: UnlockSuccess,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/consumer/unlock-success',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof UnlockSuccess>;

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
