import type { Meta, StoryObj } from '@storybook/react';
import { TokenHubUnlock } from './index';

const meta: Meta<typeof TokenHubUnlock> = {
  title: 'TokenHub/Unlock',
  component: TokenHubUnlock,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#0a0a0c' },
      ],
    },
  },
};

export default meta;
type Story = StoryObj<typeof TokenHubUnlock>;

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
