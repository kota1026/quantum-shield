'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Lock,
  Unlock,
  Key,
  Shield,
  Server,
  Layers,
  Users,
  AlertTriangle,
  Clock,
  Zap,
  CheckCircle,
  Hash,
  ShieldCheck,
  Ban,
  FileText,
  Eye,
  Cpu,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const algorithms = ['dilithium', 'sphincs', 'sha3'] as const;

const specCategories = ['timing', 'signatures', 'staking', 'limits'] as const;

const specItems: Record<string, string[]> = {
  timing: ['normalUnlock', 'emergencyUnlock', 'proverTimeout', 'challengeDefense'],
  signatures: ['threshold', 'vrfTimeout', 'sigDeadline'],
  staking: ['proverMin', 'observerMin', 'emergencyBond'],
  limits: ['tvlCap', 'minLock'],
};

const principles = ['cp1', 'cp2', 'cp3', 'cp4', 'cp5'] as const;

export function TechnicalDetails() {
  const t = useTranslations('ecosystemTechnical');
  const [expandedSequence, setExpandedSequence] = useState<string | null>('lock');

  const toggleSequence = (key: string) => {
    setExpandedSequence(expandedSequence === key ? null : key);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Premium Background Effect */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
        <div
          className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[800px] h-[600px]"
          style={{
            background: 'radial-gradient(ellipse, rgba(188, 0, 45, 0.1), transparent 60%)',
            opacity: 0.5,
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 flex justify-between items-center px-8 py-6 border-b border-border/50" role="banner">
        <div className="flex items-center gap-4">
          <Link href="/ecosystem" className="flex items-center gap-2 text-foreground-secondary hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">{t('backToEcosystem')}</span>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 relative flex items-center justify-center" aria-hidden="true">
            <div className="absolute inset-0 border border-gold rounded-full">
              <span className="absolute -top-[2px] left-1/2 -translate-x-1/2 w-1 h-1 bg-gold rounded-full" />
            </div>
            <div className="w-5 h-5 bg-hinomaru rounded-full" />
          </div>
          <span className="font-semibold">Quantum Shield</span>
        </div>
      </header>

      <main className="relative z-10 max-w-[1000px] mx-auto px-8 py-12">
        {/* Page Title */}
        <div className="mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{t('title')}</h1>
          <p className="text-foreground-secondary text-lg">
            {t('description')}
          </p>
        </div>

        {/* Table of Contents */}
        <Card className="p-6 mb-12">
          <h2 className="font-bold text-lg mb-4">{t('toc.title')}</h2>
          <nav className="grid md:grid-cols-2 gap-2">
            {['architecture', 'crypto', 'sequences', 'roles', 'specs', 'principles'].map((section) => (
              <a
                key={section}
                href={`#${section}`}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-background-secondary transition-colors text-sm"
              >
                <ArrowRight className="w-4 h-4 text-gold" />
                <span>{t(`toc.${section}`)}</span>
              </a>
            ))}
          </nav>
        </Card>

        {/* Architecture Section */}
        <section className="mb-16" id="architecture">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Layers className="w-6 h-6 text-gold" />
            {t('architecture.title')}
          </h2>
          <p className="text-foreground-secondary mb-6">
            {t('architecture.description')}
          </p>

          <div className="space-y-4">
            {(['user', 'l3', 'l1'] as const).map((layer, index) => (
              <Card key={layer} className="p-6">
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                      layer === 'l1' && 'bg-hinomaru/10',
                      layer === 'l3' && 'bg-gold/10',
                      layer === 'user' && 'bg-emerald-500/10'
                    )}
                  >
                    {layer === 'l1' && <Server className="w-6 h-6 text-hinomaru" />}
                    {layer === 'l3' && <Layers className="w-6 h-6 text-gold" />}
                    {layer === 'user' && <Users className="w-6 h-6 text-emerald-500" />}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1">
                      {t(`architecture.layers.${layer}.title`)}
                    </h3>
                    <p className="text-sm text-foreground-secondary mb-3">
                      {t(`architecture.layers.${layer}.description`)}
                    </p>
                    <ul className="grid md:grid-cols-2 gap-2">
                      {(t.raw(`architecture.layers.${layer}.components`) as string[]).map(
                        (component, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                            <span className="text-foreground-secondary">{component}</span>
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                </div>
                {index < 2 && (
                  <div className="flex justify-center mt-4">
                    <div className="w-px h-8 bg-border" />
                  </div>
                )}
              </Card>
            ))}
          </div>
        </section>

        {/* Cryptography Section */}
        <section className="mb-16" id="crypto">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Key className="w-6 h-6 text-gold" />
            {t('crypto.title')}
          </h2>
          <p className="text-foreground-secondary mb-6">
            {t('crypto.description')}
          </p>

          <div className="grid md:grid-cols-3 gap-6 mb-6">
            {algorithms.map((algo) => (
              <Card key={algo} className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  {algo === 'dilithium' && <Key className="w-5 h-5 text-hinomaru" />}
                  {algo === 'sphincs' && <ShieldCheck className="w-5 h-5 text-gold" />}
                  {algo === 'sha3' && <Hash className="w-5 h-5 text-emerald-500" />}
                  <div>
                    <h3 className="font-bold">{t(`crypto.algorithms.${algo}.name`)}</h3>
                    <span className="text-xs text-gold">{t(`crypto.algorithms.${algo}.standard`)}</span>
                  </div>
                </div>
                <p className="text-sm text-gold font-medium mb-2">
                  {t(`crypto.algorithms.${algo}.use`)}
                </p>
                <p className="text-sm text-foreground-secondary">
                  {t(`crypto.algorithms.${algo}.description`)}
                </p>
              </Card>
            ))}
          </div>

          <Card className="p-6 border-danger/30 bg-danger/5">
            <div className="flex items-center gap-3 mb-4">
              <Ban className="w-5 h-5 text-danger" />
              <h3 className="font-bold text-danger">{t('crypto.prohibited.title')}</h3>
            </div>
            <ul className="space-y-2">
              {(t.raw('crypto.prohibited.items') as string[]).map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-foreground-secondary">
                  <span className="w-1.5 h-1.5 bg-danger rounded-full" />
                  {item}
                </li>
              ))}
            </ul>
          </Card>
        </section>

        {/* Sequences Section */}
        <section className="mb-16" id="sequences">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Zap className="w-6 h-6 text-gold" />
            {t('sequences.title')}
          </h2>
          <p className="text-foreground-secondary mb-6">
            {t('sequences.description')}
          </p>

          <div className="space-y-4">
            {(['lock', 'unlock', 'emergency'] as const).map((seq) => (
              <Card key={seq} className="overflow-hidden">
                <button
                  onClick={() => toggleSequence(seq)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-background-secondary/50 transition-colors"
                  aria-expanded={expandedSequence === seq}
                >
                  <div className="flex items-center gap-4">
                    {seq === 'lock' && <Lock className="w-6 h-6 text-hinomaru" />}
                    {seq === 'unlock' && <Unlock className="w-6 h-6 text-gold" />}
                    {seq === 'emergency' && <AlertTriangle className="w-6 h-6 text-warning" />}
                    <div>
                      <h3 className="text-lg font-bold">{t(`sequences.${seq}.title`)}</h3>
                      <div className="flex gap-4 text-sm text-foreground-secondary mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {t(`sequences.${seq}.time`)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5" />
                          {t(`sequences.${seq}.gas`)}
                        </span>
                      </div>
                    </div>
                  </div>
                  {expandedSequence === seq ? (
                    <ChevronUp className="w-5 h-5 text-foreground-secondary flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-foreground-secondary flex-shrink-0" />
                  )}
                </button>

                {expandedSequence === seq && (
                  <div className="px-6 pb-6 border-t border-border/50 pt-4">
                    {seq === 'emergency' && (
                      <div className="mb-4 p-3 bg-warning/10 border border-warning/30 rounded-lg text-sm text-warning">
                        {t('sequences.emergency.trigger')}
                      </div>
                    )}

                    <div className="space-y-3">
                      {(t.raw(`sequences.${seq}.steps`) as Array<{ step: number; action: string; detail: string }>).map(
                        (step) => (
                          <div key={step.step} className="flex gap-4">
                            <div className="w-8 h-8 bg-hinomaru text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
                              {step.step}
                            </div>
                            <div className="flex-1 pt-1">
                              <p className="font-medium text-foreground">{step.action}</p>
                              <p className="text-sm text-foreground-secondary">{step.detail}</p>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </section>

        {/* Roles Section */}
        <section className="mb-16" id="roles">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Users className="w-6 h-6 text-gold" />
            {t('roles.title')}
          </h2>
          <p className="text-foreground-secondary mb-6">
            {t('roles.description')}
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {(['prover', 'observer', 'user'] as const).map((role) => (
              <Card key={role} className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  {role === 'prover' && <Cpu className="w-6 h-6 text-purple-500" />}
                  {role === 'observer' && <Eye className="w-6 h-6 text-emerald-500" />}
                  {role === 'user' && <Users className="w-6 h-6 text-hinomaru" />}
                  <h3 className="font-bold text-lg">{t(`roles.${role}.title`)}</h3>
                </div>
                <p className="text-sm text-foreground-secondary mb-4">
                  {t(`roles.${role}.description`)}
                </p>

                <h4 className="text-sm font-semibold mb-2 text-gold">
                  {role === 'user' ? t('roles.actionsLabel') : t('roles.responsibilitiesLabel')}
                </h4>
                <ul className="space-y-1 mb-4">
                  {(t.raw(`roles.${role}.${role === 'user' ? 'actions' : 'responsibilities'}`) as string[]).map(
                    (item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                        <span className="text-foreground-secondary">{item}</span>
                      </li>
                    )
                  )}
                </ul>

                {role !== 'user' && (
                  <>
                    <h4 className="text-sm font-semibold mb-2 text-gold">{t('roles.requirementsLabel')}</h4>
                    <div className="text-sm text-foreground-secondary space-y-1">
                      <p>
                        <strong>{t('roles.stakeLabel')}:</strong> {t(`roles.${role}.requirements.stake`)}
                      </p>
                      {role === 'prover' && (
                        <>
                          <p>
                            <strong>HSM:</strong> {t('roles.prover.requirements.hsm')}
                          </p>
                          <p>
                            <strong>{t('roles.uptimeLabel')}:</strong> {t('roles.prover.requirements.uptime')}
                          </p>
                        </>
                      )}
                    </div>
                  </>
                )}

                {role === 'user' && (
                  <>
                    <h4 className="text-sm font-semibold mb-2 text-gold">{t('roles.benefitsLabel')}</h4>
                    <ul className="space-y-1">
                      {(t.raw('roles.user.benefits') as string[]).map((benefit, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                          <span className="text-foreground-secondary">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </Card>
            ))}
          </div>
        </section>

        {/* Specs Section */}
        <section className="mb-16" id="specs">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <FileText className="w-6 h-6 text-gold" />
            {t('specs.title')}
          </h2>
          <p className="text-foreground-secondary mb-6">
            {t('specs.description')}
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {specCategories.map((category) => (
              <Card key={category} className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  {category === 'timing' && <Clock className="w-5 h-5 text-hinomaru" />}
                  {category === 'signatures' && <Key className="w-5 h-5 text-gold" />}
                  {category === 'staking' && <Shield className="w-5 h-5 text-emerald-500" />}
                  {category === 'limits' && <Server className="w-5 h-5 text-purple-500" />}
                  <h3 className="font-bold">{t(`specs.${category}.title`)}</h3>
                </div>
                <div className="space-y-3">
                  {specItems[category].map((item) => (
                    <div key={item} className="flex justify-between items-start border-b border-border/30 pb-3 last:border-0 last:pb-0">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{t(`specs.${category}.items.${item}.label`)}</p>
                        <p className="text-xs text-foreground-tertiary">
                          {t(`specs.${category}.items.${item}.description`)}
                        </p>
                      </div>
                      <span className="font-bold text-gold ml-4">
                        {t(`specs.${category}.items.${item}.value`)}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Principles Section */}
        <section className="mb-16" id="principles">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Shield className="w-6 h-6 text-gold" />
            {t('principles.title')}
          </h2>
          <p className="text-foreground-secondary mb-6">
            {t('principles.description')}
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {principles.map((cp) => (
              <Card key={cp} className="p-5 border-gold/30">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-gold" />
                  <h3 className="font-bold text-sm">{t(`principles.items.${cp}.title`)}</h3>
                </div>
                <p className="text-sm text-foreground-secondary">
                  {t(`principles.items.${cp}.description`)}
                </p>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center bg-gradient-to-br from-hinomaru/10 to-gold/10 rounded-2xl p-12 border border-hinomaru/20">
          <h2 className="text-2xl font-bold mb-4">{t('cta.title')}</h2>
          <p className="text-foreground-secondary mb-8 max-w-lg mx-auto">
            {t('cta.description')}
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/consumer/landing">
              <Button variant="primary" size="lg" className="flex items-center gap-2">
                {t('cta.getStarted')}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/ecosystem">
              <Button variant="outline" size="lg">
                {t('cta.backToApps')}
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border mt-20 py-8">
        <div className="max-w-[1000px] mx-auto px-8 text-center text-sm text-foreground-tertiary">
          <p>{t('footer.copyright')}</p>
        </div>
      </footer>
    </div>
  );
}
