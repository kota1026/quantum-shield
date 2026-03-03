'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useState } from 'react';
import {
  Eye,
  ChevronRight,
  TrendingUp,
  Search,
  Filter,
  Shield,
  AlertTriangle,
  CheckCircle,
  Activity,
  Server,
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
const DEFAULT_OBSERVERS_DATA = {
  overview: {
    totalObservers: '12',
    activeObservers: '10',
    challengesThisMonth: '3',
    avgResponseTime: '45s',
    detectionRate: '99.8%',
    falsePositiveRate: '0.1%',
  },
  observers: [
    {
      id: 'obs-001',
      name: 'QS-Observer-Tokyo-01',
      region: 'Tokyo',
      status: 'active',
      monitoredTransactions: '125,456',
      challengesIssued: 2,
      uptime: 99.99,
      lastActivity: '5秒前',
    },
    {
      id: 'obs-002',
      name: 'QS-Observer-Tokyo-02',
      region: 'Tokyo',
      status: 'active',
      monitoredTransactions: '118,234',
      challengesIssued: 1,
      uptime: 99.95,
      lastActivity: '12秒前',
    },
    {
      id: 'obs-003',
      name: 'QS-Observer-Singapore-01',
      region: 'Singapore',
      status: 'active',
      monitoredTransactions: '98,567',
      challengesIssued: 0,
      uptime: 99.98,
      lastActivity: '3秒前',
    },
    {
      id: 'obs-004',
      name: 'QS-Observer-Frankfurt-01',
      region: 'Frankfurt',
      status: 'degraded',
      monitoredTransactions: '89,123',
      challengesIssued: 0,
      uptime: 98.50,
      lastActivity: '2分前',
    },
    {
      id: 'obs-005',
      name: 'QS-Observer-Virginia-01',
      region: 'Virginia',
      status: 'active',
      monitoredTransactions: '156,789',
      challengesIssued: 0,
      uptime: 99.97,
      lastActivity: '8秒前',
    },
    {
      id: 'obs-006',
      name: 'QS-Observer-Backup-01',
      region: 'Tokyo',
      status: 'standby',
      monitoredTransactions: '0',
      challengesIssued: 0,
      uptime: 100,
      lastActivity: 'スタンバイ',
    },
  ],
};

export function SaasObservers() {
  const t = useTranslations('admin.saasObservers');
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'degraded' | 'standby'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const tabs = [
    { key: 'all', label: t('tabs.all'), count: DEFAULT_OBSERVERS_DATA.observers.length },
    { key: 'active', label: t('tabs.active'), count: DEFAULT_OBSERVERS_DATA.observers.filter(o => o.status === 'active').length },
    { key: 'degraded', label: t('tabs.degraded'), count: DEFAULT_OBSERVERS_DATA.observers.filter(o => o.status === 'degraded').length },
    { key: 'standby', label: t('tabs.standby'), count: DEFAULT_OBSERVERS_DATA.observers.filter(o => o.status === 'standby').length },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">{t('status.active')}</Badge>;
      case 'degraded':
        return <Badge variant="warning">{t('status.degraded')}</Badge>;
      case 'standby':
        return <Badge variant="default">{t('status.standby')}</Badge>;
      default:
        return null;
    }
  };

  const filteredObservers = DEFAULT_OBSERVERS_DATA.observers.filter((observer) => {
    const matchesSearch = observer.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === 'all') return matchesSearch;
    return matchesSearch && observer.status === activeTab;
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
              <Link href="/admin/saas/operators" className="hover:text-foreground">
                SaaS
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
              label={t('stats.totalObservers')}
              value={DEFAULT_OBSERVERS_DATA.overview.totalObservers}
              icon={<Eye className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.activeObservers')}
              value={DEFAULT_OBSERVERS_DATA.overview.activeObservers}
              subValue="83%"
              icon={<CheckCircle className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.challengesThisMonth')}
              value={DEFAULT_OBSERVERS_DATA.overview.challengesThisMonth}
              icon={<AlertTriangle className="h-5 w-5" />}
              status="warning"
            />
            <StatCard
              label={t('stats.avgResponseTime')}
              value={DEFAULT_OBSERVERS_DATA.overview.avgResponseTime}
              icon={<Activity className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.detectionRate')}
              value={DEFAULT_OBSERVERS_DATA.overview.detectionRate}
              icon={<Shield className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.falsePositiveRate')}
              value={DEFAULT_OBSERVERS_DATA.overview.falsePositiveRate}
              icon={<Server className="h-5 w-5" />}
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

          {/* Observer List */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">{t('observerList.title')}</CardTitle>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-tertiary" />
                  <input
                    type="text"
                    placeholder={t('observerList.searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="rounded-lg border border-surface-tertiary bg-background-secondary py-2 pl-10 pr-4 text-sm focus:border-gold focus:outline-none"
                  />
                </div>
                <Button variant="outline" size="sm" leftIcon={<Filter className="h-4 w-4" />}>
                  {t('observerList.filter')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-surface-tertiary text-left text-xs text-foreground-tertiary">
                      <th className="pb-3 font-medium">{t('table.columns.observer')}</th>
                      <th className="pb-3 font-medium">{t('table.columns.region')}</th>
                      <th className="pb-3 font-medium">{t('table.columns.status')}</th>
                      <th className="pb-3 text-right font-medium">{t('table.columns.monitored')}</th>
                      <th className="pb-3 text-right font-medium">{t('table.columns.challenges')}</th>
                      <th className="pb-3 text-right font-medium">{t('table.columns.uptime')}</th>
                      <th className="pb-3 font-medium">{t('table.columns.lastActivity')}</th>
                      <th className="pb-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredObservers.map((observer) => (
                      <tr
                        key={observer.id}
                        className="border-b border-surface-tertiary/50 hover:bg-background-secondary/50"
                      >
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              'flex h-10 w-10 items-center justify-center rounded-full',
                              observer.status === 'active' && 'bg-success/10',
                              observer.status === 'degraded' && 'bg-warning/10',
                              observer.status === 'standby' && 'bg-foreground-tertiary/10'
                            )}>
                              <Eye className={cn(
                                'h-5 w-5',
                                observer.status === 'active' && 'text-success',
                                observer.status === 'degraded' && 'text-warning',
                                observer.status === 'standby' && 'text-foreground-tertiary'
                              )} />
                            </div>
                            <span className="font-medium">{observer.name}</span>
                          </div>
                        </td>
                        <td className="py-4">
                          <Badge variant="default">{observer.region}</Badge>
                        </td>
                        <td className="py-4">{getStatusBadge(observer.status)}</td>
                        <td className="py-4 text-right font-mono">{observer.monitoredTransactions}</td>
                        <td className="py-4 text-right">
                          {observer.challengesIssued > 0 ? (
                            <Badge variant="warning">{observer.challengesIssued}</Badge>
                          ) : (
                            <span className="text-foreground-tertiary">0</span>
                          )}
                        </td>
                        <td className="py-4 text-right">
                          <span className={cn(
                            observer.uptime >= 99.9 ? 'text-success' :
                            observer.uptime >= 99 ? 'text-warning' : 'text-danger'
                          )}>
                            {observer.uptime}%
                          </span>
                        </td>
                        <td className="py-4 text-sm text-foreground-secondary">{observer.lastActivity}</td>
                        <td className="py-4">
                          <Link
                            href={`/admin/saas/observers/${observer.id}`}
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
