'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  ExternalLink,
  CheckCircle,
  XCircle,
  Eye,
  Coins,
  Shield,
  Activity,
  AlertTriangle,
  Clock,
  TrendingUp,
  Copy,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useObserverDetail } from '@/hooks/admin/useObservers';
import type { ObserverDetailData } from '@/lib/api/admin/mock';

interface ObserverDetailProps {
  id: string;
}

// Fallback data - Used when API is unavailable
const FALLBACK_OBSERVER: ObserverDetailData = {
  id: 'OB-001',
  wallet: '0x1234567890abcdef1234567890abcdef12345678',
  challenges: 125,
  successRate: '98.4%',
  earnings: '2,450 QS',
  bond: '500 QS',
  lastChallenge: '2024-01-27 14:30',
  status: 'active',
  successfulChallenges: 123,
  failedChallenges: 2,
  registeredAt: '2023-06-15 10:00',
  avgResponseTime: '1.2s',
  recentChallenges: [
    { id: 'CH-125', type: 'unlock', target: 'UL-789', result: 'success', timestamp: '2024-01-27 14:30', reward: '20 QS' },
    { id: 'CH-124', type: 'unlock', target: 'UL-788', result: 'success', timestamp: '2024-01-27 12:15', reward: '20 QS' },
    { id: 'CH-123', type: 'unlock', target: 'UL-787', result: 'failed', timestamp: '2024-01-27 09:00', reward: '0 QS' },
    { id: 'CH-122', type: 'unlock', target: 'UL-786', result: 'success', timestamp: '2024-01-26 16:45', reward: '20 QS' },
    { id: 'CH-121', type: 'unlock', target: 'UL-785', result: 'success', timestamp: '2024-01-26 11:30', reward: '20 QS' },
  ],
};

// Loading skeleton component
function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="h-10 w-10 rounded-lg bg-muted animate-pulse" />
          <div className="space-y-2">
            <div className="h-7 bg-muted rounded w-48 animate-pulse" />
            <div className="h-4 bg-muted rounded w-24 animate-pulse" />
          </div>
        </div>
        <div className="h-8 bg-muted rounded-full w-24 animate-pulse" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="h-6 bg-muted rounded w-32 animate-pulse" />
              <div className="h-16 bg-muted rounded animate-pulse" />
              <div className="grid grid-cols-2 gap-4">
                <div className="h-20 bg-muted rounded animate-pulse" />
                <div className="h-20 bg-muted rounded animate-pulse" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="h-6 bg-muted rounded w-40 animate-pulse" />
              <div className="grid grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-20 bg-muted rounded animate-pulse" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="h-6 bg-muted rounded w-32 animate-pulse" />
              <div className="h-32 bg-muted rounded animate-pulse" />
            </CardContent>
          </Card>
        </div>
      </div>
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

