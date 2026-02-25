'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useState } from 'react';
import {
  Wallet,
  Search,
  Filter,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  PieChart,
  FileText,
  DollarSign,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AdminSidebarV2 } from '../AdminSidebarV2';

// Stat card
interface StatCardProps {
  label: string;
  value: string;
  subValue?: string;
  icon: React.ReactNode;
  status?: 'success' | 'warning' | 'danger' | 'info';
}

function StatCard({ label, value, subValue, icon, status = 'success' }: StatCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={cn(
          'flex h-10 w-10 items-center justify-center rounded-lg',
          status === 'success' && 'bg-success/10 text-success',
          status === 'warning' && 'bg-warning/10 text-warning',
          status === 'danger' && 'bg-danger/10 text-danger',
          status === 'info' && 'bg-info/10 text-info'
        )}>
          {icon}
        </div>
        <div>
          <div className="text-xs text-foreground-tertiary">{label}</div>
          <div className="text-xl font-bold text-foreground">{value}</div>
          {subValue && <div className="text-xs text-foreground-secondary">{subValue}</div>}
        </div>
      </div>
    </Card>
  );
}

// Mock data
const mockTransactions = [
  {
    id: 'tx-001',
    type: 'expense',
    category: 'development',
    description: 'Prover Network Maintenance',
    amount: '-125,000 USDC',
    recipient: '0x4a2f...8b1c',
    status: 'completed',
    date: '2026-01-18',
  },
  {
    id: 'tx-002',
    type: 'income',
    category: 'fees',
    description: 'Protocol Fee Revenue',
    amount: '+85,200 USDC',
    recipient: 'Treasury',
    status: 'completed',
    date: '2026-01-17',
  },
  {
    id: 'tx-003',
    type: 'expense',
    category: 'grant',
    description: 'Community Grant - Observer Tools',
    amount: '-50,000 USDC',
    recipient: '0x7c3d...2e5f',
    status: 'pending',
    date: '2026-01-17',
  },
  {
    id: 'tx-004',
    type: 'expense',
    category: 'security',
    description: 'Security Audit - Trail of Bits',
    amount: '-200,000 USDC',
    recipient: '0x9e1a...4f7b',
    status: 'completed',
    date: '2026-01-15',
  },
  {
    id: 'tx-005',
    type: 'income',
    category: 'saas',
    description: 'Enterprise SaaS Revenue',
    amount: '+350,000 USDC',
    recipient: 'Treasury',
    status: 'completed',
    date: '2026-01-14',
  },
];

const mockAllocations = [
  { category: 'development', percentage: 35, amount: '2.1M USDC' },
  { category: 'security', percentage: 20, amount: '1.2M USDC' },
  { category: 'grants', percentage: 15, amount: '0.9M USDC' },
  { category: 'operations', percentage: 15, amount: '0.9M USDC' },
  { category: 'reserves', percentage: 15, amount: '0.9M USDC' },
];

