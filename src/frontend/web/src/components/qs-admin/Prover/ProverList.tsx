'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Server,
  Search,
  Filter,
  Download,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Pause,
  Play,
  Coins,
  ExternalLink,
  Eye,
  Activity,
  TrendingUp,
  Cpu,
  HardDrive,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useProverStats, useProverList } from '@/hooks/admin/useProvers';
import type { ProverStats } from '@/lib/api/admin/mock';
import type { ProverListItem } from '@/lib/api/admin/types';

// Default data - Used when API is unavailable
const DEFAULT_STATS: ProverStats = {
  totalProvers: 156,
  activeProvers: 142,
  totalStaked: '1,250,000 QS',
  avgUptime: '99.2%',
};

interface DefaultProver {
  id: string;
  name: string;
  wallet: string;
  staked: string;
  uptime: string;
  proofCount: number;
  lastProof: string;
  status: string;
  tier: string;
  cpu: string;
  memory: string;
}

const DEFAULT_PROVERS: DefaultProver[] = [
  { id: 'PV-001', name: 'Prover Alpha Corp', wallet: '0x1234...5678', staked: '50,000 QS', uptime: '99.9%', proofCount: 12450, lastProof: '2024-01-27 14:30', status: 'active', tier: 'enterprise', cpu: '85%', memory: '72%' },
  { id: 'PV-002', name: 'Node Runner Ltd', wallet: '0x2345...6789', staked: '25,000 QS', uptime: '99.5%', proofCount: 8920, lastProof: '2024-01-27 14:28', status: 'active', tier: 'professional', cpu: '65%', memory: '58%' },
  { id: 'PV-003', name: 'Quantum Nodes Inc', wallet: '0x3456...7890', staked: '50,000 QS', uptime: '98.8%', proofCount: 15600, lastProof: '2024-01-27 14:25', status: 'active', tier: 'enterprise', cpu: '78%', memory: '82%' },
  { id: 'PV-004', name: 'Decentralized Labs', wallet: '0x4567...8901', staked: '10,000 QS', uptime: '97.2%', proofCount: 3450, lastProof: '2024-01-27 14:20', status: 'active', tier: 'standard', cpu: '45%', memory: '38%' },
  { id: 'PV-005', name: 'Shield Nodes LLC', wallet: '0x5678...9012', staked: '50,000 QS', uptime: '0%', proofCount: 11200, lastProof: '2024-01-25 08:30', status: 'suspended', tier: 'enterprise', cpu: '-', memory: '-' },
  { id: 'PV-006', name: 'Crypto Infrastructure Co', wallet: '0x6789...0123', staked: '25,000 QS', uptime: '99.1%', proofCount: 7800, lastProof: '2024-01-27 14:15', status: 'active', tier: 'professional', cpu: '72%', memory: '65%' },
  { id: 'PV-007', name: 'Bare Metal Nodes', wallet: '0x7890...1234', staked: '10,000 QS', uptime: '96.5%', proofCount: 2100, lastProof: '2024-01-27 12:00', status: 'maintenance', tier: 'standard', cpu: '-', memory: '-' },
];

// Loading skeleton components
function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded w-24 animate-pulse" />
            <div className="h-8 bg-muted rounded w-32 animate-pulse" />
          </div>
          <div className="h-12 w-12 rounded-lg bg-muted animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}

function TableRowSkeleton() {
  return (
    <tr className="border-b border-border">
      <td className="py-3 px-4"><div className="h-4 bg-muted rounded w-16 animate-pulse" /></td>
      <td className="py-3 px-4"><div className="h-4 bg-muted rounded w-32 animate-pulse" /></td>
      <td className="py-3 px-4"><div className="h-4 bg-muted rounded w-20 animate-pulse" /></td>
      <td className="py-3 px-4"><div className="h-4 bg-muted rounded w-24 animate-pulse" /></td>
      <td className="py-3 px-4"><div className="h-4 bg-muted rounded w-14 animate-pulse" /></td>
      <td className="py-3 px-4"><div className="h-4 bg-muted rounded w-16 animate-pulse" /></td>
      <td className="py-3 px-4"><div className="h-4 bg-muted rounded w-20 animate-pulse" /></td>
      <td className="py-3 px-4"><div className="h-6 bg-muted rounded w-16 animate-pulse" /></td>
      <td className="py-3 px-4"><div className="h-8 bg-muted rounded w-20 animate-pulse" /></td>
    </tr>
  );
}

