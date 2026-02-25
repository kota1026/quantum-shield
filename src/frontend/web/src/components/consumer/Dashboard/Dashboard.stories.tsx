import type { Meta, StoryObj } from '@storybook/react';
import { Dashboard } from './index';
import { StatCard } from './StatCard';
import { LockAssetCard } from './LockAssetCard';
import { RecentActivity, Transaction } from './RecentActivity';

// Storybook Meta
const meta: Meta<typeof Dashboard> = {
  title: 'Consumer/Dashboard',
  component: Dashboard,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Consumer App Dashboard - Main user interface for managing quantum-resistant assets',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Dashboard>;

// Full Dashboard
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

// StatCard Stories
export const StatCardDefault: StoryObj<typeof StatCard> = {
  render: () => (
    <div className="p-6 bg-background">
      <div className="grid grid-cols-2 gap-4 max-w-2xl">
        <StatCard
          label="Total Locked"
          value="24.85"
          unit="ETH"
          badge={{ text: '+12.4%', variant: 'success' }}
          highlight
        />
        <StatCard
          label="Available"
          value="12.50"
          unit="ETH"
        />
        <StatCard
          label="Pending Unlock"
          value="2"
        />
        <StatCard
          label="Transactions"
          value="47"
        />
      </div>
    </div>
  ),
};

// LockAssetCard Stories
export const LockAssetCardDefault: StoryObj<typeof LockAssetCard> = {
  render: () => (
    <div className="p-6 bg-background max-w-lg">
      <LockAssetCard
        balance={12.50}
        onLock={(amount) => console.log('Lock:', amount)}
      />
    </div>
  ),
};

// RecentActivity Stories
const sampleTransactions: Transaction[] = [
  {
    id: '1',
    type: 'lock',
    amount: '5.00 ETH',
    timestamp: '2026-01-06 14:32',
    status: 'complete',
  },
  {
    id: '2',
    type: 'unlocking',
    amount: '2.50 ETH',
    timestamp: '2026-01-05 09:15',
    status: 'pending',
  },
  {
    id: '3',
    type: 'unlock',
    amount: '1.25 ETH',
    timestamp: '2026-01-03 18:45',
    status: 'complete',
  },
];

export const RecentActivityDefault: StoryObj<typeof RecentActivity> = {
  render: () => (
    <div className="p-6 bg-background max-w-md">
      <RecentActivity transactions={sampleTransactions} />
    </div>
  ),
};

export const RecentActivityEmpty: StoryObj<typeof RecentActivity> = {
  render: () => (
    <div className="p-6 bg-background max-w-md">
      <RecentActivity transactions={[]} />
    </div>
  ),
};
