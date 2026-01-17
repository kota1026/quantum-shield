'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  Coins,
  Bell,
  Lock,
  Swords,
  LogOut,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
  Unlock,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Mock data
const mockStats = {
  pendingSignatures: 12,
  urgentCount: 4,
  todaysProcessed: 847,
  avgProcessed: 720,
  processedChange: 18,
  responseTime: 28.2,
  responseTimeChange: 2.1,
  slaMaxTime: 30,
  uptime: 99.97,
  slaMinUptime: 99.9,
};

const mockQueueItems = [
  {
    id: 'req-001',
    type: 'unlock',
    address: '0x7a3f...9c2d',
    route: 'L1→L3',
    amount: '5.25',
    time: '2m 34s',
  },
  {
    id: 'req-002',
    type: 'unlock',
    address: '0x8b2c...1e5a',
    route: 'L1→L3',
    amount: '12.00',
    time: '4m 12s',
  },
  {
    id: 'req-003',
    type: 'emergency',
    address: '0x3d9f...7c4b',
    route: 'Emergency',
    amount: '2.50',
    time: '8m 45s',
  },
];

const mockPerformance = [
  { key: 'responseTime', value: 28.2, max: 30, unit: 's', status: 'warning' },
  { key: 'successRate', value: 99.8, max: 100, unit: '%', status: 'good' },
  { key: 'uptime', value: 99.97, max: 100, unit: '%', status: 'good' },
  { key: 'hsmHealth', value: 100, max: 100, unit: '', status: 'good', label: 'Healthy' },
];

const mockRewards = {
  claimable: 4.82,
  pending: 1.24,
  thisMonth: 12.45,
  allTime: 156.8,
};

const mockStake = {
  amount: 150.0,
  usdValue: 412500,
  status: 'safe',
  challenges: 0,
};

const mockTodaySummary = {
  signatures: 847,
  volume: 2451,
  feesEarned: 0.48,
  rank: 12,
  totalProvers: 127,
};

