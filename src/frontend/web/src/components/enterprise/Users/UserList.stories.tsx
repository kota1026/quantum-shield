import type { Meta, StoryObj } from '@storybook/react';
import { UserList } from './index';

const meta: Meta<typeof UserList> = {
  title: 'Enterprise/UserList',
  component: UserList,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof UserList>;

export const Default: Story = {};

export const Desktop: Story = {
  parameters: {
    viewport: { defaultViewport: 'desktop' },
  },
};

export const Tablet: Story = {
  parameters: {
    viewport: { defaultViewport: 'tablet' },
  },
};
