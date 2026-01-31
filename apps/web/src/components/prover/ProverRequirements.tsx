'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import {
  Shield,
  Server,
  Clock,
  Zap,
  Lock,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  Globe,
  Cpu,
  HardDrive,
  Wifi,
  Users,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function ProverRequirements() {
  const t = useTranslations('prover.requirements');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const toggleLocale = () => {
    const newLocale = locale === 'ja' ? 'en' : 'ja';
    router.replace(pathname, { locale: newLocale });
  };

  const coreRequirements = [
    {
      key: 'stake',
      icon: Lock,
      value: '$400,000+',
      color: 'hinomaru',
    },
    {
      key: 'hsm',
      icon: Shield,
      value: 'FIPS 140-2 Level 3+',
      color: 'gold',
    },
    {
      key: 'uptime',
      icon: Clock,
      value: '99.9%',
      color: 'success',
    },
    {
      key: 'responseTime',
      icon: Zap,
      value: '< 30s',
      color: 'info',
    },
  ];

  const technicalSpecs = [
    { key: 'cpu', icon: Cpu },
    { key: 'memory', icon: Server },
    { key: 'storage', icon: HardDrive },
    { key: 'network', icon: Wifi },
  ];

  const securityRequirements = [
    'hsmCertification',
    'keyManagement',
    'accessControl',
    'auditLogging',
    'incidentResponse',
  ];

  const operationalRequirements = [
    'availability',
    'monitoring',
    'backup',
    'updates',
    'communication',
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[radial-gradient(ellipse,rgba(201,169,98,0.08),transparent_60%)] opacity-50" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-8">
        {/* Header */}
        <header className="flex justify-between items-center py-5" role="banner">
          <Link href="/prover/landing" className="flex items-center gap-3 group">
            <div className="relative w-12 h-12 flex items-center justify-center">
              <div
                className="absolute inset-0 border border-gold rounded-full animate-[spin_25s_linear_infinite]"
                aria-hidden="true"
              >
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-gold rounded-full" />
              </div>
              <div
                className="w-6 h-6 bg-hinomaru rounded-full shadow-[0_0_20px_rgba(188,0,45,0.4)]"
                aria-hidden="true"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-semibold tracking-tight">Quantum Shield</span>
              <span className="text-[10px] text-gold tracking-widest uppercase">
                Prover Portal
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleLocale}
              className="flex items-center gap-2 px-3 py-2 min-h-[44px] text-sm font-medium text-foreground-secondary hover:text-foreground border border-surface-tertiary/30 rounded-full transition-colors"
              aria-label={locale === 'ja' ? 'Switch to English' : '日本語に切り替え'}
            >
              <Globe className="h-4 w-4" aria-hidden="true" />
              {locale === 'ja' ? 'EN' : 'JA'}
            </button>
            <Link
              href="/prover/landing"
              className="flex items-center gap-2 min-h-[44px] text-foreground-secondary hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              {t('backToLanding')}
            </Link>
          </div>
        </header>

        <main className="pb-16">
          {/* Hero */}
          <section className="text-center py-12">
            <h1 className="text-4xl font-bold mb-4">{t('title')}</h1>
            <p className="text-foreground-secondary max-w-2xl mx-auto">
              {t('subtitle')}
            </p>
          </section>

          {/* Core Requirements */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-6">{t('coreRequirements.title')}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {coreRequirements.map((req) => (
                <Card key={req.key} variant="hoverGradient" className="p-6 text-center">
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4 ${
                      req.color === 'hinomaru'
                        ? 'bg-hinomaru/10'
                        : req.color === 'gold'
                          ? 'bg-gold/10'
                          : req.color === 'success'
                            ? 'bg-success/10'
                            : 'bg-info/10'
                    }`}
                  >
                    <req.icon
                      className={`h-6 w-6 ${
                        req.color === 'hinomaru'
                          ? 'text-hinomaru'
                          : req.color === 'gold'
                            ? 'text-gold'
                            : req.color === 'success'
                              ? 'text-success'
                              : 'text-info'
                      }`}
                      aria-hidden="true"
                    />
                  </div>
                  <div className="text-2xl font-bold font-mono text-gold mb-2">
                    {req.value}
                  </div>
                  <h3 className="font-semibold mb-1">
                    {t(`coreRequirements.${req.key}.title`)}
                  </h3>
                  <p className="text-sm text-foreground-secondary">
                    {t(`coreRequirements.${req.key}.description`)}
                  </p>
                </Card>
              ))}
            </div>
          </section>

          {/* Technical Specifications */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-6">{t('technicalSpecs.title')}</h2>
            <Card className="p-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {technicalSpecs.map((spec) => (
                  <div key={spec.key} className="text-center">
                    <div className="w-12 h-12 bg-background-secondary rounded-lg flex items-center justify-center mx-auto mb-3">
                      <spec.icon className="h-6 w-6 text-foreground-secondary" aria-hidden="true" />
                    </div>
                    <h4 className="font-semibold mb-1">
                      {t(`technicalSpecs.${spec.key}.title`)}
                    </h4>
                    <p className="text-sm text-gold font-mono">
                      {t(`technicalSpecs.${spec.key}.value`)}
                    </p>
                    <p className="text-xs text-foreground-tertiary mt-1">
                      {t(`technicalSpecs.${spec.key}.note`)}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </section>

          {/* Security & Operational Requirements */}
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {/* Security */}
            <section>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Shield className="h-6 w-6 text-hinomaru" aria-hidden="true" />
                {t('security.title')}
              </h2>
              <Card className="p-6">
                <ul className="space-y-4">
                  {securityRequirements.map((req) => (
                    <li key={req} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-success flex-shrink-0 mt-0.5" aria-hidden="true" />
                      <div>
                        <span className="font-medium">{t(`security.${req}.title`)}</span>
                        <p className="text-sm text-foreground-secondary">
                          {t(`security.${req}.description`)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            </section>

            {/* Operational */}
            <section>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Server className="h-6 w-6 text-gold" aria-hidden="true" />
                {t('operational.title')}
              </h2>
              <Card className="p-6">
                <ul className="space-y-4">
                  {operationalRequirements.map((req) => (
                    <li key={req} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-success flex-shrink-0 mt-0.5" aria-hidden="true" />
                      <div>
                        <span className="font-medium">{t(`operational.${req}.title`)}</span>
                        <p className="text-sm text-foreground-secondary">
                          {t(`operational.${req}.description`)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            </section>
          </div>

          {/* Slashing Risks */}
          <section id="risk" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-warning" aria-hidden="true" />
              {t('slashing.title')}
            </h2>
            <Card className="p-8 border-warning/30">
              <p className="text-foreground-secondary mb-6">
                {t('slashing.description')}
              </p>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-warning/10 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">{t('slashing.minor.title')}</h4>
                  <p className="text-2xl font-bold font-mono text-warning mb-2">1-5%</p>
                  <p className="text-sm text-foreground-secondary">
                    {t('slashing.minor.description')}
                  </p>
                </div>
                <div className="bg-hinomaru/10 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">{t('slashing.major.title')}</h4>
                  <p className="text-2xl font-bold font-mono text-hinomaru mb-2">5-25%</p>
                  <p className="text-sm text-foreground-secondary">
                    {t('slashing.major.description')}
                  </p>
                </div>
                <div className="bg-hinomaru/20 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">{t('slashing.critical.title')}</h4>
                  <p className="text-2xl font-bold font-mono text-hinomaru mb-2">25-100%</p>
                  <p className="text-sm text-foreground-secondary">
                    {t('slashing.critical.description')}
                  </p>
                </div>
              </div>
              <div className="mt-6 p-4 bg-background-secondary rounded-lg">
                <h4 className="font-semibold mb-2">{t('slashing.quadratic.title')}</h4>
                <p className="text-sm text-foreground-secondary">
                  {t('slashing.quadratic.description')}
                </p>
              </div>
            </Card>
          </section>

          {/* CTA */}
          <section className="text-center">
            <Card className="p-12 bg-gradient-to-r from-hinomaru/5 to-gold/5">
              <h2 className="text-2xl font-bold mb-4">{t('cta.title')}</h2>
              <p className="text-foreground-secondary mb-8 max-w-xl mx-auto">
                {t('cta.description')}
              </p>
              <div className="flex gap-4 justify-center">
                <Button variant="primary" size="lg" asChild>
                  <Link href="/prover/application">
                    {t('cta.applyButton')}
                    <ArrowRight className="h-4 w-4 ml-2" aria-hidden="true" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="/prover/terms">
                    <FileText className="h-4 w-4 mr-2" aria-hidden="true" />
                    {t('cta.termsButton')}
                  </Link>
                </Button>
              </div>
            </Card>
          </section>
        </main>
      </div>
    </div>
  );
}
