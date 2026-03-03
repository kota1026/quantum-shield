'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useState } from 'react';
import {
  Shield,
  Search,
  Filter,
  ChevronRight,
  AlertTriangle,
  Scale,
  Clock,
  Gavel,
  XCircle,
  CheckCircle,
  Eye,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AdminSidebarV2 } from '../AdminSidebarV2';
import { useSlashings, useSlashingStats, useSlashingConfig, useExecuteSlashing, useRejectSlashing } from '@/hooks/admin/useSlashings';
import type { SlashingEvent } from '@/lib/api/admin/types';

interface StatCardProps {
  label: string;
  value: string;
  subValue?: string;
  icon: React.ReactNode;
  status?: 'success' | 'warning' | 'danger';
}

function StatCard({ label, value, subValue, icon, status = 'success' }: StatCardProps) {
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
        <div>
          <div className="text-xs text-foreground-tertiary">{label}</div>
          <div className="text-xl font-bold text-foreground">{value}</div>
          {subValue && <div className="text-xs text-foreground-secondary">{subValue}</div>}
        </div>
      </div>
    </Card>
  );
}

const EMPTY_SLASHING_EVENT: SlashingEvent = {
  id: '',
  proverId: '',
  operator: '',
  type: 'sla_violation',
  amount: '0',
  reason: '',
  status: 'pending',
  createdAt: '',
  executedAt: null,
};

