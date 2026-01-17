import type { Meta, StoryObj } from '@storybook/react';
import { UserDetail } from './UserDetail';

const meta: Meta<typeof UserDetail> = {
  title: 'Enterprise/UserDetail',
  component: UserDetail,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof UserDetail>;

export const Default: Story = {
  args: {
    userId: 'user_001',
  },
};

export const Desktop: Story = {
  args: {
    userId: 'user_001',
  },
  parameters: {
    viewport: { defaultViewport: 'desktop' },
  },
};

export const Tablet: Story = {
  args: {
    userId: 'user_001',
  },
  parameters: {
    viewport: { defaultViewport: 'tablet' },
  },
};
