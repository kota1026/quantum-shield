'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  Shield,
  ArrowLeft,
  Users,
  ExternalLink,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Vote,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Demo council members data
const DEMO_COUNCIL_MEMBERS = [
  {
    id: '1',
    name: 'Nakamoto Foundation',
    address: '0x1234...5678',
    initial: 'N',
    role: 'Chair',
    joinedDate: '2024-01-15',
    votingPower: 15,
    description: 'Leading blockchain research foundation focused on decentralized governance.',
    isActive: true,
  },
  {
    id: '2',
    name: 'Quantum Security Labs',
    address: '0xabcd...efgh',
    initial: 'Q',
    role: 'Security',
    joinedDate: '2024-01-15',
    votingPower: 15,
    description: 'Cryptography research lab specializing in post-quantum security.',
    isActive: true,
  },
  {
    id: '3',
    name: 'Tokyo Tech Council',
    address: '0x9876...5432',
    initial: 'T',
    role: 'Technical',
    joinedDate: '2024-03-01',
    votingPower: 14,
    description: 'Academic institution providing technical oversight and research.',
    isActive: true,
  },
  {
    id: '4',
    name: 'DeFi Alliance',
    address: '0xdef0...1234',
    initial: 'D',
    role: 'Integration',
    joinedDate: '2024-03-01',
    votingPower: 14,
    description: 'DeFi ecosystem representative ensuring cross-protocol compatibility.',
    isActive: true,
  },
  {
    id: '5',
    name: 'Community DAO',
    address: '0x5555...6666',
    initial: 'C',
    role: 'Community',
    joinedDate: '2024-06-01',
    votingPower: 14,
    description: 'Elected community representative for user advocacy.',
    isActive: true,
  },
  {
    id: '6',
    name: 'Legal Advisory',
    address: '0x7777...8888',
    initial: 'L',
    role: 'Legal',
    joinedDate: '2024-06-01',
    votingPower: 14,
    description: 'Legal counsel ensuring regulatory compliance across jurisdictions.',
    isActive: true,
  },
  {
    id: '7',
    name: 'Risk Committee',
    address: '0x9999...0000',
    initial: 'R',
    role: 'Risk',
    joinedDate: '2024-09-01',
    votingPower: 14,
    description: 'Risk assessment team monitoring protocol health and safety.',
    isActive: true,
  },
];

// Demo emergency actions
const DEMO_EMERGENCY_ACTIONS = [
  {
    id: 'EA-003',
    title: 'Pause Prover Registration',
    status: 'executed',
    date: '2024-12-15',
    votes: { for: 5, against: 2 },
    reason: 'Security vulnerability in onboarding flow detected.',
  },
  {
    id: 'EA-002',
    title: 'Rate Limit Increase',
    status: 'executed',
    date: '2024-10-22',
    votes: { for: 7, against: 0 },
    reason: 'Network congestion required temporary parameter adjustment.',
  },
];

// Role colors
const roleColors: Record<string, string> = {
  Chair: 'bg-gold/10 text-gold border-gold/30',
  Security: 'bg-hinomaru/10 text-hinomaru border-hinomaru/30',
  Technical: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  Integration: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  Community: 'bg-success/10 text-success border-success/30',
  Legal: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
  Risk: 'bg-warning/10 text-warning border-warning/30',
};

