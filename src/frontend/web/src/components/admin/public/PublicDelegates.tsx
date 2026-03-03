'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useState } from 'react';
import {
  Users,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  Vote,
  Award,
  Target,
  CheckCircle,
  XCircle,
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
const DEFAULT_DELEGATES_DATA = {
  overview: {
    totalDelegates: '156',
    activeDelegates: '124',
    totalVotingPower: '28.5M QS',
    avgParticipation: '78%',
    delegationsThisMonth: '89',
    topDelegateShare: '12.5%',
  },
  delegates: [
    {
      id: 'del-001',
      address: '0x1a2b...3c4d',
      ensName: 'governance-lead.eth',
      votingPower: '3,500,000 QS',
      percentage: '12.3%',
      delegators: 245,
      proposalsVoted: 42,
      participationRate: 95,
      status: 'active',
    },
    {
      id: 'del-002',
      address: '0x5e6f...7g8h',
      ensName: 'community-voice.eth',
      votingPower: '2,800,000 QS',
      percentage: '9.8%',
      delegators: 189,
      proposalsVoted: 38,
      participationRate: 88,
      status: 'active',
    },
    {
      id: 'del-003',
      address: '0x9i0j...1k2l',
      ensName: 'protocol-expert.eth',
      votingPower: '2,100,000 QS',
      percentage: '7.4%',
      delegators: 156,
      proposalsVoted: 45,
      participationRate: 100,
      status: 'active',
    },
    {
      id: 'del-004',
      address: '0x3m4n...5o6p',
      ensName: null,
      votingPower: '1,850,000 QS',
      percentage: '6.5%',
      delegators: 98,
      proposalsVoted: 30,
      participationRate: 72,
      status: 'active',
    },
    {
      id: 'del-005',
      address: '0x7q8r...9s0t',
      ensName: 'defi-delegate.eth',
      votingPower: '1,500,000 QS',
      percentage: '5.3%',
      delegators: 134,
      proposalsVoted: 25,
      participationRate: 58,
      status: 'inactive',
    },
    {
      id: 'del-006',
      address: '0x1u2v...3w4x',
      ensName: 'security-expert.eth',
      votingPower: '1,200,000 QS',
      percentage: '4.2%',
      delegators: 87,
      proposalsVoted: 40,
      participationRate: 92,
      status: 'active',
    },
  ],
  recentDelegations: [
    { from: '0xab12...cd34', to: 'governance-lead.eth', amount: '50,000 QS', time: '2時間前' },
    { from: '0xef56...gh78', to: 'community-voice.eth', amount: '25,000 QS', time: '5時間前' },
    { from: '0xij90...kl12', to: 'protocol-expert.eth', amount: '100,000 QS', time: '8時間前' },
    { from: '0xmn34...op56', to: 'security-expert.eth', amount: '15,000 QS', time: '12時間前' },
  ],
};

export function PublicDelegates() {
  const t = useTranslations('admin.publicDelegates');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'inactive'>('all');

  const tabs = [
    { key: 'all', label: t('tabs.all'), count: DEFAULT_DELEGATES_DATA.delegates.length },
    { key: 'active', label: t('tabs.active'), count: DEFAULT_DELEGATES_DATA.delegates.filter(d => d.status === 'active').length },
    { key: 'inactive', label: t('tabs.inactive'), count: DEFAULT_DELEGATES_DATA.delegates.filter(d => d.status === 'inactive').length },
  ];

  const getParticipationBadge = (rate: number) => {
    if (rate >= 90) return <Badge variant="success">{rate}%</Badge>;
    if (rate >= 70) return <Badge variant="warning">{rate}%</Badge>;
    return <Badge variant="danger">{rate}%</Badge>;
  };

  const filteredDelegates = DEFAULT_DELEGATES_DATA.delegates.filter((delegate) => {
    const matchesSearch =
      delegate.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (delegate.ensName && delegate.ensName.toLowerCase().includes(searchQuery.toLowerCase()));

    if (activeTab === 'all') return matchesSearch;
    return matchesSearch && delegate.status === activeTab;
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
              label={t('stats.totalDelegates')}
              value={DEFAULT_DELEGATES_DATA.overview.totalDelegates}
              trend={{ value: '+8', direction: 'up' }}
              icon={<Users className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.activeDelegates')}
              value={DEFAULT_DELEGATES_DATA.overview.activeDelegates}
              subValue="79%"
              icon={<CheckCircle className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.totalVotingPower')}
              value={DEFAULT_DELEGATES_DATA.overview.totalVotingPower}
              icon={<Vote className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.avgParticipation')}
              value={DEFAULT_DELEGATES_DATA.overview.avgParticipation}
              icon={<Target className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.delegationsThisMonth')}
              value={DEFAULT_DELEGATES_DATA.overview.delegationsThisMonth}
              trend={{ value: '+23%', direction: 'up' }}
              icon={<TrendingUp className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.topDelegateShare')}
              value={DEFAULT_DELEGATES_DATA.overview.topDelegateShare}
              icon={<Award className="h-5 w-5" />}
              status="warning"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Delegates Table */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">{t('delegatesList.title')}</CardTitle>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-tertiary" />
                      <input
                        type="text"
                        placeholder={t('delegatesList.searchPlaceholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="rounded-lg border border-surface-tertiary bg-background-secondary py-2 pl-10 pr-4 text-sm focus:border-gold focus:outline-none"
                      />
                    </div>
                    <Button variant="outline" size="sm" leftIcon={<Filter className="h-4 w-4" />}>
                      {t('delegatesList.filter')}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Tabs */}
                  <div className="mb-4 flex gap-1 rounded-lg border border-surface-tertiary bg-background-secondary p-1">
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

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-surface-tertiary text-left text-xs text-foreground-tertiary">
                          <th className="pb-3 font-medium">{t('table.columns.delegate')}</th>
                          <th className="pb-3 text-right font-medium">{t('table.columns.votingPower')}</th>
                          <th className="pb-3 text-right font-medium">{t('table.columns.delegators')}</th>
                          <th className="pb-3 text-right font-medium">{t('table.columns.participation')}</th>
                          <th className="pb-3"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDelegates.map((delegate) => (
                          <tr
                            key={delegate.id}
                            className="border-b border-surface-tertiary/50 hover:bg-background-secondary/50"
                          >
                            <td className="py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/10">
                                  <Vote className="h-5 w-5 text-gold" />
                                </div>
                                <div>
                                  {delegate.ensName && (
                                    <div className="font-medium text-foreground">{delegate.ensName}</div>
                                  )}
                                  <div className="font-mono text-xs text-foreground-tertiary">
                                    {delegate.address}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 text-right">
                              <div className="font-mono font-medium">{delegate.votingPower}</div>
                              <div className="text-xs text-foreground-tertiary">{delegate.percentage}</div>
                            </td>
                            <td className="py-4 text-right">
                              <div className="font-medium">{delegate.delegators}</div>
                            </td>
                            <td className="py-4 text-right">
                              {getParticipationBadge(delegate.participationRate)}
                            </td>
                            <td className="py-4 text-right">
                              <Link
                                href={`/admin/public/delegates/${delegate.id}`}
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

            {/* Recent Delegations */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('recentDelegations.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {DEFAULT_DELEGATES_DATA.recentDelegations.map((delegation, index) => (
                    <div
                      key={index}
                      className="rounded-lg border border-surface-tertiary p-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-success" />
                          <span className="font-mono text-xs text-foreground-tertiary">
                            {delegation.from}
                          </span>
                        </div>
                        <span className="text-xs text-foreground-tertiary">{delegation.time}</span>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-sm">{t('recentDelegations.delegatedTo')}</span>
                        <span className="font-medium text-gold">{delegation.to}</span>
                      </div>
                      <div className="mt-1 text-sm font-mono font-medium">
                        {delegation.amount}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
