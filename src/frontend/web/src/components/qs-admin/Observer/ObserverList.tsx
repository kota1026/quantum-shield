'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Eye,
  Search,
  Filter,
  Download,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Shield,
  Coins,
  TrendingUp,
  Activity,
  AlertTriangle,
  Target,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useObserverStats, useObserverList } from '@/hooks/admin/useObservers';
import type { ObserverStats } from '@/lib/api/admin/mock';
import type { ObserverListItem } from '@/lib/api/admin/types';

// Fallback stats - Used when API is unavailable
const FALLBACK_STATS: ObserverStats = {
  totalObservers: 156,
  activeObservers: 142,
  totalChallenges: 1234,
  successRate: '94.2%',
};

// Fallback observer type for UI display
interface FallbackObserver {
  id: string;
  wallet: string;
  challenges: number;
  successRate: string;
  earnings: string;
  bond: string;
  lastChallenge: string;
  status: string;
  successfulChallenges: number;
  failedChallenges: number;
}

const FALLBACK_OBSERVERS: FallbackObserver[] = [
  { id: 'OB-001', wallet: '0x1234...5678', challenges: 125, successRate: '98.4%', earnings: '2,450 QS', bond: '500 QS', lastChallenge: '2024-01-27 14:30', status: 'active', successfulChallenges: 123, failedChallenges: 2 },
  { id: 'OB-002', wallet: '0x2345...6789', challenges: 89, successRate: '95.5%', earnings: '1,780 QS', bond: '500 QS', lastChallenge: '2024-01-27 13:15', status: 'active', successfulChallenges: 85, failedChallenges: 4 },
  { id: 'OB-003', wallet: '0x3456...7890', challenges: 234, successRate: '92.3%', earnings: '4,680 QS', bond: '1,000 QS', lastChallenge: '2024-01-27 12:00', status: 'active', successfulChallenges: 216, failedChallenges: 18 },
  { id: 'OB-004', wallet: '0x4567...8901', challenges: 45, successRate: '88.9%', earnings: '900 QS', bond: '500 QS', lastChallenge: '2024-01-25 16:45', status: 'inactive', successfulChallenges: 40, failedChallenges: 5 },
  { id: 'OB-005', wallet: '0x5678...9012', challenges: 178, successRate: '96.1%', earnings: '3,560 QS', bond: '500 QS', lastChallenge: '2024-01-27 11:30', status: 'active', successfulChallenges: 171, failedChallenges: 7 },
  { id: 'OB-006', wallet: '0x6789...0123', challenges: 56, successRate: '100%', earnings: '1,120 QS', bond: '500 QS', lastChallenge: '2024-01-27 10:00', status: 'active', successfulChallenges: 56, failedChallenges: 0 },
  { id: 'OB-007', wallet: '0x7890...1234', challenges: 12, successRate: '75.0%', earnings: '180 QS', bond: '200 QS', lastChallenge: '2024-01-26 08:00', status: 'warning', successfulChallenges: 9, failedChallenges: 3 },
  { id: 'OB-008', wallet: '0x8901...2345', challenges: 320, successRate: '97.5%', earnings: '6,400 QS', bond: '1,000 QS', lastChallenge: '2024-01-27 09:45', status: 'active', successfulChallenges: 312, failedChallenges: 8 },
];

// Union type for API data and fallback data
type ObserverItem = ObserverListItem | FallbackObserver;

// Loading skeleton component
function ListSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="h-10 w-10 rounded-lg bg-muted animate-pulse" />
          <div className="space-y-2">
            <div className="h-7 bg-muted rounded w-48 animate-pulse" />
            <div className="h-4 bg-muted rounded w-32 animate-pulse" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-20 bg-muted rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="p-6">
          <div className="h-64 bg-muted rounded animate-pulse" />
        </CardContent>
      </Card>
    </div>
  );
}

// Error state component
interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <Card className="border-danger/50">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-5 w-5 text-danger" />
            <span className="text-danger">{message}</span>
          </div>
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

const STATUS_COLORS = {
  active: 'bg-success/10 text-success',
  inactive: 'bg-foreground-tertiary/10 text-foreground-tertiary',
  warning: 'bg-warning/10 text-warning',
};

