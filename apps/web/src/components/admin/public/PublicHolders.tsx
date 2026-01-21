'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useState } from 'react';
import {
  Coins,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  PieChart,
  BarChart3,
  Users,
  Wallet,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AdminSidebarV2 } from '../AdminSidebarV2';

interface StatCardProps {
  label: string;
  value: string;
  subValue?: string;
  trend?: { value: string; direction: 'up' | 'down' };
  icon: React.ReactNode;
  status?: 'success' | 'warning' | 'danger';
}

function StatCard({ label, value, subValue, trend, icon, status = 'success' }: StatCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={cn(
          'flex h-10 w-10 items-center justify-center rounded-lg',
          status === 'success' && 'bg-success/10 text-success',
          status === 'warning' && 'bg-warning/10 text-warning',
          status === 'danger' && 'bg-danger/10 text-danger'
        )}>
          {icon}
        </div>
        <div className="flex-1">
          <div className="text-xs text-foreground-tertiary">{label}</div>
          <div className="flex items-center gap-2">
            <div className="text-xl font-bold text-foreground">{value}</div>
            {trend && (
              <span className={cn(
                'flex items-center text-xs',
                trend.direction === 'up' ? 'text-success' : 'text-danger'
              )}>
                {trend.direction === 'up' ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {trend.value}
              </span>
            )}
          </div>
          {subValue && <div className="text-xs text-foreground-secondary">{subValue}</div>}
        </div>
      </div>
    </Card>
  );
}

// Mock data
const mockHoldersData = {
  overview: {
    totalHolders: '12,456',
    totalSupply: '100M QS',
    circulatingSupply: '45M QS',
    topHoldersShare: '32.5%',
    avgHolding: '3,612 QS',
    medianHolding: '850 QS',
  },
  distribution: [
    { range: '> 1M QS', holders: 12, percentage: 18.5, color: 'gold' },
    { range: '100K - 1M QS', holders: 89, percentage: 22.3, color: 'success' },
    { range: '10K - 100K QS', holders: 456, percentage: 28.7, color: 'warning' },
    { range: '1K - 10K QS', holders: 2345, percentage: 18.2, color: 'foreground-secondary' },
    { range: '< 1K QS', holders: 9554, percentage: 12.3, color: 'foreground-tertiary' },
  ],
  topHolders: [
    { rank: 1, address: '0x1a2b...3c4d', ensName: 'qs-treasury.eth', balance: '15,000,000 QS', percentage: '15.0%', type: 'treasury' },
    { rank: 2, address: '0x5e6f...7g8h', ensName: 'staking-pool.eth', balance: '8,500,000 QS', percentage: '8.5%', type: 'staking' },
    { rank: 3, address: '0x9i0j...1k2l', ensName: 'whale001.eth', balance: '3,200,000 QS', percentage: '3.2%', type: 'whale' },
    { rank: 4, address: '0x3m4n...5o6p', ensName: null, balance: '2,800,000 QS', percentage: '2.8%', type: 'whale' },
    { rank: 5, address: '0x7q8r...9s0t', ensName: 'defi-protocol.eth', balance: '2,100,000 QS', percentage: '2.1%', type: 'protocol' },
    { rank: 6, address: '0x1u2v...3w4x', ensName: null, balance: '1,850,000 QS', percentage: '1.85%', type: 'whale' },
    { rank: 7, address: '0x5y6z...7a8b', ensName: 'investor.eth', balance: '1,500,000 QS', percentage: '1.5%', type: 'investor' },
    { rank: 8, address: '0x9c0d...1e2f', ensName: null, balance: '1,200,000 QS', percentage: '1.2%', type: 'whale' },
    { rank: 9, address: '0x3g4h...5i6j', ensName: 'dao-member.eth', balance: '980,000 QS', percentage: '0.98%', type: 'dao' },
    { rank: 10, address: '0x7k8l...9m0n', ensName: null, balance: '850,000 QS', percentage: '0.85%', type: 'whale' },
  ],
};

