import type { Meta, StoryObj } from '@storybook/react';
import { TransactionDetail } from './TransactionDetail';

const meta: Meta<typeof TransactionDetail> = {
  title: 'Enterprise/TransactionDetail',
  component: TransactionDetail,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof TransactionDetail>;

export const Default: Story = {
  args: {
    transactionId: '0x7a3f9d2e',
  },
};

export const Desktop: Story = {
  args: {
    transactionId: '0x7a3f9d2e',
  },
  parameters: {
    viewport: { defaultViewport: 'desktop' },
  },
};

export const Tablet: Story = {
  args: {
    transactionId: '0x7a3f9d2e',
  },
  parameters: {
    viewport: { defaultViewport: 'tablet' },
  },
};