export function Council() {
  const t = useTranslations('qs-hub.council');
  const tCommon = useTranslations('qs-hub.common');

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Premium Background Effect */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
        <div
          className={cn(
            'absolute -top-24 left-1/2 -translate-x-1/2',
            'w-[800px] h-[500px]',
            'bg-[radial-gradient(ellipse,rgba(201,169,98,0.12),transparent_60%)]',
            'opacity-50'
          )}
        />
      </div>

      {/* Main Content */}
      <main className="relative z-10 max-w-[1000px] mx-auto px-4 sm:px-6 pt-6" role="main">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <Link
            href="/qs-hub/dashboard"
            className="flex items-center gap-2 text-sm text-foreground-secondary hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {tCommon('backToHome')}
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 relative flex items-center justify-center">
              <div
                className="absolute inset-0 border border-gold rounded-full animate-spin"
                style={{ animationDuration: '25s' }}
              />
              <div className="w-5 h-5 bg-hinomaru rounded-full shadow-glow-hinomaru" />
            </div>
            <div>
              <div className="text-sm font-semibold">Quantum Shield</div>
              <div className="text-[10px] text-gold tracking-wider">QS HUB</div>
            </div>
          </div>
        </header>

        {/* Page Title */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-hinomaru/10 flex items-center justify-center">
            <Shield className="w-6 h-6 text-hinomaru" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t('title')}</h1>
            <p className="text-sm text-foreground-secondary">{t('subtitle')}</p>
          </div>
        </div>

        {/* About Section */}
        <Card className="p-6 mb-8 bg-gradient-to-br from-background to-hinomaru/5 border-hinomaru/20">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-hinomaru flex-shrink-0 mt-1" aria-hidden="true" />
            <div>
              <h2 className="font-semibold mb-2">{t('about.title')}</h2>
              <p className="text-sm text-foreground-secondary mb-4">{t('about.description')}</p>
              <div className="grid sm:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span>{t('about.feature1')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span>{t('about.feature2')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span>{t('about.feature3')}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Stats */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8" aria-label={t('statsAriaLabel')}>
          <Card className="p-4">
            <div className="text-xs text-foreground-tertiary mb-1">{t('stats.members')}</div>
            <div className="text-2xl font-bold">{DEMO_COUNCIL_MEMBERS.length}</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs text-foreground-tertiary mb-1">{t('stats.threshold')}</div>
            <div className="text-2xl font-bold">5/7</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs text-foreground-tertiary mb-1">{t('stats.actions')}</div>
            <div className="text-2xl font-bold">{DEMO_EMERGENCY_ACTIONS.length}</div>
          </Card>
          <Card className="p-4 border-success/30">
            <div className="text-xs text-foreground-tertiary mb-1">{t('stats.status')}</div>
            <div className="text-lg font-semibold text-success">{t('stats.active')}</div>
          </Card>
        </section>

        {/* Council Members */}
        <section className="mb-8" aria-labelledby="members-heading">
          <h2 id="members-heading" className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-gold" aria-hidden="true" />
            {t('members.title')}
          </h2>

          <div className="grid sm:grid-cols-2 gap-4" role="list" aria-label={t('members.listAriaLabel')}>
            {DEMO_COUNCIL_MEMBERS.map((member) => (
              <Card
                key={member.id}
                className="p-5 hover:border-gold/30 transition-all duration-200"
                role="listitem"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center text-gold font-bold text-lg">
                    {member.initial}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{member.name}</span>
                      <span
                        className={cn(
                          'text-xs px-2 py-0.5 rounded-full border',
                          roleColors[member.role] || 'bg-foreground-tertiary/10 text-foreground-tertiary'
                        )}
                      >
                        {t(`roles.${member.role.toLowerCase()}`)}
                      </span>
                    </div>
                    <p className="text-xs text-foreground-tertiary mb-2">{member.description}</p>
                    <div className="flex items-center gap-4 text-xs text-foreground-secondary">
                      <span className="font-mono">{member.address}</span>
                      <span className="flex items-center gap-1">
                        <Vote className="w-3 h-3" />
                        {member.votingPower}%
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Recent Emergency Actions */}
        <section aria-labelledby="actions-heading">
          <h2 id="actions-heading" className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-hinomaru" aria-hidden="true" />
            {t('actions.title')}
          </h2>

          <div className="space-y-3" role="list" aria-label={t('actions.listAriaLabel')}>
            {DEMO_EMERGENCY_ACTIONS.map((action) => (
              <Card
                key={action.id}
                className="p-4 hover:border-gold/30 transition-all duration-200"
                role="listitem"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-foreground-tertiary">{action.id}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-success/10 text-success">
                        {t(`actions.status.${action.status}`)}
                      </span>
                    </div>
                    <h3 className="font-medium mb-1">{action.title}</h3>
                    <p className="text-sm text-foreground-secondary">{action.reason}</p>
                  </div>
                  <div className="text-right text-sm">
                    <div className="flex items-center gap-1 text-foreground-tertiary mb-1">
                      <Clock className="w-3.5 h-3.5" />
                      {action.date}
                    </div>
                    <div className="text-xs">
                      <span className="text-success">{action.votes.for}</span>
                      <span className="text-foreground-tertiary mx-1">/</span>
                      <span className="text-danger">{action.votes.against}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-border text-center">
          <p className="text-xs text-foreground-tertiary">
            © 2024 Quantum Shield. All rights reserved.
          </p>
        </footer>
      </main>
    </div>
  );
}

export default Council;
