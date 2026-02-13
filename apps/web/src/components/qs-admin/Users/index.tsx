'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Users,
  UserCheck,
  UserPlus,
  Lock,
  Search,
  Filter,
  Download,
  ExternalLink,
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useUsersStats, useUsersList } from '@/hooks/admin/useUsers';
import type { UsersStats, User } from '@/lib/api/admin/types';


interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: { value: number; isPositive: boolean; label: string };
  href?: string;
}

function StatCard({ title, value, icon: Icon, trend, href }: StatCardProps) {
  const content = (
    <Card className={cn(href && 'hover:border-hinomaru/50 transition-colors cursor-pointer')}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-foreground-secondary">{title}</p>
            <p className="text-2xl font-bold mt-2">{value}</p>
            {trend && (
              <p className={cn(
                'text-xs mt-2 flex items-center',
                trend.isPositive ? 'text-success' : 'text-danger'
              )}>
                {trend.isPositive ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1" />
                )}
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

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

const STATUS_COLORS = {
  active: 'bg-success/10 text-success',
  inactive: 'bg-foreground-tertiary/10 text-foreground-tertiary',
  suspended: 'bg-danger/10 text-danger',
};

// Loading Skeleton
function UsersDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-6 w-48 bg-surface rounded animate-pulse" />
          <div className="h-4 w-32 bg-surface rounded animate-pulse mt-2" />
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
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-surface rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Error State
function UsersDashboardError({ onRetry }: { onRetry: () => void }) {
  const t = useTranslations('qsAdmin');
  return (
    <Card>
      <CardContent className="p-6">
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-danger mx-auto mb-4" />
          <p className="text-foreground-secondary mb-4">{t('common.error')}</p>
          <Button variant="outline" onClick={onRetry}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('common.retry')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function UsersDashboard() {
  const t = useTranslations('qsAdmin');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  // Fetch data using hooks
  const { data: apiStats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useUsersStats();
  const { data: usersData, isLoading: usersLoading, error: usersError, refetch: refetchUsers } = useUsersList();

  const isLoading = statsLoading || usersLoading;
  const hasError = statsError || usersError;

  const stats = apiStats;
  const users = usersData?.users ?? [];

  const filters = [
    { key: 'all', label: t('common.all') },
    { key: 'active', label: t('users.status.active') },
    { key: 'inactive', label: t('users.status.inactive') },
    { key: 'suspended', label: t('users.status.suspended') },
  ];

  const filteredUsers = users.filter(user => {
    if (activeFilter !== 'all' && user.status !== activeFilter) return false;
    if (searchQuery && !user.wallet.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  if (isLoading) {
    return <UsersDashboardSkeleton />;
  }

  // Show error when API fails and no data available
  if (hasError && !apiStats && !usersData) {
    return <UsersDashboardError onRetry={() => { refetchStats(); refetchUsers(); }} />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('users.title')}</h1>
          <p className="text-foreground-secondary">{t('users.subtitle')}</p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          {t('common.export')}
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('users.stats.totalUsers')}
          value={(stats?.totalUsers ?? 0).toLocaleString()}
          icon={Users}
          trend={{ value: 5.2, isPositive: true, label: t('common.trend.fromLastWeek') }}
        />
        <StatCard
          title={t('users.stats.activeUsers')}
          value={(stats?.activeUsers ?? 0).toLocaleString()}
          icon={UserCheck}
          trend={{ value: 3.1, isPositive: true, label: t('common.trend.fromLastWeek') }}
        />
        <StatCard
          title={t('users.stats.newUsers')}
          value={(stats?.newUsers ?? 0).toLocaleString()}
          icon={UserPlus}
          trend={{ value: 12.5, isPositive: true, label: t('common.trend.fromLastWeek') }}
        />
        <StatCard
          title={t('users.stats.lockedVolume')}
          value={stats?.lockedVolume ?? '0 ETH'}
          icon={Lock}
          trend={{ value: 8.3, isPositive: true, label: t('common.trend.fromLastWeek') }}
        />
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">{t('users.title')}</CardTitle>
          <div className="flex items-center space-x-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-tertiary" />
              <Input
                type="text"
                placeholder={t('common.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            {/* Filter */}
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filter Tabs */}
          <div className="flex space-x-2 mb-4 border-b border-border">
            {filters.map((filter) => (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                className={cn(
                  'px-4 py-3 min-h-[44px] text-sm font-medium border-b-2 -mb-px transition-colors',
                  activeFilter === filter.key
                    ? 'border-hinomaru text-hinomaru'
                    : 'border-transparent text-foreground-secondary hover:text-foreground'
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('users.table.wallet')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('users.table.joined')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('users.table.lastActive')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('users.table.locked')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('users.table.status')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('users.table.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-border hover:bg-surface transition-colors"
                  >
                    <td className="py-3 px-4">
                      <code className="text-sm font-mono">{user.wallet}</code>
                    </td>
                    <td className="py-3 px-4 text-foreground-secondary">{user.joined}</td>
                    <td className="py-3 px-4 text-foreground-secondary">{user.lastActive}</td>
                    <td className="py-3 px-4 font-medium">{user.locked}</td>
                    <td className="py-3 px-4">
                      <span className={cn(
                        'inline-flex items-center px-2 py-1 rounded-md text-xs font-medium',
                        STATUS_COLORS[user.status as keyof typeof STATUS_COLORS]
                      )}>
                        {t(`status.${user.status}`)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-foreground-secondary">
              {t('users.empty')}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
