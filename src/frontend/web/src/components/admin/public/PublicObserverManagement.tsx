'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useState } from 'react';
import {
  Eye,
  Search,
  Filter,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  Wallet,
  Award,
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
const SAMPLE_OBSERVERS = [
  {
    id: 'obs-001',
    operator: 'Watchdog Labs',
    address: '0x4a2f...8b1c',
    status: 'active',
    challengesSubmitted: 145,
    successfulChallenges: 12,
    totalRewards: '2,340 QS',
    lastActive: '3分前',
  },
  {
    id: 'obs-002',
    operator: 'Sentinel Network',
    address: '0x7c3d...2e5f',
    status: 'active',
    challengesSubmitted: 89,
    successfulChallenges: 8,
    totalRewards: '1,560 QS',
    lastActive: '1分前',
  },
  {
    id: 'obs-003',
    operator: 'Guardian Protocol',
    address: '0x9e1a...4f7b',
    status: 'active',
    challengesSubmitted: 234,
    successfulChallenges: 21,
    totalRewards: '4,120 QS',
    lastActive: '5分前',
  },
  {
    id: 'obs-004',
    operator: 'Aegis Watch',
    address: '0x2b8c...6d9e',
    status: 'inactive',
    challengesSubmitted: 45,
    successfulChallenges: 3,
    totalRewards: '580 QS',
    lastActive: '2日前',
  },
];

const SAMPLE_CHALLENGES = [
  {
    id: 'ch-001',
    observer: 'Watchdog Labs',
    target: 'prover-042',
    reason: 'Invalid signature detected',
    status: 'pending',
    submittedAt: '2026-01-18 10:32',
    reward: '50 QS',
  },
  {
    id: 'ch-002',
    observer: 'Guardian Protocol',
    target: 'prover-089',
    reason: 'SLA violation - response timeout',
    status: 'verified',
    submittedAt: '2026-01-17 14:15',
    reward: '75 QS',
  },
  {
    id: 'ch-003',
    observer: 'Sentinel Network',
    target: 'prover-023',
    reason: 'Duplicate signature submission',
    status: 'rejected',
    submittedAt: '2026-01-17 09:45',
    reward: '0 QS',
  },
];

export function PublicObserverManagement() {
  const t = useTranslations('admin.publicObservers');
  const [activeTab, setActiveTab] = useState<'all' | 'challenges' | 'rewards'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const tabs = [
    { key: 'all', label: t('tabs.all'), count: SAMPLE_OBSERVERS.length },
    { key: 'challenges', label: t('tabs.challenges'), count: SAMPLE_CHALLENGES.filter(c => c.status === 'pending').length },
    { key: 'rewards', label: t('tabs.rewards') },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">{t('status.active')}</Badge>;
      case 'inactive':
        return <Badge variant="default">{t('status.inactive')}</Badge>;
      case 'pending':
        return <Badge variant="warning">{t('challengeStatus.pending')}</Badge>;
      case 'verified':
        return <Badge variant="success">{t('challengeStatus.verified')}</Badge>;
      case 'rejected':
        return <Badge variant="danger">{t('challengeStatus.rejected')}</Badge>;
      default:
        return null;
    }
  };

  const filteredObservers = SAMPLE_OBSERVERS.filter(
    (obs) =>
      obs.operator.toLowerCase().includes(searchQuery.toLowerCase()) ||
      obs.address.toLowerCase().includes(searchQuery.toLowerCase())
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
              label={t('stats.totalObservers')}
              value="42"
              icon={<Eye className="h-5 w-5" />}
              status="info"
            />
            <StatCard
              label={t('stats.activeObservers')}
              value="38"
              subValue="90.5%"
              icon={<CheckCircle className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.pendingChallenges')}
              value="3"
              icon={<Clock className="h-5 w-5" />}
              status="warning"
            />
            <StatCard
              label={t('stats.successfulChallenges')}
              value="156"
              subValue="Today: +5"
              icon={<Award className="h-5 w-5" />}
              status="success"
            />
            <StatCard
              label={t('stats.totalRewards')}
              value="45,230 QS"
              icon={<Wallet className="h-5 w-5" />}
              status="info"
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
                  <Badge size="sm" variant={activeTab === tab.key ? 'gold' : tab.key === 'challenges' ? 'warning' : 'default'}>
                    {tab.count}
                  </Badge>
                )}
              </button>
            ))}
          </div>

          {/* All Observers Tab */}
          {activeTab === 'all' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">{t('observerList.title')}</CardTitle>
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
                        <th className="pb-3 font-medium">{t('table.columns.observerId')}</th>
                        <th className="pb-3 font-medium">{t('table.columns.operator')}</th>
                        <th className="pb-3 font-medium">{t('table.columns.status')}</th>
                        <th className="pb-3 font-medium">{t('table.columns.challenges')}</th>
                        <th className="pb-3 font-medium">{t('table.columns.successRate')}</th>
                        <th className="pb-3 font-medium">{t('table.columns.rewards')}</th>
                        <th className="pb-3 font-medium">{t('table.columns.lastActive')}</th>
                        <th className="pb-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredObservers.map((obs) => (
                        <tr
                          key={obs.id}
                          className="border-b border-surface-tertiary/50 hover:bg-background-secondary/50"
                        >
                          <td className="py-4">
                            <span className="font-mono text-sm">{obs.id}</span>
                          </td>
                          <td className="py-4">
                            <div>
                              <div className="font-medium text-foreground">{obs.operator}</div>
                              <div className="font-mono text-xs text-foreground-tertiary">
                                {obs.address}
                              </div>
                            </div>
                          </td>
                          <td className="py-4">{getStatusBadge(obs.status)}</td>
                          <td className="py-4">
                            <span className="font-mono">{obs.challengesSubmitted}</span>
                          </td>
                          <td className="py-4">
                            <span className={cn(
                              'font-mono',
                              (obs.successfulChallenges / obs.challengesSubmitted) > 0.1 ? 'text-success' : 'text-foreground-secondary'
                            )}>
                              {((obs.successfulChallenges / obs.challengesSubmitted) * 100).toFixed(1)}%
                            </span>
                          </td>
                          <td className="py-4">
                            <span className="font-mono">{obs.totalRewards}</span>
                          </td>
                          <td className="py-4">
                            <span className="text-sm text-foreground-secondary">
                              {obs.lastActive}
                            </span>
                          </td>
                          <td className="py-4">
                            <Link
                              href={`/admin/public/observers/${obs.id}`}
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

          {/* Challenges Tab */}
          {activeTab === 'challenges' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('challenges.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {SAMPLE_CHALLENGES.map((challenge) => (
                    <div
                      key={challenge.id}
                      className={cn(
                        'flex items-center justify-between rounded-lg border p-4',
                        challenge.status === 'pending'
                          ? 'border-warning/50 bg-warning/5'
                          : 'border-surface-tertiary bg-background-secondary'
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          'flex h-12 w-12 items-center justify-center rounded-xl',
                          challenge.status === 'pending' && 'bg-warning/10',
                          challenge.status === 'verified' && 'bg-success/10',
                          challenge.status === 'rejected' && 'bg-danger/10'
                        )}>
                          <AlertTriangle className={cn(
                            'h-6 w-6',
                            challenge.status === 'pending' && 'text-warning',
                            challenge.status === 'verified' && 'text-success',
                            challenge.status === 'rejected' && 'text-danger'
                          )} />
                        </div>
                        <div>
                          <div className="font-medium text-foreground">
                            {t('challenges.targetLabel')}: {challenge.target}
                          </div>
                          <div className="text-sm text-foreground-secondary">
                            {challenge.reason}
                          </div>
                          <div className="mt-1 flex items-center gap-3 text-xs text-foreground-tertiary">
                            <span>{t('challenges.by')}: {challenge.observer}</span>
                            <span>{challenge.submittedAt}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(challenge.status)}
                        {challenge.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" leftIcon={<XCircle className="h-4 w-4" />}>
                              {t('challenges.reject')}
                            </Button>
                            <Button size="sm" leftIcon={<CheckCircle className="h-4 w-4" />}>
                              {t('challenges.verify')}
                            </Button>
                          </div>
                        )}
                        {challenge.status === 'verified' && (
                          <span className="font-mono text-sm text-success">+{challenge.reward}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Rewards Tab */}
          {activeTab === 'rewards' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('rewards.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-surface-tertiary">
                  <div className="text-center text-foreground-tertiary">
                    <TrendingUp className="mx-auto h-12 w-12" />
                    <p className="mt-2">{t('rewards.placeholder')}</p>
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
