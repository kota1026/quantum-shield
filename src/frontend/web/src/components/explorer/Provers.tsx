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

// Empty initial state (no fake data)
const DEFAULT_PROVER_STATS: ProverStats = {
  totalProvers: 0,
  activeProvers: 0,
  avgUptime: 0,
  avgResponseTime: '-',
  totalSignatures: 0,
};

const EMPTY_PROVERS: ProverSummary[] = [];

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
  const stats = proverStatsApi ?? DEFAULT_PROVER_STATS;
  const provers = proversApi ?? EMPTY_PROVERS;

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
                  {stats.activeProvers}/{stats.totalProvers} {t('provers.stats.online')}
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
              <div className="text-2xl font-bold">{stats.totalProvers}</div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <Activity className="w-5 h-5 text-success" />
                <span className="text-sm text-foreground-secondary">{t('provers.stats.avgUptime')}</span>
              </div>
              <div className="text-2xl font-bold text-success">{stats.avgUptime}%</div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <Clock className="w-5 h-5 text-foreground-secondary" />
                <span className="text-sm text-foreground-secondary">{t('provers.stats.avgResponseTime')}</span>
              </div>
              <div className="text-2xl font-bold">{stats.avgResponseTime}</div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <Shield className="w-5 h-5 text-hinomaru" />
                <span className="text-sm text-foreground-secondary">{t('provers.stats.totalSignatures')}</span>
              </div>
              <div className="text-2xl font-bold">{stats.totalSignatures.toLocaleString()}</div>
            </Card>
          </div>

          {/* Provers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {provers.map((prover) => (
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
