'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { ObserverHeader } from '../Dashboard/ObserverHeader';
import { PendingFilters } from './PendingFilters';
import { PendingUnlockRow } from './PendingUnlockRow';
import { Pagination } from './Pagination';
import { Card } from '@/components/ui/card';

// Mock data
const mockPendingUnlocks = [
  {
    id: '1',
    address: '0x4b7c...9e1f',
    fullAddress: '0x4b7c8a2e1f9d3c6b5a4e7f8d9c1b2a3e4f5d6c7b8a9e1f',
    amount: '45.00 ETH',
    type: 'emergency' as const,
    timeRemaining: '6d 14:22:18',
    riskScore: 87,
    status: 'monitoring' as const,
    startedAt: '2026-01-04 09:15:42 UTC',
    bondPaid: '2.25 ETH (5%)',
    txHash: '0x7a8b...3c4d',
    accountAge: 12,
    riskFactors: [
      'First-time emergency unlock',
      'Large amount (top 5% of unlocks)',
      'Account age: 12 days',
    ],
  },
  {
    id: '2',
    address: '0x8f2a...3d4e',
    fullAddress: '0x8f2a3d4e5c6b7a8f9d0e1c2b3a4d5e6f7c8b9a0d1e2f',
    amount: '12.50 ETH',
    type: 'normal' as const,
    timeRemaining: '23:41:02',
    riskScore: 24,
    status: 'pending' as const,
    startedAt: '2026-01-09 10:18:58 UTC',
    txHash: '0x9c2d...5e6f',
    accountAge: 287,
    previousUnlocks: 4,
  },
  {
    id: '3',
    address: '0x1a9d...7b2c',
    fullAddress: '0x1a9d7b2c3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d',
    amount: '8.75 ETH',
    type: 'normal' as const,
    timeRemaining: '18:05:33',
    riskScore: 15,
    status: 'pending' as const,
    startedAt: '2026-01-09 15:42:11 UTC',
    txHash: '0x3e4f...7a8b',
    accountAge: 156,
    previousUnlocks: 2,
  },
  {
    id: '4',
    address: '0x2e5f...8a1b',
    fullAddress: '0x2e5f8a1b9c0d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b',
    amount: '25.00 ETH',
    type: 'normal' as const,
    timeRemaining: '21:33:47',
    riskScore: 62,
    status: 'review' as const,
    startedAt: '2026-01-09 08:22:33 UTC',
    txHash: '0x5c6d...9e0f',
    accountAge: 45,
    riskFactors: ['Unusual unlock pattern detected'],
  },
  {
    id: '5',
    address: '0x5c3e...2d9a',
    fullAddress: '0x5c3e2d9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a',
    amount: '3.25 ETH',
    type: 'normal' as const,
    timeRemaining: '15:22:11',
    riskScore: 8,
    status: 'lowRisk' as const,
    startedAt: '2026-01-09 18:05:22 UTC',
    txHash: '0x7a8b...1c2d',
    accountAge: 542,
    previousUnlocks: 12,
  },
];

export function PendingMonitor() {
  const t = useTranslations('observer.dashboard.pending');

  const [filters, setFilters] = useState({
    unlockType: 'all',
    minAmount: '',
    maxAmount: '',
    riskScore: 'all',
    sortBy: 'timeAsc',
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalItems = 47;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const handleFilterChange = (
    key: keyof typeof filters,
    value: string
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

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
          <div
            className={cn(
              'flex items-center gap-2 px-4 py-2',
              'bg-success/10 border border-success rounded-full',
              'text-success text-xs font-medium'
            )}
            role="status"
            aria-label={t('liveMonitoring')}
          >
            <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
            {t('liveMonitoring')}
          </div>
        </div>

        {/* Filters */}
        <PendingFilters filters={filters} onFilterChange={handleFilterChange} />

        {/* Data Table */}
        <Card variant="default" padding="none">
          <div className="overflow-x-auto">
            <table className="w-full" role="grid">
              <thead>
                <tr className="border-b border-border/30 bg-background-secondary">
                  <th className="text-left text-[11px] font-semibold text-foreground-tertiary uppercase tracking-wider px-4 py-3">
                    {t('table.userAddress')}
                  </th>
                  <th className="text-left text-[11px] font-semibold text-foreground-tertiary uppercase tracking-wider px-4 py-3">
                    {t('table.amount')}
                  </th>
                  <th className="text-left text-[11px] font-semibold text-foreground-tertiary uppercase tracking-wider px-4 py-3">
                    {t('table.type')}
                  </th>
                  <th className="text-left text-[11px] font-semibold text-foreground-tertiary uppercase tracking-wider px-4 py-3">
                    {t('table.timeRemaining')}
                  </th>
                  <th className="text-left text-[11px] font-semibold text-foreground-tertiary uppercase tracking-wider px-4 py-3">
                    {t('table.risk')}
                  </th>
                  <th className="text-left text-[11px] font-semibold text-foreground-tertiary uppercase tracking-wider px-4 py-3">
                    {t('table.status')}
                  </th>
                  <th className="text-left text-[11px] font-semibold text-foreground-tertiary uppercase tracking-wider px-4 py-3">
                    {t('table.action')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {mockPendingUnlocks.map((unlock) => (
                  <PendingUnlockRow key={unlock.id} unlock={unlock} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </Card>
      </main>
    </div>
  );
}
