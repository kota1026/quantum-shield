import type { Meta, StoryObj } from '@storybook/react';
import { HistoryDetail, TransactionDetail } from './index';

const meta: Meta<typeof HistoryDetail> = {
  title: 'Consumer/HistoryDetail',
  component: HistoryDetail,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
    },
  },
};

export default meta;
type Story = StoryObj<typeof HistoryDetail>;

const lockTransaction: TransactionDetail = {
  id: '1',
  type: 'lock',
  status: 'complete',
  amount: '5.00 ETH',
  amountUsd: '~ $15,750 USD',
  timestamp: '2026-01-06 14:32:45',
  txHash: '0x7a3f...9c2d',
  fullTxHash: '0x7a3f8b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9c2d',
  blockNumber: 19234567,
  blockConfirmed: 12,
  gasUsed: '142,350',
  gasFee: '0.0028 ETH',
};

const normalUnlockTransaction: TransactionDetail = {
  id: '2',
  type: 'normalUnlock',
  status: 'pending24h',
  amount: '2.50 ETH',
  amountUsd: '~ $7,875 USD',
  timestamp: '2026-01-05 09:15:22',
  txHash: '0x8b4c...1e5f',
  fullTxHash: '0x8b4c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a1e5f',
  blockNumber: 19234123,
  remainingTime: '23:41:02',
  estimatedCompletion: '2026-01-06 09:15:22',
  gasUsed: '185,420',
  gasFee: '0.0035 ETH',
};

const emergencyUnlockTransaction: TransactionDetail = {
  id: '3',
  type: 'emergencyUnlock',
  status: 'pending7d',
  amount: '0.75 ETH',
  amountUsd: '~ $2,362 USD',
  timestamp: '2026-01-04 18:00:33',
  txHash: '0x2d7a...4f8b',
  fullTxHash: '0x2d7a9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f4f8b',
  blockNumber: 19233890,
  bondAmount: '0.5 ETH',
  remainingTime: '5d 14:22:45',
  estimatedCompletion: '2026-01-11 18:00:33',
  gasUsed: '210,890',
  gasFee: '0.0042 ETH',
};

const unlockCompleteTransaction: TransactionDetail = {
  id: '4',
  type: 'unlockComplete',
  status: 'complete',
  amount: '1.25 ETH',
  amountUsd: '~ $3,937 USD',
  timestamp: '2026-01-03 18:45:11',
  txHash: '0x5e9c...3a7d',
  fullTxHash: '0x5e9c4d3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f3a7d',
  blockNumber: 19233456,
  blockConfirmed: 12,
  gasUsed: '125,780',
  gasFee: '0.0024 ETH',
};

export const LockComplete: Story = {
  args: {
    transaction: lockTransaction,
  },
};

export const NormalUnlockPending: Story = {
  args: {
    transaction: normalUnlockTransaction,
  },
};

export const EmergencyUnlockPending: Story = {
  args: {
    transaction: emergencyUnlockTransaction,
  },
};

export const UnlockComplete: Story = {
  args: {
    transaction: unlockCompleteTransaction,
  },
};

export const Mobile: Story = {
  args: {
    transaction: lockTransaction,
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};
