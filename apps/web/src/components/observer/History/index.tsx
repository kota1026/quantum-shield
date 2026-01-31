'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ObserverHeader } from '../Dashboard/ObserverHeader';
import { Card } from '@/components/ui/card';
import { Pagination } from '../Pending/Pagination';
import { useChallengeHistory } from '@/hooks/observer';
import { MOCK_CHALLENGE_HISTORY } from '@/lib/api/observer/mock';

// Fallback data
const FALLBACK_CHALLENGES = MOCK_CHALLENGE_HISTORY;

// Extended mock data (kept for reference)
const extendedChallenges = [
  {
    id: '#CHG-2843',
    targetAddress: '0x9a2e...1f3c',
    amount: '18.25 ETH',
    date: '2026-01-08',
    result: 'inProgress' as const,
    rewardPenalty: null,
  },
  {
    id: '#CHG-2847',
    targetAddress: '0x4b7c...9e1f',
    amount: '45.00 ETH',
    date: '2026-01-08',
    result: 'inProgress' as const,
    rewardPenalty: null,
  },
  {
    id: '#CHG-2831',
    targetAddress: '0x7d3f...8c2a',
    amount: '32.50 ETH',
    date: '2026-01-05',
    result: 'won' as const,
    rewardPenalty: '+0.65 ETH',
  },
  {
    id: '#CHG-2824',
    targetAddress: '0x2e4f...9a1b',
    amount: '12.00 ETH',
    date: '2026-01-03',
    result: 'won' as const,
    rewardPenalty: '+0.24 ETH',
  },
  {
    id: '#CHG-2819',
    targetAddress: '0x5c8d...3e7f',
    amount: '8.75 ETH',
    date: '2026-01-01',
    result: 'lost' as const,
    rewardPenalty: '-0.10 ETH',
  },
  {
    id: '#CHG-2812',
    targetAddress: '0x1a9b...4c2d',
    amount: '55.00 ETH',
    date: '2025-12-28',
    result: 'won' as const,
    rewardPenalty: '+1.10 ETH',
  },
  {
    id: '#CHG-2805',
    targetAddress: '0x8f3e...7d1a',
    amount: '22.25 ETH',
    date: '2025-12-25',
    result: 'won' as const,
    rewardPenalty: '+0.45 ETH',
  },
];

