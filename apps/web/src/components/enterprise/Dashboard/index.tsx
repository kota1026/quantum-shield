'use client';

import { useTranslations } from 'next-intl';
import { EnterpriseSidebar } from './EnterpriseSidebar';
import { EnterpriseTopBar } from './EnterpriseTopBar';
import { EnterpriseStatCard } from './EnterpriseStatCard';
import { RecentTransactionsTable, EnterpriseTransaction } from './RecentTransactionsTable';
import { RecentActivityList, ActivityItem } from './RecentActivityList';
import { SystemStatusList, SystemStatus } from './SystemStatusList';
import { cn } from '@/lib/utils';

// Demo data - In production, this would come from API
const DEMO_STATS = {
  tvl: { value: '$124.5', unit: 'M', change: { value: '12.4% vs last month', isPositive: true } },
  volume: { value: '$47.2', unit: 'M', change: { value: '8.7% vs last month', isPositive: true } },
  transactions: { value: '12,847', change: { value: '247 today', isPositive: true } },
  activeUsers: { value: '1,234', change: { value: '56 this week', isPositive: true } },
};

const DEMO_TRANSACTIONS: EnterpriseTransaction[] = [
  { id: '1', hash: '0x7a3f...9c2d', type: 'lock', amount: '5.00 ETH', status: 'complete', time: '2 min ago' },
  { id: '2', hash: '0x3b2e...1f4a', type: 'unlock', amount: '2.50 ETH', status: 'pending', time: '15 min ago' },
  { id: '3', hash: '0x9d1c...8e5b', type: 'lock', amount: '10.00 ETH', status: 'complete', time: '32 min ago' },
  { id: '4', hash: '0x5e7d...2a9f', type: 'emergency', amount: '1.25 ETH', status: 'pending', time: '1 hr ago' },
  { id: '5', hash: '0x2f4a...6c3e', type: 'lock', amount: '15.00 ETH', status: 'complete', time: '2 hr ago' },
];

const DEMO_ACTIVITIES: ActivityItem[] = [
  { id: '1', type: 'lock', title: 'New lock transaction', meta: '5.00 ETH • 2 min ago' },
  { id: '2', type: 'user', title: 'User invited: tanaka@acme.co', meta: 'Admin • 15 min ago' },
  { id: '3', type: 'api', title: 'API key created', meta: 'Production • 1 hr ago' },
  { id: '4', type: 'unlock', title: 'Unlock completed', meta: '2.50 ETH • 3 hr ago' },
];

const DEMO_SYSTEMS: SystemStatus[] = [
  { id: '1', name: 'API Gateway', status: 'online', value: 'Operational' },
  { id: '2', name: 'Prover Network', status: 'online', value: '127 nodes' },
  { id: '3', name: 'Ethereum RPC', status: 'online', value: 'Operational' },
  { id: '4', name: 'Webhooks', status: 'online', value: '99.9% uptime' },
];

export function EnterpriseDashboard() {
  const t = useTranslations('enterprise.dashboard');

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <EnterpriseSidebar />

      {/* Main Content */}
      <div className="flex-1 ml-[260px]">
        {/* Top Bar */}
        <EnterpriseTopBar
          pageTitle={t('pageTitle')}
          userName={t('demoUser.name')}
          userInitial={t('demoUser.initial')}
        />

        {/* Page Content */}
        <main className="p-8" role="main" aria-label={t('ariaLabel')}>
          {/* Stats Grid */}
          <section
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8"
            aria-label={t('stats.ariaLabel')}
          >
            <EnterpriseStatCard
              label={t('stats.tvl.label')}
              value={DEMO_STATS.tvl.value}
              unit={DEMO_STATS.tvl.unit}
              tooltip={t('stats.tvl.tooltip')}
              change={DEMO_STATS.tvl.change}
              icon="wallet"
            />
            <EnterpriseStatCard
              label={t('stats.volume.label')}
              value={DEMO_STATS.volume.value}
              unit={DEMO_STATS.volume.unit}
              tooltip={t('stats.volume.tooltip')}
              change={DEMO_STATS.volume.change}
              icon="chart"
            />
            <EnterpriseStatCard
              label={t('stats.transactions.label')}
              value={DEMO_STATS.transactions.value}
              tooltip={t('stats.transactions.tooltip')}
              change={DEMO_STATS.transactions.change}
              icon="document"
            />
            <EnterpriseStatCard
              label={t('stats.activeUsers.label')}
              value={DEMO_STATS.activeUsers.value}
              tooltip={t('stats.activeUsers.tooltip')}
              change={DEMO_STATS.activeUsers.change}
              icon="users"
            />
          </section>

          {/* Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-8">
            {/* Left Column - Transactions */}
            <RecentTransactionsTable transactions={DEMO_TRANSACTIONS} />

            {/* Right Column */}
            <div className="flex flex-col gap-8">
              <RecentActivityList activities={DEMO_ACTIVITIES} />
              <SystemStatusList systems={DEMO_SYSTEMS} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default EnterpriseDashboard;

// Re-export components
export { EnterpriseSidebar } from './EnterpriseSidebar';
export { EnterpriseTopBar } from './EnterpriseTopBar';
export { EnterpriseStatCard } from './EnterpriseStatCard';
export { RecentTransactionsTable } from './RecentTransactionsTable';
export { RecentActivityList } from './RecentActivityList';
export { SystemStatusList } from './SystemStatusList';
