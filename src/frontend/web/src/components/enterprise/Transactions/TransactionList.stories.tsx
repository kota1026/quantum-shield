import type { Meta, StoryObj } from '@storybook/react';
import { TransactionList } from './index';

const meta: Meta<typeof TransactionList> = {
  title: 'Enterprise/TransactionList',
  component: TransactionList,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof TransactionList>;

export const Default: Story = {
  args: {},
};

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
