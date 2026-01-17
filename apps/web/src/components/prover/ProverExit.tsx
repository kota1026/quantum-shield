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
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Mock data
const mockExitData = {
  currentStake: 400000,
  tokens: 80000,
  unclaimedRewards: 12340,
  unlockDate: '2026/09/20',
  daysRemaining: 183,
  penaltyRate: 5,
  penaltyAmount: 20000,
  returnAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f8bD34',
};

const mockCompletedExit = {
  proverId: 'PRV-2026-001234',
  activityDays: 87,
  stakeReturned: 380000,
  totalRewards: 47520,
  signaturesProcessed: 12847,
};

type TabType = 'request' | 'complete';

export function ProverExit() {
  const t = useTranslations('prover');
  const [activeTab, setActiveTab] = useState<TabType>('request');
  const [exitReason, setExitReason] = useState('');
  const [comment, setComment] = useState('');
  const [confirmations, setConfirmations] = useState({
    penalty: false,
    activityEnd: false,
    coolingPeriod: false,
  });

  const navItems = [
    { key: 'dashboard', icon: LayoutDashboard, href: '/prover/dashboard' },
    { key: 'queue', icon: FileText, href: '/prover/queue', badge: 12 },
    { key: 'metrics', icon: BarChart3, href: '/prover/metrics' },
    { key: 'rewards', icon: Coins, href: '/prover/rewards' },
  ];

  const managementItems = [
    { key: 'alerts', icon: Bell, href: '/prover/alerts', badge: 2, badgeVariant: 'warning' as const },
    { key: 'stake', icon: Lock, href: '/prover/stake' },
    { key: 'challenges', icon: Swords, href: '/prover/challenges' },
  ];

  const allConfirmed = Object.values(confirmations).every(Boolean);

  const timelineSteps = [
    { key: 'exitRequest', date: t('exit.timeline.today') },
    { key: 'queueComplete', date: t('exit.timeline.within24h') },
    { key: 'coolingPeriod', date: t('exit.timeline.days7') },
    { key: 'stakeReturn', date: '2026/01/24' },
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
              className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-foreground-secondary hover:bg-surface hover:text-foreground mb-1 transition-colors"
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
            className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium bg-hinomaru/10 text-hinomaru-400 mb-1 transition-colors"
            aria-current="page"
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
      <main id="main-content" className="flex-1 p-8 overflow-y-auto max-w-4xl">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">{t('exit.title')}</h1>
          <p className="text-foreground-secondary">{t('exit.description')}</p>
        </div>

        {/* Tab Navigation */}
        <div
          className="flex gap-1 mb-6 bg-background-secondary p-1 rounded-xl w-fit"
          role="tablist"
          aria-label={t('exit.tabs')}
        >
          <button
            id="request-tab"
            role="tab"
            aria-selected={activeTab === 'request'}
            aria-controls="request-panel"
            tabIndex={activeTab === 'request' ? 0 : -1}
            onClick={() => setActiveTab('request')}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'request' ? 'bg-hinomaru text-white' : 'text-foreground-secondary hover:text-foreground'
            }`}
          >
            📝 {t('exit.tab.request')}
          </button>
          <button
            id="complete-tab"
            role="tab"
            aria-selected={activeTab === 'complete'}
            aria-controls="complete-panel"
            tabIndex={activeTab === 'complete' ? 0 : -1}
            onClick={() => setActiveTab('complete')}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'complete' ? 'bg-hinomaru text-white' : 'text-foreground-secondary hover:text-foreground'
            }`}
          >
            ✓ {t('exit.tab.complete')}
          </button>
        </div>

        {/* Request Tab */}
        <div
          id="request-panel"
          role="tabpanel"
          aria-labelledby="request-tab"
          className={activeTab === 'request' ? '' : 'hidden'}
        >
          {/* Warning Banner */}
          <Card className="p-5 mb-6 border-warning bg-gradient-to-br from-warning/20 to-transparent">
            <h3 className="font-semibold text-warning mb-3 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              {t('exit.warning.title')}
            </h3>
            <ul className="list-disc list-inside text-sm text-foreground-secondary space-y-2">
              <li><strong>{t('exit.warning.lockPeriod')}:</strong> {t('exit.warning.lockPeriodDesc')}</li>
              <li><strong>{t('exit.warning.pendingRequests')}:</strong> {t('exit.warning.pendingRequestsDesc')}</li>
              <li><strong>{t('exit.warning.unresolvedChallenges')}:</strong> {t('exit.warning.unresolvedChallengesDesc')}</li>
              <li><strong>{t('exit.warning.rewards')}:</strong> {t('exit.warning.rewardsDesc')}</li>
            </ul>
          </Card>

          {/* Exit Summary */}
          <Card className="p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">{t('exit.summary.title')}</h3>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-5 bg-background rounded-xl">
                <div className="text-xs text-foreground-tertiary mb-2">{t('exit.summary.currentStake')}</div>
                <div className="text-2xl font-bold font-mono text-gold">${mockExitData.currentStake.toLocaleString()}</div>
                <div className="text-xs text-foreground-tertiary mt-1">QST {mockExitData.tokens.toLocaleString()}</div>
              </div>
              <div className="p-5 bg-background rounded-xl">
                <div className="text-xs text-foreground-tertiary mb-2">{t('exit.summary.unclaimedRewards')}</div>
                <div className="text-2xl font-bold font-mono text-success">${mockExitData.unclaimedRewards.toLocaleString()}</div>
                <div className="text-xs text-foreground-tertiary mt-1">{t('exit.summary.autoTransfer')}</div>
              </div>
              <div className="p-5 bg-background rounded-xl">
                <div className="text-xs text-foreground-tertiary mb-2">{t('exit.summary.unlockDate')}</div>
                <div className="text-2xl font-bold font-mono">{mockExitData.unlockDate}</div>
                <div className="text-xs text-foreground-tertiary mt-1">{t('exit.summary.daysRemaining', { days: mockExitData.daysRemaining })}</div>
              </div>
            </div>

            {/* Timeline */}
            <div className="p-5 bg-background rounded-xl">
              <h4 className="font-semibold mb-4">{t('exit.timeline.title')}</h4>
              <div className="relative flex justify-between">
                <div className="absolute top-5 left-10 right-10 h-0.5 bg-surface-tertiary" />
                {timelineSteps.map((step, index) => (
                  <div key={step.key} className="relative flex flex-col items-center text-center z-10">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                      index === 0 ? 'bg-hinomaru text-white' : 'bg-background-secondary border-2 border-surface-tertiary'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="text-xs text-foreground-tertiary mt-2">{t(`exit.timeline.steps.${step.key}`)}</div>
                    <div className="text-xs text-gold mt-1">{step.date}</div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Early Exit Penalty */}
          <Card className="p-6 mb-6 border-danger bg-gradient-to-br from-danger/20 to-transparent">
            <h4 className="font-semibold text-danger mb-2 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              {t('exit.penalty.title')}
            </h4>
            <p className="text-sm text-foreground-secondary mb-4">{t('exit.penalty.description')}</p>
            <div className="flex justify-between items-center p-4 bg-background rounded-lg">
              <div>
                <div className="text-xs text-foreground-tertiary">{t('exit.penalty.rate')}: {mockExitData.penaltyRate}%</div>
                <div className="text-sm">${mockExitData.currentStake.toLocaleString()} × {mockExitData.penaltyRate}% =</div>
              </div>
              <div className="text-2xl font-bold text-danger">-${mockExitData.penaltyAmount.toLocaleString()}</div>
            </div>
          </Card>

          {/* Exit Form */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-6">{t('exit.form.title')}</h3>

            <div className="space-y-6">
              <div>
                <label htmlFor="exit-reason" className="block font-semibold mb-2">{t('exit.form.reasonLabel')}</label>
                <select
                  id="exit-reason"
                  value={exitReason}
                  onChange={(e) => setExitReason(e.target.value)}
                  className="w-full p-3 bg-background border border-surface-tertiary rounded-lg focus:outline-none focus:ring-2 focus:ring-hinomaru"
                >
                  <option value="">{t('exit.form.selectReason')}</option>
                  <option value="business">{t('exit.form.reasons.business')}</option>
                  <option value="resource">{t('exit.form.reasons.resource')}</option>
                  <option value="market">{t('exit.form.reasons.market')}</option>
                  <option value="personal">{t('exit.form.reasons.personal')}</option>
                  <option value="other">{t('exit.form.reasons.other')}</option>
                </select>
              </div>

              <div>
                <label htmlFor="exit-comment" className="block font-semibold mb-2">{t('exit.form.commentLabel')}</label>
                <textarea
                  id="exit-comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={t('exit.form.commentPlaceholder')}
                  className="w-full p-3 bg-background border border-surface-tertiary rounded-lg resize-y min-h-[100px] focus:outline-none focus:ring-2 focus:ring-hinomaru"
                />
              </div>

              <div>
                <label className="block font-semibold mb-2">{t('exit.form.returnAddressLabel')}</label>
                <div className="flex items-center gap-4 p-3 bg-background rounded-lg">
                  <code className="flex-1 text-sm">{mockExitData.returnAddress}</code>
                  <span className="text-success flex items-center gap-1 text-sm">
                    <CheckCircle className="h-4 w-4" aria-hidden="true" />
                    {t('exit.form.verified')}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-start gap-3 p-4 bg-background rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={confirmations.penalty}
                    onChange={(e) => setConfirmations({ ...confirmations, penalty: e.target.checked })}
                    className="w-5 h-5 mt-0.5"
                  />
                  <span className="text-sm text-foreground-secondary">
                    {t('exit.form.confirm.penalty', { amount: mockExitData.penaltyAmount.toLocaleString() })}
                  </span>
                </label>

                <label className="flex items-start gap-3 p-4 bg-background rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={confirmations.activityEnd}
                    onChange={(e) => setConfirmations({ ...confirmations, activityEnd: e.target.checked })}
                    className="w-5 h-5 mt-0.5"
                  />
                  <span className="text-sm text-foreground-secondary">{t('exit.form.confirm.activityEnd')}</span>
                </label>

                <label className="flex items-start gap-3 p-4 bg-background rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={confirmations.coolingPeriod}
                    onChange={(e) => setConfirmations({ ...confirmations, coolingPeriod: e.target.checked })}
                    className="w-5 h-5 mt-0.5"
                  />
                  <span className="text-sm text-foreground-secondary">{t('exit.form.confirm.coolingPeriod')}</span>
                </label>
              </div>

              <div className="flex gap-3">
                <Button variant="danger" disabled={!allConfirmed} aria-disabled={!allConfirmed}>
                  {t('exit.form.submitButton')}
                </Button>
                <Button variant="outline">{t('exit.form.cancelButton')}</Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Complete Tab */}
        <div
          id="complete-panel"
          role="tabpanel"
          aria-labelledby="complete-tab"
          className={activeTab === 'complete' ? '' : 'hidden'}
        >
          <Card className="p-8 text-center">
            <div className="w-24 h-24 mx-auto mb-6 bg-success rounded-full flex items-center justify-center">
              <CheckCircle className="h-12 w-12 text-white" aria-hidden="true" />
            </div>
            <h2 className="text-2xl font-bold mb-2">{t('exit.complete.title')}</h2>
            <p className="text-foreground-secondary mb-8">{t('exit.complete.description')}</p>

            <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
              <div className="p-4 bg-background rounded-lg text-left">
                <div className="text-xs text-foreground-tertiary mb-1">{t('exit.complete.proverId')}</div>
                <div className="font-mono font-semibold">{mockCompletedExit.proverId}</div>
              </div>
              <div className="p-4 bg-background rounded-lg text-left">
                <div className="text-xs text-foreground-tertiary mb-1">{t('exit.complete.activityPeriod')}</div>
                <div className="font-semibold">{t('exit.complete.days', { count: mockCompletedExit.activityDays })}</div>
              </div>
              <div className="p-4 bg-background rounded-lg text-left">
                <div className="text-xs text-foreground-tertiary mb-1">{t('exit.complete.status')}</div>
                <div className="font-semibold text-success">{t('exit.complete.statusComplete')}</div>
              </div>
              <div className="p-4 bg-background rounded-lg text-left">
                <div className="text-xs text-foreground-tertiary mb-1">{t('exit.complete.stakeReturned')}</div>
                <div className="font-semibold font-mono text-gold">${mockCompletedExit.stakeReturned.toLocaleString()}</div>
              </div>
              <div className="p-4 bg-background rounded-lg text-left">
                <div className="text-xs text-foreground-tertiary mb-1">{t('exit.complete.totalRewards')}</div>
                <div className="font-semibold font-mono text-gold">${mockCompletedExit.totalRewards.toLocaleString()}</div>
              </div>
              <div className="p-4 bg-background rounded-lg text-left">
                <div className="text-xs text-foreground-tertiary mb-1">{t('exit.complete.signaturesProcessed')}</div>
                <div className="font-semibold">{mockCompletedExit.signaturesProcessed.toLocaleString()}{t('exit.complete.count')}</div>
              </div>
            </div>

            <Link href="/prover/landing">
              <Button variant="primary">{t('exit.complete.backToHome')}</Button>
            </Link>
          </Card>

          {/* Thank You Message */}
          <Card className="p-6 mt-6 text-center border-gold bg-gradient-to-br from-gold/10 to-transparent">
            <h3 className="text-lg font-semibold text-gold mb-2">{t('exit.thankYou.title')}</h3>
            <p className="text-foreground-secondary">{t('exit.thankYou.description')}</p>
          </Card>
        </div>
      </main>
    </div>
  );
}