const STATUS_CONFIG = {
  active: { icon: CheckCircle, color: 'text-success', bg: 'bg-success/10' },
  inactive: { icon: XCircle, color: 'text-foreground-tertiary', bg: 'bg-foreground-tertiary/10' },
  warning: { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10' },
};

const CHALLENGE_RESULT_COLORS = {
  success: 'bg-success/10 text-success',
  failed: 'bg-danger/10 text-danger',
  pending: 'bg-warning/10 text-warning',
};

export function ObserverDetail({ id }: ObserverDetailProps) {
  const t = useTranslations('qsAdmin.observer');
  const tCommon = useTranslations('qsAdmin.common');

  // React Query hook
  const observerQuery = useObserverDetail(id);

  // Map API data to component format
  const mapApiData = (data: unknown): ObserverDetailData => {
    if (!data || typeof data !== 'object') return { ...FALLBACK_OBSERVER, id };
    const d = data as Record<string, unknown>;
    return {
      id: (d.id as string) || id,
      wallet: (d.wallet as string) || (d.walletAddress as string) || FALLBACK_OBSERVER.wallet,
      challenges: (d.challenges as number) ||
        ((d.successfulChallenges as number) || 0) + ((d.failedChallenges as number) || 0) ||
        FALLBACK_OBSERVER.challenges,
      successRate: (d.successRate as string) || FALLBACK_OBSERVER.successRate,
      earnings: (d.earnings as string) || (d.totalEarnings as string) || FALLBACK_OBSERVER.earnings,
      bond: (d.bond as string) || FALLBACK_OBSERVER.bond,
      lastChallenge: (d.lastChallenge as string) || FALLBACK_OBSERVER.lastChallenge,
      status: (d.status as string) || FALLBACK_OBSERVER.status,
      successfulChallenges: (d.successfulChallenges as number) ?? FALLBACK_OBSERVER.successfulChallenges,
      failedChallenges: (d.failedChallenges as number) ?? FALLBACK_OBSERVER.failedChallenges,
      registeredAt: (d.registeredAt as string) ||
        (typeof d.registeredAt === 'number' ? new Date(d.registeredAt).toLocaleString('ja-JP') : FALLBACK_OBSERVER.registeredAt),
      avgResponseTime: (d.avgResponseTime as string) || FALLBACK_OBSERVER.avgResponseTime,
      recentChallenges: (d.recentChallenges as ObserverDetailData['recentChallenges']) || FALLBACK_OBSERVER.recentChallenges,
    };
  };

  // Use API data or fallback
  const observer = observerQuery.data ? mapApiData(observerQuery.data) : { ...FALLBACK_OBSERVER, id };

  // Show loading skeleton only for initial load
  if (observerQuery.isLoading && !observerQuery.data) {
    return <DetailSkeleton />;
  }

  const statusConfig = STATUS_CONFIG[observer.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.active;
  const StatusIcon = statusConfig.icon;
  const successRateNum = parseFloat(observer.successRate);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/qs-admin/observer/list">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center space-x-3">
            <div className={cn('h-12 w-12 rounded-lg flex items-center justify-center', statusConfig.bg)}>
              <Eye className={cn('h-6 w-6', statusConfig.color)} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{t('detail.title')}</h1>
              <p className="text-foreground-secondary">{observer.id}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={cn('inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium capitalize', statusConfig.bg, statusConfig.color)}>
            <StatusIcon className="h-4 w-4 mr-1.5" />
            {t(`status.${observer.status}`)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('detail.basicInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-foreground-secondary">{t('table.wallet')}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <code className="font-mono text-sm bg-surface px-3 py-2 rounded-lg flex-1">{observer.wallet}</code>
                  <Button variant="ghost" size="icon" onClick={() => copyToClipboard(observer.wallet)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div>
                  <p className="text-sm text-foreground-secondary">{t('table.bond')}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Coins className="h-5 w-5 text-gold" />
                    <span className="text-xl font-bold">{observer.bond}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-foreground-secondary">{t('detail.registeredAt')}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Clock className="h-4 w-4 text-foreground-tertiary" />
                    <span>{observer.registeredAt}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('detail.performanceInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-surface rounded-lg">
                  <p className="text-sm text-foreground-secondary">{t('table.challenges')}</p>
                  <p className="text-2xl font-bold mt-1">{observer.challenges}</p>
                </div>
                <div className="p-4 bg-surface rounded-lg">
                  <p className="text-sm text-foreground-secondary">{t('table.successRate')}</p>
                  <p className={cn('text-2xl font-bold mt-1', successRateNum >= 95 ? 'text-success' : successRateNum >= 85 ? 'text-warning' : 'text-danger')}>
                    {observer.successRate}
                  </p>
                </div>
                <div className="p-4 bg-surface rounded-lg">
                  <p className="text-sm text-foreground-secondary">{t('detail.successfulChallenges')}</p>
                  <p className="text-2xl font-bold mt-1 text-success">{observer.successfulChallenges}</p>
                </div>
                <div className="p-4 bg-surface rounded-lg">
                  <p className="text-sm text-foreground-secondary">{t('detail.failedChallenges')}</p>
                  <p className="text-2xl font-bold mt-1 text-danger">{observer.failedChallenges}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div>
                  <p className="text-sm text-foreground-secondary">{t('detail.totalEarnings')}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <TrendingUp className="h-5 w-5 text-success" />
                    <span className="text-xl font-bold text-success">{observer.earnings}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-foreground-secondary">{t('detail.avgResponseTime')}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Activity className="h-4 w-4 text-foreground-tertiary" />
                    <span className="font-medium">{observer.avgResponseTime}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Challenges */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">{t('detail.recentChallenges')}</CardTitle>
              <Link href={`/qs-admin/transactions/challenge?observer=${id}`}>
                <Button variant="ghost" size="sm">
                  {t('detail.viewAllChallenges')}
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">ID</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">Target</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">Result</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">Reward</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {observer.recentChallenges.map((challenge) => (
                      <tr key={challenge.id} className="border-b border-border hover:bg-surface transition-colors">
                        <td className="py-3 px-4">
                          <Link href={`/qs-admin/transactions/challenge/${challenge.id}`} className="text-hinomaru hover:underline font-mono text-sm">
                            {challenge.id}
                          </Link>
                        </td>
                        <td className="py-3 px-4 font-mono text-sm">{challenge.target}</td>
                        <td className="py-3 px-4">
                          <span className={cn('inline-flex items-center px-2 py-1 rounded-md text-xs font-medium capitalize', CHALLENGE_RESULT_COLORS[challenge.result as keyof typeof CHALLENGE_RESULT_COLORS])}>
                            {challenge.result === 'success' ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                            {challenge.result}
                          </span>
                        </td>
                        <td className={cn('py-3 px-4 font-medium', challenge.result === 'success' ? 'text-success' : 'text-foreground-tertiary')}>
                          {challenge.reward}
                        </td>
                        <td className="py-3 px-4 text-sm text-foreground-secondary">{challenge.timestamp}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('table.actions')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {observer.status === 'active' && (
                <Button variant="outline" className="w-full text-warning border-warning hover:bg-warning/10">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  {t('actions.suspend')}
                </Button>
              )}
              {observer.status === 'inactive' && (
                <Button variant="outline" className="w-full text-success border-success hover:bg-success/10">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {t('actions.activate')}
                </Button>
              )}
              <a
                href={`https://etherscan.io/address/${observer.wallet}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full"
              >
                <Button variant="ghost" className="w-full">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {t('actions.viewOnExplorer')}
                </Button>
              </a>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-foreground-secondary">{t('table.lastActive')}</p>
                  <p className="font-medium">{observer.lastChallenge}</p>
                </div>
                <div>
                  <p className="text-sm text-foreground-secondary">{t('table.challenges')}</p>
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-hinomaru" />
                    <span className="font-medium">{observer.challenges}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-foreground-secondary">{t('table.successRate')}</p>
                  <div className="flex items-center space-x-2">
                    <div className="w-full h-2 bg-surface rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full', successRateNum >= 95 ? 'bg-success' : successRateNum >= 85 ? 'bg-warning' : 'bg-danger')}
                        style={{ width: `${successRateNum}%` }}
                      />
                    </div>
                    <span className={cn('font-medium', successRateNum >= 95 ? 'text-success' : successRateNum >= 85 ? 'text-warning' : 'text-danger')}>
                      {observer.successRate}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
