'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  Server,
  Activity,
  Clock,
  Shield,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ArrowLeft,
  ExternalLink,
  Copy,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface ProverDetailProps {
  proverId: string;
  locale?: string;
}

// Default prover data for initial state
const DEFAULT_PROVER_DATA: Record<string, {
  id: string;
  name: string;
  address: string;
  fullAddress: string;
  stake: string;
  uptime: number;
  responseTime: string;
  signaturesCount: number;
  dailySignatures: number;
  status: 'active' | 'warning' | 'offline';
  lastActive: string;
  registeredAt: string;
  uptimeHistory: { date: string; uptime: number }[];
  recentSignatures: {
    unlockId: string;
    timestamp: string;
    responseTime: string;
    status: 'success' | 'pending';
  }[];
}> = {
  'prover-1': {
    id: 'prover-1',
    name: 'Prover Alpha',
    address: '0x1a2b...3c4d',
    fullAddress: '0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t',
    stake: '100.00',
    uptime: 99.99,
    responseTime: '0.8s',
    signaturesCount: 8234,
    dailySignatures: 45,
    status: 'active',
    lastActive: '2 min ago',
    registeredAt: '2024-01-15',
    uptimeHistory: [
      { date: '2026-01-01', uptime: 99.9 },
      { date: '2026-01-08', uptime: 99.95 },
      { date: '2026-01-15', uptime: 99.99 },
      { date: '2026-01-22', uptime: 99.98 },
    ],
    recentSignatures: [
      { unlockId: 'UNL-1234', timestamp: '2026-01-24 14:30', responseTime: '0.7s', status: 'success' },
      { unlockId: 'UNL-1233', timestamp: '2026-01-24 14:15', responseTime: '0.9s', status: 'success' },
      { unlockId: 'UNL-1232', timestamp: '2026-01-24 13:45', responseTime: '0.8s', status: 'success' },
      { unlockId: 'UNL-1231', timestamp: '2026-01-24 12:00', responseTime: '0.6s', status: 'success' },
      { unlockId: 'UNL-1230', timestamp: '2026-01-24 11:30', responseTime: '1.0s', status: 'success' },
    ],
  },
  'prover-4': {
    id: 'prover-4',
    name: 'Prover Delta',
    address: '0x3m4n...5o6p',
    fullAddress: '0x3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f',
    stake: '100.00',
    uptime: 99.88,
    responseTime: '1.5s',
    signaturesCount: 5421,
    dailySignatures: 32,
    status: 'warning',
    lastActive: '3 min ago',
    registeredAt: '2024-03-20',
    uptimeHistory: [
      { date: '2026-01-01', uptime: 99.5 },
      { date: '2026-01-08', uptime: 99.3 },
      { date: '2026-01-15', uptime: 99.7 },
      { date: '2026-01-22', uptime: 99.88 },
    ],
    recentSignatures: [
      { unlockId: 'UNL-1234', timestamp: '2026-01-24 14:30', responseTime: '1.4s', status: 'success' },
      { unlockId: 'UNL-1228', timestamp: '2026-01-24 10:00', responseTime: '1.6s', status: 'success' },
      { unlockId: 'UNL-1225', timestamp: '2026-01-24 08:15', responseTime: '1.5s', status: 'success' },
    ],
  },
};

function getStatusColor(status: 'active' | 'warning' | 'offline') {
  switch (status) {
    case 'active':
      return 'bg-success text-success';
    case 'warning':
      return 'bg-warning text-warning';
    case 'offline':
      return 'bg-danger text-danger';
  }
}

function getStatusIcon(status: 'active' | 'warning' | 'offline') {
  switch (status) {
    case 'active':
      return CheckCircle;
    case 'warning':
      return AlertTriangle;
    case 'offline':
      return XCircle;
  }
}