const STATUS_ICONS = {
  active: CheckCircle,
  inactive: XCircle,
  warning: AlertTriangle,
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

export function ObserverList() {
  const t = useTranslations('qsAdmin.observer');
  const tCommon = useTranslations('qsAdmin.common');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // React Query hooks
  const statsQuery = useObserverStats();
  const listQuery = useObserverList();

  // Map API data to display format
  const mapApiObserver = (apiObserver: ObserverListItem): FallbackObserver => ({
    id: apiObserver.id,
    wallet: apiObserver.walletAddress,
    challenges: apiObserver.successfulChallenges + apiObserver.failedChallenges,
    successRate: apiObserver.successfulChallenges + apiObserver.failedChallenges > 0
      ? `${((apiObserver.successfulChallenges / (apiObserver.successfulChallenges + apiObserver.failedChallenges)) * 100).toFixed(1)}%`
      : '0%',
    earnings: apiObserver.totalEarnings,
    bond: '500 QS', // Default bond
    lastChallenge: new Date(apiObserver.registeredAt).toLocaleString('ja-JP'),
    status: apiObserver.status === 'suspended' ? 'inactive' : apiObserver.status === 'practice' ? 'warning' : apiObserver.status,
    successfulChallenges: apiObserver.successfulChallenges,
    failedChallenges: apiObserver.failedChallenges,
  });

  // Use API data or fallback
  const stats = statsQuery.data ?? FALLBACK_STATS;
  const apiObservers = listQuery.data?.observers;
  const observers: FallbackObserver[] = apiObservers
    ? apiObservers.map(mapApiObserver)
    : FALLBACK_OBSERVERS;

  const statusFilters = [
    { key: 'all', label: tCommon('all') },
    { key: 'active', label: t('status.active') },
    { key: 'warning', label: t('status.warning') },
    { key: 'inactive', label: t('status.inactive') },
  ];

  const filteredObservers = useMemo(() => {
    return observers.filter((observer: FallbackObserver) => {
      if (statusFilter !== 'all' && observer.status !== statusFilter) return false;
      if (searchQuery && !observer.wallet.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !observer.id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [observers, statusFilter, searchQuery]);

  // Show loading skeleton only for initial load
  if (statsQuery.isLoading && !statsQuery.data && listQuery.isLoading && !listQuery.data) {
    return <ListSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/qs-admin/observer">
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
        <StatCard title={t('stats.totalObservers')} value={stats.totalObservers} icon={Eye} />
        <StatCard title={t('stats.activeObservers')} value={stats.activeObservers} icon={Activity} trend={{ value: 5.2, isPositive: true, label: tCommon('trend.fromLastWeek') }} />
        <StatCard title={t('stats.totalChallenges')} value={stats.totalChallenges.toLocaleString()} icon={Shield} trend={{ value: 15.3, isPositive: true, label: tCommon('trend.fromLastWeek') }} />
        <StatCard title={t('stats.successRate')} value={stats.successRate} icon={Target} />
      </div>

      {/* Observers Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">{t('listTitle')} ({filteredObservers.length})</CardTitle>
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
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('table.wallet')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('table.bond')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('table.challenges')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('table.successRate')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('table.earnings')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('table.lastActive')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('table.status')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('table.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredObservers.map((observer) => {
                  const StatusIcon = STATUS_ICONS[observer.status as keyof typeof STATUS_ICONS];
                  const successRateNum = parseFloat(observer.successRate);
                  return (
                    <tr key={observer.id} className={cn('border-b border-border hover:bg-surface transition-colors', observer.status === 'warning' && 'bg-warning/5')}>
                      <td className="py-3 px-4"><code className="text-sm font-mono text-hinomaru">{observer.id}</code></td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <Eye className="h-4 w-4 text-foreground-tertiary" />
                          <code className="text-sm font-mono">{observer.wallet}</code>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <Coins className="h-4 w-4 text-gold" />
                          <span className="font-medium">{observer.bond}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <span className="font-medium">{observer.challenges}</span>
                          <span className="text-xs text-foreground-tertiary ml-2">
                            (<span className="text-success">{observer.successfulChallenges}</span>/<span className="text-danger">{observer.failedChallenges}</span>)
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-16 h-2 bg-surface rounded-full overflow-hidden">
                            <div
                              className={cn('h-full rounded-full', successRateNum >= 95 ? 'bg-success' : successRateNum >= 85 ? 'bg-warning' : 'bg-danger')}
                              style={{ width: `${successRateNum}%` }}
                            />
                          </div>
                          <span className={cn('font-medium', successRateNum >= 95 ? 'text-success' : successRateNum >= 85 ? 'text-warning' : 'text-danger')}>
                            {observer.successRate}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-success">{observer.earnings}</td>
                      <td className="py-3 px-4 text-sm text-foreground-secondary">{observer.lastChallenge}</td>
                      <td className="py-3 px-4">
                        <span className={cn('inline-flex items-center px-2 py-1 rounded-md text-xs font-medium capitalize', STATUS_COLORS[observer.status as keyof typeof STATUS_COLORS])}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {t(`status.${observer.status}`)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Link href={`/qs-admin/observer/list/${observer.id}`} className="inline-flex items-center justify-center min-h-[44px] px-4 py-2 text-sm font-medium border border-border rounded-md hover:bg-accent transition-colors">
                          {tCommon('detail')}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredObservers.length === 0 && (
            <div className="text-center py-8 text-foreground-secondary">{t('empty')}</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
