'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  History,
  Calendar,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { TokenHubHeader } from '../Dashboard/TokenHubHeader';
import { useExtendedRewardsHistory } from '@/hooks/token-hub/useTokenHub';

// Empty history data (used when API is unavailable)
const EMPTY_HISTORY = [
  {
    id: '1',
    epoch: 42,
    date: '2026-01-17',
    amount: 168,
    breakdown: { holding: 120, voting: 35, delegation: 13 },
  },
  {
    id: '2',
    epoch: 41,
    date: '2026-01-10',
    amount: 162,
    breakdown: { holding: 118, voting: 32, delegation: 12 },
  },
  {
    id: '3',
    epoch: 40,
    date: '2026-01-03',
    amount: 156,
    breakdown: { holding: 115, voting: 30, delegation: 11 },
  },
];


// Chart data for different time views
const WEEKLY_CHART_DATA = [130, 150, 160, 140, 170, 155, 165, 175, 148, 156, 162, 168];
const MONTHLY_CHART_DATA = [580, 620, 650, 680, 640, 700];

const STATS = {
  totalClaimed: 1599,
  totalPending: 847,
  avgPerWeek: 156,
  highestWeek: 175,
  lowestWeek: 130,
  totalEpochs: 42,
};

type TimeView = 'weekly' | 'monthly';
type FilterType = 'all' | 'holding' | 'voting' | 'delegation';

