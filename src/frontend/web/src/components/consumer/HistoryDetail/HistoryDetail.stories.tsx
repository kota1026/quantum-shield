import type { Meta, StoryObj } from '@storybook/react';
import { HistoryDetail } from './index';
import type { HistoryTransaction } from '../History/HistoryItem';

const meta: Meta<typeof HistoryDetail> = {
  title: 'Consumer/HistoryDetail',
  component: HistoryDetail,
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'dark',
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof HistoryDetail>;

// Sample transaction data
const lockCompleteTransaction: HistoryTransaction = {
  id: '1',
  type: 'lock',
  status: 'complete',
  amount: '5.00 ETH',
  timestamp: '2026-01-06 14:32',
  txHash: '0x7a3f...9c2d',
  blockConfirmed: 12,
};

const normalUnlockPendingTransaction: HistoryTransaction = {
  id: '2',
  type: 'normalUnlock',
  status: 'pending24h',
  amount: '2.50 ETH',
  timestamp: '2026-01-05 09:15',
  txHash: '0x8b4c...1e5f',
  remainingTime: '23:41:02',
};

const emergencyUnlockPendingTransaction: HistoryTransaction = {
  id: '3',
  type: 'emergencyUnlock',
  status: 'pending7d',
  amount: '0.75 ETH',
  timestamp: '2026-01-04 18:00',
  txHash: '0x2d7a...4f8b',
  bondAmount: '0.5 ETH',
  remainingTime: '6d 23:41:02',
};

const unlockCompleteTransaction: HistoryTransaction = {
  id: '4',
  type: 'unlockComplete',
  status: 'complete',
  amount: '1.25 ETH',
  timestamp: '2026-01-03 18:45',
  txHash: '0x5e9c...3a7d',
  blockConfirmed: 12,
};

/**
 * Lock transaction that has been confirmed
 */
export const LockComplete: Story = {
  args: {
    transaction: lockCompleteTransaction,
  },
};

/**
 * Normal unlock in progress with 24h waiting period
 */
export const NormalUnlockPending: Story = {
  args: {
    transaction: normalUnlockPendingTransaction,
  },
};

/**
 * Emergency unlock in progress with 7-day challenge period
 */
export const EmergencyUnlockPending: Story = {
  args: {
    transaction: emergencyUnlockPendingTransaction,
  },
};

/**
 * Unlock that has been completed
 */
export const UnlockComplete: Story = {
  args: {
    transaction: unlockCompleteTransaction,
  },
};

/**
 * Mobile view of the history detail
 */
export const Mobile: Story = {
  args: {
    transaction: lockCompleteTransaction,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};
