'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useState } from 'react';
import {
  Shield,
  Target,
  Info,
  Lock,
  Rocket,
  Vote,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  HelpCircle,
  ArrowLeft,
} from 'lucide-react';
import { useCouncil } from '@/hooks/governance';
import type { CouncilData } from '@/lib/api/governance/mock';

// Empty initial state (no fake data)
const EMPTY_COUNCIL: CouncilData = {
  securityCouncil: [],
  purposeCommittee: [],
  vetoHistory: [],
  systemStatus: {
    lockContract: false,
    starkVerifier: false,
    governance: false,
    lastCheck: '-',
  },
};

type TabType = 'status' | 'veto';

interface MemberCardProps {
  id: string;
  name: string;
  role: string;
  active: boolean;
  roleLabel: string;
  activeLabel: string;
  inactiveLabel: string;
}

function MemberCard({
  id,
  name,
  role,
  active,
  roleLabel,
  activeLabel,
  inactiveLabel,
}: MemberCardProps) {
  return (
    <div className="rounded-lg bg-[#111114] p-4 text-center">
      <div className="bg-gradient-gold mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white">
        {id}
      </div>
      <div className="mb-0.5 truncate text-xs font-semibold text-white">{name}</div>
      <div className="text-[10px] text-gray-500">{roleLabel}</div>
      <div className="mt-2 flex items-center justify-center gap-1">
        <span
          className={`inline-block h-2 w-2 rounded-full ${active ? 'bg-emerald-500' : 'bg-gray-500'}`}
        />
        <span className="text-[10px] text-gray-500">{active ? activeLabel : inactiveLabel}</span>
      </div>
    </div>
  );
}

interface CouncilCardProps {
  title: string;
  icon: React.ReactNode;
  status: string;
  description: string;
  multisigTooltip?: string;
  members: Array<{ id: string; name: string; role: string; active: boolean }>;
  roleLabels: { lead: string; member: string; chair: string };
  activeLabel: string;
  inactiveLabel: string;
}

