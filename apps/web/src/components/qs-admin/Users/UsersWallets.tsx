'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Wallet,
  Search,
  Filter,
  Download,
  ExternalLink,
  ArrowLeft,
  Lock,
  Unlock,
  TrendingUp,
  Copy,
  Eye,
  Clock,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useWalletsStats, useWalletsList } from '@/hooks/admin/useUsers';
import {
  MOCK_WALLETS_STATS,
  MOCK_USER_WALLETS,
  type WalletsStats,
  type UserWallet,
} from '@/lib/api/admin/mock';

// Fallback data
const FALLBACK_STATS = MOCK_WALLETS_STATS;
const FALLBACK_WALLETS = MOCK_USER_WALLETS;

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: { value: number; isPositive: boolean; label: string };
}

function StatCard({ title, value, icon: Icon, trend }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-foreground-secondary">{title}</p>
            <p className="text-2xl font-bold mt-2">{value}</p>
            {trend && (
              <p className={cn('text-xs mt-2 flex items-center', trend.isPositive ? 'text-success' : 'text-danger')}>
                <TrendingUp className={cn('h-3 w-3 mr-1', !trend.isPositive && 'rotate-180')} />
                {trend.isPositive ? '+' : ''}{trend.value}% {trend.label}
              </p>
            )}
          </div>
          <div className="h-12 w-12 rounded-lg bg-hinomaru/10 flex items-center justify-center">
            <Icon className="h-6 w-6 text-hinomaru" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Loading Skeleton
function UsersWalletsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="h-10 w-10 bg-surface rounded animate-pulse" />
          <div>
            <div className="h-6 w-48 bg-surface rounded animate-pulse" />
            <div className="h-4 w-32 bg-surface rounded animate-pulse mt-2" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-20 bg-surface rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-16 bg-surface rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Error State
function UsersWalletsError({ onRetry }: { onRetry: () => void }) {
  const t = useTranslations('qsAdmin.common');
  return (
    <Card>
      <CardContent className="p-6">
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-danger mx-auto mb-4" />
          <p className="text-foreground-secondary mb-4">{t('error')}</p>
          <Button variant="outline" onClick={onRetry}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('retry')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function UsersWallets() {
  const t = useTranslations('qsAdmin.users');
  const tCommon = useTranslations('qsAdmin.common');
  const [searchQuery, setSearchQuery] = useState('');
  const [lockFilter, setLockFilter] = useState('all');

  // Fetch data using hooks
  const { data: apiStats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useWalletsStats();
  const { data: walletsData, isLoading: walletsLoading, error: walletsError, refetch: refetchWallets } = useWalletsList();

  const isLoading = statsLoading || walletsLoading;
  const hasError = statsError || walletsError;

  // Use API data with fallback
  const stats = apiStats ?? FALLBACK_STATS;
  const wallets = walletsData?.wallets ?? FALLBACK_WALLETS;

  const lockFilters = [
    { key: 'all', label: t('userWallets.filters.all') },
    { key: 'withLocks', label: t('userWallets.filters.withLocks') },
    { key: 'withUnlocking', label: t('userWallets.filters.withUnlocking') },
    { key: 'empty', label: t('userWallets.filters.empty') },
  ];

  const filteredWallets = wallets.filter(wallet => {
    if (lockFilter === 'withLocks' && wallet.locked === '0 ETH') return false;
    if (lockFilter === 'withUnlocking' && wallet.unlocking === '0 ETH') return false;
    if (lockFilter === 'empty' && wallet.locked !== '0 ETH') return false;
    if (searchQuery && !wallet.address.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !wallet.shortAddress.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
  };

  if (isLoading) {
    return <UsersWalletsSkeleton />;
  }

  if (hasError && !apiStats && !walletsData) {
    return <UsersWalletsError onRetry={() => { refetchStats(); refetchWallets(); }} />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/qs-admin/users">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('userWallets.title')}</h1>
            <p className="text-foreground-secondary">{t('userWallets.subtitle')}</p>
          </div>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          {tCommon('export')}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={t('userWallets.stats.totalWallets')} value={stats.totalWallets.toLocaleString()} icon={Wallet} trend={{ value: 5.2, isPositive: true, label: tCommon('trend.fromLastWeek') }} />
        <StatCard title={t('userWallets.stats.walletsWithLocks')} value={stats.walletsWithLocks.toLocaleString()} icon={Lock} />
        <StatCard title={t('userWallets.stats.totalLocked')} value={stats.totalLocked} icon={Lock} trend={{ value: 8.3, isPositive: true, label: tCommon('trend.fromLastWeek') }} />
        <StatCard title={t('userWallets.stats.avgLockAmount')} value={stats.avgLockAmount} icon={Wallet} />
      </div>

      {/* Wallets Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">{t('userWallets.listTitle')} ({filteredWallets.length})</CardTitle>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-tertiary" />
              <Input type="text" placeholder={t('userWallets.searchPlaceholder')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 w-72" />
            </div>
            <Button variant="outline" size="icon"><Filter className="h-4 w-4" /></Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filter Tabs */}
          <div className="flex space-x-2 mb-4 border-b border-border">
            {lockFilters.map((filter) => (
              <button key={filter.key} onClick={() => setLockFilter(filter.key)} className={cn('px-4 py-3 min-h-[44px] text-sm font-medium border-b-2 -mb-px transition-colors', lockFilter === filter.key ? 'border-hinomaru text-hinomaru' : 'border-transparent text-foreground-secondary hover:text-foreground')}>
                {filter.label}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('userWallets.table.walletAddress')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('userWallets.table.locked')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('userWallets.table.unlocking')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('userWallets.table.pending')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('userWallets.table.transactions')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('userWallets.table.lastActivity')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('userWallets.table.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredWallets.map((wallet) => (
                  <tr key={wallet.address} className="border-b border-border hover:bg-surface transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <Wallet className="h-4 w-4 text-foreground-tertiary" />
                        <code className="text-sm font-mono">{wallet.shortAddress}</code>
                        <button onClick={() => copyAddress(wallet.address)} className="text-foreground-tertiary hover:text-foreground">
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {wallet.locked !== '0 ETH' ? (
                        <div className="flex items-center space-x-2">
                          <Lock className="h-4 w-4 text-success" />
                          <span className="font-medium text-success">{wallet.locked}</span>
                        </div>
                      ) : (
                        <span className="text-foreground-tertiary">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {wallet.unlocking !== '0 ETH' ? (
                        <div className="flex items-center space-x-2">
                          <Unlock className="h-4 w-4 text-warning" />
                          <span className="font-medium text-warning">{wallet.unlocking}</span>
                        </div>
                      ) : (
                        <span className="text-foreground-tertiary">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {wallet.pendingUnlocks > 0 ? (
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-info" />
                          <span className="text-info font-medium">{wallet.pendingUnlocks}</span>
                        </div>
                      ) : (
                        <span className="text-foreground-tertiary">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-foreground-secondary">{wallet.totalTx}</td>
                    <td className="py-3 px-4 text-sm text-foreground-secondary">{wallet.lastTx}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1">
                        <Button variant="ghost" size="sm" title={t('userWallets.actions.viewDetails')}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" title={t('userWallets.actions.viewOnEtherscan')}>
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredWallets.length === 0 && (
            <div className="text-center py-8 text-foreground-secondary">{t('userWallets.noWalletsFound')}</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
