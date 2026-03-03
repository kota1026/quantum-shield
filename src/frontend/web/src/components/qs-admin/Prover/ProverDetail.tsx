'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  ExternalLink,
  CheckCircle,
  XCircle,
  Pause,
  Play,
  Coins,
  Copy,
  Server,
  Activity,
  TrendingUp,
  Cpu,
  HardDrive,
  Clock,
  Shield,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useProverDetail } from '@/hooks/admin/useProvers';

interface ProverDetailProps {
  id: string;
}

// Default data - Used when API is unavailable
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
  registeredAt: string;
  infrastructure: string;
  hardwareSpecs: string;
  networkBandwidth: string;
  totalRewards: string;
  avgResponseTime: string;
  challengesReceived: number;
  challengesPassed: number;
  challengesFailed: number;
  recentProofs: Array<{
    id: string;
    type: string;
    amount: string;
    timestamp: string;
    status: string;
  }>;
}

const DEFAULT_PROVER: DefaultProver = {
  id: 'PRV-001',
  name: 'Prover Alpha Corp',
  wallet: '0x1234567890abcdef1234567890abcdef12345678',
  staked: '50,000 QS',
  uptime: '99.9%',
  proofCount: 12450,
  lastProof: '2024-01-27 14:30',
  status: 'active',
  tier: 'enterprise',
  cpu: '85%',
  memory: '72%',
  registeredAt: '2023-06-15 10:00',
  infrastructure: 'AWS Tokyo',
  hardwareSpecs: '64 vCPU, 256GB RAM, 4TB NVMe SSD',
  networkBandwidth: '10 Gbps dedicated',
  totalRewards: '125,000 QS',
  avgResponseTime: '0.8s',
  challengesReceived: 156,
  challengesPassed: 154,
  challengesFailed: 2,
  recentProofs: [
    { id: 'PF-12450', type: 'lock', amount: '10.5 ETH', timestamp: '2024-01-27 14:30', status: 'success' },
    { id: 'PF-12449', type: 'unlock', amount: '5.0 ETH', timestamp: '2024-01-27 14:25', status: 'success' },
    { id: 'PF-12448', type: 'lock', amount: '25.0 ETH', timestamp: '2024-01-27 14:20', status: 'success' },
    { id: 'PF-12447', type: 'lock', amount: '3.5 ETH', timestamp: '2024-01-27 14:15', status: 'success' },
    { id: 'PF-12446', type: 'unlock', amount: '15.0 ETH', timestamp: '2024-01-27 14:10', status: 'success' },
  ],
};

const STATUS_CONFIG = {
  active: { icon: CheckCircle, color: 'text-success', bg: 'bg-success/10', label: 'アクティブ' },
  suspended: { icon: XCircle, color: 'text-danger', bg: 'bg-danger/10', label: '停止中' },
  maintenance: { icon: Pause, color: 'text-warning', bg: 'bg-warning/10', label: 'メンテナンス中' },
  inactive: { icon: XCircle, color: 'text-foreground-tertiary', bg: 'bg-foreground-tertiary/10', label: '非アクティブ' },
};

const TIER_CONFIG = {
  standard: { color: 'text-foreground-tertiary', bg: 'bg-foreground-tertiary/10' },
  professional: { color: 'text-info', bg: 'bg-info/10' },
  enterprise: { color: 'text-gold', bg: 'bg-gold/10' },
};

// Loading skeleton components
function DetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="h-10 w-10 bg-muted rounded animate-pulse" />
          <div className="space-y-2">
            <div className="h-6 w-48 bg-muted rounded animate-pulse" />
            <div className="h-4 w-24 bg-muted rounded animate-pulse" />
          </div>
        </div>
        <div className="flex space-x-2">
          <div className="h-8 w-24 bg-muted rounded-full animate-pulse" />
          <div className="h-8 w-24 bg-muted rounded-full animate-pulse" />
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="h-6 w-32 bg-muted rounded animate-pulse" />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                  <div className="h-5 w-32 bg-muted rounded animate-pulse" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                  <div className="h-5 w-24 bg-muted rounded animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="h-6 w-24 bg-muted rounded animate-pulse" />
              <div className="h-10 w-full bg-muted rounded animate-pulse" />
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
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <AlertTriangle className="h-12 w-12 text-warning mb-4" />
      <p className="text-lg font-medium mb-2">Failed to load prover details</p>
      <p className="text-sm text-muted-foreground mb-6">{message}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      )}
    </div>
  );
}

