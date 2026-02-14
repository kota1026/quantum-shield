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
import { useCouncil } from '@/hooks/qs-hub/useQSHub';


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

  // Fetch council from API
  const { data: councilMembers, isLoading: councilLoading, error: councilError } = useCouncil();

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
            className="min-h-[44px] px-2 -ml-2 inline-flex items-center gap-2 text-sm text-foreground-secondary hover:text-foreground transition-colors"
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
            <div className="text-2xl font-bold">{councilMembers?.length ?? 0}</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs text-foreground-tertiary mb-1">{t('stats.threshold')}</div>
            <div className="text-2xl font-bold">5/7</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs text-foreground-tertiary mb-1">{t('stats.actions')}</div>
            <div className="text-2xl font-bold">-</div>
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
            {councilLoading ? (
              <div className="col-span-full text-center py-8 text-foreground-tertiary">{t('loading')}</div>
            ) : councilError ? (
              <div className="col-span-full text-center py-8 text-warning">{t('error')}</div>
            ) : !councilMembers || councilMembers.length === 0 ? (
              <div className="col-span-full text-center py-8 text-foreground-tertiary">{t('members.empty')}</div>
            ) : councilMembers.map((member) => (
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

          <div className="text-center py-8 text-foreground-tertiary">
            {t('actions.noActions')}
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
