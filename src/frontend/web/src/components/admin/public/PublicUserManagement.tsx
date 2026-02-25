'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  ChevronRight,
  Shield,
  Wallet,
  Clock,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
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
                <TrendingUp className={cn('h-3 w-3', trend.direction === 'down' && 'rotate-180')} />
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
const mockUsers = [
  {
    id: 'user-001',
    address: '0x7a3f...9c2d',
    ensName: 'tanaka.eth',
    status: 'active',
    totalLocked: '12.5 ETH',
    totalLockedUsd: '$31,250',
    activeLocks: 3,
    registeredAt: '2025-10-15',
    lastActivity: '2分前',
  },
  {
    id: 'user-002',
    address: '0x3b1c...f8a7',
    ensName: null,
    status: 'active',
    totalLocked: '8.2 ETH',
    totalLockedUsd: '$20,500',
    activeLocks: 2,
    registeredAt: '2025-11-20',
    lastActivity: '15分前',
  },
  {
    id: 'user-003',
    address: '0x9d2e...1f4b',
    ensName: 'yamamoto.eth',
    status: 'pending_unlock',
    totalLocked: '25.0 ETH',
    totalLockedUsd: '$62,500',
    activeLocks: 1,
    registeredAt: '2025-09-05',
    lastActivity: '1時間前',
  },
  {
    id: 'user-004',
    address: '0x5e8f...2a3c',
    ensName: null,
    status: 'active',
    totalLocked: '5.8 ETH',
    totalLockedUsd: '$14,500',
    activeLocks: 1,
    registeredAt: '2025-12-01',
    lastActivity: '30分前',
  },
  {
    id: 'user-005',
    address: '0x1d4a...7b9e',
    ensName: 'suzuki.eth',
    status: 'flagged',
    totalLocked: '45.0 ETH',
    totalLockedUsd: '$112,500',
    activeLocks: 5,
    registeredAt: '2025-08-10',
    lastActivity: '3時間前',
  },
];

const mockMetrics = {
  totalUsers: 4523,
  activeUsers: 3891,
  totalTvl: '45.2M',
  avgLockAmount: '8.5 ETH',
  pendingUnlocks: 156,
};

export function PublicUserManagement() {
  const t = useTranslations('admin.publicUsers');
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'pending' | 'flagged'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const tabs = [
    { key: 'all', label: t('tabs.all'), count: mockUsers.length },
    { key: 'active', label: t('tabs.active'), count: mockUsers.filter(u => u.status === 'active').length },
    { key: 'pending', label: t('tabs.pending'), count: mockUsers.filter(u => u.status === 'pending_unlock').length },
    { key: 'flagged', label: t('tabs.flagged'), count: mockUsers.filter(u => u.status === 'flagged').length },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">{t('status.active')}</Badge>;
      case 'pending_unlock':
        return <Badge variant="warning">{t('status.pendingUnlock')}</Badge>;
      case 'flagged':
        return <Badge variant="danger">{t('status.flagged')}</Badge>;
      default:
        return null;
    }
  };

  const filteredUsers = mockUsers.filter((user) => {
    const matchesSearch =
      user.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.ensName && user.ensName.toLowerCase().includes(searchQuery.toLowerCase()));

    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'active') return matchesSearch && user.status === 'active';
    if (activeTab === 'pending') return matchesSearch && user.status === 'pending_unlock';
    if (activeTab === 'flagged') return matchesSearch && user.status === 'flagged';
    return matchesSearch;
  });

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
              <span className="text-foreground">{t('breadcrumb')}</span>
            </div>
            <h1 className="mt-2 text-3xl font-bold text-foreground">{t('title')}</h1>
            <p className="mt-1 text-sm text-foreground-secondary">{t('subtitle')}</p>
          </div>

          {/* Stats */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard
              label={t('stats.totalUsers')}
              value={mockMetrics.totalUsers.toLocaleString()}
              trend={{ value: '+5.2%', direction: 'up' }}
              icon={<Users className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.activeUsers')}
              value={mockMetrics.activeUsers.toLocaleString()}
              subValue="86%"
              icon={<CheckCircle className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.totalTvl')}
              value={`$${mockMetrics.totalTvl}`}
              trend={{ value: '+12.3%', direction: 'up' }}
              icon={<Wallet className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.avgLockAmount')}
              value={mockMetrics.avgLockAmount}
              icon={<Lock className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.pendingUnlocks')}
              value={String(mockMetrics.pendingUnlocks)}
              icon={<Clock className="h-5 w-5" />}
              status="warning"
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
                <Badge size="sm" variant={activeTab === tab.key ? 'gold' : 'default'}>
                  {tab.count}
                </Badge>
              </button>
            ))}
          </div>

          {/* User List */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">{t('userList.title')}</CardTitle>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-tertiary" />
                  <input
                    type="text"
                    placeholder={t('userList.searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="rounded-lg border border-surface-tertiary bg-background-secondary py-2 pl-10 pr-4 text-sm focus:border-gold focus:outline-none"
                  />
                </div>
                <Button variant="outline" size="sm" leftIcon={<Filter className="h-4 w-4" />}>
                  {t('userList.filter')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-surface-tertiary text-left text-xs text-foreground-tertiary">
                      <th className="pb-3 font-medium">{t('table.columns.user')}</th>
                      <th className="pb-3 font-medium">{t('table.columns.status')}</th>
                      <th className="pb-3 font-medium">{t('table.columns.totalLocked')}</th>
                      <th className="pb-3 font-medium">{t('table.columns.activeLocks')}</th>
                      <th className="pb-3 font-medium">{t('table.columns.registeredAt')}</th>
                      <th className="pb-3 font-medium">{t('table.columns.lastActivity')}</th>
                      <th className="pb-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr
                        key={user.id}
                        className="border-b border-surface-tertiary/50 hover:bg-background-secondary/50"
                      >
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/10">
                              <Users className="h-5 w-5 text-gold" />
                            </div>
                            <div>
                              {user.ensName && (
                                <div className="font-medium text-foreground">{user.ensName}</div>
                              )}
                              <div className="font-mono text-xs text-foreground-tertiary">
                                {user.address}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4">{getStatusBadge(user.status)}</td>
                        <td className="py-4">
                          <div className="font-mono font-medium text-foreground">{user.totalLocked}</div>
                          <div className="text-xs text-foreground-tertiary">{user.totalLockedUsd}</div>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <Lock className="h-4 w-4 text-foreground-tertiary" />
                            <span>{user.activeLocks}</span>
                          </div>
                        </td>
                        <td className="py-4 text-sm text-foreground-secondary">{user.registeredAt}</td>
                        <td className="py-4 text-sm text-foreground-secondary">{user.lastActivity}</td>
                        <td className="py-4">
                          <Link
                            href={`/admin/public/users/${user.id}`}
                            className="text-gold hover:underline"
                          >
                            {t('table.viewDetail')}
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