function CouncilCard({
  title,
  icon,
  status,
  description,
  multisigTooltip,
  members,
  roleLabels,
  activeLabel,
  inactiveLabel,
}: CouncilCardProps) {
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'lead':
        return roleLabels.lead;
      case 'chair':
        return roleLabels.chair;
      default:
        return roleLabels.member;
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-white/5 bg-[#0e0e11]">
      <div className="flex items-center justify-between border-b border-white/5 p-6">
        <div className="flex items-center gap-2 text-lg font-semibold text-white">
          {icon}
          {title}
        </div>
        <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-500">
          {status}
        </span>
      </div>
      <div className="p-6">
        <div className="mb-6 flex items-start gap-2 text-sm leading-relaxed text-gray-400">
          <span>{description}</span>
          {multisigTooltip && (
            <span className="group relative cursor-help">
              <HelpCircle className="h-4 w-4 flex-shrink-0 text-gray-500" aria-hidden="true" />
              <span
                role="tooltip"
                className="invisible absolute bottom-full left-1/2 z-50 mb-2 w-64 -translate-x-1/2 rounded-lg bg-[#1a1a1f] p-3 text-xs text-gray-300 shadow-lg group-hover:visible"
              >
                {multisigTooltip}
              </span>
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {members.map((member) => (
            <MemberCard
              key={member.id}
              {...member}
              roleLabel={getRoleLabel(member.role)}
              activeLabel={activeLabel}
              inactiveLabel={inactiveLabel}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface SystemStatusCardProps {
  icon: React.ReactNode;
  name: string;
  active: boolean;
  activeLabel: string;
}

function SystemStatusCard({ icon, name, active, activeLabel }: SystemStatusCardProps) {
  return (
    <div className="rounded-lg bg-[#111114] p-6 text-center">
      <div className="mb-2 text-2xl">{icon}</div>
      <div className="mb-1 text-sm font-semibold text-white">{name}</div>
      <div
        className={`inline-flex items-center gap-1 text-xs ${active ? 'text-emerald-500' : 'text-yellow-500'}`}
      >
        <span
          className={`inline-block h-2 w-2 rounded-full ${active ? 'bg-emerald-500' : 'bg-yellow-500'}`}
        />
        {activeLabel}
      </div>
    </div>
  );
}

export function Council() {
  const t = useTranslations('governance.council');
  const tFooter = useTranslations('governance.landing.footer');
  const [activeTab, setActiveTab] = useState<TabType>('status');

  // Fetch data using hooks
  const { data: councilApi, isLoading, error } = useCouncil();

  if (isLoading) {
    return (
      <main className="relative min-h-screen bg-[#0a0a0c] pb-12" aria-label={t('ariaLabel')} role="main">
        <div className="relative z-10 mx-auto max-w-6xl px-6 pt-8 animate-pulse space-y-6">
          <div className="h-6 w-40 rounded bg-surface-secondary" />
          <div className="h-10 w-64 rounded bg-surface-secondary" />
          <div className="h-24 rounded-lg bg-surface-secondary" />
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="h-64 rounded-xl bg-surface-secondary" />
            <div className="h-64 rounded-xl bg-surface-secondary" />
          </div>
          <div className="h-48 rounded-xl bg-surface-secondary" />
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="relative min-h-screen bg-[#0a0a0c] pb-12" aria-label={t('ariaLabel')} role="main">
        <div className="flex h-[50vh] items-center justify-center">
          <div className="text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-danger" />
            <p className="mt-4 text-lg font-semibold text-foreground">{t('error')}</p>
          </div>
        </div>
      </main>
    );
  }

  // Use API data with fallback
  const councilData = councilApi ?? EMPTY_COUNCIL;
  const securityCouncilMembers = councilData.securityCouncil;
  const purposeCommitteeMembers = councilData.purposeCommittee;
  const vetoHistory = councilData.vetoHistory;
  const systemStatus = councilData.systemStatus;

  const [selectedVeto, setSelectedVeto] = useState<string | null>(vetoHistory[0]?.id || null);

  const securityActiveCount = securityCouncilMembers.filter((m) => m.active).length;
  const purposeActiveCount = purposeCommitteeMembers.filter((m) => m.active).length;

  return (
    <main
      className="relative min-h-screen bg-[#0a0a0c] pb-12"
      aria-label={t('ariaLabel')}
      role="main"
    >
      {/* Premium background */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute left-1/2 top-[-100px] h-[500px] w-[800px] -translate-x-1/2 bg-[radial-gradient(ellipse,rgba(201,169,98,0.12),transparent_60%)] opacity-50" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-6 pt-8">
        {/* Back to Dashboard */}
        <Link
          href="/governance/landing"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gold transition-colors mb-6 min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('backToDashboard')}
        </Link>

        {/* Page Header */}
        <header className="mb-8">
          <h1 className="mb-2 flex items-center gap-3 text-3xl font-bold text-white">
            <Shield className="h-8 w-8 text-gold" aria-hidden="true" />
            {t('pageTitle')}
          </h1>
          <p className="text-gray-400">{t('pageSubtitle')}</p>
        </header>

        {/* Info Box */}
        <div className="mb-8 rounded-lg border border-gold bg-gold/10 p-6">
          <div className="mb-2 flex items-center gap-2 font-semibold text-gold">
            <Info className="h-5 w-5" aria-hidden="true" />
            {t('infoBox.title')}
          </div>
          <p className="text-sm leading-relaxed text-gray-400">{t('infoBox.text')}</p>
        </div>

        {/* Council Cards Grid */}
        <div className="mb-8 grid gap-8 lg:grid-cols-2">
          <CouncilCard
            title={t('securityCouncil.title')}
            icon={<Shield className="h-5 w-5 text-gold" aria-hidden="true" />}
            status={t('securityCouncil.status', {
              active: securityActiveCount,
              total: securityCouncilMembers.length,
            })}
            description={t('securityCouncil.description')}
            multisigTooltip={t('securityCouncil.multisigTooltip')}
            members={securityCouncilMembers}
            roleLabels={{
              lead: t('securityCouncil.roles.lead'),
              member: t('securityCouncil.roles.member'),
              chair: t('securityCouncil.roles.chair'),
            }}
            activeLabel={t('memberCard.active')}
            inactiveLabel={t('memberCard.inactive')}
          />

          <CouncilCard
            title={t('purposeCommittee.title')}
            icon={<Target className="h-5 w-5 text-gold" aria-hidden="true" />}
            status={t('purposeCommittee.status', {
              active: purposeActiveCount,
              total: purposeCommitteeMembers.length,
            })}
            description={t('purposeCommittee.description')}
            members={purposeCommitteeMembers}
            roleLabels={{
              lead: t('securityCouncil.roles.lead'),
              member: t('securityCouncil.roles.member'),
              chair: t('securityCouncil.roles.chair'),
            }}
            activeLabel={t('memberCard.active')}
            inactiveLabel={t('memberCard.inactive')}
          />
        </div>

        {/* Tabs */}
        <div
          className="mb-8 inline-flex gap-1 rounded-full border border-white/5 bg-[#111114] p-1"
          role="tablist"
          aria-label="Council information tabs"
        >
          <button
            role="tab"
            aria-selected={activeTab === 'status'}
            aria-controls="status-panel"
            id="status-tab"
            className={`flex items-center gap-2 rounded-full px-6 min-h-[44px] text-sm font-medium transition-colors ${
              activeTab === 'status'
                ? 'bg-[#18181c] text-white'
                : 'text-gray-400 hover:text-white'
            }`}
            onClick={() => setActiveTab('status')}
          >
            <CheckCircle className="h-4 w-4" aria-hidden="true" />
            {t('tabs.status')}
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'veto'}
            aria-controls="veto-panel"
            id="veto-tab"
            className={`flex items-center gap-2 rounded-full px-6 min-h-[44px] text-sm font-medium transition-colors ${
              activeTab === 'veto' ? 'bg-[#18181c] text-white' : 'text-gray-400 hover:text-white'
            }`}
            onClick={() => setActiveTab('veto')}
          >
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            {t('tabs.vetoHistory')}
          </button>
        </div>

        {/* Tab Content: System Status */}
        <div
          id="status-panel"
          role="tabpanel"
          aria-labelledby="status-tab"
          className={activeTab === 'status' ? 'block' : 'hidden'}
        >
          <div className="overflow-hidden rounded-xl border border-white/5 bg-[#0e0e11]">
            <div className="border-b border-white/5 p-6 font-semibold text-white">
              {t('systemStatus.title')}
            </div>
            <div className="p-6">
              {/* All Systems Operational */}
              <div className="mb-8 rounded-lg border border-emerald-500 bg-emerald-500/10 p-6 text-center">
                <div className="mb-2 text-5xl">
                  <CheckCircle className="mx-auto h-12 w-12 text-emerald-500" aria-hidden="true" />
                </div>
                <div className="mb-1 text-lg font-semibold text-emerald-500">
                  {t('systemStatus.allOperational')}
                </div>
                <div className="text-sm text-gray-400">
                  {t('systemStatus.lastCheck', { time: systemStatus.lastCheck })}
                </div>
              </div>

              {/* System Cards */}
              <div className="grid gap-4 md:grid-cols-3">
                <SystemStatusCard
                  icon={<Lock className="mx-auto h-6 w-6 text-gold" />}
                  name={t('systemStatus.systems.lockContract')}
                  active={systemStatus.lockContract}
                  activeLabel={t('systemStatus.statusActive')}
                />
                <SystemStatusCard
                  icon={<Rocket className="mx-auto h-6 w-6 text-gold" />}
                  name={t('systemStatus.systems.starkVerifier')}
                  active={systemStatus.starkVerifier}
                  activeLabel={t('systemStatus.statusActive')}
                />
                <SystemStatusCard
                  icon={<Vote className="mx-auto h-6 w-6 text-gold" />}
                  name={t('systemStatus.systems.governance')}
                  active={systemStatus.governance}
                  activeLabel={t('systemStatus.statusActive')}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tab Content: Veto History */}
        <div
          id="veto-panel"
          role="tabpanel"
          aria-labelledby="veto-tab"
          className={activeTab === 'veto' ? 'block' : 'hidden'}
        >
          <div className="overflow-hidden rounded-xl border border-white/5 bg-[#0e0e11]">
            <div className="border-b border-white/5 p-6 font-semibold text-white">
              {t('vetoHistory.title')} ({t('vetoHistory.total', { count: vetoHistory.length })})
            </div>

            {vetoHistory.length === 0 ? (
              <div className="p-6 text-center text-gray-500">{t('vetoHistory.noHistory')}</div>
            ) : (
              <div className="divide-y divide-white/5">
                {vetoHistory.map((veto) => (
                  <button
                    key={veto.id}
                    className={`grid w-full cursor-pointer grid-cols-[80px_1fr_150px] items-center gap-4 p-6 text-left transition-colors hover:bg-[#111114] md:grid-cols-[80px_1fr_150px_150px_120px] ${
                      selectedVeto === veto.id ? 'bg-[#111114]' : ''
                    }`}
                    onClick={() => setSelectedVeto(selectedVeto === veto.id ? null : veto.id)}
                    aria-expanded={selectedVeto === veto.id}
                  >
                    <div className="font-mono font-bold text-gold">{veto.id}</div>
                    <div className="truncate font-medium text-white">{veto.title}</div>
                    <div className="text-xs text-gray-400">{veto.vetoedBy}</div>
                    <div className="hidden items-center gap-1 text-xs text-yellow-500 md:flex">
                      <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                      {t(`vetoHistory.violations.${veto.reason}`)}
                    </div>
                    <div className="hidden text-xs text-gray-500 md:block">{veto.date}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Veto Detail Card */}
          {selectedVeto && (
            <div className="mt-6 overflow-hidden rounded-xl border border-white/5 bg-[#0e0e11]">
              <div className="border-b border-white/5 p-6 font-semibold text-white">
                {t('vetoHistory.vetoDetail.title', { id: selectedVeto })}
              </div>
              <div className="p-6">
                {vetoHistory
                  .filter((v) => v.id === selectedVeto)
                  .map((veto) => (
                    <div key={veto.id} className="space-y-6">
                      <div>
                        <div className="mb-1 text-xs text-gray-500">
                          {t('vetoHistory.vetoDetail.vetoedBy')}
                        </div>
                        <div className="font-semibold text-white">
                          {veto.vetoedBy} ({t('vetoHistory.vetoDetail.approvalCount', { count: veto.approvalCount })})
                        </div>
                      </div>
                      <div>
                        <div className="mb-1 text-xs text-gray-500">
                          {t('vetoHistory.vetoDetail.reason')}
                        </div>
                        <div className="rounded-lg bg-[#111114] p-4 text-sm leading-relaxed text-gray-300">
                          {veto.reasonText}
                        </div>
                      </div>
                      <div>
                        <div className="mb-1 text-xs text-gray-500">
                          {t('vetoHistory.vetoDetail.onchainRef')}
                        </div>
                        <div className="font-mono text-sm text-gold">{veto.onchainRef}</div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-12 border-t border-white/5 pt-6">
          <div className="mb-4 flex flex-wrap justify-center gap-4 text-xs text-gray-500">
            <a
              href="https://forum.quantumshield.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-white min-h-[44px] inline-flex items-center px-2"
            >
              {tFooter('governanceForum')}
            </a>
            <a
              href="https://github.com/kota1026/quantum-shield/blob/main/docs/WHITEPAPER.md"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-white min-h-[44px] inline-flex items-center px-2"
            >
              {tFooter('documentation')}
            </a>
            <Link href="/consumer/terms" className="transition-colors hover:text-white min-h-[44px] min-w-[44px] inline-flex items-center px-2">
              {tFooter('terms')}
            </Link>
            <Link href="/consumer/privacy" className="transition-colors hover:text-white min-h-[44px] inline-flex items-center px-2">
              {tFooter('privacy')}
            </Link>
          </div>
          <p className="text-center text-xs text-gray-600">{t('footer.disclaimer')}</p>
        </footer>
      </div>
    </main>
  );
}
