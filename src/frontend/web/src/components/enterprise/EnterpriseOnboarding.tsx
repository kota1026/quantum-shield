'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useState } from 'react';
import {
  ChevronRight,
  Check,
  Clock,
  Shield,
  Key,
  Users,
  Settings,
  Rocket,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'current' | 'pending';
  icon: React.ReactNode;
}

export function EnterpriseOnboarding() {
  const t = useTranslations('enterprise.onboarding');
  const [currentStep, setCurrentStep] = useState(2);

  const steps: OnboardingStep[] = [
    {
      id: 'contract',
      title: t('steps.contract.title'),
      description: t('steps.contract.description'),
      status: 'completed',
      icon: <Shield className="h-5 w-5" />,
    },
    {
      id: 'team',
      title: t('steps.team.title'),
      description: t('steps.team.description'),
      status: 'completed',
      icon: <Users className="h-5 w-5" />,
    },
    {
      id: 'api',
      title: t('steps.api.title'),
      description: t('steps.api.description'),
      status: 'current',
      icon: <Key className="h-5 w-5" />,
    },
    {
      id: 'settings',
      title: t('steps.settings.title'),
      description: t('steps.settings.description'),
      status: 'pending',
      icon: <Settings className="h-5 w-5" />,
    },
    {
      id: 'launch',
      title: t('steps.launch.title'),
      description: t('steps.launch.description'),
      status: 'pending',
      icon: <Rocket className="h-5 w-5" />,
    },
  ];

  const completedSteps = steps.filter((s) => s.status === 'completed').length;
  const progressPercent = (completedSteps / steps.length) * 100;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-foreground-tertiary">
            <Link href="/enterprise/landing" className="hover:text-foreground">
              Enterprise
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground">{t('breadcrumb.onboarding')}</span>
          </div>
          <h1 className="mt-4 text-3xl font-bold text-foreground">{t('title')}</h1>
          <p className="mt-2 text-foreground-secondary">{t('subtitle')}</p>
        </div>

        {/* Progress Card */}
        <Card className="mb-8">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-bold text-foreground">
                  {t('progress.title', { completed: completedSteps, total: steps.length })}
                </div>
                <div className="text-sm text-foreground-secondary">
                  {t('progress.subtitle')}
                </div>
              </div>
              <div className="text-3xl font-bold text-gold">
                {Math.round(progressPercent)}%
              </div>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-background-tertiary">
              <div
                className="h-full bg-gold transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Steps */}
        <Card>
          <CardHeader>
            <CardTitle>{t('stepsTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={cn(
                    'relative rounded-lg border p-4',
                    step.status === 'current'
                      ? 'border-gold bg-gold/5'
                      : step.status === 'completed'
                        ? 'border-success/50 bg-success/5'
                        : 'border-surface-tertiary bg-background-secondary'
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-lg',
                        step.status === 'completed'
                          ? 'bg-success text-white'
                          : step.status === 'current'
                            ? 'bg-gold text-background'
                            : 'bg-background-tertiary text-foreground-tertiary'
                      )}
                    >
                      {step.status === 'completed' ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        step.icon
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{step.title}</span>
                        {step.status === 'current' && (
                          <Badge variant="gold">{t('statusBadge.current')}</Badge>
                        )}
                        {step.status === 'completed' && (
                          <Badge variant="success">{t('statusBadge.completed')}</Badge>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-foreground-secondary">
                        {step.description}
                      </p>
                      {step.status === 'current' && (
                        <div className="mt-4">
                          <Button size="sm">{t('continueButton')}</Button>
                        </div>
                      )}
                    </div>
                    {step.status === 'pending' && (
                      <div className="flex items-center gap-1 text-sm text-foreground-tertiary">
                        <Clock className="h-4 w-4" />
                        <span>{t('statusBadge.pending')}</span>
                      </div>
                    )}
                  </div>

                  {/* Connector line */}
                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        'absolute left-9 top-14 h-6 w-0.5',
                        step.status === 'completed' ? 'bg-success' : 'bg-surface-tertiary'
                      )}
                    />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Help Card */}
        <Card className="mt-8">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-foreground">{t('help.title')}</h3>
                <p className="mt-1 text-sm text-foreground-secondary">
                  {t('help.description')}
                </p>
              </div>
              <Link href="/enterprise/support">
                <Button variant="outline">{t('help.contactButton')}</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
