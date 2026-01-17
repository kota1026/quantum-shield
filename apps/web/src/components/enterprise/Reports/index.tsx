'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { EnterpriseSidebar } from '../Dashboard/EnterpriseSidebar';
import { Button } from '@/components/ui/button';

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

// Mock data
const MOCK_STATS: ReportStats = {
  totalTransactions: { value: 1234, change: 12 },
  totalVolume: { value: '$47.2M', change: 8.7 },
  avgTvl: { value: '$118.4M', change: 5.2 },
  activeUsers: { value: 847, change: 23 },
};

const MOCK_TRANSACTION_SUMMARY: TransactionSummary[] = [
  { type: 'lock', count: 847, volume: '$32.4M', avgSize: '$38,252', percentage: '68.6%' },
  { type: 'normalUnlock', count: 342, volume: '$12.8M', avgSize: '$37,426', percentage: '27.7%' },
  { type: 'emergencyUnlock', count: 45, volume: '$2.0M', avgSize: '$44,444', percentage: '3.7%' },
];

const MOCK_TOP_USERS: TopUser[] = [
  { rank: 1, address: '0x1234...5678', transactions: 47, volume: '$4.2M' },
  { rank: 2, address: '0x9abc...def0', transactions: 35, volume: '$3.1M' },
  { rank: 3, address: '0x5678...9012', transactions: 28, volume: '$2.8M' },
];

interface ReportsProps {
  className?: string;
}

export function Reports({ className }: ReportsProps) {
  const t = useTranslations('enterprise.reports');
  const [selectedPeriod, setSelectedPeriod] = useState('december');

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
                {MOCK_STATS.totalTransactions.value.toLocaleString()}
              </p>
              <p className="text-xs text-success mt-1">
                ↑ {t('stats.totalTransactions.change', { percent: MOCK_STATS.totalTransactions.change })}
              </p>
            </div>
            <div className="bg-background-secondary border border-white/5 rounded-xl p-6">
              <p className="text-xs text-text-tertiary mb-1">{t('stats.totalVolume.label')}</p>
              <p className="text-2xl font-bold text-text-primary">{MOCK_STATS.totalVolume.value}</p>
              <p className="text-xs text-success mt-1">
                ↑ {t('stats.totalVolume.change', { percent: MOCK_STATS.totalVolume.change })}
              </p>
            </div>
            <div className="bg-background-secondary border border-white/5 rounded-xl p-6">
              <p className="text-xs text-text-tertiary mb-1">{t('stats.avgTvl.label')}</p>
              <p className="text-2xl font-bold text-text-primary">{MOCK_STATS.avgTvl.value}</p>
              <p className="text-xs text-success mt-1">
                ↑ {t('stats.avgTvl.change', { percent: MOCK_STATS.avgTvl.change })}
              </p>
            </div>
            <div className="bg-background-secondary border border-white/5 rounded-xl p-6">
              <p className="text-xs text-text-tertiary mb-1">{t('stats.activeUsers.label')}</p>
              <p className="text-2xl font-bold text-text-primary">
                {MOCK_STATS.activeUsers.value.toLocaleString()}
              </p>
              <p className="text-xs text-success mt-1">
                ↑ {t('stats.activeUsers.change', { count: MOCK_STATS.activeUsers.change })}
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
                  {MOCK_TRANSACTION_SUMMARY.map((row, index) => (
                    <tr key={row.type} className={index !== MOCK_TRANSACTION_SUMMARY.length - 1 ? 'border-b border-white/5' : ''}>
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
                  {MOCK_TOP_USERS.map((user, index) => (
                    <tr key={user.address} className={index !== MOCK_TOP_USERS.length - 1 ? 'border-b border-white/5' : ''}>
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