export function ChallengeHistory() {
  const t = useTranslations('observer.dashboard.history');

  // Fetch data using hooks
  const { data: challengeHistoryApi } = useChallengeHistory();

  // Use API data with fallback
  const challenges = challengeHistoryApi ?? extendedChallenges;

  const [resultFilter, setResultFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('last30');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalItems = challenges.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const handleExportCsv = () => {
    const headers = [
      t('table.challengeId'),
      t('table.targetAddress'),
      t('table.amount'),
      t('table.date'),
      t('table.result'),
      t('table.rewardPenalty'),
    ];

    const rows = challenges.map((challenge) => [
      challenge.id,
      challenge.targetAddress,
      challenge.amount,
      challenge.date,
      challenge.result === 'inProgress'
        ? t('results.inProgress')
        : challenge.result === 'won'
          ? t('results.won')
          : t('results.lost'),
      challenge.rewardPenalty || '-',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `observer-history-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resultBadgeStyles = {
    inProgress: 'bg-foreground-tertiary/10 text-foreground-tertiary',
    won: 'bg-success/10 text-success',
    lost: 'bg-danger/10 text-danger',
  };

  const inputClasses = cn(
    'px-3 py-2 min-h-[44px] bg-background-secondary border border-border rounded-lg',
    'text-sm text-foreground outline-none',
    'focus:border-hinomaru transition-colors'
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Premium Background */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
        <div
          className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[800px] h-[600px]"
          style={{
            background:
              'radial-gradient(ellipse, rgba(188, 0, 45, 0.12), transparent 60%)',
            opacity: 0.5,
          }}
        />
      </div>

      <main
        className="relative z-10 max-w-[1400px] mx-auto px-8 py-8"
        role="main"
        aria-label={t('pageTitle')}
      >
        {/* Header */}
        <ObserverHeader />

        {/* Page Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-[28px] font-bold text-foreground">
            {t('pageTitle')}
          </h1>
        </div>

        {/* Stats Summary */}
        <div
          className="grid grid-cols-4 gap-4 mb-8"
          role="region"
          aria-label="Challenge statistics"
        >
          <div className="bg-card border border-border/30 rounded-xl p-6 text-center">
            <div className="text-[28px] font-bold text-foreground mb-1">14</div>
            <div className="text-xs text-foreground-tertiary">
              {t('stats.totalChallenges')}
            </div>
          </div>
          <div className="bg-card border border-border/30 rounded-xl p-6 text-center">
            <div className="text-[28px] font-bold text-success mb-1">12</div>
            <div className="text-xs text-foreground-tertiary">
              {t('stats.successful')}
            </div>
          </div>
          <div className="bg-card border border-border/30 rounded-xl p-6 text-center">
            <div className="text-[28px] font-bold text-danger mb-1">2</div>
            <div className="text-xs text-foreground-tertiary">
              {t('stats.failed')}
            </div>
          </div>
          <div className="bg-card border border-border/30 rounded-xl p-6 text-center">
            <div className="text-[28px] font-bold text-gold mb-1">4.28 ETH</div>
            <div className="text-xs text-foreground-tertiary">
              {t('stats.totalEarnings')}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <select
            className={inputClasses}
            value={resultFilter}
            onChange={(e) => setResultFilter(e.target.value)}
            aria-label="Filter by result"
          >
            <option value="all">{t('filters.result.all')}</option>
            <option value="successful">{t('filters.result.successful')}</option>
            <option value="failed">{t('filters.result.failed')}</option>
          </select>
          <select
            className={inputClasses}
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
            aria-label="Filter by period"
          >
            <option value="last30">{t('filters.period.last30')}</option>
            <option value="last7">{t('filters.period.last7')}</option>
            <option value="last90">{t('filters.period.last90')}</option>
            <option value="allTime">{t('filters.period.allTime')}</option>
          </select>
          <button
            onClick={handleExportCsv}
            className={cn(
              'ml-auto px-4 py-2 min-h-[44px] flex items-center gap-2',
              'bg-gold/10 border border-gold rounded-lg',
              'text-gold text-sm hover:bg-gold hover:text-background transition-colors'
            )}
          >
            <Download className="w-4 h-4" />
            {t('filters.exportCsv')}
          </button>
        </div>

        {/* Data Table */}
        <Card variant="default" padding="none">
          <div className="overflow-x-auto">
            <table className="w-full" role="grid">
              <thead>
                <tr className="border-b border-border/30 bg-background-secondary">
                  <th className="text-left text-[11px] font-semibold text-foreground-tertiary uppercase tracking-wider px-4 py-3">
                    {t('table.challengeId')}
                  </th>
                  <th className="text-left text-[11px] font-semibold text-foreground-tertiary uppercase tracking-wider px-4 py-3">
                    {t('table.targetAddress')}
                  </th>
                  <th className="text-left text-[11px] font-semibold text-foreground-tertiary uppercase tracking-wider px-4 py-3">
                    {t('table.amount')}
                  </th>
                  <th className="text-left text-[11px] font-semibold text-foreground-tertiary uppercase tracking-wider px-4 py-3">
                    {t('table.date')}
                  </th>
                  <th className="text-left text-[11px] font-semibold text-foreground-tertiary uppercase tracking-wider px-4 py-3">
                    {t('table.result')}
                  </th>
                  <th className="text-left text-[11px] font-semibold text-foreground-tertiary uppercase tracking-wider px-4 py-3">
                    {t('table.rewardPenalty')}
                  </th>
                  <th className="text-left text-[11px] font-semibold text-foreground-tertiary uppercase tracking-wider px-4 py-3">
                    {t('table.action')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {challenges.map((challenge) => (
                  <tr
                    key={challenge.id}
                    className="border-b border-border/30 hover:bg-background-secondary cursor-pointer transition-colors"
                    onClick={() => {
                      window.location.href = `/observer/challenge/${challenge.id.replace('#CHG-', '')}`;
                    }}
                  >
                    <td className="px-4 py-4">
                      <Link
                        href={`/observer/challenge/${challenge.id.replace('#CHG-', '')}`}
                        className="font-mono text-sm text-foreground hover:text-gold inline-flex items-center min-h-[44px]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {challenge.id}
                      </Link>
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-mono text-sm text-foreground-secondary">
                        {challenge.targetAddress}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-mono font-semibold text-foreground">
                        {challenge.amount}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-foreground-secondary">
                        {challenge.date}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={cn(
                          'inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium',
                          resultBadgeStyles[challenge.result]
                        )}
                      >
                        {t(`results.${challenge.result}`)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {challenge.rewardPenalty ? (
                        <span
                          className={cn(
                            'font-mono font-semibold',
                            challenge.rewardPenalty.startsWith('+')
                              ? 'text-success'
                              : 'text-danger'
                          )}
                        >
                          {challenge.rewardPenalty}
                        </span>
                      ) : (
                        <span className="text-foreground-tertiary">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <Link
                        href={`/observer/challenge/${challenge.id.replace('#', '')}`}
                        className={cn(
                          'inline-flex items-center px-3 py-1.5 min-h-[44px]',
                          'bg-transparent border border-border rounded text-xs',
                          'text-foreground-secondary hover:border-gold hover:text-gold transition-colors'
                        )}
                      >
                        {t('actions.view')}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center px-6 py-4 border-t border-border/30">
            <div className="text-sm text-foreground-secondary">
              {t('pagination.showing', {
                start: 1,
                end: 7,
                total: totalItems,
              })}
            </div>
            <div className="flex gap-1">
              <button
                className={cn(
                  'px-3 py-2 min-h-[44px] bg-background-secondary border border-border/30 rounded text-sm',
                  'text-foreground-secondary hover:border-border hover:text-foreground transition-colors'
                )}
              >
                {t('pagination.prev')}
              </button>
              <button
                className={cn(
                  'px-3 py-2 min-w-[44px] min-h-[44px] rounded text-sm font-medium',
                  'bg-hinomaru/10 border border-hinomaru text-hinomaru'
                )}
              >
                1
              </button>
              <button
                className={cn(
                  'px-3 py-2 min-w-[44px] min-h-[44px] bg-background-secondary border border-border/30 rounded text-sm',
                  'text-foreground-secondary hover:border-border hover:text-foreground transition-colors'
                )}
              >
                2
              </button>
              <button
                className={cn(
                  'px-3 py-2 min-h-[44px] bg-background-secondary border border-border/30 rounded text-sm',
                  'text-foreground-secondary hover:border-border hover:text-foreground transition-colors'
                )}
              >
                {t('pagination.next')}
              </button>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
