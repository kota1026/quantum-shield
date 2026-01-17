'use client';

import { useState } from 'react';
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
  Download,
  TrendingUp,
  TrendingDown,
  Zap,
  CheckCircle,
  Clock,
  XCircle,
  PenTool,
  Star,
  Trophy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Mock data
const mockPerformanceStats = {
  uptime: { value: 99.97, change: 2.3, trend: 'up' as const },
  signatures: { value: 12847, change: 5.2, trend: 'up' as const },
  latency: { value: 124, change: -15, trend: 'down' as const },
  violations: { value: 0 },
};

const mockSignatureHistory = [
  { date: '2026/01/17', count: 487, successRate: 100, avgTime: 118, reward: 2435 },
  { date: '2026/01/16', count: 523, successRate: 100, avgTime: 125, reward: 2615 },
  { date: '2026/01/15', count: 412, successRate: 99.8, avgTime: 132, reward: 2060 },
  { date: '2026/01/14', count: 389, successRate: 100, avgTime: 121, reward: 1945 },
  { date: '2026/01/13', count: 445, successRate: 100, avgTime: 128, reward: 2225 },
];

const mockDetailMetrics = [
  { key: 'sphincsSignature', value: 100, status: 'success' as const },
  { key: 'verificationRate', value: 99.9, status: 'success' as const },
  { key: 'slaCompliance', value: 100, status: 'gold' as const },
  { key: 'availability', value: 99.97, status: 'success' as const },
  { key: 'responseTime', value: 85, status: 'gold' as const },
];

const mockRewardsSummary = {
  total: 47520,
  period: 90,
};

const mockRewardsBreakdown = [
  { key: 'signatureRewards', icon: PenTool, count: 12847, rate: 3.5, amount: 44964.5 },
  { key: 'performanceBonus', icon: Star, description: 'SLA 100%', amount: 2248.5 },
  { key: 'earlyAdopterBonus', icon: Trophy, description: 'Phase 1', amount: 307 },
];

const mockPayoutHistory = [
  { date: '2026/03/01', type: 'withdrawal', amount: 15240, address: '0x742d...8bD34', status: 'completed' },
  { date: '2026/02/01', type: 'withdrawal', amount: 14890, address: '0x742d...8bD34', status: 'completed' },
  { date: '2026/01/01', type: 'withdrawal', amount: 13560, address: '0x742d...8bD34', status: 'completed' },
];

const mockChartData = [60, 75, 45, 90, 85, 70, 95, 80, 65, 100, 88, 92];

type TabType = 'performance' | 'rewards';
type PeriodType = '7d' | '30d' | '90d' | 'year';