export function ProverDetail({ id }: ProverDetailProps) {
  const t = useTranslations('qsAdmin.prover');
  const tCommon = useTranslations('qsAdmin.common');

  // React Query hook
  const proverQuery = useProverDetail(id);

  // Use API data or fallback
  const apiProver = proverQuery.data;

  // Build prover object from API data or fallback
  const prover: DefaultProver = apiProver ? {
    id: apiProver.id,
    name: apiProver.name,
    wallet: apiProver.operatorAddress,
    staked: apiProver.stake,
    uptime: apiProver.metrics?.uptimePercentage ? `${apiProver.metrics.uptimePercentage}%` : '0%',
    proofCount: apiProver.metrics?.totalSignatures || 0,
    lastProof: '-',
    status: apiProver.status,
    tier: apiProver.tier || 'standard',
    cpu: '-',
    memory: '-',
    registeredAt: apiProver.registeredAt ? new Date(apiProver.registeredAt).toLocaleString('ja-JP') : '-',
    infrastructure: '-',
    hardwareSpecs: '-',
    networkBandwidth: '-',
    totalRewards: apiProver.metrics?.totalRewards || '0 QS',
    avgResponseTime: apiProver.metrics?.avgResponseTimeMs ? `${apiProver.metrics.avgResponseTimeMs}ms` : '-',
    challengesReceived: 0,
    challengesPassed: 0,
    challengesFailed: 0,
    recentProofs: [],
  } : { ...DEFAULT_PROVER, id };

  const statusConfig = STATUS_CONFIG[prover.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.active;
  const tierConfig = TIER_CONFIG[prover.tier as keyof typeof TIER_CONFIG] || TIER_CONFIG.standard;
  const StatusIcon = statusConfig.icon;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleSuspend = () => {
    alert(t('actions.suspendConfirm'));
  };

  const handleResume = () => {
    alert(t('actions.resumeConfirm'));
  };

  // Loading state
  if (proverQuery.isLoading) {
    return <DetailSkeleton />;
  }

  // Error state (still show fallback data)
  if (proverQuery.isError && !prover) {
    return <ErrorState message={proverQuery.error?.message || 'Unknown error'} onRetry={() => proverQuery.refetch()} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/qs-admin/prover/list">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center space-x-3">
            <div className={cn('h-12 w-12 rounded-lg flex items-center justify-center', statusConfig.bg)}>
              <Server className={cn('h-6 w-6', statusConfig.color)} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{t('listDetail.title')}</h1>
              <p className="text-foreground-secondary">{prover.id}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={cn('inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium', statusConfig.bg, statusConfig.color)}>
            <StatusIcon className="h-4 w-4 mr-1.5" />
            {t(`status.${prover.status}`)}
          </span>
          <span className={cn('inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium capitalize', tierConfig.bg, tierConfig.color)}>
            {prover.tier}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('listDetail.basicInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-foreground-secondary">{t('table.name')}</p>
                  <p className="font-medium mt-1">{prover.name}</p>
                </div>
                <div>
                  <p className="text-sm text-foreground-secondary">{t('table.tier')}</p>
                  <span className={cn('inline-flex items-center px-2 py-1 rounded-md text-xs font-medium capitalize mt-1', tierConfig.bg, tierConfig.color)}>
                    {prover.tier}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <p className="text-sm text-foreground-secondary mb-2">{t('table.wallet')}</p>
                <div className="flex items-center space-x-2">
                  <code className="font-mono text-sm bg-surface px-3 py-2 rounded-lg flex-1">{prover.wallet}</code>
                  <Button variant="ghost" size="icon" onClick={() => copyToClipboard(prover.wallet)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <a href={`https://etherscan.io/address/${prover.wallet}`} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="icon">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </a>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <p className="text-sm text-foreground-secondary">{t('table.staked')}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <Coins className="h-5 w-5 text-gold" />
                  <span className="text-xl font-bold">{prover.staked}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div>
                  <p className="text-sm text-foreground-secondary">{t('listDetail.registeredAt')}</p>
                  <p className="font-medium mt-1">{prover.registeredAt}</p>
                </div>
                <div>
                  <p className="text-sm text-foreground-secondary">{t('listDetail.lastProof')}</p>
                  <p className="font-medium mt-1">{prover.lastProof}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('listDetail.performance')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-surface rounded-lg">
                  <Activity className="h-6 w-6 text-hinomaru mx-auto mb-2" />
                  <p className="text-2xl font-bold">{prover.uptime}</p>
                  <p className="text-xs text-foreground-secondary">{t('table.uptime')}</p>
                </div>
                <div className="text-center p-4 bg-surface rounded-lg">
                  <Shield className="h-6 w-6 text-success mx-auto mb-2" />
                  <p className="text-2xl font-bold">{prover.proofCount.toLocaleString()}</p>
                  <p className="text-xs text-foreground-secondary">{t('table.proofs')}</p>
                </div>
                <div className="text-center p-4 bg-surface rounded-lg">
                  <Clock className="h-6 w-6 text-info mx-auto mb-2" />
                  <p className="text-2xl font-bold">{prover.avgResponseTime}</p>
                  <p className="text-xs text-foreground-secondary">{t('listDetail.avgResponseTime')}</p>
                </div>
                <div className="text-center p-4 bg-surface rounded-lg">
                  <Coins className="h-6 w-6 text-gold mx-auto mb-2" />
                  <p className="text-2xl font-bold">{prover.totalRewards}</p>
                  <p className="text-xs text-foreground-secondary">{t('listDetail.totalRewards')}</p>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-border">
                <h4 className="text-sm font-medium mb-4">{t('listDetail.resources')}</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="flex items-center">
                        <Cpu className="h-4 w-4 mr-2 text-foreground-tertiary" />
                        CPU
                      </span>
                      <span className="font-medium">{prover.cpu}</span>
                    </div>
                    <div className="h-2 bg-surface rounded-full overflow-hidden">
                      <div className="h-full bg-hinomaru rounded-full" style={{ width: prover.cpu }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="flex items-center">
                        <HardDrive className="h-4 w-4 mr-2 text-foreground-tertiary" />
                        {t('listDetail.memory')}
                      </span>
                      <span className="font-medium">{prover.memory}</span>
                    </div>
                    <div className="h-2 bg-surface rounded-full overflow-hidden">
                      <div className="h-full bg-info rounded-full" style={{ width: prover.memory }} />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Proofs */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">{t('listDetail.recentProofs')}</CardTitle>
              <Link href={`/qs-admin/transactions?prover=${prover.id}`}>
                <Button variant="outline" size="sm">
                  {t('listDetail.viewAllProofs')}
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {prover.recentProofs.map((proof) => (
                  <Link key={proof.id} href={`/qs-admin/transactions/${proof.type}/${proof.id}`}>
                    <div className="flex items-center justify-between p-3 bg-surface rounded-lg hover:bg-surface/80 transition-colors cursor-pointer">
                      <div className="flex items-center space-x-3">
                        <Shield className={cn('h-5 w-5', proof.status === 'success' ? 'text-success' : 'text-danger')} />
                        <div>
                          <p className="font-medium text-sm">{proof.id}</p>
                          <p className="text-xs text-foreground-secondary">{proof.timestamp}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{proof.amount}</p>
                        <p className={cn('text-xs', proof.status === 'success' ? 'text-success' : 'text-danger')}>
                          {proof.status === 'success' ? t('status.active') : t('status.suspended')}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('listDetail.actions')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {prover.status === 'active' && (
                <Button
                  variant="outline"
                  className="w-full text-warning border-warning hover:bg-warning/10"
                  onClick={handleSuspend}
                >
                  <Pause className="h-4 w-4 mr-2" />
                  {t('actions.suspend')}
                </Button>
              )}
              {prover.status === 'suspended' && (
                <Button
                  variant="outline"
                  className="w-full text-success border-success hover:bg-success/10"
                  onClick={handleResume}
                >
                  <Play className="h-4 w-4 mr-2" />
                  {t('actions.resume')}
                </Button>
              )}
              <a href={`https://etherscan.io/address/${prover.wallet}`} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="w-full">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {t('listDetail.viewOnExplorer')}
                </Button>
              </a>
            </CardContent>
          </Card>

          {/* Challenge Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('listDetail.challengeStats')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-foreground-secondary">{t('listDetail.challengesReceived')}</span>
                  <span className="font-medium">{prover.challengesReceived}</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-foreground-secondary">{t('listDetail.challengesPassed')}</span>
                  <span className="font-medium text-success">{prover.challengesPassed}</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-foreground-secondary">{t('listDetail.challengesFailed')}</span>
                  <span className="font-medium text-danger">{prover.challengesFailed}</span>
                </div>
              </div>
              <div className="pt-4 border-t border-border">
                <div className="flex justify-between text-sm">
                  <span className="text-foreground-secondary">{t('listDetail.successRate')}</span>
                  <span className="font-medium text-success">
                    {((prover.challengesPassed / prover.challengesReceived) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Infrastructure */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <div>
                <p className="text-sm text-foreground-secondary">{t('table.infrastructure')}</p>
                <p className="font-medium mt-1">{prover.infrastructure}</p>
              </div>
              <div>
                <p className="text-sm text-foreground-secondary">{t('listDetail.hardwareSpecs')}</p>
                <p className="font-medium mt-1 text-sm">{prover.hardwareSpecs}</p>
              </div>
              <div>
                <p className="text-sm text-foreground-secondary">{t('listDetail.networkBandwidth')}</p>
                <p className="font-medium mt-1">{prover.networkBandwidth}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
