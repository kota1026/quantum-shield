'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  BarChart3,
  Coins,
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
  HelpCircle,
  X,
  Wallet,
  RefreshCw,
  ArrowUpCircle,
  Building2,
  Shield,
  Calendar,
  Percent,
  Gift,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ProverSidebar } from './ProverSidebar';
import {
  usePerformanceStats,
  useSignatureHistory,
  useDetailMetrics,
  useRewardsSummary,
  usePayoutHistory,
  useProverMetrics,
  useProverDashboard,
} from '@/hooks/prover';
import { useProverId } from '@/stores/proverAuthStore';

// Prover type: public or enterprise
type ProverType = 'public' | 'enterprise';

// Default empty performance state
const EMPTY_PERFORMANCE = {
  uptime: { value: 0, change: 0 },
  signatures: { value: 0, change: 0 },
  latency: { value: 0, change: 0 },
  violations: { value: 0 },
};

// Local visualization data (uses Lucide icon components) — values should come from API
const rewardsBreakdownConfig = [
  { key: 'signatureRewards', icon: PenTool, count: 0, rate: 0, amount: 0 },
  { key: 'performanceBonus', icon: Star, description: '-', amount: 0 },
  { key: 'earlyAdopterBonus', icon: Trophy, description: '-', amount: 0 },
];

// Enterprise-specific rewards data (QS Token denomination)
const DEFAULT_ENTERPRISE_REWARDS = {
  contract: {
    operatorName: 'ACME Corporation',
    plan: 'Enterprise Plus',
    contractPeriod: '2025-06-01 – 2026-05-31',
  },
  guaranteedRevenue: {
    monthly: 240_000, // QS Token
    received: 1_680_000, // QS Token (7 months)
    remaining: 1_200_000, // QS Token (5 months)
  },
  performanceBonus: {
    eligible: true,
    currentRate: 15, // % bonus for exceeding SLA
    earnedThisMonth: 36_000, // QS Token
    totalEarned: 252_000, // QS Token
  },
  additionalIncentives: [
    { key: 'earlyAdopter', amount: 100_000, descriptionKey: 'metrics.enterprise.earlyAdopterDescription' },
    { key: 'perfectUptime', amount: 50_000, descriptionKey: 'metrics.enterprise.perfectUptimeDescription' },
    { key: 'referral', amount: 20_000, descriptionKey: 'metrics.enterprise.referralDescription' },
  ],
  totalEarned: 2_102_000, // QS Token total
};

// Chart data with actual values
const SAMPLE_CHART_DATA = [
  { value: 320, label: '1/6' },
  { value: 450, label: '1/7' },
  { value: 380, label: '1/8' },
  { value: 520, label: '1/9' },
  { value: 490, label: '1/10' },
  { value: 410, label: '1/11' },
  { value: 560, label: '1/12' },
  { value: 480, label: '1/13' },
  { value: 390, label: '1/14' },
  { value: 530, label: '1/15' },
  { value: 510, label: '1/16' },
  { value: 487, label: '1/17' },
];

const SAMPLE_REWARDS_CHART_DATA = [
  { value: 1850, label: '1/6' },
  { value: 2150, label: '1/7' },
  { value: 1920, label: '1/8' },
  { value: 2480, label: '1/9' },
  { value: 2320, label: '1/10' },
  { value: 2050, label: '1/11' },
  { value: 2680, label: '1/12' },
  { value: 2225, label: '1/13' },
  { value: 1945, label: '1/14' },
  { value: 2060, label: '1/15' },
  { value: 2615, label: '1/16' },
  { value: 2435, label: '1/17' },
];

type TabType = 'performance' | 'rewards';
type PeriodType = '7d' | '30d' | '90d' | 'year';