// Error state component
interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <AlertTriangle className="h-8 w-8 text-warning mb-2" />
      <p className="text-sm text-muted-foreground mb-4">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      )}
    </div>
  );
}

const STATUS_COLORS = {
  active: 'bg-success/10 text-success',
  suspended: 'bg-danger/10 text-danger',
  maintenance: 'bg-warning/10 text-warning',
  inactive: 'bg-foreground-tertiary/10 text-foreground-tertiary',
};

const STATUS_ICONS = {
  active: CheckCircle,
  suspended: XCircle,
  maintenance: Pause,
  inactive: XCircle,
};

const TIER_COLORS = {
  standard: 'bg-foreground-tertiary/10 text-foreground-tertiary',
  professional: 'bg-info/10 text-info',
  enterprise: 'bg-gold/10 text-gold',
};

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

export function ProverList() {
  const t = useTranslations('qsAdmin.prover');
  const tCommon = useTranslations('qsAdmin.common');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // React Query hooks
  const statsQuery = useProverStats();
  const proversQuery = useProverList();

  // Use API data or fallback
  const stats = statsQuery.data ?? DEFAULT_STATS;
  const provers = proversQuery.data?.provers ?? DEFAULT_PROVERS;

  const statusFilters = [
    { key: 'all', label: tCommon('all') },
    { key: 'active', label: t('status.active') },
    { key: 'maintenance', label: t('status.maintenance') },
    { key: 'suspended', label: t('status.suspended') },
  ];

  const filteredProvers = useMemo(() => {
    return provers.filter(prover => {
      const proverStatus = prover.status;
      if (statusFilter !== 'all' && proverStatus !== statusFilter) return false;
      const name = 'name' in prover ? prover.name : '';
      const wallet = 'wallet' in prover ? prover.wallet : ('operatorAddress' in prover ? prover.operatorAddress : '');
      if (searchQuery && !name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !wallet.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !prover.id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [provers, statusFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/qs-admin/prover">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('listTitle')}</h1>
            <p className="text-foreground-secondary">{t('listSubtitle')}</p>
          </div>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          {tCommon('export')}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsQuery.isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : statsQuery.isError ? (
          <div className="col-span-4">
            <ErrorState
              message="Failed to load statistics"
              onRetry={() => statsQuery.refetch()}
            />
          </div>
        ) : (
          <>
            <StatCard title={t('stats.totalProvers')} value={stats.totalProvers} icon={Server} />
            <StatCard title={t('stats.activeProvers')} value={stats.activeProvers} icon={Activity} trend={{ value: 5.2, isPositive: true, label: tCommon('trend.fromLastWeek') }} />
            <StatCard title={t('stats.totalStaked')} value={stats.totalStaked} icon={Coins} />
            <StatCard title={t('stats.avgUptime')} value={stats.avgUptime} icon={CheckCircle} />
          </>
        )}
      </div>

      {/* Provers Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">{t('listTitle')} ({filteredProvers.length})</CardTitle>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-tertiary" />
              <Input type="text" placeholder={t('searchPlaceholder')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 w-72" />
            </div>
            <Button variant="outline" size="icon"><Filter className="h-4 w-4" /></Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filter Tabs */}
          <div className="flex space-x-2 mb-4 border-b border-border">
            {statusFilters.map((filter) => (
              <button key={filter.key} onClick={() => setStatusFilter(filter.key)} className={cn('px-4 py-3 min-h-[44px] text-sm font-medium border-b-2 -mb-px transition-colors', statusFilter === filter.key ? 'border-hinomaru text-hinomaru' : 'border-transparent text-foreground-secondary hover:text-foreground')}>
                {filter.label}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('table.id')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('table.name')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('table.tier')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('table.staked')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('table.uptime')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('table.proofs')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('table.resources')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('table.status')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('table.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {proversQuery.isLoading ? (
                  <>
                    <TableRowSkeleton />
                    <TableRowSkeleton />
                    <TableRowSkeleton />
                    <TableRowSkeleton />
                    <TableRowSkeleton />
                  </>
                ) : proversQuery.isError ? (
                  <tr>
                    <td colSpan={9}>
                      <ErrorState
                        message="Failed to load provers"
                        onRetry={() => proversQuery.refetch()}
                      />
                    </td>
                  </tr>
                ) : (
                  filteredProvers.map((prover) => {
                    const StatusIcon = STATUS_ICONS[prover.status as keyof typeof STATUS_ICONS] || CheckCircle;
                    const name = 'name' in prover ? prover.name : '-';
                    const wallet = 'wallet' in prover ? prover.wallet : ('operatorAddress' in prover ? prover.operatorAddress : '-');
                    const staked = 'staked' in prover ? prover.staked : ('stake' in prover ? prover.stake : '-');
                    const uptime = 'uptime' in prover ? prover.uptime : '-';
                    const proofCount = 'proofCount' in prover ? prover.proofCount : 0;
                    const tier = prover.tier || 'standard';
                    const cpu = 'cpu' in prover ? prover.cpu : '-';
                    const memory = 'memory' in prover ? prover.memory : '-';
                    return (
                      <tr key={prover.id} className={cn('border-b border-border hover:bg-surface transition-colors', prover.status === 'suspended' && 'bg-danger/5')}>
                        <td className="py-3 px-4"><code className="text-sm font-mono text-hinomaru">{prover.id}</code></td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium">{name}</p>
                            <code className="text-xs text-foreground-tertiary font-mono">{wallet}</code>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={cn('inline-flex items-center px-2 py-1 rounded-md text-xs font-medium capitalize', TIER_COLORS[tier as keyof typeof TIER_COLORS] || TIER_COLORS.standard)}>
                            {tier}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <Coins className="h-4 w-4 text-gold" />
                            <span className="font-medium">{staked}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={cn('font-medium', parseFloat(uptime) >= 99 ? 'text-success' : parseFloat(uptime) >= 95 ? 'text-warning' : 'text-danger')}>
                            {uptime}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-foreground-secondary">{proofCount.toLocaleString()}</td>
                        <td className="py-3 px-4">
                          {cpu !== '-' ? (
                            <div className="flex items-center space-x-3 text-sm">
                              <div className="flex items-center space-x-1">
                                <Cpu className="h-3 w-3 text-foreground-tertiary" />
                                <span>{cpu}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <HardDrive className="h-3 w-3 text-foreground-tertiary" />
                                <span>{memory}</span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-foreground-tertiary">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className={cn('inline-flex items-center px-2 py-1 rounded-md text-xs font-medium capitalize', STATUS_COLORS[prover.status as keyof typeof STATUS_COLORS] || 'bg-muted text-muted-foreground')}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {t(`status.${prover.status}`)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-1">
                            <Link href={`/qs-admin/prover/list/${prover.id}`}>
                              <Button variant="ghost" size="sm" title={t('actions.viewDetail')}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            {prover.status === 'active' && (
                              <Button variant="ghost" size="sm" className="text-warning hover:text-warning hover:bg-warning/10" title="Pause">
                                <Pause className="h-4 w-4" />
                              </Button>
                            )}
                            {prover.status === 'suspended' && (
                              <Button variant="ghost" size="sm" className="text-success hover:text-success hover:bg-success/10" title="Resume">
                                <Play className="h-4 w-4" />
                              </Button>
                            )}
                            <a href={`https://etherscan.io/address/${wallet}`} target="_blank" rel="noopener noreferrer">
                              <Button variant="ghost" size="sm"><ExternalLink className="h-4 w-4" /></Button>
                            </a>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {!proversQuery.isLoading && !proversQuery.isError && filteredProvers.length === 0 && (
            <div className="text-center py-8 text-foreground-secondary">{t('empty')}</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
