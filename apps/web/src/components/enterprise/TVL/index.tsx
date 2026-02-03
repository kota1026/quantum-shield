'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { EnterpriseSidebar } from '../Dashboard/EnterpriseSidebar';
import { EnterpriseTopBar } from '../Dashboard/EnterpriseTopBar';
import { EnterpriseStatCard } from '../Dashboard/EnterpriseStatCard';
import { TimeFilter, TimePeriod } from './TimeFilter';
import { TVLChart } from './TVLChart';
import { AssetBreakdown, Asset } from './AssetBreakdown';

// Demo data - In production, this would come from API
const FALLBACK_STATS = {
  totalTVL: { value: '$124.5', unit: 'M', change: { value: '12.4% vs last month', isPositive: true } },
  yourTVL: { value: '$8.2', unit: 'M', change: { value: '5.3% vs last month', isPositive: true } },
  marketShare: { value: '6.6', unit: '%', change: { value: '0.4% vs last month', isPositive: true } },
  depositors: { value: '1,847', change: { value: '124 this month', isPositive: true } },
};

const FALLBACK_ASSETS: Asset[] = [
  { id: '1', symbol: 'ETH', name: 'Ethereum', value: '$78.5M', percentage: 63.1, iconType: 'eth' },
  { id: '2', symbol: 'WBTC', name: 'WBTC', value: '$32.4M', percentage: 26.0, iconType: 'btc' },
  { id: '3', symbol: 'USDC', name: 'USDC', value: '$13.6M', percentage: 10.9, iconType: 'usdc' },
];

export function TVLDashboard() {
  const t = useTranslations('enterprise.tvl');
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
            aria-label={t('stats.ariaLabel')}
          >
            <EnterpriseStatCard
              label={t('stats.totalTVL.label')}
              value={FALLBACK_STATS.totalTVL.value}
              unit={FALLBACK_STATS.totalTVL.unit}
              tooltip={t('stats.totalTVL.tooltip')}
              change={FALLBACK_STATS.totalTVL.change}
              icon="wallet"
            />
            <EnterpriseStatCard
              label={t('stats.yourTVL.label')}
              value={FALLBACK_STATS.yourTVL.value}
              unit={FALLBACK_STATS.yourTVL.unit}
              tooltip={t('stats.yourTVL.tooltip')}
              change={FALLBACK_STATS.yourTVL.change}
              icon="wallet"
            />
            <EnterpriseStatCard
              label={t('stats.marketShare.label')}
              value={FALLBACK_STATS.marketShare.value}
              unit={FALLBACK_STATS.marketShare.unit}
              tooltip={t('stats.marketShare.tooltip')}
              change={FALLBACK_STATS.marketShare.change}
              icon="chart"
            />
            <EnterpriseStatCard
              label={t('stats.depositors.label')}
              value={FALLBACK_STATS.depositors.value}
              tooltip={t('stats.depositors.tooltip')}
              change={FALLBACK_STATS.depositors.change}
              icon="users"
            />
          </section>

          {/* TVL Chart */}
          <TVLChart className="mb-8" />

          {/* Asset Breakdown */}
          <AssetBreakdown assets={FALLBACK_ASSETS} />
        </main>
      </div>
    </div>
  );
}

export default TVLDashboard;

// Re-export components
export { TimeFilter } from './TimeFilter';
export { TVLChart } from './TVLChart';
export { AssetBreakdown } from './AssetBreakdown';
export type { TimePeriod } from './TimeFilter';
export type { Asset } from './AssetBreakdown';
