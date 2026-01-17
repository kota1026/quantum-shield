'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Shield, Clock, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// Types
type ProverStatus = 'active' | 'pending' | 'slaWarning' | 'suspended';
type TabType = 'all' | 'queue' | 'applications' | 'performance';

interface Prover {
  id: string;
  operator: string;
  status: ProverStatus;
  stake: number;
  sla: number;
  signatures24h: number;
  lastActive: string;
}

// Tab component
interface TabItemProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  badge?: number;
}

function TabItem({ label, isActive, onClick, badge }: TabItemProps) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={onClick}
      className={cn(
        'rounded-lg px-5 py-2.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        isActive
          ? 'bg-background-tertiary text-foreground'
          : 'text-foreground-secondary hover:text-foreground'
      )}
    >
      {label}
      {badge !== undefined && badge > 0 && (
        <span className="ml-2 rounded-full bg-danger/10 px-2 py-0.5 text-xs font-semibold text-danger">
          {badge}
        </span>
      )}
    </button>
  );
}

// Stat mini card component
interface StatMiniProps {
  label: string;
  value: string;
  variant?: 'default' | 'success' | 'warning';
}

function StatMini({ label, value, variant = 'default' }: StatMiniProps) {
  const valueColors = {
    default: 'text-foreground',
    success: 'text-success',
    warning: 'text-warning',
  };

  return (
    <div className="rounded-xl border border-surface-tertiary bg-card p-4">
      <div className="mb-1 text-xs text-foreground-tertiary">{label}</div>
      <div className={cn('font-mono text-2xl font-bold', valueColors[variant])}>
        {value}
      </div>
    </div>
  );
}

// SLA bar component
interface SlaBarProps {
  value: number;
}

function SlaBar({ value }: SlaBarProps) {
  const isWarning = value < 99.5;

  return (
    <div className="flex items-center gap-2">
      <div
        className="h-1.5 w-20 overflow-hidden rounded-full bg-background"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`SLA: ${value}%`}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all',
            isWarning ? 'bg-warning' : 'bg-success'
          )}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="font-mono text-sm text-foreground-secondary">
        {value}%
      </span>
    </div>
  );
}

// Status badge component
interface StatusBadgeProps {
  status: ProverStatus;
}

function StatusBadge({ status }: StatusBadgeProps) {
  const t = useTranslations('admin.prover.status');

  const statusConfig = {
    active: {
      label: t('active'),
      bgClass: 'bg-success/10',
      textClass: 'text-success',
      dotClass: 'bg-success',
    },
    pending: {
      label: t('pending'),
      bgClass: 'bg-warning/10',
      textClass: 'text-warning',
      dotClass: 'bg-warning',
    },
    slaWarning: {
      label: t('slaWarning'),
      bgClass: 'bg-warning/10',
      textClass: 'text-warning',
      dotClass: 'bg-warning',
    },
    suspended: {
      label: t('suspended'),
      bgClass: 'bg-danger/10',
      textClass: 'text-danger',
      dotClass: 'bg-danger',
    },
  };

  const config = statusConfig[status];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium',
        config.bgClass,
        config.textClass
      )}
    >
      <span
        className={cn('h-1.5 w-1.5 rounded-full', config.dotClass)}
        aria-hidden="true"
      />
      {config.label}
    </span>
  );
}

// Prover table row component
interface ProverRowProps {
  prover: Prover;
  onClick: () => void;
}

