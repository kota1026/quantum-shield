'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { EnterpriseSidebar } from '../Dashboard/EnterpriseSidebar';
import { Button } from '@/components/ui/button';
import { useReports } from '@/hooks/enterprise';
import {
  MOCK_REPORT_STATS,
  MOCK_TRANSACTION_SUMMARY as MOCK_TX_SUMMARY,
  MOCK_TOP_USERS as MOCK_TOP_USERS_DATA,
} from '@/lib/api/enterprise/mock';

interface TransactionSummary {
  type: 'lock' | 'normalUnlock' | 'emergencyUnlock';
  count: number;
  volume: string;
  avgSize: string;
  percentage: string;
}

interface TopUser {
  rank: number;
  address: string;
  transactions: number;
  volume: string;
}

interface ReportStats {
  totalTransactions: { value: number; change: number };
  totalVolume: { value: string; change: number };
  avgTvl: { value: string; change: number };
  activeUsers: { value: number; change: number };
}

// Fallback data for when API is unavailable
const FALLBACK_STATS: ReportStats = {
  totalTransactions: { value: MOCK_REPORT_STATS.total_transactions.value, change: MOCK_REPORT_STATS.total_transactions.change },
  totalVolume: { value: MOCK_REPORT_STATS.total_volume.value, change: MOCK_REPORT_STATS.total_volume.change },
  avgTvl: { value: MOCK_REPORT_STATS.avg_tvl.value, change: MOCK_REPORT_STATS.avg_tvl.change },
  activeUsers: { value: MOCK_REPORT_STATS.active_users.value, change: MOCK_REPORT_STATS.active_users.change },
};

const FALLBACK_TRANSACTION_SUMMARY: TransactionSummary[] = MOCK_TX_SUMMARY.map(t => ({
  type: t.type as 'lock' | 'normalUnlock' | 'emergencyUnlock',
  count: t.count,
  volume: t.volume,
  avgSize: t.avg_size,
  percentage: t.percentage,
}));

const FALLBACK_TOP_USERS: TopUser[] = MOCK_TOP_USERS_DATA.map((u, i) => ({
  rank: i + 1,
  address: u.address,
  transactions: u.transactions,
  volume: u.volume,
}));

interface ReportsProps {
  className?: string;
}