export function ProverMetrics() {
  const t = useTranslations('prover');
  const proverId = useProverId();

  const [activeTab, setActiveTab] = useState<TabType>('performance');
  const [period, setPeriod] = useState<PeriodType>('90d');
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showReinvestModal, setShowReinvestModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('0x742d...8bD34');
  const [reinvestAmount, setReinvestAmount] = useState('');
  // For demo: toggle between public and enterprise view
  const [proverType] = useState<ProverType>('enterprise');

  // proverIdを使ってAPIからデータを取得
  const { data: proverMetricsApi } = useProverMetrics(proverId ?? '');
  const { data: proverDashboardApi } = useProverDashboard(proverId ?? '');
  const { data: performanceApi } = usePerformanceStats(proverId ?? undefined);
  const { data: signatureHistoryApi } = useSignatureHistory(proverId ?? undefined);
  const { data: detailMetricsApi } = useDetailMetrics(proverId ?? undefined);
  const { data: rewardsSummaryApi } = useRewardsSummary(proverId ?? undefined);
  const { data: payoutHistoryApi } = usePayoutHistory(proverId ?? undefined);

  // Stake amount from dashboard API (USD-pegged: $400K equivalent in ETH or QS)
  const currentStakeAmount = proverDashboardApi ? parseFloat(proverDashboardApi.stakeAmount) : 0;

  // APIデータを使用（フォールバック付き）
  // proverMetricsApiからのデータを優先的に使用
  const performanceStats = performanceApi ?? (proverMetricsApi ? {
    uptime: { value: proverMetricsApi.uptimePercentage ?? 0, change: 0 },
    signatures: { value: proverMetricsApi.totalSignatures ?? 0, change: 0 },
    latency: { value: proverMetricsApi.avgResponseTimeMs ?? 0, change: 0 },
    violations: { value: proverMetricsApi.slashCount ?? 0 },
  } : EMPTY_PERFORMANCE);
  const signatureHistory = signatureHistoryApi ?? [];
  const detailMetrics = detailMetricsApi ?? (proverMetricsApi ? [
    { key: 'slaCompliance', value: proverMetricsApi.successRate, status: 'success' },
    { key: 'avgResponseTime', value: 94.2, status: 'success' },
    { key: 'successRate', value: proverMetricsApi.successRate, status: 'success' },
    { key: 'availability', value: proverMetricsApi.uptimePercentage, status: 'gold' },
  ] : []);
  const rewardsSummary = rewardsSummaryApi ?? (proverMetricsApi ? {
    total: parseFloat(proverMetricsApi.totalEarnings) || 0,
    period: 90,
  } : { total: 0, period: 0 });
  const payoutHistory = payoutHistoryApi ?? [];

  const maxChartValue = Math.max(...SAMPLE_CHART_DATA.map((d) => d.value));
  const maxRewardsValue = Math.max(...SAMPLE_REWARDS_CHART_DATA.map((d) => d.value));

  const handleWithdraw = () => {
    if (withdrawAmount && parseFloat(withdrawAmount) > 0) {
      alert(t('metrics.modal.withdraw.success', { amount: withdrawAmount }));
      setShowWithdrawModal(false);
      setWithdrawAmount('');
    }
  };

  const handleReinvest = () => {
    const amount = parseFloat(reinvestAmount);
    if (reinvestAmount && !isNaN(amount) && amount > 0 && amount <= rewardsSummary.total) {
      // In real app, this would trigger a blockchain transaction
      alert(t('metrics.modal.reinvest.success', { amount: reinvestAmount }));
      setShowReinvestModal(false);
      setReinvestAmount('');
    }
  };

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
      <ProverSidebar activePage="metrics" />

      {/* Main Content */}
      <main id="main-content" className="flex-1 p-8 overflow-y-auto">
        {/* Premium Background Effect */}
        <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
          <div
            className={cn(
              'absolute -top-24 left-1/2 -translate-x-1/2',
              'w-[800px] h-[500px]',
              'bg-[radial-gradient(ellipse,rgba(201,169,98,0.08),transparent_60%)]',
              'opacity-50'
            )}
          />
        </div>

        <div className="relative z-10">
          {/* Page Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold">{t('metrics.title')}</h1>
              <p className="text-foreground-secondary mt-1">{t('metrics.description')}</p>
            </div>
            <div className="flex gap-3">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as PeriodType)}
                className="px-4 py-2 bg-background-secondary border border-surface-tertiary rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold"
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
              className={`px-5 py-3 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
                activeTab === 'performance' ? 'bg-gold text-background' : 'text-foreground-secondary hover:text-foreground'
              }`}
            >
              <BarChart3 className="inline-block h-4 w-4 mr-2" aria-hidden="true" />
              {t('metrics.tab.performance')}
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'rewards'}
              aria-controls="rewards-panel"
              onClick={() => setActiveTab('rewards')}
              className={`px-5 py-3 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
                activeTab === 'rewards' ? 'bg-gold text-background' : 'text-foreground-secondary hover:text-foreground'
              }`}
            >
              <Coins className="inline-block h-4 w-4 mr-2" aria-hidden="true" />
              {t('metrics.tab.rewards')}
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
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card variant="hoverGradient" padding="md">
                <div className="flex justify-between items-start mb-3">
                  <div className="w-12 h-12 bg-gold/20 rounded-xl flex items-center justify-center">
                    <Zap className="h-6 w-6 text-gold" aria-hidden="true" />
                  </div>
                  <Badge variant="success" className="text-[11px]">
                    <TrendingUp className="h-3 w-3 mr-1" aria-hidden="true" />+{performanceStats.uptime?.change ?? 0}%
                  </Badge>
                </div>
                <div className="text-3xl font-bold font-mono">{performanceStats.uptime?.value ?? 0}%</div>
                <div className="flex items-center gap-1 text-sm text-foreground-tertiary">
                  {t('metrics.stats.uptime')}
                  <button
                    className="group relative min-h-[44px] min-w-[44px] flex items-center justify-center -m-3"
                    aria-label={t('metrics.stats.uptimeHelp')}
                  >
                    <HelpCircle className="h-3.5 w-3.5 text-foreground-tertiary hover:text-gold transition-colors" />
                    <div className="absolute bottom-full left-0 mb-2 w-64 p-3 bg-background-secondary border border-gold/30 rounded-lg text-xs text-foreground-secondary opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-lg">
                      {t('metrics.stats.uptimeDescription')}
                    </div>
                  </button>
                </div>
              </Card>

              <Card variant="hoverGradient" padding="md">
                <div className="flex justify-between items-start mb-3">
                  <div className="w-12 h-12 bg-success/20 rounded-xl flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-success" aria-hidden="true" />
                  </div>
                  <Badge variant="success" className="text-[11px]">
                    <TrendingUp className="h-3 w-3 mr-1" aria-hidden="true" />+{performanceStats.signatures?.change ?? 0}%
                  </Badge>
                </div>
                <div className="text-3xl font-bold font-mono text-success">
                  {(performanceStats.signatures?.value ?? 0).toLocaleString()}
                </div>
                <div className="text-sm text-foreground-tertiary">{t('metrics.stats.signaturesCompleted')}</div>
              </Card>

              <Card variant="hoverGradient" padding="md">
                <div className="flex justify-between items-start mb-3">
                  <div className="w-12 h-12 bg-info/20 rounded-xl flex items-center justify-center">
                    <Clock className="h-6 w-6 text-info" aria-hidden="true" />
                  </div>
                  <Badge variant="success" className="text-[11px]">
                    <TrendingDown className="h-3 w-3 mr-1" aria-hidden="true" />
                    {performanceStats.latency?.change ?? 0}ms
                  </Badge>
                </div>
                <div className="text-3xl font-bold font-mono">{performanceStats.latency?.value ?? 0}ms</div>
                <div className="text-sm text-foreground-tertiary">{t('metrics.stats.avgLatency')}</div>
              </Card>

              <Card variant="hoverGradient" padding="md">
                <div className="flex justify-between items-start mb-3">
                  <div className="w-12 h-12 bg-hinomaru/20 rounded-xl flex items-center justify-center">
                    <XCircle className="h-6 w-6 text-hinomaru" aria-hidden="true" />
                  </div>
                </div>
                <div className="text-3xl font-bold font-mono">{performanceStats.violations?.value ?? 0}</div>
                <div className="text-sm text-foreground-tertiary">{t('metrics.stats.violations')}</div>
              </Card>
            </div>

            {/* Performance Chart with Hover */}
            <Card className="p-5 mb-6">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg font-semibold">{t('metrics.chart.performance')}</h3>
                <div className="flex gap-5">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gold" />
                    <span className="text-sm text-foreground-secondary">{t('metrics.chart.signatureCount')}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-end gap-2 h-64 px-4">
                {SAMPLE_CHART_DATA.map((data, i) => (
                  <div
                    key={i}
                    className="flex-1 relative group h-full flex items-end"
                    onMouseEnter={() => setHoveredBar(i)}
                    onMouseLeave={() => setHoveredBar(null)}
                  >
                    {/* Tooltip */}
                    <div
                      className={cn(
                        'absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-background-secondary border border-gold/30 rounded-lg text-center z-10 transition-opacity duration-200 pointer-events-none min-w-[80px]',
                        hoveredBar === i ? 'opacity-100' : 'opacity-0'
                      )}
                    >
                      <div className="text-xs text-foreground-tertiary">{data.label}</div>
                      <div className="text-sm font-bold font-mono text-gold">{data.value}</div>
                      <div className="text-xs text-foreground-secondary">{t('metrics.chart.signatures')}</div>
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gold/30" />
                    </div>
                    {/* Bar */}
                    <div
                      className={cn(
                        'w-full rounded-t-md transition-all duration-200 cursor-pointer',
                        'bg-gold/80',
                        hoveredBar === i ? 'opacity-100 bg-gold shadow-[0_0_15px_rgba(201,169,98,0.3)]' : 'opacity-70 hover:opacity-90'
                      )}
                      style={{ height: `${(data.value / maxChartValue) * 100}%` }}
                      role="img"
                      aria-label={`${data.label}: ${data.value}`}
                    />
                    {/* X-axis label */}
                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-foreground-tertiary">
                      {data.label}
                    </div>
                  </div>
                ))}
              </div>
              <div className="h-6" /> {/* Space for x-axis labels */}
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
                    {signatureHistory.map((row, i) => (
                      <tr key={i} className="border-b border-surface-tertiary hover:bg-surface/50">
                        <td className="py-3 text-sm">{row.date}</td>
                        <td className="py-3 text-sm font-mono">{row.count}</td>
                        <td className="py-3 text-sm font-mono text-success">{row.successRate}%</td>
                        <td className="py-3 text-sm font-mono">{row.avgTime}ms</td>
                        <td className="py-3 text-sm font-mono text-gold">{row.reward.toLocaleString()} QS</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>

              {/* Detail Metrics */}
              <Card className="p-5">
                <h3 className="text-lg font-semibold mb-4">{t('metrics.detail.title')}</h3>
                <div className="space-y-4">
                  {detailMetrics.map((metric, idx) => (
                    <div key={`${metric.key}-${idx}`} className="flex items-center justify-between">
                      <span className="text-sm text-foreground-secondary">{t(`metrics.detail.${metric.key}`)}</span>
                      <div className="flex items-center gap-2">
                        <span className={cn('text-sm font-mono', metric.status === 'gold' ? 'text-gold' : 'text-success')}>
                          {metric.value}%
                        </span>
                        <div className="w-24 h-2 bg-background rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              metric.status === 'success' ? 'bg-success' : 'bg-gradient-to-r from-hinomaru to-gold'
                            }`}
                            style={{ width: `${metric.value}%` }}
                            role="progressbar"
                            aria-valuenow={metric.value}
                            aria-valuemin={0}
                            aria-valuemax={100}
                          />
                        </div>
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
            {/* Enterprise Rewards Summary (shown for enterprise provers) */}
            {proverType === 'enterprise' && (
              <Card className="p-6 mb-6 border-gold bg-gradient-to-br from-gold/10 to-transparent">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-6 w-6 text-gold" aria-hidden="true" />
                    <div>
                      <h2 className="font-semibold">{t('metrics.enterprise.title')}</h2>
                      <div className="text-xs text-foreground-secondary">
                        {DEFAULT_ENTERPRISE_REWARDS.contract.operatorName} • {DEFAULT_ENTERPRISE_REWARDS.contract.plan}
                      </div>
                    </div>
                  </div>
                  <Badge variant="gold">{t('metrics.enterprise.totalEarned')}</Badge>
                </div>

                {/* Total Earned */}
                <div className="text-center mb-6 pb-6 border-b border-gold/30">
                  <div className="text-5xl font-bold font-mono text-gold mb-2">
                    {DEFAULT_ENTERPRISE_REWARDS.totalEarned.toLocaleString()} QS
                  </div>
                  <div className="text-foreground-secondary">
                    {t('metrics.enterprise.totalEarnedDesc')}
                  </div>
                </div>

                {/* Guaranteed Revenue Section */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="h-4 w-4 text-success" aria-hidden="true" />
                    <span className="font-semibold text-sm">{t('metrics.enterprise.guaranteedRevenue')}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 bg-background/50 rounded-lg">
                      <div className="text-xs text-foreground-tertiary mb-1">{t('metrics.enterprise.monthly')}</div>
                      <div className="text-lg font-bold text-success">{DEFAULT_ENTERPRISE_REWARDS.guaranteedRevenue.monthly.toLocaleString()} QS</div>
                    </div>
                    <div className="p-3 bg-background/50 rounded-lg">
                      <div className="text-xs text-foreground-tertiary mb-1">{t('metrics.enterprise.received')}</div>
                      <div className="text-lg font-bold font-mono">{DEFAULT_ENTERPRISE_REWARDS.guaranteedRevenue.received.toLocaleString()} QS</div>
                    </div>
                    <div className="p-3 bg-background/50 rounded-lg">
                      <div className="text-xs text-foreground-tertiary mb-1">{t('metrics.enterprise.remaining')}</div>
                      <div className="text-lg font-bold font-mono text-foreground-secondary">{DEFAULT_ENTERPRISE_REWARDS.guaranteedRevenue.remaining.toLocaleString()} QS</div>
                    </div>
                  </div>
                </div>

                {/* Performance Bonus Section */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Percent className="h-4 w-4 text-gold" aria-hidden="true" />
                    <span className="font-semibold text-sm">{t('metrics.enterprise.performanceBonus')}</span>
                    {DEFAULT_ENTERPRISE_REWARDS.performanceBonus.eligible && (
                      <Badge variant="success" className="text-[10px]">{t('metrics.enterprise.eligible')}</Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 bg-background/50 rounded-lg">
                      <div className="text-xs text-foreground-tertiary mb-1">{t('metrics.enterprise.bonusRate')}</div>
                      <div className="text-lg font-bold text-gold">+{DEFAULT_ENTERPRISE_REWARDS.performanceBonus.currentRate}%</div>
                    </div>
                    <div className="p-3 bg-background/50 rounded-lg">
                      <div className="text-xs text-foreground-tertiary mb-1">{t('metrics.enterprise.thisMonth')}</div>
                      <div className="text-lg font-bold font-mono">{DEFAULT_ENTERPRISE_REWARDS.performanceBonus.earnedThisMonth.toLocaleString()} QS</div>
                    </div>
                    <div className="p-3 bg-background/50 rounded-lg">
                      <div className="text-xs text-foreground-tertiary mb-1">{t('metrics.enterprise.bonusTotal')}</div>
                      <div className="text-lg font-bold font-mono">{DEFAULT_ENTERPRISE_REWARDS.performanceBonus.totalEarned.toLocaleString()} QS</div>
                    </div>
                  </div>
                </div>

                {/* Additional Incentives */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Gift className="h-4 w-4 text-hinomaru" aria-hidden="true" />
                    <span className="font-semibold text-sm">{t('metrics.enterprise.additionalIncentives')}</span>
                  </div>
                  <div className="space-y-2">
                    {DEFAULT_ENTERPRISE_REWARDS.additionalIncentives.map((incentive) => (
                      <div
                        key={incentive.key}
                        className="flex items-center justify-between p-3 bg-background/50 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <Trophy className="h-4 w-4 text-gold" aria-hidden="true" />
                          <span className="text-sm">{t(incentive.descriptionKey)}</span>
                        </div>
                        <span className="font-mono font-semibold text-success">+{incentive.amount.toLocaleString()} QS</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Contract Period */}
                <div className="mt-6 pt-4 border-t border-gold/30 flex items-center justify-between text-xs text-foreground-secondary">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{t('metrics.enterprise.contractPeriod')}: {DEFAULT_ENTERPRISE_REWARDS.contract.contractPeriod}</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setShowWithdrawModal(true)}>
                    {t('metrics.rewards.withdraw')}
                  </Button>
                </div>
              </Card>
            )}

            {/* Public Rewards Summary (shown for public provers) */}
            {proverType === 'public' && (
            <Card className="p-8 mb-6 border-gold bg-gradient-to-br from-gold/10 to-transparent text-center">
              <div className="text-5xl font-bold font-mono text-gold mb-2">
                {rewardsSummary.total.toLocaleString()} QS
              </div>
              <div className="text-foreground-secondary mb-6">
                {t('metrics.rewards.totalLabel', { days: rewardsSummary.period })}
              </div>
              <div className="flex gap-3 justify-center">
                <Button
                  variant="primary"
                  onClick={() => setShowWithdrawModal(true)}
                >
                  {t('metrics.rewards.withdraw')}
                </Button>
                <Button
                  variant="outline"
                  className="border-gold text-gold hover:bg-gold/10"
                  onClick={() => setShowReinvestModal(true)}
                >
                  {t('metrics.rewards.reinvest')}
                </Button>
              </div>
            </Card>
            )}

            <div className="grid grid-cols-[2fr_1fr] gap-6">
              {/* Rewards Chart with Hover */}
              <Card className="p-5">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-lg font-semibold">{t('metrics.rewards.chartTitle')}</h3>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gold" />
                    <span className="text-sm text-foreground-secondary">{t('metrics.rewards.dailyRewards')}</span>
                  </div>
                </div>
                <div className="flex items-end gap-2 h-64 px-4">
                  {SAMPLE_REWARDS_CHART_DATA.map((data, i) => (
                    <div
                      key={i}
                      className="flex-1 relative group h-full flex items-end"
                      onMouseEnter={() => setHoveredBar(i + 100)}
                      onMouseLeave={() => setHoveredBar(null)}
                    >
                      {/* Tooltip */}
                      <div
                        className={cn(
                          'absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-background-secondary border border-gold/30 rounded-lg text-center z-10 transition-opacity duration-200 pointer-events-none min-w-[80px]',
                          hoveredBar === i + 100 ? 'opacity-100' : 'opacity-0'
                        )}
                      >
                        <div className="text-xs text-foreground-tertiary">{data.label}</div>
                        <div className="text-sm font-bold font-mono text-gold">{data.value.toLocaleString()}</div>
                        <div className="text-xs text-foreground-secondary">QS</div>
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gold/30" />
                      </div>
                      {/* Bar */}
                      <div
                        className={cn(
                          'w-full rounded-t-md transition-all duration-200 cursor-pointer',
                          'bg-gold/80',
                          hoveredBar === i + 100 ? 'opacity-100 bg-gold shadow-[0_0_15px_rgba(201,169,98,0.3)]' : 'opacity-70 hover:opacity-90'
                        )}
                        style={{ height: `${(data.value / maxRewardsValue) * 100}%` }}
                        role="img"
                        aria-label={`${data.label}: ${data.value} QS`}
                      />
                      {/* X-axis label */}
                      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-foreground-tertiary">
                        {data.label}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="h-6" /> {/* Space for x-axis labels */}
              </Card>

              {/* Rewards Breakdown */}
              <Card className="p-5">
                <h3 className="text-lg font-semibold mb-4">{t('metrics.rewards.breakdownTitle')}</h3>
                <div className="space-y-3">
                  {rewardsBreakdownConfig.map((item) => (
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
                              ? `${item.count.toLocaleString()} × ${item.rate} QS`
                              : item.description}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm font-semibold font-mono text-gold">
                        {item.amount.toLocaleString()} QS
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-gold/10 to-transparent rounded-lg border border-gold/30">
                    <span className="font-semibold">{t('metrics.rewards.total')}</span>
                    <span className="text-lg font-bold font-mono text-gold">
                      {rewardsSummary.total.toLocaleString()} QS
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
                  {payoutHistory.map((row, i) => (
                    <tr key={i} className="border-b border-surface-tertiary hover:bg-surface/50">
                      <td className="py-3 text-sm">{row.date}</td>
                      <td className="py-3 text-sm">{t('metrics.payout.withdrawal')}</td>
                      <td className="py-3 text-sm font-mono text-gold">{row.amount.toLocaleString()} QS</td>
                      <td className="py-3 text-xs font-mono text-foreground-secondary">{row.address}</td>
                      <td className="py-3">
                        <Badge variant="success" className="text-[11px]">
                          <CheckCircle className="h-3 w-3 mr-1" aria-hidden="true" />
                          {t('metrics.payout.completed')}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        </div>
      </main>

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setShowWithdrawModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="withdraw-title"
        >
          <div
            className="bg-background-secondary rounded-2xl w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-surface-tertiary">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gold/20 rounded-xl flex items-center justify-center">
                    <Wallet className="h-6 w-6 text-gold" />
                  </div>
                  <h2 id="withdraw-title" className="text-lg font-semibold">
                    {t('metrics.modal.withdraw.title')}
                  </h2>
                </div>
                <button
                  onClick={() => setShowWithdrawModal(false)}
                  className="text-foreground-tertiary hover:text-foreground transition-colors p-1"
                  aria-label={t('queue.modal.close')}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              <p className="text-sm text-foreground-secondary">
                {t('metrics.modal.withdraw.description')}
              </p>

              {/* Available Balance */}
              <div className="p-4 bg-background rounded-xl">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-foreground-secondary">{t('metrics.modal.withdraw.available')}</span>
                  <span className="font-semibold text-gold">{rewardsSummary.total.toLocaleString()} QS</span>
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <label htmlFor="withdraw-amount" className="block text-sm font-medium mb-2">
                  {t('metrics.modal.withdraw.amountLabel')}
                </label>
                <div className="relative">
                  <input
                    id="withdraw-amount"
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder={rewardsSummary.total.toString()}
                    className="w-full px-4 py-3 bg-background border border-surface-tertiary rounded-xl focus:outline-none focus:ring-2 focus:ring-gold text-right pr-16 font-mono"
                    min="0"
                    max={rewardsSummary.total}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground-tertiary">QS</span>
                </div>
                <button
                  type="button"
                  className="text-sm text-gold hover:underline mt-1"
                  onClick={() => setWithdrawAmount(rewardsSummary.total.toString())}
                >
                  {t('metrics.modal.withdraw.max')}
                </button>
              </div>

              {/* Destination Address */}
              <div>
                <label htmlFor="withdraw-address" className="block text-sm font-medium mb-2">
                  {t('metrics.modal.withdraw.addressLabel')}
                </label>
                <input
                  id="withdraw-address"
                  type="text"
                  value={withdrawAddress}
                  onChange={(e) => setWithdrawAddress(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-surface-tertiary rounded-xl focus:outline-none focus:ring-2 focus:ring-gold font-mono text-sm"
                />
              </div>

              {/* Fee notice */}
              <div className="p-3 bg-info/10 border border-info/30 rounded-lg text-sm text-foreground-secondary">
                {t('metrics.modal.withdraw.feeNotice')}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-surface-tertiary flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowWithdrawModal(false);
                  setWithdrawAmount('');
                }}
              >
                {t('queue.modal.cancel')}
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={handleWithdraw}
                disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > rewardsSummary.total}
              >
                {t('metrics.modal.withdraw.confirm')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reinvest Modal */}
      {showReinvestModal && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setShowReinvestModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="reinvest-title"
        >
          <div
            className="bg-background-secondary rounded-2xl w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-surface-tertiary">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-success/20 rounded-xl flex items-center justify-center">
                    <ArrowUpCircle className="h-6 w-6 text-success" />
                  </div>
                  <h2 id="reinvest-title" className="text-lg font-semibold">
                    {t('metrics.modal.reinvest.title')}
                  </h2>
                </div>
                <button
                  onClick={() => setShowReinvestModal(false)}
                  className="text-foreground-tertiary hover:text-foreground transition-colors p-1"
                  aria-label={t('queue.modal.close')}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              <p className="text-sm text-foreground-secondary">
                {t('metrics.modal.reinvest.description')}
              </p>

              {/* Current Info */}
              <div className="p-4 bg-background rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-foreground-secondary">{t('metrics.modal.reinvest.availableRewards')}</span>
                  <span className="font-semibold text-gold">{rewardsSummary.total.toLocaleString()} QS</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-foreground-secondary">{t('metrics.modal.reinvest.currentStake')}</span>
                  <span className="font-semibold">{currentStakeAmount.toLocaleString()} QS</span>
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <label htmlFor="reinvest-amount" className="block text-sm font-medium mb-2">
                  {t('metrics.modal.reinvest.amountLabel')}
                </label>
                <div className="relative">
                  <input
                    id="reinvest-amount"
                    type="number"
                    value={reinvestAmount}
                    onChange={(e) => setReinvestAmount(e.target.value)}
                    placeholder={rewardsSummary.total.toString()}
                    className="w-full px-4 py-3 bg-background border border-surface-tertiary rounded-xl focus:outline-none focus:ring-2 focus:ring-success text-right pr-16 font-mono"
                    min="0"
                    max={rewardsSummary.total}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground-tertiary">QS</span>
                </div>
                <button
                  type="button"
                  className="text-sm text-gold hover:underline mt-1"
                  onClick={() => setReinvestAmount(rewardsSummary.total.toString())}
                >
                  {t('metrics.modal.reinvest.max')}
                </button>
              </div>

              {/* Preview */}
              {reinvestAmount && parseFloat(reinvestAmount) > 0 && (
                <div className="p-4 bg-success/10 border border-success/30 rounded-xl">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">{t('metrics.modal.reinvest.newStake')}</span>
                    <span className="font-semibold text-success">
                      {(currentStakeAmount + parseFloat(reinvestAmount)).toLocaleString()} QS
                    </span>
                  </div>
                </div>
              )}

              {/* Benefit notice */}
              <div className="p-3 bg-gold/10 border border-gold/30 rounded-lg text-sm text-foreground-secondary">
                {t('metrics.modal.reinvest.benefitNotice')}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-surface-tertiary flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowReinvestModal(false);
                  setReinvestAmount('');
                }}
              >
                {t('queue.modal.cancel')}
              </Button>
              <Button
                variant="success"
                className="flex-1"
                onClick={handleReinvest}
                disabled={!reinvestAmount || isNaN(parseFloat(reinvestAmount)) || parseFloat(reinvestAmount) <= 0 || parseFloat(reinvestAmount) > rewardsSummary.total}
              >
                {t('metrics.modal.reinvest.confirm')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
