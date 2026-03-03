'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useState } from 'react';
import {
  Vote,
  Search,
  Filter,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  FileText,
  Users,
  Gauge,
  Play,
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
const SAMPLE_PROPOSALS = [
  {
    id: 'QIP-042',
    title: 'Increase Prover Minimum Stake to 50,000 QS',
    type: 'parameter',
    status: 'active',
    forVotes: 2450000,
    againstVotes: 850000,
    quorum: 70,
    endTime: '2日 14時間後',
    proposer: '0x4a2f...8b1c',
  },
  {
    id: 'QIP-041',
    title: 'Add New Observer Reward Tier',
    type: 'treasury',
    status: 'pending',
    forVotes: 0,
    againstVotes: 0,
    quorum: 0,
    endTime: '開始待ち',
    proposer: '0x7c3d...2e5f',
  },
  {
    id: 'QIP-040',
    title: 'Reduce Unlock Fee from 0.3% to 0.2%',
    type: 'parameter',
    status: 'passed',
    forVotes: 3200000,
    againstVotes: 480000,
    quorum: 85,
    endTime: '実行待ち',
    proposer: '0x9e1a...4f7b',
  },
  {
    id: 'QIP-039',
    title: 'Update Emergency Pause Multi-sig Threshold',
    type: 'security',
    status: 'executed',
    forVotes: 4100000,
    againstVotes: 120000,
    quorum: 92,
    endTime: '実行済み',
    proposer: '0x2b8c...6d9e',
  },
  {
    id: 'QIP-038',
    title: 'Reject: Disable Time Lock Period',
    type: 'parameter',
    status: 'rejected',
    forVotes: 320000,
    againstVotes: 4200000,
    quorum: 88,
    endTime: '否決',
    proposer: '0x5f1d...3a7c',
  },
];

const SAMPLE_EXECUTION_QUEUE = [
  {
    id: 'QIP-040',
    title: 'Reduce Unlock Fee from 0.3% to 0.2%',
    scheduledAt: '2026-01-20 10:00 UTC',
    timelockRemaining: '1日 23時間',
    status: 'queued',
  },
  {
    id: 'QIP-037',
    title: 'Increase Observer Challenge Window',
    scheduledAt: '2026-01-19 14:00 UTC',
    timelockRemaining: '12時間',
    status: 'ready',
  },
];

export function PublicGovernanceManagement() {
  const t = useTranslations('admin.publicGovernance');
  const [activeTab, setActiveTab] = useState<'proposals' | 'execution' | 'parameters' | 'emergency'>('proposals');
  const [searchQuery, setSearchQuery] = useState('');

  const tabs = [
    { key: 'proposals', label: t('tabs.proposals'), count: SAMPLE_PROPOSALS.filter(p => p.status === 'active').length },
    { key: 'execution', label: t('tabs.execution'), count: SAMPLE_EXECUTION_QUEUE.length },
    { key: 'parameters', label: t('tabs.parameters') },
    { key: 'emergency', label: t('tabs.emergency') },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="warning">{t('status.active')}</Badge>;
      case 'pending':
        return <Badge variant="default">{t('status.pending')}</Badge>;
      case 'passed':
        return <Badge variant="success">{t('status.passed')}</Badge>;
      case 'executed':
        return <Badge variant="success">{t('status.executed')}</Badge>;
      case 'rejected':
        return <Badge variant="danger">{t('status.rejected')}</Badge>;
      case 'queued':
        return <Badge variant="warning">{t('executionStatus.queued')}</Badge>;
      case 'ready':
        return <Badge variant="success">{t('executionStatus.ready')}</Badge>;
      default:
        return null;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'parameter':
        return <Badge variant="info">{t('proposalType.parameter')}</Badge>;
      case 'treasury':
        return <Badge variant="gold">{t('proposalType.treasury')}</Badge>;
      case 'security':
        return <Badge variant="danger">{t('proposalType.security')}</Badge>;
      default:
        return null;
    }
  };

  const filteredProposals = SAMPLE_PROPOSALS.filter(
    (proposal) =>
      proposal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proposal.id.toLowerCase().includes(searchQuery.toLowerCase())
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
              label={t('stats.totalProposals')}
              value="42"
              icon={<FileText className="h-5 w-5" />}
              status="info"
            />
            <StatCard
              label={t('stats.activeProposals')}
              value="3"
              icon={<Vote className="h-5 w-5" />}
              status="warning"
            />
            <StatCard
              label={t('stats.pendingExecution')}
              value="2"
              icon={<Clock className="h-5 w-5" />}
              status="info"
            />
            <StatCard
              label={t('stats.totalVoters')}
              value="1,234"
              subValue="veQS holders"
              icon={<Users className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.avgQuorum')}
              value="78%"
              icon={<Gauge className="h-5 w-5" />}
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
                  <Badge size="sm" variant={activeTab === tab.key ? 'gold' : tab.key === 'proposals' ? 'warning' : 'default'}>
                    {tab.count}
                  </Badge>
                )}
              </button>
            ))}
          </div>

          {/* Proposals Tab */}
          {activeTab === 'proposals' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">{t('proposals.title')}</CardTitle>
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
                <div className="space-y-4">
                  {filteredProposals.map((proposal) => (
                    <div
                      key={proposal.id}
                      className={cn(
                        'rounded-lg border p-4',
                        proposal.status === 'active'
                          ? 'border-warning/50 bg-warning/5'
                          : 'border-surface-tertiary bg-background-secondary'
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm text-foreground-tertiary">
                              {proposal.id}
                            </span>
                            {getTypeBadge(proposal.type)}
                            {getStatusBadge(proposal.status)}
                          </div>
                          <h3 className="mt-2 font-medium text-foreground">
                            {proposal.title}
                          </h3>
                          <div className="mt-2 flex items-center gap-4 text-xs text-foreground-tertiary">
                            <span>{t('proposals.proposer')}: {proposal.proposer}</span>
                            <span>{t('proposals.endTime')}: {proposal.endTime}</span>
                          </div>
                        </div>
                        <div className="ml-4 text-right">
                          <div className="text-sm">
                            <span className="text-success">{(proposal.forVotes / 1000000).toFixed(1)}M</span>
                            <span className="text-foreground-tertiary"> / </span>
                            <span className="text-danger">{(proposal.againstVotes / 1000000).toFixed(1)}M</span>
                          </div>
                          <div className="mt-1 text-xs text-foreground-tertiary">
                            {t('proposals.quorum')}: {proposal.quorum}%
                          </div>
                          {/* Progress bar */}
                          {(proposal.forVotes + proposal.againstVotes) > 0 && (
                            <div className="mt-2 h-2 w-32 overflow-hidden rounded-full bg-danger/20">
                              <div
                                className="h-full bg-success"
                                style={{
                                  width: `${(proposal.forVotes / (proposal.forVotes + proposal.againstVotes)) * 100}%`,
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/public/governance/proposals/${proposal.id}`}
                          className="text-sm text-gold hover:underline"
                        >
                          {t('viewDetails')}
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Execution Tab */}
          {activeTab === 'execution' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('execution.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {SAMPLE_EXECUTION_QUEUE.map((item) => (
                    <div
                      key={item.id}
                      className={cn(
                        'flex items-center justify-between rounded-lg border p-4',
                        item.status === 'ready'
                          ? 'border-success/50 bg-success/5'
                          : 'border-surface-tertiary bg-background-secondary'
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          'flex h-12 w-12 items-center justify-center rounded-xl',
                          item.status === 'ready' ? 'bg-success/10' : 'bg-warning/10'
                        )}>
                          {item.status === 'ready' ? (
                            <Play className="h-6 w-6 text-success" />
                          ) : (
                            <Clock className="h-6 w-6 text-warning" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm text-foreground-tertiary">
                              {item.id}
                            </span>
                            {getStatusBadge(item.status)}
                          </div>
                          <div className="mt-1 font-medium text-foreground">
                            {item.title}
                          </div>
                          <div className="mt-1 text-xs text-foreground-tertiary">
                            {t('execution.scheduledAt')}: {item.scheduledAt}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-sm text-foreground-secondary">
                            {t('execution.timelockRemaining')}
                          </div>
                          <div className="font-mono text-foreground">
                            {item.timelockRemaining}
                          </div>
                        </div>
                        {item.status === 'ready' && (
                          <Button size="sm" leftIcon={<Play className="h-4 w-4" />}>
                            {t('execution.execute')}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Parameters Tab */}
          {activeTab === 'parameters' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('parameters.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-surface-tertiary">
                  <div className="text-center text-foreground-tertiary">
                    <Gauge className="mx-auto h-12 w-12" />
                    <p className="mt-2">{t('parameters.placeholder')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Emergency Tab */}
          {activeTab === 'emergency' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('emergency.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-danger/50 bg-danger/5 p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-danger/10">
                      <AlertTriangle className="h-6 w-6 text-danger" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-foreground">
                        {t('emergency.pauseTitle')}
                      </h3>
                      <p className="mt-2 text-sm text-foreground-secondary">
                        {t('emergency.pauseDescription')}
                      </p>
                      <div className="mt-4 flex items-center gap-3">
                        <Button variant="danger" leftIcon={<AlertTriangle className="h-4 w-4" />}>
                          {t('emergency.pauseButton')}
                        </Button>
                        <span className="text-xs text-foreground-tertiary">
                          {t('emergency.pauseNote')}
                        </span>
                      </div>
                    </div>
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
