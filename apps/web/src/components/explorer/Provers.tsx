'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  Server,
  Activity,
  Clock,
  Shield,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProverStats, useProvers } from '@/hooks/explorer';
import type { ProverStats, ProverSummary } from '@/lib/api/explorer/mock';

// Fallback data (used when API is unavailable)
const FALLBACK_PROVER_STATS: ProverStats = {
  totalProvers: 8,
  activeProvers: 8,
  avgUptime: 99.87,
  avgResponseTime: '1.2s',
  totalSignatures: 45892,
};

const FALLBACK_PROVERS: ProverSummary[] = [
  {
    id: 'prover-1',
    name: 'Prover Alpha',
    address: '0x1a2b...3c4d',
    stake: '100.00',
    uptime: 99.99,
    responseTime: '0.8s',
    signaturesCount: 8234,
    status: 'active',
    lastActive: '2m ago',
  },
  {
    id: 'prover-2',
    name: 'Prover Beta',
    address: '0x5e6f...7g8h',
    stake: '100.00',
    uptime: 99.95,
    responseTime: '1.1s',
    signaturesCount: 7892,
    status: 'active',
    lastActive: '1m ago',
  },
  {
    id: 'prover-3',
    name: 'Prover Gamma',
    address: '0x9i0j...1k2l',
    stake: '100.00',
    uptime: 99.92,
    responseTime: '1.3s',
    signaturesCount: 6543,
    status: 'active',
    lastActive: '5m ago',
  },
  {
    id: 'prover-4',
    name: 'Prover Delta',
    address: '0x3m4n...5o6p',
    stake: '100.00',
    uptime: 99.88,
    responseTime: '1.5s',
    signaturesCount: 5421,
    status: 'active',
    lastActive: '3m ago',
  },
  {
    id: 'prover-5',
    name: 'Prover Epsilon',
    address: '0x7q8r...9s0t',
    stake: '100.00',
    uptime: 99.85,
    responseTime: '1.2s',
    signaturesCount: 6234,
    status: 'active',
    lastActive: '8m ago',
  },
  {
    id: 'prover-6',
    name: 'Prover Zeta',
    address: '0x1u2v...3w4x',
    stake: '100.00',
    uptime: 99.78,
    responseTime: '1.8s',
    signaturesCount: 4123,
    status: 'active',
    lastActive: '12m ago',
  },
  {
    id: 'prover-7',
    name: 'Prover Eta',
    address: '0x5y6z...7a8b',
    stake: '100.00',
    uptime: 99.72,
    responseTime: '2.1s',
    signaturesCount: 3892,
    status: 'active',
    lastActive: '15m ago',
  },
  {
    id: 'prover-8',
    name: 'Prover Theta',
    address: '0x9c0d...1e2f',
    stake: '100.00',
    uptime: 99.65,
    responseTime: '1.9s',
    signaturesCount: 3553,
    status: 'active',
    lastActive: '20m ago',
  },
];

interface ExplorerProversProps {
  locale?: string;
}

export function ExplorerProvers({ locale = 'ja' }: ExplorerProversProps) {
  const t = useTranslations('explorer');
  const router = useRouter();

  // Fetch data using hooks
  const { data: proverStatsApi } = useProverStats();
  const { data: proversApi } = useProvers();

  // Use API data with fallback
  const mockStats = proverStatsApi ?? FALLBACK_PROVER_STATS;
  const mockProvers = proversApi ?? FALLBACK_PROVERS;

  const getUptimeColor = (uptime: number) => {
    if (uptime >= 99.9) return 'text-success';
    if (uptime >= 99.5) return 'text-gold';
    return 'text-warning';
  };

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
                  href={`/${locale}/explorer/${item === 'overview' ? 'overview' : item}`}
                  className={cn(
                    'px-5 py-2 min-h-[44px] inline-flex items-center text-sm font-medium rounded-full transition-all',
                    item === 'provers'
                      ? 'bg-background-tertiary text-foreground'
                      : 'text-foreground-secondary hover:text-foreground'
                  )}
                >
                  {t(`common.header.${item}`)}
                </Link>
              ))}
            </nav>
          </header>

          {/* Page Title */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">{t('provers.pageTitle')}</h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-success/10 border border-success/30 rounded-full">
                <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
                <span className="text-sm text-success font-medium">
                  {mockStats.activeProvers}/{mockStats.totalProvers} {t('provers.stats.online')}
                </span>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <Server className="w-5 h-5 text-gold" />
                <span className="text-sm text-foreground-secondary">{t('provers.stats.totalProvers')}</span>
              </div>
              <div className="text-2xl font-bold">{mockStats.totalProvers}</div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <Activity className="w-5 h-5 text-success" />
                <span className="text-sm text-foreground-secondary">{t('provers.stats.avgUptime')}</span>
              </div>
              <div className="text-2xl font-bold text-success">{mockStats.avgUptime}%</div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <Clock className="w-5 h-5 text-foreground-secondary" />
                <span className="text-sm text-foreground-secondary">{t('provers.stats.avgResponseTime')}</span>
              </div>
              <div className="text-2xl font-bold">{mockStats.avgResponseTime}</div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <Shield className="w-5 h-5 text-hinomaru" />
                <span className="text-sm text-foreground-secondary">{t('provers.stats.totalSignatures')}</span>
              </div>
              <div className="text-2xl font-bold">{mockStats.totalSignatures.toLocaleString()}</div>
            </Card>
          </div>

          {/* Provers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {mockProvers.map((prover) => (
              <Link
                key={prover.id}
                href={`/${locale}/explorer/provers/${prover.id}`}
                className="block"
              >
                <Card className="p-6 hover:border-gold/50 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gold/10 rounded-xl flex items-center justify-center">
                        <Server className="w-5 h-5 text-gold" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{prover.name}</h3>
                        <span className="text-xs text-foreground-tertiary font-mono">{prover.address}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-success rounded-full" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-foreground-secondary">{t('provers.fields.uptime')}</span>
                      <span className={cn('font-mono font-semibold', getUptimeColor(prover.uptime))}>
                        {prover.uptime}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-foreground-secondary">{t('provers.fields.responseTime')}</span>
                      <span className="font-mono">{prover.responseTime}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-foreground-secondary">{t('provers.fields.signatures')}</span>
                      <span className="font-mono">{prover.signaturesCount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-foreground-secondary">{t('provers.fields.stake')}</span>
                      <span className="font-mono">{prover.stake} ETH</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border/50">
                    <span className="text-xs text-foreground-tertiary">
                      {t('provers.fields.lastActive')}: {prover.lastActive}
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          {/* Info Section */}
          <Card className="mt-8 p-6 border-gold/30 bg-gold/5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-gold/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <HelpCircle className="w-5 h-5 text-gold" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">{t('provers.info.title')}</h3>
                <p className="text-sm text-foreground-secondary">
                  {t('provers.info.description')}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  );
}