export function PublicProverSlashing() {
  const t = useTranslations('admin.proverSlashing');
  const [activeTab, setActiveTab] = useState<'events' | 'pending' | 'config' | 'appeals'>('events');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<SlashingEvent | null>(null);

  const { data: slashingData, isLoading, error } = useSlashings();
  const { data: statsData } = useSlashingStats();
  const { data: configData } = useSlashingConfig();
  const executeSlashing = useExecuteSlashing();
  const rejectSlashing = useRejectSlashing();

  const events = slashingData?.events ?? [];
  const stats = statsData ?? { totalSlashed: '0', pendingCount: 0, appealsCount: 0, executedThisMonth: 0, rejectedThisMonth: 0 };
  const config = configData ?? { slaThreshold: 99.5, slaViolationPenalty: '5%', downtimePenalty: '10,000 QS/hour', invalidSignaturePenalty: '25,000 QS', appealPeriod: '24 hours', gracePeriod: '1 hour' };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminSidebarV2 />
        <main className="pl-[280px]" role="main">
          <div className="p-6 lg:p-8">
            <div className="animate-pulse space-y-6">
              <div className="h-8 w-64 rounded bg-surface-secondary" />
              <div className="grid grid-cols-5 gap-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-24 rounded-lg bg-surface-secondary" />
                ))}
              </div>
              <div className="h-96 rounded-lg bg-surface-secondary" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <AdminSidebarV2 />
        <main className="pl-[280px]" role="main">
          <div className="flex h-[60vh] items-center justify-center">
            <div className="text-center">
              <AlertTriangle className="mx-auto h-12 w-12 text-danger" />
              <p className="mt-4 text-lg font-semibold text-foreground">{t('error.title')}</p>
              <p className="mt-2 text-sm text-foreground-secondary">{t('error.description')}</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const pendingCount = events.filter(e => e.status === 'pending' || e.status === 'reviewing').length;
  const appealCount = events.filter(e => e.status === 'appealed').length;

  const tabs = [
    { key: 'events', label: t('tabs.events'), count: events.length },
    { key: 'pending', label: t('tabs.pending'), count: stats.pendingCount },
    { key: 'appeals', label: t('tabs.appeals'), count: stats.appealsCount },
    { key: 'config', label: t('tabs.config') },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'executed':
        return <Badge variant="success">{t('status.executed')}</Badge>;
      case 'pending':
        return <Badge variant="warning">{t('status.pending')}</Badge>;
      case 'reviewing':
        return <Badge variant="default">{t('status.reviewing')}</Badge>;
      case 'appealed':
        return <Badge variant="gold">{t('status.appealed')}</Badge>;
      case 'rejected':
        return <Badge variant="danger">{t('status.rejected')}</Badge>;
      default:
        return null;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'sla_violation':
        return <Badge variant="warning">{t('types.slaViolation')}</Badge>;
      case 'downtime':
        return <Badge variant="danger">{t('types.downtime')}</Badge>;
      case 'invalid_signature':
        return <Badge variant="danger">{t('types.invalidSignature')}</Badge>;
      default:
        return <Badge variant="default">{type}</Badge>;
    }
  };

  const filteredEvents = events.filter(
    (event) =>
      event.operator.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.proverId.toLowerCase().includes(searchQuery.toLowerCase())
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
              <Link href="/admin/public/provers" className="hover:text-foreground">
                Provers
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
              label={t('stats.totalSlashed')}
              value={stats.totalSlashed}
              icon={<Gavel className="h-5 w-5" />}
              status="danger"
            />
            <StatCard
              label={t('stats.pendingReview')}
              value={String(stats.pendingCount)}
              icon={<Clock className="h-5 w-5" />}
              status="warning"
            />
            <StatCard
              label={t('stats.appealsActive')}
              value={String(stats.appealsCount)}
              icon={<Scale className="h-5 w-5" />}
              status="warning"
            />
            <StatCard
              label={t('stats.executedThisMonth')}
              value={String(stats.executedThisMonth)}
              icon={<CheckCircle className="h-5 w-5" />}
              status="success"
            />
            <StatCard
              label={t('stats.rejectedThisMonth')}
              value={String(stats.rejectedThisMonth)}
              icon={<XCircle className="h-5 w-5" />}
              status="danger"
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
                {tab.count !== undefined && (
                  <Badge size="sm" variant={activeTab === tab.key ? 'gold' : 'default'}>
                    {tab.count}
                  </Badge>
                )}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Events List */}
            {(activeTab === 'events' || activeTab === 'pending' || activeTab === 'appeals') && (
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base">{t('eventList.title')}</CardTitle>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-tertiary" />
                        <input
                          type="text"
                          placeholder={t('eventList.searchPlaceholder')}
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="rounded-lg border border-surface-tertiary bg-background-secondary py-2 pl-10 pr-4 text-sm focus:border-gold focus:outline-none"
                        />
                      </div>
                      <Button variant="outline" size="sm" leftIcon={<Filter className="h-4 w-4" />}>
                        {t('eventList.filter')}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {filteredEvents
                        .filter((event) => {
                          if (activeTab === 'pending') return event.status === 'pending' || event.status === 'reviewing';
                          if (activeTab === 'appeals') return event.status === 'appealed';
                          return true;
                        })
                        .map((event) => (
                          <div
                            key={event.id}
                            onClick={() => setSelectedEvent(event)}
                            className={cn(
                              'cursor-pointer rounded-lg border p-4 transition-all',
                              selectedEvent?.id === event.id
                                ? 'border-gold bg-gold/5'
                                : 'border-surface-tertiary hover:border-gold/50'
                            )}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-danger/10">
                                  <AlertTriangle className="h-5 w-5 text-danger" />
                                </div>
                                <div>
                                  <div className="font-medium text-foreground">{event.operator}</div>
                                  <div className="font-mono text-xs text-foreground-tertiary">
                                    {event.proverId}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-mono text-lg font-bold text-danger">-{event.amount}</div>
                                {getStatusBadge(event.status)}
                              </div>
                            </div>
                            <div className="mt-3 flex items-center gap-4 text-sm">
                              {getTypeBadge(event.type)}
                              <span className="text-foreground-tertiary">{event.createdAt}</span>
                            </div>
                            <div className="mt-2 text-sm text-foreground-secondary">{event.reason}</div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Detail Panel */}
            {(activeTab === 'events' || activeTab === 'pending' || activeTab === 'appeals') && (
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">{t('detail.title')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedEvent ? (
                      <div className="space-y-4">
                        <div>
                          <div className="text-xs text-foreground-tertiary">{t('detail.eventId')}</div>
                          <div className="font-mono text-sm">{selectedEvent.id}</div>
                        </div>
                        <div>
                          <div className="text-xs text-foreground-tertiary">{t('detail.prover')}</div>
                          <div className="font-medium">{selectedEvent.operator}</div>
                          <div className="font-mono text-xs text-foreground-tertiary">
                            {selectedEvent.proverId}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-foreground-tertiary">{t('detail.type')}</div>
                          <div className="mt-1">{getTypeBadge(selectedEvent.type)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-foreground-tertiary">{t('detail.amount')}</div>
                          <div className="font-mono text-xl font-bold text-danger">-{selectedEvent.amount}</div>
                        </div>
                        <div>
                          <div className="text-xs text-foreground-tertiary">{t('detail.reason')}</div>
                          <div className="text-sm">{selectedEvent.reason}</div>
                        </div>
                        <div>
                          <div className="text-xs text-foreground-tertiary">{t('detail.status')}</div>
                          <div className="mt-1">{getStatusBadge(selectedEvent.status)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-foreground-tertiary">{t('detail.createdAt')}</div>
                          <div className="text-sm">{selectedEvent.createdAt}</div>
                        </div>
                        {selectedEvent.executedAt && (
                          <div>
                            <div className="text-xs text-foreground-tertiary">{t('detail.executedAt')}</div>
                            <div className="text-sm">{selectedEvent.executedAt}</div>
                          </div>
                        )}

                        {(selectedEvent.status === 'pending' || selectedEvent.status === 'reviewing') && (
                          <div className="flex gap-2 pt-4">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              leftIcon={<XCircle className="h-4 w-4" />}
                              onClick={() => rejectSlashing.mutate(selectedEvent.id)}
                              disabled={rejectSlashing.isPending}
                            >
                              {t('detail.actions.reject')}
                            </Button>
                            <Button
                              size="sm"
                              className="flex-1"
                              leftIcon={<CheckCircle className="h-4 w-4" />}
                              onClick={() => executeSlashing.mutate(selectedEvent.id)}
                              disabled={executeSlashing.isPending}
                            >
                              {t('detail.actions.execute')}
                            </Button>
                          </div>
                        )}

                        {selectedEvent.status === 'appealed' && (
                          <div className="flex gap-2 pt-4">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => executeSlashing.mutate(selectedEvent.id)}
                              disabled={executeSlashing.isPending}
                            >
                              {t('detail.actions.denyAppeal')}
                            </Button>
                            <Button
                              size="sm"
                              className="flex-1"
                              onClick={() => rejectSlashing.mutate(selectedEvent.id)}
                              disabled={rejectSlashing.isPending}
                            >
                              {t('detail.actions.approveAppeal')}
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex h-64 items-center justify-center text-center text-foreground-tertiary">
                        <div>
                          <Eye className="mx-auto h-12 w-12" />
                          <p className="mt-2">{t('detail.selectEvent')}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Config Tab */}
            {activeTab === 'config' && (
              <div className="lg:col-span-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">{t('config.title')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                      <div className="rounded-lg border border-surface-tertiary p-4">
                        <div className="text-xs text-foreground-tertiary">{t('config.slaThreshold')}</div>
                        <div className="mt-1 text-2xl font-bold">{config.slaThreshold}%</div>
                      </div>
                      <div className="rounded-lg border border-surface-tertiary p-4">
                        <div className="text-xs text-foreground-tertiary">{t('config.slaViolationPenalty')}</div>
                        <div className="mt-1 text-2xl font-bold">{config.slaViolationPenalty}</div>
                        <div className="text-xs text-foreground-secondary">{t('config.ofStake')}</div>
                      </div>
                      <div className="rounded-lg border border-surface-tertiary p-4">
                        <div className="text-xs text-foreground-tertiary">{t('config.downtimePenalty')}</div>
                        <div className="mt-1 text-2xl font-bold">{config.downtimePenalty}</div>
                      </div>
                      <div className="rounded-lg border border-surface-tertiary p-4">
                        <div className="text-xs text-foreground-tertiary">{t('config.invalidSignaturePenalty')}</div>
                        <div className="mt-1 text-2xl font-bold">{config.invalidSignaturePenalty}</div>
                      </div>
                      <div className="rounded-lg border border-surface-tertiary p-4">
                        <div className="text-xs text-foreground-tertiary">{t('config.appealPeriod')}</div>
                        <div className="mt-1 text-2xl font-bold">{config.appealPeriod}</div>
                      </div>
                      <div className="rounded-lg border border-surface-tertiary p-4">
                        <div className="text-xs text-foreground-tertiary">{t('config.gracePeriod')}</div>
                        <div className="mt-1 text-2xl font-bold">{config.gracePeriod}</div>
                      </div>
                    </div>
                    <div className="mt-6">
                      <Button variant="outline">
                        {t('config.editParameters')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