export function PublicTreasuryManagement() {
  const t = useTranslations('admin.publicTreasury');
  const [activeTab, setActiveTab] = useState<'overview' | 'expenses' | 'distribution' | 'audit'>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  const tabs = [
    { key: 'overview', label: t('tabs.overview') },
    { key: 'expenses', label: t('tabs.expenses'), count: mockTransactions.filter(tx => tx.status === 'pending').length },
    { key: 'distribution', label: t('tabs.distribution') },
    { key: 'audit', label: t('tabs.audit') },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success">{t('status.completed')}</Badge>;
      case 'pending':
        return <Badge variant="warning">{t('status.pending')}</Badge>;
      case 'rejected':
        return <Badge variant="danger">{t('status.rejected')}</Badge>;
      default:
        return null;
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'development':
        return <Badge variant="info">{t('category.development')}</Badge>;
      case 'security':
        return <Badge variant="danger">{t('category.security')}</Badge>;
      case 'grant':
        return <Badge variant="gold">{t('category.grant')}</Badge>;
      case 'fees':
        return <Badge variant="success">{t('category.fees')}</Badge>;
      case 'saas':
        return <Badge variant="success">{t('category.saas')}</Badge>;
      default:
        return null;
    }
  };

  const filteredTransactions = mockTransactions.filter(
    (tx) =>
      tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebarV2 />

      <main className="pl-[280px]" role="main" aria-label={t('ariaLabel')}>
        <div className="p-6 lg:p-8">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 text-sm text-foreground-tertiary">
              <Link href="/admin/dashboard" className="hover:text-foreground">
                Dashboard
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground">{t('title')}</span>
            </div>
            <h1 className="mt-2 text-3xl font-bold text-foreground">{t('title')}</h1>
            <p className="mt-1 text-sm text-foreground-secondary">{t('subtitle')}</p>
          </div>

          {/* Stats */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard
              label={t('stats.totalBalance')}
              value="$6.2M"
              icon={<Wallet className="h-5 w-5" />}
              status="info"
            />
            <StatCard
              label={t('stats.monthlyIncome')}
              value="+$435K"
              subValue="+12.3% MoM"
              icon={<ArrowUpRight className="h-5 w-5" />}
              status="success"
            />
            <StatCard
              label={t('stats.monthlyExpenses')}
              value="-$375K"
              subValue="-5.2% MoM"
              icon={<ArrowDownRight className="h-5 w-5" />}
              status="warning"
            />
            <StatCard
              label={t('stats.pendingApprovals')}
              value="3"
              icon={<FileText className="h-5 w-5" />}
              status="warning"
            />
            <StatCard
              label={t('stats.runwayMonths')}
              value="18"
              subValue="months"
              icon={<TrendingUp className="h-5 w-5" />}
              status="success"
            />
          </div>

          {/* Tabs */}
          <div className="mb-6 flex gap-1 rounded-lg border border-surface-tertiary bg-background-secondary p-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={cn(
                  'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all',
                  activeTab === tab.key
                    ? 'bg-gold text-background'
                    : 'text-foreground-secondary hover:text-foreground'
                )}
              >
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <Badge size="sm" variant={activeTab === tab.key ? 'gold' : 'warning'}>
                    {tab.count}
                  </Badge>
                )}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Recent Transactions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t('overview.recentTransactions')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mockTransactions.slice(0, 5).map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between rounded-lg border border-surface-tertiary p-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'flex h-10 w-10 items-center justify-center rounded-lg',
                            tx.type === 'income' ? 'bg-success/10' : 'bg-warning/10'
                          )}>
                            {tx.type === 'income' ? (
                              <ArrowUpRight className="h-5 w-5 text-success" />
                            ) : (
                              <ArrowDownRight className="h-5 w-5 text-warning" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-foreground">{tx.description}</div>
                            <div className="text-xs text-foreground-tertiary">{tx.date}</div>
                          </div>
                        </div>
                        <div className={cn(
                          'font-mono font-medium',
                          tx.type === 'income' ? 'text-success' : 'text-foreground'
                        )}>
                          {tx.amount}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Allocation */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t('overview.allocation')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockAllocations.map((allocation) => (
                      <div key={allocation.category}>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-foreground-secondary">
                            {t(`allocationCategory.${allocation.category}`)}
                          </span>
                          <span className="font-mono text-foreground">{allocation.amount}</span>
                        </div>
                        <div className="mt-1 h-2 overflow-hidden rounded-full bg-background-tertiary">
                          <div
                            className="h-full bg-gold"
                            style={{ width: `${allocation.percentage}%` }}
                          />
                        </div>
                        <div className="mt-1 text-right text-xs text-foreground-tertiary">
                          {allocation.percentage}%
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Expenses Tab */}
          {activeTab === 'expenses' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">{t('expenses.title')}</CardTitle>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-tertiary" />
                    <input
                      type="text"
                      placeholder={t('search.placeholder')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="rounded-lg border border-surface-tertiary bg-background-secondary py-2 pl-10 pr-4 text-sm focus:border-gold focus:outline-none"
                    />
                  </div>
                  <Button variant="outline" size="sm" leftIcon={<Filter className="h-4 w-4" />}>
                    {t('filter')}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-surface-tertiary text-left text-xs text-foreground-tertiary">
                        <th className="pb-3 font-medium">{t('table.columns.id')}</th>
                        <th className="pb-3 font-medium">{t('table.columns.category')}</th>
                        <th className="pb-3 font-medium">{t('table.columns.description')}</th>
                        <th className="pb-3 font-medium">{t('table.columns.amount')}</th>
                        <th className="pb-3 font-medium">{t('table.columns.recipient')}</th>
                        <th className="pb-3 font-medium">{t('table.columns.status')}</th>
                        <th className="pb-3 font-medium">{t('table.columns.date')}</th>
                        <th className="pb-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransactions.map((tx) => (
                        <tr
                          key={tx.id}
                          className="border-b border-surface-tertiary/50 hover:bg-background-secondary/50"
                        >
                          <td className="py-4">
                            <span className="font-mono text-sm">{tx.id}</span>
                          </td>
                          <td className="py-4">{getCategoryBadge(tx.category)}</td>
                          <td className="py-4">
                            <span className="text-foreground">{tx.description}</span>
                          </td>
                          <td className="py-4">
                            <span className={cn(
                              'font-mono',
                              tx.type === 'income' ? 'text-success' : 'text-foreground'
                            )}>
                              {tx.amount}
                            </span>
                          </td>
                          <td className="py-4">
                            <span className="font-mono text-sm text-foreground-tertiary">
                              {tx.recipient}
                            </span>
                          </td>
                          <td className="py-4">{getStatusBadge(tx.status)}</td>
                          <td className="py-4">
                            <span className="text-sm text-foreground-secondary">{tx.date}</span>
                          </td>
                          <td className="py-4">
                            <Link
                              href={`/admin/public/treasury/transactions/${tx.id}`}
                              className="text-gold hover:underline"
                            >
                              {t('viewDetails')}
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Distribution Tab */}
          {activeTab === 'distribution' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('distribution.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-surface-tertiary">
                  <div className="text-center text-foreground-tertiary">
                    <PieChart className="mx-auto h-12 w-12" />
                    <p className="mt-2">{t('distribution.placeholder')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Audit Tab */}
          {activeTab === 'audit' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('audit.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-surface-tertiary">
                  <div className="text-center text-foreground-tertiary">
                    <FileText className="mx-auto h-12 w-12" />
                    <p className="mt-2">{t('audit.placeholder')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
