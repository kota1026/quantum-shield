'use client';

import { useTranslations } from 'next-intl';
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  Coins,
  Bell,
  Lock,
  Swords,
  LogOut,
  Settings,
  Shield,
  Vote,
  Eye,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Link } from '@/i18n/navigation';
import { EcosystemLink } from '@/components/shared/EcosystemLink';

interface ProverSidebarProps {
  activePage?: 'dashboard' | 'queue' | 'metrics' | 'alerts' | 'challenges' | 'exit' | 'settings';
}

export function ProverSidebar({ activePage = 'dashboard' }: ProverSidebarProps) {
  const t = useTranslations('prover');

  const navItems = [
    { key: 'dashboard', icon: LayoutDashboard, href: '/prover/dashboard' },
    { key: 'queue', icon: FileText, href: '/prover/queue', badge: 12 },
    { key: 'metrics', icon: BarChart3, href: '/prover/metrics' },
    { key: 'rewards', icon: Coins, href: '/prover/metrics' },
  ];

  const managementItems = [
    { key: 'alerts', icon: Bell, href: '/prover/alerts?tab=alerts', badge: 2, badgeVariant: 'warning' as const },
    { key: 'stake', icon: Lock, href: '/prover/alerts?tab=stake' },
    { key: 'challenges', icon: Swords, href: '/prover/challenges' },
  ];

  return (
    <aside className="w-64 bg-background-secondary border-r border-surface-tertiary p-6 flex flex-col">
      <Link href="/prover/landing" className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 relative flex items-center justify-center">
          <div
            className="absolute inset-0 border-[1.5px] border-gold rounded-full animate-spin"
            style={{ animationDuration: '25s' }}
          >
            <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-gold rounded-full" />
          </div>
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
        {navItems.map((item) => {
          const isActive = item.key === activePage || (item.key === 'rewards' && activePage === 'metrics');
          return (
            <Link
              key={item.key}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium mb-1 transition-colors ${
                isActive
                  ? 'bg-hinomaru/10 text-hinomaru-400'
                  : 'text-foreground-secondary hover:bg-surface hover:text-foreground'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <item.icon className="h-[18px] w-[18px]" aria-hidden="true" />
              {t(`dashboard.nav.${item.key}`)}
              {item.badge && (
                <Badge variant="danger" className="ml-auto text-[11px] px-2 py-0.5">
                  {item.badge}
                </Badge>
              )}
            </Link>
          );
        })}

        <div className="text-[10px] uppercase tracking-[1.5px] text-foreground-tertiary px-3 mb-2 mt-6">
          {t('dashboard.nav.management')}
        </div>
        {managementItems.map((item) => {
          const isActive = item.key === activePage ||
            (item.key === 'alerts' && activePage === 'alerts') ||
            (item.key === 'challenges' && activePage === 'challenges');
          return (
            <Link
              key={item.key}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium mb-1 transition-colors ${
                isActive
                  ? 'bg-hinomaru/10 text-hinomaru-400'
                  : 'text-foreground-secondary hover:bg-surface hover:text-foreground'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <item.icon className="h-[18px] w-[18px]" aria-hidden="true" />
              {t(`dashboard.nav.${item.key}`)}
              {item.badge && (
                <Badge variant={item.badgeVariant || 'danger'} className="ml-auto text-[11px] px-2 py-0.5">
                  {item.badge}
                </Badge>
              )}
            </Link>
          );
        })}

        <div className="text-[10px] uppercase tracking-[1.5px] text-foreground-tertiary px-3 mb-2 mt-6">
          {t('dashboard.nav.account')}
        </div>
        <Link
          href="/prover/settings"
          className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium mb-1 transition-colors ${
            activePage === 'settings'
              ? 'bg-hinomaru/10 text-hinomaru-400'
              : 'text-foreground-secondary hover:bg-surface hover:text-foreground'
          }`}
          aria-current={activePage === 'settings' ? 'page' : undefined}
        >
          <Settings className="h-[18px] w-[18px]" aria-hidden="true" />
          {t('dashboard.nav.settings')}
        </Link>
        <Link
          href="/prover/exit"
          className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
            activePage === 'exit'
              ? 'bg-hinomaru/10 text-hinomaru-400'
              : 'text-foreground-secondary hover:bg-surface hover:text-foreground'
          }`}
        >
          <LogOut className="h-[18px] w-[18px]" aria-hidden="true" />
          {t('dashboard.nav.exit')}
        </Link>
      </nav>

      {/* Ecosystem Links */}
      <div className="text-[10px] uppercase tracking-[1.5px] text-foreground-tertiary px-3 mb-2 mt-6">
        {t('dashboard.nav.ecosystem')}
      </div>
      <div className="px-3 mb-3">
        <EcosystemLink variant="card" />
      </div>
      <Link
        href="/consumer/dashboard"
        className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium mb-1 transition-colors text-foreground-secondary hover:bg-surface hover:text-foreground"
      >
        <Shield className="h-[18px] w-[18px]" aria-hidden="true" />
        {t('dashboard.nav.consumerApp')}
      </Link>
      <Link
        href="/token-hub/dashboard"
        className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium mb-1 transition-colors text-foreground-secondary hover:bg-surface hover:text-foreground"
      >
        <Coins className="h-[18px] w-[18px]" aria-hidden="true" />
        {t('dashboard.nav.tokenHub')}
      </Link>
      <Link
        href="/governance/landing"
        className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium mb-1 transition-colors text-foreground-secondary hover:bg-surface hover:text-foreground"
      >
        <Vote className="h-[18px] w-[18px]" aria-hidden="true" />
        {t('dashboard.nav.governance')}
      </Link>
      <Link
        href="/observer/dashboard"
        className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium mb-1 transition-colors text-foreground-secondary hover:bg-surface hover:text-foreground"
      >
        <Eye className="h-[18px] w-[18px]" aria-hidden="true" />
        {t('dashboard.nav.observer')}
      </Link>

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
  );
}