function ProverRow({ prover, onClick }: ProverRowProps) {
  const formatStake = (value: number) => {
    return `$${(value / 1000).toFixed(0)}K`;
  };

  return (
    <tr
      onClick={onClick}
      className="cursor-pointer border-b border-surface-tertiary transition-colors hover:bg-background-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold"
      tabIndex={0}
      role="button"
      aria-label={`Prover ${prover.id}, ${prover.operator}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <td className="px-4 py-4">
        <span className="font-mono text-gold">{prover.id}</span>
      </td>
      <td className="px-4 py-4 text-sm">{prover.operator}</td>
      <td className="px-4 py-4">
        <StatusBadge status={prover.status} />
      </td>
      <td className="px-4 py-4">
        <span className="font-mono font-semibold">{formatStake(prover.stake)}</span>
      </td>
      <td className="px-4 py-4">
        <SlaBar value={prover.sla} />
      </td>
      <td className="px-4 py-4 text-sm">{prover.signatures24h}</td>
      <td className="px-4 py-4 font-mono text-sm text-foreground-tertiary">
        {prover.lastActive}
      </td>
    </tr>
  );
}

export function AdminProver() {
  const t = useTranslations('admin.prover');
  const [activeTab, setActiveTab] = useState<TabType>('all');

  // Mock data - in production would come from API
  const stats = {
    activeProvers: 127,
    totalStake: '$50.8M',
    avgSla: '99.87%',
    pendingQueue: 12,
  };

  const provers: Prover[] = [
    {
      id: '#001',
      operator: 'Secureworks Inc.',
      status: 'active',
      stake: 425000,
      sla: 99.9,
      signatures24h: 142,
      lastActive: '2 min ago',
    },
    {
      id: '#042',
      operator: 'Node Guardians LLC',
      status: 'active',
      stake: 400000,
      sla: 99.8,
      signatures24h: 138,
      lastActive: '5 min ago',
    },
    {
      id: '#078',
      operator: 'CryptoValidators',
      status: 'slaWarning',
      stake: 410000,
      sla: 98.5,
      signatures24h: 89,
      lastActive: '15 min ago',
    },
    {
      id: '#103',
      operator: 'Tokyo Staking',
      status: 'active',
      stake: 450000,
      sla: 99.95,
      signatures24h: 156,
      lastActive: '1 min ago',
    },
    {
      id: '#127',
      operator: 'BlockSecure Asia',
      status: 'active',
      stake: 400000,
      sla: 99.7,
      signatures24h: 121,
      lastActive: '3 min ago',
    },
  ];

  const applicationCount = 3;

  const handleProverClick = (proverId: string) => {
    // In production, would open detail modal or navigate
    console.log('Prover clicked:', proverId);
  };

  return (
    <main
      className="min-h-screen bg-background pl-[260px]"
      role="main"
      aria-label={t('ariaLabel')}
    >
      <div className="p-6 lg:p-8">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>
          <p className="mt-1 text-sm text-foreground-secondary">{t('subtitle')}</p>
        </div>

        {/* Tabs */}
        <div
          className="mb-6 flex gap-1 rounded-lg bg-background-secondary p-1"
          role="tablist"
          aria-label={t('title')}
          style={{ width: 'fit-content' }}
        >
          <TabItem
            label={t('tabs.all')}
            isActive={activeTab === 'all'}
            onClick={() => setActiveTab('all')}
          />
          <TabItem
            label={t('tabs.queue')}
            isActive={activeTab === 'queue'}
            onClick={() => setActiveTab('queue')}
          />
          <TabItem
            label={t('tabs.applications')}
            isActive={activeTab === 'applications'}
            onClick={() => setActiveTab('applications')}
            badge={applicationCount}
          />
          <TabItem
            label={t('tabs.performance')}
            isActive={activeTab === 'performance'}
            onClick={() => setActiveTab('performance')}
          />
        </div>

        {/* Stats Row */}
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatMini
            label={t('stats.activeProvers.label')}
            value={stats.activeProvers.toString()}
            variant="success"
          />
          <StatMini label={t('stats.totalStake.label')} value={stats.totalStake} />
          <StatMini
            label={t('stats.avgSla.label')}
            value={stats.avgSla}
            variant="success"
          />
          <StatMini
            label={t('stats.pendingQueue.label')}
            value={stats.pendingQueue.toString()}
            variant="warning"
          />
        </div>

        {/* Content based on active tab */}
        {activeTab === 'all' && (
          <Card padding="none">
            <CardHeader className="border-b border-surface-tertiary px-5 py-4">
              <CardTitle className="text-base">{t('table.title')}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full" role="table">
                  <thead>
                    <tr className="bg-background-secondary">
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-foreground-tertiary"
                      >
                        {t('table.columns.proverId')}
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-foreground-tertiary"
                      >
                        {t('table.columns.operator')}
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-foreground-tertiary"
                      >
                        {t('table.columns.status')}
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-foreground-tertiary"
                      >
                        {t('table.columns.stake')}
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-foreground-tertiary"
                      >
                        {t('table.columns.sla')}
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-foreground-tertiary"
                      >
                        {t('table.columns.signatures')}
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-foreground-tertiary"
                      >
                        {t('table.columns.lastActive')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {provers.map((prover) => (
                      <ProverRow
                        key={prover.id}
                        prover={prover}
                        onClick={() => handleProverClick(prover.id)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'queue' && (
          <Card padding="none">
            <CardHeader className="border-b border-surface-tertiary px-5 py-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4" aria-hidden="true" />
                {t('tabs.queue')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Shield className="mb-4 h-12 w-12 text-foreground-tertiary" aria-hidden="true" />
                <p className="text-sm text-foreground-secondary">
                  Signing queue view coming soon
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'applications' && (
          <Card padding="none">
            <CardHeader className="border-b border-surface-tertiary px-5 py-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="h-4 w-4 text-warning" aria-hidden="true" />
                {t('applications.title')}
                <span className="rounded-full bg-danger/10 px-2 py-0.5 text-xs font-semibold text-danger">
                  {applicationCount}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Shield className="mb-4 h-12 w-12 text-foreground-tertiary" aria-hidden="true" />
                <p className="text-sm text-foreground-secondary">
                  Application review view coming soon
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'performance' && (
          <Card padding="none">
            <CardHeader className="border-b border-surface-tertiary px-5 py-4">
              <CardTitle className="text-base">{t('tabs.performance')}</CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Shield className="mb-4 h-12 w-12 text-foreground-tertiary" aria-hidden="true" />
                <p className="text-sm text-foreground-secondary">
                  Performance metrics view coming soon
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