export function PublicHolders() {
  const t = useTranslations('admin.publicHolders');
  const [searchQuery, setSearchQuery] = useState('');

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'treasury':
        return <Badge variant="gold">{t('holderTypes.treasury')}</Badge>;
      case 'staking':
        return <Badge variant="success">{t('holderTypes.staking')}</Badge>;
      case 'whale':
        return <Badge variant="default">{t('holderTypes.whale')}</Badge>;
      case 'protocol':
        return <Badge variant="warning">{t('holderTypes.protocol')}</Badge>;
      case 'investor':
        return <Badge variant="default">{t('holderTypes.investor')}</Badge>;
      case 'dao':
        return <Badge variant="success">{t('holderTypes.dao')}</Badge>;
      default:
        return null;
    }
  };

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
              <Link href="/admin/public/users" className="hover:text-foreground">
                Public
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground">{t('breadcrumb')}</span>
            </div>
            <h1 className="mt-2 text-3xl font-bold text-foreground">{t('title')}</h1>
            <p className="mt-1 text-sm text-foreground-secondary">{t('subtitle')}</p>
          </div>

          {/* Stats */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
            <StatCard
              label={t('stats.totalHolders')}
              value={mockHoldersData.overview.totalHolders}
              trend={{ value: '+3.2%', direction: 'up' }}
              icon={<Users className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.totalSupply')}
              value={mockHoldersData.overview.totalSupply}
              icon={<Coins className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.circulatingSupply')}
              value={mockHoldersData.overview.circulatingSupply}
              subValue="45%"
              icon={<PieChart className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.topHoldersShare')}
              value={mockHoldersData.overview.topHoldersShare}
              subValue={t('stats.top10')}
              icon={<BarChart3 className="h-5 w-5" />}
              status="warning"
            />
            <StatCard
              label={t('stats.avgHolding')}
              value={mockHoldersData.overview.avgHolding}
              icon={<Wallet className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.medianHolding')}
              value={mockHoldersData.overview.medianHolding}
              icon={<BarChart3 className="h-5 w-5" />}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Distribution Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('distribution.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockHoldersData.distribution.map((item, index) => (
                    <div key={index}>
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            'h-3 w-3 rounded-full',
                            item.color === 'gold' && 'bg-gold',
                            item.color === 'success' && 'bg-success',
                            item.color === 'warning' && 'bg-warning',
                            item.color === 'foreground-secondary' && 'bg-foreground-secondary',
                            item.color === 'foreground-tertiary' && 'bg-foreground-tertiary'
                          )} />
                          <span className="text-sm text-foreground">{item.range}</span>
                        </div>
                        <span className="text-sm font-medium">{item.holders.toLocaleString()}</span>
                      </div>
                      <div className="h-2 rounded-full bg-background-secondary">
                        <div
                          className={cn(
                            'h-2 rounded-full',
                            item.color === 'gold' && 'bg-gold',
                            item.color === 'success' && 'bg-success',
                            item.color === 'warning' && 'bg-warning',
                            item.color === 'foreground-secondary' && 'bg-foreground-secondary',
                            item.color === 'foreground-tertiary' && 'bg-foreground-tertiary'
                          )}
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                      <div className="mt-1 text-right text-xs text-foreground-tertiary">
                        {item.percentage}% {t('distribution.ofSupply')}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Holders Table */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">{t('topHolders.title')}</CardTitle>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-tertiary" />
                      <input
                        type="text"
                        placeholder={t('topHolders.searchPlaceholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="rounded-lg border border-surface-tertiary bg-background-secondary py-2 pl-10 pr-4 text-sm focus:border-gold focus:outline-none"
                      />
                    </div>
                    <Button variant="outline" size="sm" leftIcon={<Filter className="h-4 w-4" />}>
                      {t('topHolders.filter')}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-surface-tertiary text-left text-xs text-foreground-tertiary">
                          <th className="pb-3 font-medium">{t('table.columns.rank')}</th>
                          <th className="pb-3 font-medium">{t('table.columns.address')}</th>
                          <th className="pb-3 font-medium">{t('table.columns.type')}</th>
                          <th className="pb-3 text-right font-medium">{t('table.columns.balance')}</th>
                          <th className="pb-3 text-right font-medium">{t('table.columns.share')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mockHoldersData.topHolders.map((holder) => (
                          <tr
                            key={holder.rank}
                            className="border-b border-surface-tertiary/50 hover:bg-background-secondary/50"
                          >
                            <td className="py-3">
                              <div className={cn(
                                'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
                                holder.rank <= 3 ? 'bg-gold/20 text-gold' : 'bg-background-secondary text-foreground-tertiary'
                              )}>
                                {holder.rank}
                              </div>
                            </td>
                            <td className="py-3">
                              <div>
                                {holder.ensName && (
                                  <div className="font-medium text-foreground">{holder.ensName}</div>
                                )}
                                <div className="font-mono text-xs text-foreground-tertiary">
                                  {holder.address}
                                </div>
                              </div>
                            </td>
                            <td className="py-3">{getTypeBadge(holder.type)}</td>
                            <td className="py-3 text-right font-mono text-sm font-medium">
                              {holder.balance}
                            </td>
                            <td className="py-3 text-right text-sm text-foreground-secondary">
                              {holder.percentage}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4 flex justify-center">
                    <Button variant="outline" size="sm">
                      {t('topHolders.viewAll')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