export function ProverMetrics() {
  const t = useTranslations('prover');
  const [activeTab, setActiveTab] = useState<TabType>('performance');
  const [period, setPeriod] = useState<PeriodType>('90d');

  const navItems = [
    { key: 'dashboard', icon: LayoutDashboard, href: '/prover/dashboard' },
    { key: 'queue', icon: FileText, href: '/prover/queue', badge: 12 },
    { key: 'metrics', icon: BarChart3, href: '/prover/metrics', active: true },
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
        {/* Page Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">{t('metrics.title')}</h1>
          <div className="flex gap-3">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as PeriodType)}
              className="px-4 py-2 bg-background-secondary border border-surface-tertiary rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-hinomaru"
              aria-label={t('metrics.periodSelect')}
            >
              <option value="7d">{t('metrics.period.7d')}</option>
              <option value="30d">{t('metrics.period.30d')}</option>
              <option value="90d">{t('metrics.period.90d')}</option>
              <option value="year">{t('metrics.period.year')}</option>
            </select>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" aria-hidden="true" />
              {t('metrics.export')}
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div
          className="flex gap-1 mb-6 bg-background-secondary p-1 rounded-xl w-fit"
          role="tablist"
          aria-label={t('metrics.tabs')}
        >
          <button
            role="tab"
            aria-selected={activeTab === 'performance'}
            aria-controls="performance-panel"
            onClick={() => setActiveTab('performance')}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'performance' ? 'bg-hinomaru text-white' : 'text-foreground-secondary hover:text-foreground'
            }`}
          >
            📊 {t('metrics.tab.performance')}
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'rewards'}
            aria-controls="rewards-panel"
            onClick={() => setActiveTab('rewards')}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'rewards' ? 'bg-hinomaru text-white' : 'text-foreground-secondary hover:text-foreground'
            }`}
          >
            💰 {t('metrics.tab.rewards')}
          </button>
        </div>

        {/* Performance Tab */}
        <div
          id="performance-panel"
          role="tabpanel"
          aria-labelledby="performance-tab"
          className={activeTab === 'performance' ? '' : 'hidden'}
        >
          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card className="p-5">
              <div className="flex justify-between items-start mb-3">
                <div className="w-12 h-12 bg-gold/20 rounded-xl flex items-center justify-center">
                  <Zap className="h-6 w-6 text-gold" aria-hidden="true" />
                </div>
                <Badge variant="success" className="text-[11px]">
                  <TrendingUp className="h-3 w-3 mr-1" aria-hidden="true" />+{mockPerformanceStats.uptime.change}%
                </Badge>
              </div>
              <div className="text-3xl font-bold font-mono">{mockPerformanceStats.uptime.value}%</div>
              <div className="text-sm text-foreground-tertiary">{t('metrics.stats.uptime')}</div>
            </Card>

            <Card className="p-5">
              <div className="flex justify-between items-start mb-3">
                <div className="w-12 h-12 bg-success/20 rounded-xl flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-success" aria-hidden="true" />
                </div>
                <Badge variant="success" className="text-[11px]">
                  <TrendingUp className="h-3 w-3 mr-1" aria-hidden="true" />+{mockPerformanceStats.signatures.change}%
                </Badge>
              </div>
              <div className="text-3xl font-bold font-mono text-success">
                {mockPerformanceStats.signatures.value.toLocaleString()}
              </div>
              <div className="text-sm text-foreground-tertiary">{t('metrics.stats.signaturesCompleted')}</div>
            </Card>

            <Card className="p-5">
              <div className="flex justify-between items-start mb-3">
                <div className="w-12 h-12 bg-info/20 rounded-xl flex items-center justify-center">
                  <Clock className="h-6 w-6 text-info" aria-hidden="true" />
                </div>
                <Badge variant="success" className="text-[11px]">
                  <TrendingDown className="h-3 w-3 mr-1" aria-hidden="true" />
                  {mockPerformanceStats.latency.change}ms
                </Badge>
              </div>
              <div className="text-3xl font-bold font-mono">{mockPerformanceStats.latency.value}ms</div>
              <div className="text-sm text-foreground-tertiary">{t('metrics.stats.avgLatency')}</div>
            </Card>

            <Card className="p-5">
              <div className="flex justify-between items-start mb-3">
                <div className="w-12 h-12 bg-hinomaru/20 rounded-xl flex items-center justify-center">
                  <XCircle className="h-6 w-6 text-hinomaru" aria-hidden="true" />
                </div>
              </div>
              <div className="text-3xl font-bold font-mono">{mockPerformanceStats.violations.value}</div>
              <div className="text-sm text-foreground-tertiary">{t('metrics.stats.violations')}</div>
            </Card>
          </div>

          {/* Performance Chart */}
          <Card className="p-5 mb-6">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-semibold">{t('metrics.chart.performance')}</h3>
              <div className="flex gap-5">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gold rounded-full" />
                  <span className="text-sm text-foreground-secondary">{t('metrics.chart.signatureCount')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-success rounded-full" />
                  <span className="text-sm text-foreground-secondary">{t('metrics.chart.successRate')}</span>
                </div>
              </div>
            </div>
            <div className="flex items-end gap-2 h-64 px-4">
              {mockChartData.map((value, i) => (
                <div
                  key={i}
                  className="flex-1 bg-gradient-to-t from-hinomaru to-gold rounded-t"
                  style={{ height: `${value}%` }}
                  role="img"
                  aria-label={`${value}%`}
                />
              ))}
            </div>
          </Card>

          {/* Content Grid */}
          <div className="grid grid-cols-[2fr_1fr] gap-6">
            {/* Signature History */}
            <Card className="p-5">
              <h3 className="text-lg font-semibold mb-4">{t('metrics.history.title')}</h3>
              <table className="w-full" role="grid" aria-label={t('metrics.history.title')}>
                <thead>
                  <tr className="border-b border-surface-tertiary">
                    <th className="pb-3 text-left text-[11px] font-semibold uppercase tracking-wider text-foreground-tertiary">
                      {t('metrics.history.date')}
                    </th>
                    <th className="pb-3 text-left text-[11px] font-semibold uppercase tracking-wider text-foreground-tertiary">
                      {t('metrics.history.count')}
                    </th>
                    <th className="pb-3 text-left text-[11px] font-semibold uppercase tracking-wider text-foreground-tertiary">
                      {t('metrics.history.successRate')}
                    </th>
                    <th className="pb-3 text-left text-[11px] font-semibold uppercase tracking-wider text-foreground-tertiary">
                      {t('metrics.history.avgTime')}
                    </th>
                    <th className="pb-3 text-left text-[11px] font-semibold uppercase tracking-wider text-foreground-tertiary">
                      {t('metrics.history.reward')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {mockSignatureHistory.map((row, i) => (
                    <tr key={i} className="border-b border-surface-tertiary hover:bg-surface/50">
                      <td className="py-3 text-sm">{row.date}</td>
                      <td className="py-3 text-sm font-mono">{row.count}</td>
                      <td className="py-3 text-sm font-mono text-success">{row.successRate}%</td>
                      <td className="py-3 text-sm font-mono">{row.avgTime}ms</td>
                      <td className="py-3 text-sm font-mono text-gold">${row.reward.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            {/* Detail Metrics */}
            <Card className="p-5">
              <h3 className="text-lg font-semibold mb-4">{t('metrics.detail.title')}</h3>
              <div className="space-y-4">
                {mockDetailMetrics.map((metric) => (
                  <div key={metric.key} className="flex items-center justify-between">
                    <span className="text-sm text-foreground-secondary">{t(`metrics.detail.${metric.key}`)}</span>
                    <div className="w-24 h-2 bg-background rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          metric.status === 'success' ? 'bg-success' : 'bg-gold'
                        }`}
                        style={{ width: `${metric.value}%` }}
                        role="progressbar"
                        aria-valuenow={metric.value}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* Rewards Tab */}
        <div
          id="rewards-panel"
          role="tabpanel"
          aria-labelledby="rewards-tab"
          className={activeTab === 'rewards' ? '' : 'hidden'}
        >
          {/* Rewards Summary */}
          <Card className="p-8 mb-6 border-gold bg-gradient-to-br from-gold/10 to-transparent text-center">
            <div className="text-5xl font-bold font-mono text-gold mb-2">
              ${mockRewardsSummary.total.toLocaleString()}
            </div>
            <div className="text-foreground-secondary mb-6">
              {t('metrics.rewards.totalLabel', { days: mockRewardsSummary.period })}
            </div>
            <div className="flex gap-3 justify-center">
              <Button variant="primary">{t('metrics.rewards.withdraw')}</Button>
              <Button variant="outline">{t('metrics.rewards.reinvest')}</Button>
            </div>
          </Card>

          <div className="grid grid-cols-[2fr_1fr] gap-6">
            {/* Rewards Chart */}
            <Card className="p-5">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg font-semibold">{t('metrics.rewards.chartTitle')}</h3>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gold rounded-full" />
                  <span className="text-sm text-foreground-secondary">{t('metrics.rewards.dailyRewards')}</span>
                </div>
              </div>
              <div className="flex items-end gap-2 h-64 px-4">
                {mockChartData.map((value, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-gold rounded-t"
                    style={{ height: `${value}%` }}
                    role="img"
                    aria-label={`${value}%`}
                  />
                ))}
              </div>
            </Card>

            {/* Rewards Breakdown */}
            <Card className="p-5">
              <h3 className="text-lg font-semibold mb-4">{t('metrics.rewards.breakdownTitle')}</h3>
              <div className="space-y-3">
                {mockRewardsBreakdown.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between p-3 bg-surface rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gold/20 rounded-lg flex items-center justify-center">
                        <item.icon className="h-4 w-4 text-gold" aria-hidden="true" />
                      </div>
                      <div>
                        <div className="text-sm font-medium">{t(`metrics.rewards.${item.key}`)}</div>
                        <div className="text-xs text-foreground-tertiary">
                          {item.count
                            ? `${item.count.toLocaleString()} × $${item.rate}`
                            : item.description}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm font-semibold font-mono text-gold">
                      ${item.amount.toLocaleString()}
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between p-3 bg-background rounded-lg border border-surface-tertiary">
                  <span className="font-semibold">{t('metrics.rewards.total')}</span>
                  <span className="text-lg font-bold font-mono text-gold">
                    ${mockRewardsSummary.total.toLocaleString()}
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* Payout History */}
          <Card className="p-5 mt-6">
            <h3 className="text-lg font-semibold mb-4">{t('metrics.payout.title')}</h3>
            <table className="w-full" role="grid" aria-label={t('metrics.payout.title')}>
              <thead>
                <tr className="border-b border-surface-tertiary">
                  <th className="pb-3 text-left text-[11px] font-semibold uppercase tracking-wider text-foreground-tertiary">
                    {t('metrics.payout.date')}
                  </th>
                  <th className="pb-3 text-left text-[11px] font-semibold uppercase tracking-wider text-foreground-tertiary">
                    {t('metrics.payout.type')}
                  </th>
                  <th className="pb-3 text-left text-[11px] font-semibold uppercase tracking-wider text-foreground-tertiary">
                    {t('metrics.payout.amount')}
                  </th>
                  <th className="pb-3 text-left text-[11px] font-semibold uppercase tracking-wider text-foreground-tertiary">
                    {t('metrics.payout.destination')}
                  </th>
                  <th className="pb-3 text-left text-[11px] font-semibold uppercase tracking-wider text-foreground-tertiary">
                    {t('metrics.payout.status')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {mockPayoutHistory.map((row, i) => (
                  <tr key={i} className="border-b border-surface-tertiary hover:bg-surface/50">
                    <td className="py-3 text-sm">{row.date}</td>
                    <td className="py-3 text-sm">{t('metrics.payout.withdrawal')}</td>
                    <td className="py-3 text-sm font-mono text-gold">${row.amount.toLocaleString()}</td>
                    <td className="py-3 text-xs font-mono text-foreground-secondary">{row.address}</td>
                    <td className="py-3">
                      <Badge variant="success" className="text-[11px]">
                        ● {t('metrics.payout.completed')}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      </main>
    </div>
  );
}
