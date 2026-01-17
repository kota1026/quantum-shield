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
} from 'lucide-react';

// Mock data for council members
const securityCouncilMembers = [
  { id: 'S1', name: 'security.eth', role: 'lead', active: true },
  { id: 'S2', name: 'audit_pro.eth', role: 'member', active: true },
  { id: 'S3', name: 'crypto_sec.eth', role: 'member', active: true },
  { id: 'S4', name: 'quantum_ex.eth', role: 'member', active: true },
  { id: 'S5', name: 'stark_dev.eth', role: 'member', active: true },
  { id: 'S6', name: 'zk_expert.eth', role: 'member', active: false },
  { id: 'S7', name: 'security_7.eth', role: 'member', active: false },
];

const purposeCommitteeMembers = [
  { id: 'P1', name: 'founder.eth', role: 'chair', active: true },
  { id: 'P2', name: 'advisor.eth', role: 'member', active: true },
  { id: 'P3', name: 'community.eth', role: 'member', active: true },
];

// Mock data for veto history
const vetoHistory = [
  {
    id: 'QIP-32',
    title: 'Remove Time Lock for Parameter Changes',
    vetoedBy: 'Purpose Committee',
    approvalCount: '2/3',
    reason: 'cp3',
    date: '2025-09-20',
    onchainRef: '0x7a8b9c0d...ef12',
    reasonText:
      'This proposal was vetoed because it directly violates Core Principle 3 (CP-3: Security First). The Time Lock mechanism is a critical security feature that provides the community with time to review and respond to governance decisions. Removing it would significantly reduce the protocol\'s security posture and eliminate an important safeguard against malicious proposals.',
  },
];

// Mock data for system status
const systemStatus = {
  lockContract: true,
  starkVerifier: true,
  governance: true,
  lastCheck: '2026-01-17 15:30 UTC',
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
            className={`flex items-center gap-2 rounded-full px-6 py-2 text-sm font-medium transition-colors ${
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
            className={`flex items-center gap-2 rounded-full px-6 py-2 text-sm font-medium transition-colors ${
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
          <div className="mb-4 flex flex-wrap justify-center gap-6 text-xs text-gray-500">
            <Link href="/governance" className="transition-colors hover:text-white">
              {tFooter('governanceForum')}
            </Link>
            <Link href="/docs" className="transition-colors hover:text-white">
              {tFooter('documentation')}
            </Link>
            <Link href="/terms" className="transition-colors hover:text-white">
              {tFooter('terms')}
            </Link>
            <Link href="/privacy" className="transition-colors hover:text-white">
              {tFooter('privacy')}
            </Link>
          </div>
          <p className="text-center text-xs text-gray-600">{t('footer.disclaimer')}</p>
        </footer>
      </div>
    </main>
  );
}
