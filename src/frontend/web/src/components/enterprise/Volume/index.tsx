'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { EnterpriseSidebar } from '../Dashboard/EnterpriseSidebar';
import { EnterpriseStatCard } from '../Dashboard/EnterpriseStatCard';
import { TimeFilter, TimePeriod } from '../TVL/TimeFilter';
import { VolumeChart } from './VolumeChart';
import { TokenBreakdown, TokenVolume } from './TokenBreakdown';

// Demo data - In production, this would come from API
const FALLBACK_STATS = {
  volume24h: { value: '$4.2', unit: 'M', change: { value: '15.3% vs yesterday', isPositive: true } },
  volume7d: { value: '$28.7', unit: 'M', change: { value: '8.2% vs last week', isPositive: true } },
  volume30d: { value: '$124.5', unit: 'M', change: { value: '12.4% vs last month', isPositive: true } },
  transactions: { value: '12,847', change: { value: '247 today', isPositive: true } },
};

const FALLBACK_TOKENS: TokenVolume[] = [
  { id: '1', symbol: 'ETH', name: 'Ethereum', volume: '$67.2M', percentage: 54.0, change: '12.5%', isPositive: true },
  { id: '2', symbol: 'WBTC', name: 'Wrapped Bitcoin', volume: '$35.8M', percentage: 28.7, change: '8.3%', isPositive: true },
  { id: '3', symbol: 'USDC', name: 'USD Coin', volume: '$21.5M', percentage: 17.3, change: '-2.1%', isPositive: false },
];

export function VolumeDashboard() {
  const t = useTranslations('enterprise.volume');
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('30d');

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <EnterpriseSidebar />

      {/* Main Content */}
      <div className="flex-1 ml-[260px]">
        {/* Top Bar */}
        <header
          className="flex items-center justify-between px-8 py-4 bg-background-secondary border-b border-white/5 sticky top-0 z-40"
          role="banner"
        >
          <h1 className="text-xl font-semibold text-foreground">{t('pageTitle')}</h1>
          <TimeFilter
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
          />
        </header>

        {/* Page Content */}
        <main className="p-8" role="main" aria-label={t('ariaLabel')}>
          {/* Stats Grid */}
          <section
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8"
            role="region"
            aria-label={t('stats.ariaLabel')}
          >
            <EnterpriseStatCard
              label={t('stats.volume24h.label')}
              value={FALLBACK_STATS.volume24h.value}
              unit={FALLBACK_STATS.volume24h.unit}
              tooltip={t('stats.volume24h.tooltip')}
              change={FALLBACK_STATS.volume24h.change}
              icon="trending"
            />
            <EnterpriseStatCard
              label={t('stats.volume7d.label')}
              value={FALLBACK_STATS.volume7d.value}
              unit={FALLBACK_STATS.volume7d.unit}
              tooltip={t('stats.volume7d.tooltip')}
              change={FALLBACK_STATS.volume7d.change}
              icon="trending"
            />
            <EnterpriseStatCard
              label={t('stats.volume30d.label')}
              value={FALLBACK_STATS.volume30d.value}
              unit={FALLBACK_STATS.volume30d.unit}
              tooltip={t('stats.volume30d.tooltip')}
              change={FALLBACK_STATS.volume30d.change}
              icon="trending"
            />
            <EnterpriseStatCard
              label={t('stats.transactions.label')}
              value={FALLBACK_STATS.transactions.value}
              tooltip={t('stats.transactions.tooltip')}
              change={FALLBACK_STATS.transactions.change}
              icon="activity"
            />
          </section>

          {/* Volume Chart */}
          <VolumeChart className="mb-8" />

          {/* Token Breakdown */}
          <TokenBreakdown tokens={FALLBACK_TOKENS} />
        </main>
      </div>
    </div>
  );
}

export default VolumeDashboard;

// Re-export components
export { VolumeChart } from './VolumeChart';
export { TokenBreakdown } from './TokenBreakdown';
export type { TokenVolume } from './TokenBreakdown';
