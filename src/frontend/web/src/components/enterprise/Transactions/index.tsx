'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { EnterpriseSidebar } from '../Dashboard/EnterpriseSidebar';
import { EnterpriseTopBar } from '../Dashboard/EnterpriseTopBar';
import { TransactionFilters, TransactionType, TransactionStatus } from './TransactionFilters';
import { TransactionTable, Transaction } from './TransactionTable';
import { Pagination } from './Pagination';
import { Button } from '@/components/ui/button';
import { BarChart3, Download } from 'lucide-react';
import Link from 'next/link';
import { useTransactions } from '@/hooks/enterprise';

const PAGE_SIZE = 20;

export function TransactionList() {
  const t = useTranslations('enterprise.transactions');

  // Filter states
  const [typeFilter, setTypeFilter] = useState<TransactionType>('all');
  const [statusFilter, setStatusFilter] = useState<TransactionStatus>('all');
  const [dateFrom, setDateFrom] = useState('2026-01-01');
  const [dateTo, setDateTo] = useState('2026-01-11');
  const [searchQuery, setSearchQuery] = useState('');

  // Table states
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch transactions using hook
  const { data: transactionsData } = useTransactions({
    page: currentPage,
    limit: PAGE_SIZE,
    type: typeFilter !== 'all' ? typeFilter : undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    from_date: dateFrom,
    to_date: dateTo,
  });

  // Map API data or use fallback
  const transactions: Transaction[] = transactionsData?.transactions?.map((tx) => ({
    id: tx.id,
    txHash: tx.hash,
    type: tx.type as Transaction['type'],
    amount: tx.amount,
    fromAddress: tx.user_address ?? '0x...',
    status: tx.status as Transaction['status'],
    timestamp: tx.time,
  })) ?? [];

  const totalTransactions = transactionsData?.total ?? 0;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(transactions.map((tx) => tx.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id));
    }
  };

  const handleApplyFilters = () => {
    // In production, this would trigger an API call with filters
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalTransactions / PAGE_SIZE);
  const pageStart = (currentPage - 1) * PAGE_SIZE + 1;
  const pageEnd = Math.min(currentPage * PAGE_SIZE, totalTransactions);

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
          <div className="flex items-center gap-3">
            <Button variant="outline" asChild>
              <Link href="/enterprise/transactions/analytics">
                <BarChart3 className="w-4 h-4 mr-2" aria-hidden="true" />
                {t('analytics')}
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/enterprise/transactions/export">
                <Download className="w-4 h-4 mr-2" aria-hidden="true" />
                {t('export')}
              </Link>
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-8" role="main" aria-label={t('ariaLabel')}>
          {/* Filters */}
          <TransactionFilters
            type={typeFilter}
            status={statusFilter}
            dateFrom={dateFrom}
            dateTo={dateTo}
            searchQuery={searchQuery}
            onTypeChange={setTypeFilter}
            onStatusChange={setStatusFilter}
            onDateFromChange={setDateFrom}
            onDateToChange={setDateTo}
            onSearchChange={setSearchQuery}
            onApplyFilters={handleApplyFilters}
          />

          {/* Transaction Table */}
          <div className="bg-background-secondary border border-white/5 rounded-xl overflow-hidden">
            <TransactionTable
              transactions={transactions}
              selectedIds={selectedIds}
              onSelectAll={handleSelectAll}
              onSelectOne={handleSelectOne}
              total={totalTransactions}
              pageStart={pageStart}
              pageEnd={pageEnd}
            />

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              total={totalTransactions}
              pageSize={PAGE_SIZE}
              onPageChange={setCurrentPage}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

export default TransactionList;

// Re-export components
export { TransactionFilters } from './TransactionFilters';
export { TransactionTable } from './TransactionTable';
export { Pagination } from './Pagination';
export type { TransactionType, TransactionStatus } from './TransactionFilters';
export type { Transaction, TxType, TxStatus } from './TransactionTable';