export function ProverDetail({ proverId, locale = 'ja' }: ProverDetailProps) {
  const t = useTranslations('explorer.proverDetail');
  const tCommon = useTranslations('explorer.common');

  const prover = DEFAULT_PROVER_DATA[proverId] || DEFAULT_PROVER_DATA['prover-1'];

  if (!prover) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <XCircle className="w-12 h-12 text-danger mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">{t('notFound.title')}</h2>
          <p className="text-foreground-secondary mb-6">{t('notFound.description')}</p>
          <Link href="/explorer/provers">
            <Button variant="primary">{t('notFound.backToProvers')}</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const StatusIcon = getStatusIcon(prover.status);
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = useCallback(() => {
    navigator.clipboard.writeText(prover.fullAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [prover.fullAddress]);

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        {/* Premium Background */}
        <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
          <div
            className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[800px] h-[600px] opacity-50"
            style={{
              background: 'radial-gradient(ellipse, rgba(188, 0, 45, 0.12), transparent 60%)',
            }}
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-8 py-8">
          {/* Header */}
          <header className="flex justify-between items-center mb-8">
            <Link href={`/${locale}/explorer/overview`} className="flex items-center gap-3 group">
              <div className="relative w-12 h-12 flex items-center justify-center">
                <div
                  className="absolute inset-0 border border-gold rounded-full animate-[spin_25s_linear_infinite]"
                  aria-hidden="true"
                >
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-gold rounded-full" />
                </div>
                <div className="w-6 h-6 bg-hinomaru rounded-full shadow-[0_0_20px_rgba(188,0,45,0.4)]" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-semibold text-foreground group-hover:text-gold transition-colors">
                  Quantum Shield
                </span>
                <span className="text-[10px] text-gold tracking-[2px] uppercase">
                  Explorer
                </span>
              </div>
            </Link>

            {/* Navigation */}
            <nav className="hidden lg:flex gap-1 bg-background-secondary rounded-full p-1 border border-border/30">
              {['overview', 'locks', 'unlocks', 'challenges', 'provers', 'analytics'].map((item) => (
                <Link
                  key={item}
                  href={`/${locale}/explorer/${item}`}
                  className={cn(
                    'px-5 py-2 text-sm font-medium rounded-full transition-all',
                    item === 'provers'
                      ? 'bg-background-tertiary text-foreground'
                      : 'text-foreground-secondary hover:text-foreground'
                  )}
                >
                  {tCommon(`header.${item}`)}
                </Link>
              ))}
            </nav>
          </header>

          {/* Breadcrumb */}
          <nav className="mb-6" aria-label="Breadcrumb">
            <ol className="flex items-center gap-2 text-sm">
              <li>
                <Link
                  href={`/${locale}/explorer/provers`}
                  className="text-foreground-secondary hover:text-gold transition-colors flex items-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {t('breadcrumb.provers')}
                </Link>
              </li>
              <li className="text-foreground-tertiary">/</li>
              <li className="text-foreground">{t('breadcrumb.detail')}</li>
            </ol>
          </nav>

          {/* Prover Header Card */}
          <Card className="p-6 mb-8">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gold/10 rounded-xl flex items-center justify-center">
                  <Server className="w-8 h-8 text-gold" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{prover.name}</h1>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-sm text-foreground-tertiary font-mono">{prover.address}</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={handleCopyAddress}
                          className={cn(
                            "text-foreground-tertiary hover:text-gold transition-colors p-2 -m-2 rounded",
                            copied && "text-success"
                          )}
                          aria-label={t('actions.copyAddress')}
                        >
                          {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{copied ? 'Copied!' : t('actions.copyAddress')}</p>
                      </TooltipContent>
                    </Tooltip>
                    <Badge className={cn('gap-1', getStatusColor(prover.status).replace('bg-', 'bg-').split(' ')[0] + '/10', getStatusColor(prover.status).split(' ')[1])}>
                      <StatusIcon className="w-3 h-3" />
                      {t(`status.${prover.status}`)}
                    </Badge>
                  </div>
                </div>
              </div>
              <a
                href={`https://etherscan.io/address/${prover.fullAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gold hover:underline text-sm"
              >
                {t('actions.viewOnEtherscan')}
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <Activity className="w-5 h-5 text-success" />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-sm text-foreground-secondary cursor-help">
                      {t('fields.uptime')}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('fields.uptimeTooltip')}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className={cn(
                'text-2xl font-bold',
                prover.uptime >= 99.5 ? 'text-success' : 'text-warning'
              )}>
                {prover.uptime}%
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <Clock className="w-5 h-5 text-foreground-secondary" />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-sm text-foreground-secondary cursor-help">
                      {t('fields.responseTime')}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('fields.responseTimeTooltip')}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="text-2xl font-bold">{prover.responseTime}</div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <Shield className="w-5 h-5 text-hinomaru" />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-sm text-foreground-secondary cursor-help">
                      {t('fields.totalSignatures')}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('fields.totalSignaturesTooltip')}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="text-2xl font-bold">{prover.signaturesCount.toLocaleString()}</div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <TrendingUp className="w-5 h-5 text-gold" />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-sm text-foreground-secondary cursor-help">
                      {t('fields.dailySignatures')}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('fields.dailySignaturesTooltip')}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="text-2xl font-bold">{prover.dailySignatures}</div>
            </Card>
          </div>

          {/* Details Grid */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Overview Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('sections.overview')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-foreground-tertiary">{t('fields.proverId')}</span>
                  <span className="font-mono">{prover.id}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-foreground-tertiary">{t('fields.name')}</span>
                  <span>{prover.name}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/50">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-foreground-tertiary cursor-help">{t('fields.stake')}</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('fields.stakeTooltip')}</p>
                    </TooltipContent>
                  </Tooltip>
                  <span className="font-mono">{prover.stake} ETH</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-foreground-tertiary">{t('fields.registeredAt')}</span>
                  <span>{prover.registeredAt}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-foreground-tertiary">{t('fields.lastActive')}</span>
                  <span>{prover.lastActive}</span>
                </div>
              </CardContent>
            </Card>

            {/* Uptime Chart Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('chart.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48 flex items-center justify-center border border-dashed border-border rounded-lg">
                  <div className="text-center">
                    <TrendingUp className="w-8 h-8 text-foreground-tertiary mx-auto mb-2" />
                    <p className="text-sm text-foreground-tertiary">
                      {t('chart.uptime')}: {prover.uptime}%
                    </p>
                  </div>
                </div>
                <div className="flex justify-between mt-4 text-xs text-foreground-tertiary">
                  <span>30 days ago</span>
                  <span className="text-success">{t('chart.target')}: 99.5%</span>
                  <span>Today</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Signatures Table */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-base">{t('recentSignatures.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              {prover.recentSignatures.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full" aria-label={t('recentSignatures.title')}>
                    <thead>
                      <tr className="border-b border-border text-left text-sm text-foreground-tertiary">
                        <th className="pb-3 font-medium">{t('recentSignatures.table.unlockId')}</th>
                        <th className="pb-3 font-medium">{t('recentSignatures.table.timestamp')}</th>
                        <th className="pb-3 font-medium">{t('recentSignatures.table.responseTime')}</th>
                        <th className="pb-3 font-medium">{t('recentSignatures.table.status')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {prover.recentSignatures.map((sig, index) => (
                        <tr key={index} className="hover:bg-surface/50">
                          <td className="py-3">
                            <Link
                              href={`/${locale}/explorer/unlocks/${sig.unlockId}`}
                              className="font-mono text-gold hover:underline"
                            >
                              {sig.unlockId}
                            </Link>
                          </td>
                          <td className="py-3 text-foreground-secondary">{sig.timestamp}</td>
                          <td className="py-3 font-mono">{sig.responseTime}</td>
                          <td className="py-3">
                            <Badge className="bg-success/10 text-success gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Success
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-8 text-center text-foreground-tertiary">
                  {t('recentSignatures.empty')}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  );
}

export default ProverDetail;