export function RewardsHistory() {
  const t = useTranslations('token-hub.rewardsHistory');
  const tCommon = useTranslations('token-hub.common');
  const [timeView, setTimeView] = useState<TimeView>('weekly');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Fetch history from API with fallback (uses extended local data for now)
  const { data: historyApi } = useExtendedRewardsHistory();
  const history = historyApi ?? EMPTY_HISTORY;

  const chartData = timeView === 'weekly' ? WEEKLY_CHART_DATA : MONTHLY_CHART_DATA;
  const chartMax = Math.max(...chartData);

  const filteredHistory = history.filter((item) => {
    if (filterType === 'all') return true;
    return item.breakdown[filterType as keyof typeof item.breakdown] > 0;
  });

  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const paginatedHistory = filteredHistory.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleExport = useCallback(() => {
    // In production, this would trigger a CSV/JSON export
    console.log('Export rewards history');
  }, []);

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Premium Background Effect - Gold Glow */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        aria-hidden="true"
      >
        <div
          className={cn(
            'absolute -top-24 left-1/2 -translate-x-1/2',
            'w-[800px] h-[500px]',
            'bg-[radial-gradient(ellipse,rgba(201,169,98,0.12),transparent_60%)]',
            'opacity-50'
          )}
        />
      </div>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6" role="main">
        {/* Header */}
        <TokenHubHeader />

        {/* Breadcrumb */}
        <nav
          className="mb-6"
          aria-label={t('breadcrumb.ariaLabel')}
        >
          <ol className="flex items-center gap-2 text-sm">
            <li>
              <Link
                href="/token-hub/rewards"
                className="text-foreground-tertiary hover:text-gold transition-colors focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
              >
                {t('breadcrumb.rewards')}
              </Link>
            </li>
            <li className="text-foreground-tertiary" aria-hidden="true">/</li>
            <li className="text-foreground" aria-current="page">{t('breadcrumb.current')}</li>
          </ol>
        </nav>

        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
              <History className="w-8 h-8 text-gold" aria-hidden="true" />
              {t('title')}
            </h1>
            <p className="text-foreground-secondary">{t('subtitle')}</p>
          </div>

          <Button
            variant="outline"
            onClick={handleExport}
            className="flex items-center gap-2"
            aria-label={t('export.ariaLabel')}
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            {t('export.button')}
          </Button>
        </div>

        {/* Stats Summary */}
        <section
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8"
          aria-label={t('stats.ariaLabel')}
        >
          <Card variant="hoverGradient" padding="sm">
            <div className="text-xs text-foreground-tertiary mb-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" aria-hidden="true" />
              {t('stats.totalClaimed')}
            </div>
            <div className="text-lg font-bold font-mono text-gold">
              {STATS.totalClaimed.toLocaleString()} QS
            </div>
          </Card>

          <Card variant="hoverGradient" padding="sm">
            <div className="text-xs text-foreground-tertiary mb-1 flex items-center gap-1">
              <Clock className="w-3 h-3" aria-hidden="true" />
              {t('stats.pending')}
            </div>
            <div className="text-lg font-bold font-mono text-foreground">
              {STATS.totalPending.toLocaleString()} QS
            </div>
          </Card>

          <Card variant="hoverGradient" padding="sm">
            <div className="text-xs text-foreground-tertiary mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3" aria-hidden="true" />
              {t('stats.avgPerWeek')}
            </div>
            <div className="text-lg font-bold font-mono text-foreground">
              {STATS.avgPerWeek} QS
            </div>
          </Card>

          <Card variant="hoverGradient" padding="sm">
            <div className="text-xs text-foreground-tertiary mb-1 flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3 text-success" aria-hidden="true" />
              {t('stats.highest')}
            </div>
            <div className="text-lg font-bold font-mono text-success">
              {STATS.highestWeek} QS
            </div>
          </Card>

          <Card variant="hoverGradient" padding="sm">
            <div className="text-xs text-foreground-tertiary mb-1 flex items-center gap-1">
              <ArrowDownRight className="w-3 h-3 text-foreground-secondary" aria-hidden="true" />
              {t('stats.lowest')}
            </div>
            <div className="text-lg font-bold font-mono text-foreground-secondary">
              {STATS.lowestWeek} QS
            </div>
          </Card>

          <Card variant="hoverGradient" padding="sm">
            <div className="text-xs text-foreground-tertiary mb-1 flex items-center gap-1">
              <BarChart3 className="w-3 h-3" aria-hidden="true" />
              {t('stats.totalEpochs')}
            </div>
            <div className="text-lg font-bold font-mono text-foreground">
              {STATS.totalEpochs}
            </div>
          </Card>
        </section>

        {/* Chart Section */}
        <Card padding="none" className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 border-b border-border">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-gold" aria-hidden="true" />
              {t('chart.title')}
            </h2>

            {/* Time View Toggle */}
            <div
              className="flex gap-1 bg-background-secondary rounded-lg p-1"
              role="tablist"
              aria-label={t('chart.timeViewAriaLabel')}
            >
              {(['weekly', 'monthly'] as TimeView[]).map((view) => (
                <button
                  key={view}
                  onClick={() => setTimeView(view)}
                  className={cn(
                    'px-4 py-2 text-sm font-medium rounded-md transition-all',
                    'focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                    timeView === view
                      ? 'bg-surface text-foreground'
                      : 'text-foreground-tertiary hover:text-foreground'
                  )}
                  role="tab"
                  aria-selected={timeView === view}
                  aria-controls="rewards-chart"
                  tabIndex={timeView === view ? 0 : -1}
                >
                  {t(`chart.views.${view}`)}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6" id="rewards-chart" role="tabpanel" aria-label={t('chart.ariaLabel')}>
            {/* Chart */}
            <div className="h-64">
              <svg className="w-full h-full" viewBox="0 0 800 220" role="img">
                <title>{t('chart.chartTitle')}</title>
                {/* Grid lines */}
                {[0, 1, 2, 3, 4].map((i) => (
                  <line
                    key={i}
                    x1="50"
                    y1={40 + i * 40}
                    x2="780"
                    y2={40 + i * 40}
                    stroke="rgba(255,255,255,0.04)"
                  />
                ))}
                {/* Y-axis labels */}
                {[200, 150, 100, 50, 0].map((val, i) => (
                  <text
                    key={val}
                    x="45"
                    y={44 + i * 40}
                    className="fill-foreground-tertiary text-[10px] font-mono"
                    textAnchor="end"
                  >
                    {timeView === 'monthly' ? val * 4 : val}
                  </text>
                ))}
                {/* Bars */}
                {chartData.map((value, index) => {
                  const barWidth = timeView === 'weekly' ? 45 : 90;
                  const barGap = timeView === 'weekly' ? 60 : 120;
                  const x = 70 + index * barGap;
                  const maxHeight = 160;
                  const normalizedValue = timeView === 'monthly' ? value / 4 : value;
                  const height = (normalizedValue / 200) * maxHeight;
                  const y = 200 - height;
                  const label = timeView === 'weekly' ? `W${index + 1}` : `M${index + 1}`;
                  return (
                    <g key={index}>
                      <rect
                        x={x}
                        y={y}
                        width={barWidth}
                        height={height}
                        rx="4"
                        className="fill-gold/80 hover:fill-gold transition-colors cursor-pointer"
                        role="img"
                        aria-label={`${label}: ${value} QS`}
                      />
                      <text
                        x={x + barWidth / 2}
                        y="215"
                        className="fill-foreground-tertiary text-[10px] font-mono"
                        textAnchor="middle"
                      >
                        {label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        </Card>

        {/* History List */}
        <Card padding="none" className="overflow-hidden">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 border-b border-border">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <History className="w-5 h-5 text-gold" aria-hidden="true" />
              {t('list.title')}
            </h2>

            {/* Filter */}
            <div
              className="flex gap-1 bg-background-secondary rounded-lg p-1"
              role="tablist"
              aria-label={t('list.filterAriaLabel')}
            >
              {(['all', 'holding', 'voting', 'delegation'] as FilterType[]).map((filter) => (
                <button
                  key={filter}
                  onClick={() => {
                    setFilterType(filter);
                    setCurrentPage(1);
                  }}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium rounded-md transition-all',
                    'focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                    filterType === filter
                      ? 'bg-surface text-foreground'
                      : 'text-foreground-tertiary hover:text-foreground'
                  )}
                  role="tab"
                  aria-selected={filterType === filter}
                  aria-controls="rewards-history-list"
                  tabIndex={filterType === filter ? 0 : -1}
                  title={t(`list.filterDescriptions.${filter}`)}
                >
                  {t(`list.filters.${filter}`)}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6" id="rewards-history-list" role="tabpanel">
            {/* History Items */}
            <ul className="divide-y divide-border" role="list" aria-label={t('list.ariaLabel')}>
              {paginatedHistory.map((item) => (
                <li key={item.id}>
                  <div className="flex items-center gap-4 py-4">
                    <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
                      <Check className="w-6 h-6 text-success" aria-hidden="true" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-1">
                        <span className="text-sm font-medium">{t('list.type.weeklyReward')}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gold/10 text-gold font-medium w-fit">
                          {t('list.epoch', { number: item.epoch })}
                        </span>
                      </div>
                      <div className="text-xs text-foreground-tertiary font-mono">{item.date}</div>
                      {/* Breakdown */}
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="text-xs text-foreground-tertiary">
                          {t('list.breakdown.holding')}: {item.breakdown.holding}
                        </span>
                        <span className="text-xs text-foreground-tertiary">
                          {t('list.breakdown.voting')}: {item.breakdown.voting}
                        </span>
                        <span className="text-xs text-foreground-tertiary">
                          {t('list.breakdown.delegation')}: {item.breakdown.delegation}
                        </span>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="text-lg font-semibold font-mono text-success">
                        +{item.amount} QS
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-6 pt-6 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  aria-label={t('pagination.previous')}
                >
                  <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                </Button>

                <span className="text-sm text-foreground-secondary">
                  {t('pagination.page', { current: currentPage, total: totalPages })}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  aria-label={t('pagination.next')}
                >
                  <ChevronRight className="w-4 h-4" aria-hidden="true" />
                </Button>
              </div>
            )}

            {/* Empty State */}
            {filteredHistory.length === 0 && (
              <div className="text-center py-12">
                <History className="w-12 h-12 text-foreground-tertiary mx-auto mb-4" aria-hidden="true" />
                <p className="text-foreground-secondary">{t('list.empty')}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Back Link */}
        <div className="mt-8 text-center">
          <Link
            href="/token-hub/rewards"
            className="inline-flex items-center gap-2 text-sm text-foreground-tertiary hover:text-gold transition-colors focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            {t('backToRewards')}
          </Link>
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <nav className="flex flex-wrap gap-4 md:gap-6" aria-label={tCommon('footer.navLabel')}>
              <Link
                href="/consumer/terms"
                className="text-sm text-foreground-tertiary hover:text-gold transition-colors focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
              >
                {tCommon('footer.terms')}
              </Link>
              <Link
                href="/consumer/privacy"
                className="text-sm text-foreground-tertiary hover:text-gold transition-colors focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
              >
                {tCommon('footer.privacy')}
              </Link>
              <Link
                href="/consumer/security"
                className="text-sm text-foreground-tertiary hover:text-gold transition-colors focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
              >
                {tCommon('footer.security')}
              </Link>
            </nav>
            <p className="text-xs text-foreground-tertiary text-center max-w-xl">
              {tCommon('footer.disclaimer')}
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default RewardsHistory;
