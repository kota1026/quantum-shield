import type { Meta, StoryObj } from '@storybook/react';
import { History } from './index';
import { HistoryStats, HistoryStatsData } from './HistoryStats';
import { FilterTabs, FilterType } from './FilterTabs';
import { HistoryItem, HistoryTransaction } from './HistoryItem';

// Storybook Meta
const meta: Meta<typeof History> = {
  title: 'Consumer/History',
  component: History,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Transaction History page for viewing past Lock/Unlock operations',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof History>;

// Full History Page
export const Default: Story = {};

// Mobile View
export const Mobile: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};

// Tablet View
export const Tablet: Story = {
  parameters: {
    viewport: { defaultViewport: 'tablet' },
  },
};

// HistoryStats Stories
const sampleStats: HistoryStatsData = {
  totalLocked: '24.85',
  totalLockedUnit: 'ETH',
  totalTransactions: 15,
  inProgress: 2,
};

export const StatsDefault: StoryObj<typeof HistoryStats> = {
  render: () => (
    <div className="p-6 bg-background">
      <HistoryStats stats={sampleStats} />
    </div>
  ),
};

// FilterTabs Stories
export const FilterTabsDefault: StoryObj<typeof FilterTabs> = {
  render: () => {
    const FilterTabsDemo = () => {
      const [active, setActive] = React.useState<FilterType>('all');
      return (
        <div className="p-6 bg-background">
          <FilterTabs activeFilter={active} onFilterChange={setActive} />
        </div>
      );
    };
    return <FilterTabsDemo />;
  },
};

import React from 'react';

// HistoryItem Stories
const sampleTransactions: HistoryTransaction[] = [
  {
    id: '1',
    type: 'lock',
    status: 'complete',
    amount: '5.00 ETH',
    timestamp: '2026-01-06 14:32',
    txHash: '0x7a3f...9c2d',
    blockConfirmed: 12,
  },
  {
    id: '2',
    type: 'normalUnlock',
    status: 'pending24h',
    amount: '2.50 ETH',
    timestamp: '2026-01-05 09:15',
    txHash: '0x8b4c...1e5f',
    remainingTime: '23:41:02',
  },
  {
    id: '3',
    type: 'emergencyUnlock',
    status: 'pending7d',
    amount: '0.75 ETH',
    timestamp: '2026-01-04 18:00',
    txHash: '0x2d7a...4f8b',
    bondAmount: '0.5 ETH',
  },
  {
    id: '4',
    type: 'unlockComplete',
    status: 'complete',
    amount: '1.25 ETH',
    timestamp: '2026-01-03 18:45',
    txHash: '0x5e9c...3a7d',
    blockConfirmed: 12,
  },
];

export const HistoryItemVariants: StoryObj<typeof HistoryItem> = {
  render: () => (
    <div className="p-6 bg-background space-y-3 max-w-3xl">
      {sampleTransactions.map((tx) => (
        <HistoryItem
          key={tx.id}
          transaction={tx}
          onClick={(t) => console.log('Clicked:', t.id)}
        />
      ))}
    </div>
  ),
};

// Empty State
export const EmptyState: Story = {
  render: () => (
    <div className="p-6 bg-background max-w-3xl mx-auto">
      <div className="text-center py-16 bg-surface border border-border rounded-qs-xl">
        <div className="w-12 h-12 mx-auto mb-4 text-foreground-tertiary opacity-50">
          📋
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          No transaction history
        </h3>
        <p className="text-sm text-foreground-tertiary">
          Your first Lock will appear here
        </p>
      </div>
    </div>
  ),
};