export function Reports({ className }: ReportsProps) {
  const t = useTranslations('enterprise.reports');
  const [selectedPeriod, setSelectedPeriod] = useState('december');

  // Use API hook with fallback
  const { data: reportsData } = useReports();
  const stats: ReportStats = reportsData?.stats ? {
    totalTransactions: { value: reportsData.stats.total_transactions.value, change: reportsData.stats.total_transactions.change },
    totalVolume: { value: reportsData.stats.total_volume.value, change: reportsData.stats.total_volume.change },
    avgTvl: { value: reportsData.stats.avg_tvl.value, change: reportsData.stats.avg_tvl.change },
    activeUsers: { value: reportsData.stats.active_users.value, change: reportsData.stats.active_users.change },
  } : FALLBACK_STATS;
  const transactionSummary: TransactionSummary[] = reportsData?.transaction_summary?.map(t => ({
    type: t.type as 'lock' | 'normalUnlock' | 'emergencyUnlock',
    count: t.count,
    volume: t.volume,
    avgSize: t.avg_size,
    percentage: t.percentage,
  })) ?? FALLBACK_TRANSACTION_SUMMARY;
  const topUsers: TopUser[] = reportsData?.top_users?.map((u, i) => ({
    rank: i + 1,
    address: u.address,
    transactions: u.transactions,
    volume: u.volume,
  })) ?? FALLBACK_TOP_USERS;

  return (
    <div className={cn('flex min-h-screen bg-background', className)}>
      <EnterpriseSidebar />

      <main
        className="flex-1 ml-[260px] min-h-screen"
        role="main"
        aria-label={t('ariaLabel')}
      >
        {/* Top Bar */}
        <header
          className="flex items-center justify-between px-8 py-4 bg-background-secondary border-b border-white/5 sticky top-0 z-50"
          role="banner"
        >
          <h1 className="text-xl font-semibold text-text-primary">{t('pageTitle')}</h1>
          <div className="flex items-center gap-3">
            <Link href="/enterprise/reports/compliance">
              <Button variant="secondary" size="sm">
                <span aria-hidden="true">📋</span> {t('complianceReport')}
              </Button>
            </Link>
            <Button variant="primary" size="sm">
              <span aria-hidden="true">📥</span> {t('downloadPdf')}
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8">
          {/* Period Selector */}
          <div className="flex items-center gap-4 mb-8">
            <span className="text-sm text-text-tertiary">{t('period.label')}:</span>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-2 bg-background-secondary border border-white/10 rounded-lg text-text-primary text-sm"
            >
              <option value="december">{t('period.months.december')}</option>
              <option value="november">{t('period.months.november')}</option>
              <option value="october">{t('period.months.october')}</option>
            </select>
          </div>

          {/* Stats Grid */}
          <section
            className="grid grid-cols-4 gap-4 mb-8"
            aria-label={t('stats.ariaLabel')}
          >
            <div className="bg-background-secondary border border-white/5 rounded-xl p-6">
              <p className="text-xs text-text-tertiary mb-1">{t('stats.totalTransactions.label')}</p>
              <p className="text-2xl font-bold text-text-primary">
                {stats.totalTransactions.value.toLocaleString()}
              </p>
              <p className="text-xs text-success mt-1">
                ↑ {t('stats.totalTransactions.change', { percent: stats.totalTransactions.change })}
              </p>
            </div>
            <div className="bg-background-secondary border border-white/5 rounded-xl p-6">
              <p className="text-xs text-text-tertiary mb-1">{t('stats.totalVolume.label')}</p>
              <p className="text-2xl font-bold text-text-primary">{stats.totalVolume.value}</p>
              <p className="text-xs text-success mt-1">
                ↑ {t('stats.totalVolume.change', { percent: stats.totalVolume.change })}
              </p>
            </div>
            <div className="bg-background-secondary border border-white/5 rounded-xl p-6">
              <p className="text-xs text-text-tertiary mb-1">{t('stats.avgTvl.label')}</p>
              <p className="text-2xl font-bold text-text-primary">{stats.avgTvl.value}</p>
              <p className="text-xs text-success mt-1">
                ↑ {t('stats.avgTvl.change', { percent: stats.avgTvl.change })}
              </p>
            </div>
            <div className="bg-background-secondary border border-white/5 rounded-xl p-6">
              <p className="text-xs text-text-tertiary mb-1">{t('stats.activeUsers.label')}</p>
              <p className="text-2xl font-bold text-text-primary">
                {stats.activeUsers.value.toLocaleString()}
              </p>
              <p className="text-xs text-success mt-1">
                ↑ {t('stats.activeUsers.change', { count: stats.activeUsers.change })}
              </p>
            </div>
          </section>

          {/* Transaction Summary */}
          <section className="bg-background-secondary border border-white/5 rounded-2xl overflow-hidden mb-8">
            <div className="p-6 border-b border-white/5">
              <h2 className="text-base font-semibold text-text-primary">{t('transactionSummary.title')}</h2>
            </div>
            <div className="p-6">
              <table className="w-full">
                <thead>
                  <tr className="text-left">
                    <th className="pb-4 text-xs font-medium text-text-tertiary uppercase">
                      {t('transactionSummary.columns.type')}
                    </th>
                    <th className="pb-4 text-xs font-medium text-text-tertiary uppercase">
                      {t('transactionSummary.columns.count')}
                    </th>
                    <th className="pb-4 text-xs font-medium text-text-tertiary uppercase">
                      {t('transactionSummary.columns.volume')}
                    </th>
                    <th className="pb-4 text-xs font-medium text-text-tertiary uppercase">
                      {t('transactionSummary.columns.avgSize')}
                    </th>
                    <th className="pb-4 text-xs font-medium text-text-tertiary uppercase">
                      {t('transactionSummary.columns.percentage')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {transactionSummary.map((row, index) => (
                    <tr key={row.type} className={index !== transactionSummary.length - 1 ? 'border-b border-white/5' : ''}>
                      <td className="py-4 text-sm text-text-primary">
                        {t(`transactionSummary.types.${row.type}`)}
                      </td>
                      <td className="py-4 text-sm text-text-secondary font-mono">{row.count.toLocaleString()}</td>
                      <td className="py-4 text-sm text-text-secondary font-mono">{row.volume}</td>
                      <td className="py-4 text-sm text-text-secondary font-mono">{row.avgSize}</td>
                      <td className="py-4 text-sm text-text-secondary">{row.percentage}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Volume Trend Chart */}
          <section className="bg-background-secondary border border-white/5 rounded-2xl overflow-hidden mb-8">
            <div className="p-6 border-b border-white/5">
              <h2 className="text-base font-semibold text-text-primary">{t('volumeTrend.title')}</h2>
            </div>
            <div className="p-6">
              <div className="h-[200px] bg-background-primary rounded-lg flex items-center justify-center text-text-muted text-sm">
                {t('volumeTrend.placeholder')}
              </div>
            </div>
          </section>

          {/* Top Users */}
          <section className="bg-background-secondary border border-white/5 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-white/5">
              <h2 className="text-base font-semibold text-text-primary">{t('topUsers.title')}</h2>
            </div>
            <div className="p-6">
              <table className="w-full">
                <thead>
                  <tr className="text-left">
                    <th className="pb-4 text-xs font-medium text-text-tertiary uppercase">
                      {t('topUsers.columns.rank')}
                    </th>
                    <th className="pb-4 text-xs font-medium text-text-tertiary uppercase">
                      {t('topUsers.columns.address')}
                    </th>
                    <th className="pb-4 text-xs font-medium text-text-tertiary uppercase">
                      {t('topUsers.columns.transactions')}
                    </th>
                    <th className="pb-4 text-xs font-medium text-text-tertiary uppercase">
                      {t('topUsers.columns.volume')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {topUsers.map((user, index) => (
                    <tr key={user.address} className={index !== topUsers.length - 1 ? 'border-b border-white/5' : ''}>
                      <td className="py-4 text-sm text-text-secondary">{user.rank}</td>
                      <td className="py-4 text-sm text-gold font-mono">{user.address}</td>
                      <td className="py-4 text-sm text-text-secondary font-mono">{user.transactions}</td>
                      <td className="py-4 text-sm text-text-secondary font-mono">{user.volume}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