export function ProverDashboard() {
  const t = useTranslations('prover');

  const navItems = [
    { key: 'dashboard', icon: LayoutDashboard, href: '/prover/dashboard', active: true },
    { key: 'queue', icon: FileText, href: '/prover/queue', badge: 12 },
    { key: 'metrics', icon: BarChart3, href: '/prover/metrics' },
    { key: 'rewards', icon: Coins, href: '/prover/rewards' },
  ];

  const managementItems = [
    { key: 'alerts', icon: Bell, href: '/prover/alerts', badge: 2, badgeVariant: 'warning' as const },
    { key: 'stake', icon: Lock, href: '/prover/stake' },
    { key: 'challenges', icon: Swords, href: '/prover/challenges' },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-4 focus:left-4 focus:bg-hinomaru focus:text-white focus:px-4 focus:py-2 focus:rounded-lg"
      >
        Skip to main content
      </a>

      {/* Sidebar */}
      <aside className="w-64 bg-background-secondary border-r border-surface-tertiary p-6 flex flex-col">
        <Link href="/prover/landing" className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 relative flex items-center justify-center">
            <div
              className="absolute inset-0 border-[1.5px] border-gold rounded-full animate-spin"
              style={{ animationDuration: '25s' }}
            />
            <div className="w-5 h-5 bg-hinomaru rounded-full shadow-glow-hinomaru" />
          </div>
          <div>
            <div className="text-base font-semibold">Quantum Shield</div>
            <div className="text-[10px] text-gold tracking-[1px]">Prover Portal</div>
          </div>
        </Link>

        <nav className="flex-1" aria-label={t('dashboard.nav.operations')}>
          <div className="text-[10px] uppercase tracking-[1.5px] text-foreground-tertiary px-3 mb-2">
            {t('dashboard.nav.operations')}
          </div>
          {navItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium mb-1 transition-colors ${
                item.active
                  ? 'bg-hinomaru/10 text-hinomaru-400'
                  : 'text-foreground-secondary hover:bg-surface hover:text-foreground'
              }`}
              aria-current={item.active ? 'page' : undefined}
            >
              <item.icon className="h-[18px] w-[18px]" aria-hidden="true" />
              {t(`dashboard.nav.${item.key}`)}
              {item.badge && (
                <Badge variant="danger" className="ml-auto text-[11px] px-2 py-0.5">
                  {item.badge}
                </Badge>
              )}
            </Link>
          ))}

          <div className="text-[10px] uppercase tracking-[1.5px] text-foreground-tertiary px-3 mb-2 mt-6">
            {t('dashboard.nav.management')}
          </div>
          {managementItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-foreground-secondary hover:bg-surface hover:text-foreground mb-1 transition-colors"
            >
              <item.icon className="h-[18px] w-[18px]" aria-hidden="true" />
              {t(`dashboard.nav.${item.key}`)}
              {item.badge && (
                <Badge variant={item.badgeVariant || 'danger'} className="ml-auto text-[11px] px-2 py-0.5">
                  {item.badge}
                </Badge>
              )}
            </Link>
          ))}

          <div className="text-[10px] uppercase tracking-[1.5px] text-foreground-tertiary px-3 mb-2 mt-6">
            {t('dashboard.nav.account')}
          </div>
          <Link
            href="/prover/exit"
            className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-foreground-secondary hover:bg-surface hover:text-foreground transition-colors"
          >
            <LogOut className="h-[18px] w-[18px]" aria-hidden="true" />
            {t('dashboard.nav.exit')}
          </Link>
        </nav>

        {/* Prover Status */}
        <div className="mt-auto p-4 bg-surface rounded-xl">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 bg-success rounded-full animate-pulse" aria-hidden="true" />
            <div>
              <div className="text-sm font-semibold">Prover #047</div>
              <div className="text-[11px] text-gold">Tier 1 • Active</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main id="main-content" className="flex-1 p-8 overflow-y-auto">
        {/* Alert Banner */}
        <div
          className="flex items-center gap-3 p-4 bg-warning/10 border border-warning rounded-xl mb-6"
          role="alert"
        >
          <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0" aria-hidden="true" />
          <div className="flex-1">
            <div className="text-sm font-semibold text-warning">
              {t('dashboard.alert.slaWarning')}
            </div>
            <div className="text-xs text-foreground-secondary">
              {t('dashboard.alert.responseTime', { current: '28.2', threshold: '30' })}
            </div>
          </div>
          <Button variant="warning" size="sm" asChild>
            <Link href="/prover/alerts">{t('dashboard.alert.viewAlerts')}</Link>
          </Button>
        </div>

        {/* Page Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">{t('dashboard.title')}</h1>
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link href="/prover/metrics">{t('dashboard.actions.viewMetrics')}</Link>
            </Button>
            <Button variant="primary" asChild>
              <Link href="/prover/queue">{t('dashboard.actions.processQueue')}</Link>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <Card className="p-5 relative overflow-hidden hover:border-surface-tertiary transition-colors group">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-hinomaru to-gold opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-foreground-tertiary">
                {t('dashboard.stats.pendingSignatures')}
              </span>
            </div>
            <div className="text-3xl font-bold font-mono text-hinomaru-400">
              {mockStats.pendingSignatures}
            </div>
            <div className="text-xs text-foreground-tertiary mt-1">
              {t('dashboard.stats.urgent', { count: mockStats.urgentCount })}
            </div>
          </Card>

          <Card className="p-5 relative overflow-hidden hover:border-surface-tertiary transition-colors group">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-hinomaru to-gold opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-foreground-tertiary">
                {t('dashboard.stats.todaysProcessed')}
              </span>
              <Badge variant="success" className="text-[11px]">
                <TrendingUp className="h-3 w-3 mr-1" aria-hidden="true" />
                +{mockStats.processedChange}%
              </Badge>
            </div>
            <div className="text-3xl font-bold font-mono">{mockStats.todaysProcessed}</div>
            <div className="text-xs text-foreground-tertiary mt-1">
              {t('dashboard.stats.avgPerDay', { avg: mockStats.avgProcessed })}
            </div>
          </Card>

          <Card className="p-5 relative overflow-hidden hover:border-surface-tertiary transition-colors group">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-hinomaru to-gold opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-foreground-tertiary">
                {t('dashboard.stats.responseTime')}
              </span>
              <Badge variant="danger" className="text-[11px]">
                <TrendingDown className="h-3 w-3 mr-1" aria-hidden="true" />
                +{mockStats.responseTimeChange}s
              </Badge>
            </div>
            <div className="text-3xl font-bold font-mono">
              {mockStats.responseTime}
              <span className="text-sm font-medium text-foreground-secondary ml-1">s</span>
            </div>
            <div className="text-xs text-foreground-tertiary mt-1">
              {t('dashboard.stats.slaMax', { max: mockStats.slaMaxTime })}
            </div>
          </Card>

          <Card className="p-5 relative overflow-hidden hover:border-surface-tertiary transition-colors group">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-hinomaru to-gold opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-foreground-tertiary">
                {t('dashboard.stats.uptime')}
              </span>
              <Badge variant="success" className="text-[11px]">
                {mockStats.uptime}%
              </Badge>
            </div>
            <div className="text-3xl font-bold font-mono">
              {mockStats.uptime}
              <span className="text-sm font-medium text-foreground-secondary ml-1">%</span>
            </div>
            <div className="text-xs text-foreground-tertiary mt-1">
              {t('dashboard.stats.slaMin', { min: mockStats.slaMinUptime })}
            </div>
          </Card>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-[1fr_400px] gap-6">
          {/* Left Column */}
          <div className="space-y-5">
            {/* Signature Queue */}
            <Card>
              <div className="flex justify-between items-center p-5 border-b border-surface-tertiary">
                <h2 className="text-base font-semibold">{t('dashboard.queue.title')}</h2>
                <Link href="/prover/queue" className="text-sm text-gold hover:underline">
                  {t('dashboard.viewAll')} →
                </Link>
              </div>
              <div className="p-5 space-y-2.5">
                {mockQueueItems.map((item) => (
                  <Link
                    key={item.id}
                    href={`/prover/queue/${item.id}`}
                    className="flex items-center gap-4 p-3.5 bg-background-secondary rounded-lg hover:bg-surface transition-colors"
                  >
                    <div className="w-10 h-10 bg-hinomaru/10 rounded-lg flex items-center justify-center">
                      {item.type === 'emergency' ? (
                        <AlertCircle className="h-5 w-5 text-hinomaru" aria-hidden="true" />
                      ) : (
                        <Unlock className="h-5 w-5 text-hinomaru-400" aria-hidden="true" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold">
                        {item.type === 'emergency'
                          ? t('dashboard.queue.emergencyUnlock')
                          : t('dashboard.queue.unlockRequest')}
                      </div>
                      <div className="text-xs text-foreground-tertiary font-mono">
                        {item.address} • {item.route}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold font-mono">{item.amount} ETH</div>
                      <div className="text-[11px] text-warning flex items-center gap-1">
                        <Clock className="h-3 w-3" aria-hidden="true" />
                        {item.time}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>

            {/* Performance Overview */}
            <Card>
              <div className="flex justify-between items-center p-5 border-b border-surface-tertiary">
                <h2 className="text-base font-semibold">{t('dashboard.performance.title')}</h2>
                <Link href="/prover/metrics" className="text-sm text-gold hover:underline">
                  {t('dashboard.details')} →
                </Link>
              </div>
              <div className="p-5 space-y-5">
                {mockPerformance.map((perf) => (
                  <div key={perf.key}>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-foreground-secondary">
                        {t(`dashboard.performance.${perf.key}`)}
                      </span>
                      <span className="text-sm font-semibold font-mono">
                        {perf.label || `${perf.value}${perf.unit}`}
                        {!perf.label && perf.max !== 100 && ` / ${perf.max}${perf.unit}`}
                      </span>
                    </div>
                    <div className="h-2 bg-background rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          perf.status === 'good'
                            ? 'bg-success'
                            : perf.status === 'warning'
                              ? 'bg-warning'
                              : 'bg-danger'
                        }`}
                        style={{ width: `${(perf.value / perf.max) * 100}%` }}
                        role="progressbar"
                        aria-valuenow={perf.value}
                        aria-valuemin={0}
                        aria-valuemax={perf.max}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Rewards */}
            <Card>
              <div className="flex justify-between items-center p-5 border-b border-surface-tertiary">
                <h2 className="text-base font-semibold">{t('dashboard.rewards.title')}</h2>
                <Link href="/prover/rewards" className="text-sm text-gold hover:underline">
                  {t('dashboard.claim')} →
                </Link>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div className="p-4 bg-background-secondary rounded-lg">
                    <div className="text-[11px] uppercase tracking-[0.5px] text-foreground-tertiary mb-1">
                      {t('dashboard.rewards.claimable')}
                    </div>
                    <div className="text-xl font-bold font-mono text-success">
                      {mockRewards.claimable} ETH
                    </div>
                  </div>
                  <div className="p-4 bg-background-secondary rounded-lg">
                    <div className="text-[11px] uppercase tracking-[0.5px] text-foreground-tertiary mb-1">
                      {t('dashboard.rewards.pending')}
                    </div>
                    <div className="text-xl font-bold font-mono">{mockRewards.pending} ETH</div>
                  </div>
                  <div className="p-4 bg-background-secondary rounded-lg">
                    <div className="text-[11px] uppercase tracking-[0.5px] text-foreground-tertiary mb-1">
                      {t('dashboard.rewards.thisMonth')}
                    </div>
                    <div className="text-xl font-bold font-mono">{mockRewards.thisMonth} ETH</div>
                  </div>
                  <div className="p-4 bg-background-secondary rounded-lg">
                    <div className="text-[11px] uppercase tracking-[0.5px] text-foreground-tertiary mb-1">
                      {t('dashboard.rewards.allTime')}
                    </div>
                    <div className="text-xl font-bold font-mono">{mockRewards.allTime} ETH</div>
                  </div>
                </div>
                <Button variant="primary" className="w-full" asChild>
                  <Link href="/prover/rewards">
                    {t('dashboard.rewards.claimAmount', { amount: mockRewards.claimable })}
                  </Link>
                </Button>
              </div>
            </Card>

            {/* Stake Info */}
            <Card className="border-gold">
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Lock className="h-5 w-5" aria-hidden="true" />
                  <span className="text-sm font-semibold">{t('dashboard.stake.title')}</span>
                </div>
                <div className="text-3xl font-bold font-mono mb-2">
                  {mockStake.amount.toFixed(2)} ETH
                </div>
                <div className="text-sm text-foreground-tertiary">
                  ≈ ${mockStake.usdValue.toLocaleString()} USD
                </div>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-surface-tertiary">
                  <div className="w-2 h-2 bg-success rounded-full" aria-hidden="true" />
                  <span className="text-xs text-success">
                    {t('dashboard.stake.noRisk', { challenges: mockStake.challenges })}
                  </span>
                </div>
              </div>
            </Card>

            {/* Today's Summary */}
            <Card>
              <div className="p-5 border-b border-surface-tertiary">
                <h2 className="text-base font-semibold">{t('dashboard.summary.title')}</h2>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-background-secondary rounded-lg">
                    <div className="text-[11px] uppercase tracking-[0.5px] text-foreground-tertiary mb-1">
                      {t('dashboard.summary.signatures')}
                    </div>
                    <div className="text-xl font-bold font-mono">{mockTodaySummary.signatures}</div>
                  </div>
                  <div className="p-4 bg-background-secondary rounded-lg">
                    <div className="text-[11px] uppercase tracking-[0.5px] text-foreground-tertiary mb-1">
                      {t('dashboard.summary.volume')}
                    </div>
                    <div className="text-xl font-bold font-mono">
                      {mockTodaySummary.volume.toLocaleString()} ETH
                    </div>
                  </div>
                  <div className="p-4 bg-background-secondary rounded-lg">
                    <div className="text-[11px] uppercase tracking-[0.5px] text-foreground-tertiary mb-1">
                      {t('dashboard.summary.feesEarned')}
                    </div>
                    <div className="text-xl font-bold font-mono">{mockTodaySummary.feesEarned} ETH</div>
                  </div>
                  <div className="p-4 bg-background-secondary rounded-lg">
                    <div className="text-[11px] uppercase tracking-[0.5px] text-foreground-tertiary mb-1">
                      {t('dashboard.summary.rank')}
                    </div>
                    <div className="text-xl font-bold font-mono">
                      #{mockTodaySummary.rank} / {mockTodaySummary.totalProvers}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
