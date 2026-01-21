'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useState } from 'react';
import {
  ChevronRight,
  Check,
  Shield,
  Zap,
  Building2,
  Users,
  Clock,
  HeadphonesIcon,
  Server,
  Lock,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PlanFeature {
  name: string;
  included: boolean;
}

interface Plan {
  id: string;
  name: string;
  description: string;
  price: string;
  priceNote?: string;
  features: PlanFeature[];
  highlighted?: boolean;
}

export function EnterprisePlanSelection() {
  const t = useTranslations('enterprise.planSelection');
  const [selectedPlan, setSelectedPlan] = useState<string>('business');

  const plans: Plan[] = [
    {
      id: 'starter',
      name: t('plans.starter.name'),
      description: t('plans.starter.description'),
      price: t('plans.starter.price'),
      features: [
        { name: t('features.users100'), included: true },
        { name: t('features.basicApi'), included: true },
        { name: t('features.emailSupport'), included: true },
        { name: t('features.standardSla'), included: true },
        { name: t('features.dedicatedCsm'), included: false },
        { name: t('features.customIntegration'), included: false },
        { name: t('features.onPremise'), included: false },
      ],
    },
    {
      id: 'business',
      name: t('plans.business.name'),
      description: t('plans.business.description'),
      price: t('plans.business.price'),
      highlighted: true,
      features: [
        { name: t('features.users1000'), included: true },
        { name: t('features.fullApi'), included: true },
        { name: t('features.prioritySupport'), included: true },
        { name: t('features.sla999'), included: true },
        { name: t('features.dedicatedCsm'), included: true },
        { name: t('features.customIntegration'), included: true },
        { name: t('features.onPremise'), included: false },
      ],
    },
    {
      id: 'enterprise',
      name: t('plans.enterprise.name'),
      description: t('plans.enterprise.description'),
      price: t('plans.enterprise.price'),
      priceNote: t('plans.enterprise.priceNote'),
      features: [
        { name: t('features.usersUnlimited'), included: true },
        { name: t('features.fullApi'), included: true },
        { name: t('features.support247'), included: true },
        { name: t('features.sla9999'), included: true },
        { name: t('features.dedicatedCsm'), included: true },
        { name: t('features.customIntegration'), included: true },
        { name: t('features.onPremise'), included: true },
      ],
    },
  ];

  const comparisons = [
    {
      category: t('comparison.security'),
      icon: <Shield className="h-5 w-5" />,
      items: [
        { name: t('comparison.quantumResistant'), starter: true, business: true, enterprise: true },
        { name: t('comparison.twoFa'), starter: true, business: true, enterprise: true },
        { name: t('comparison.ipAllowlist'), starter: false, business: true, enterprise: true },
        { name: t('comparison.customSecurity'), starter: false, business: false, enterprise: true },
      ],
    },
    {
      category: t('comparison.support'),
      icon: <HeadphonesIcon className="h-5 w-5" />,
      items: [
        { name: t('comparison.emailSupport'), starter: true, business: true, enterprise: true },
        { name: t('comparison.prioritySupport'), starter: false, business: true, enterprise: true },
        { name: t('comparison.phoneSupport'), starter: false, business: true, enterprise: true },
        { name: t('comparison.dedicatedTeam'), starter: false, business: false, enterprise: true },
      ],
    },
    {
      category: t('comparison.infrastructure'),
      icon: <Server className="h-5 w-5" />,
      items: [
        { name: t('comparison.sharedInfra'), starter: true, business: true, enterprise: false },
        { name: t('comparison.dedicatedInfra'), starter: false, business: false, enterprise: true },
        { name: t('comparison.multiRegion'), starter: false, business: true, enterprise: true },
        { name: t('comparison.onPremise'), starter: false, business: false, enterprise: true },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-6xl px-6 py-12 lg:px-8" role="main" aria-label={t('ariaLabel')}>
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-foreground-tertiary" aria-label="Breadcrumb">
          <Link href="/enterprise/landing" className="hover:text-foreground">
            Enterprise
          </Link>
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
          <Link href="/enterprise/apply" className="hover:text-foreground">
            {t('breadcrumb.apply')}
          </Link>
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
          <span className="text-foreground">{t('breadcrumb.plan')}</span>
        </nav>

        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>
          <p className="mt-2 text-foreground-secondary">{t('subtitle')}</p>
        </div>

        {/* Plans Grid */}
        <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={cn(
                'relative cursor-pointer transition-all',
                selectedPlan === plan.id
                  ? 'border-gold ring-2 ring-gold/20'
                  : 'hover:border-foreground-tertiary',
                plan.highlighted && 'border-gold'
              )}
              onClick={() => setSelectedPlan(plan.id)}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge variant="gold">{t('recommended')}</Badge>
                </div>
              )}
              <CardContent className="p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                  <p className="mt-1 text-sm text-foreground-secondary">{plan.description}</p>
                </div>
                <div className="mb-6">
                  <div className="text-2xl font-bold text-gold">{plan.price}</div>
                  {plan.priceNote && (
                    <div className="text-xs text-foreground-tertiary">{plan.priceNote}</div>
                  )}
                </div>
                <ul className="space-y-3" role="list">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      {feature.included ? (
                        <Check className="h-4 w-4 text-success" aria-hidden="true" />
                      ) : (
                        <span className="h-4 w-4 text-foreground-tertiary" aria-hidden="true">—</span>
                      )}
                      <span className={feature.included ? 'text-foreground' : 'text-foreground-tertiary'}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  <Button
                    variant={selectedPlan === plan.id ? 'primary' : 'outline'}
                    className="w-full"
                    aria-pressed={selectedPlan === plan.id}
                  >
                    {selectedPlan === plan.id ? t('selected') : t('selectPlan')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Comparison Table */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <h2 className="mb-6 text-xl font-bold text-foreground">{t('comparison.title')}</h2>
            <div className="space-y-8">
              {comparisons.map((category, catIndex) => (
                <div key={catIndex}>
                  <div className="mb-4 flex items-center gap-2">
                    <span className="text-gold">{category.icon}</span>
                    <h3 className="font-medium text-foreground">{category.category}</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm" role="grid">
                      <thead>
                        <tr className="border-b border-surface-tertiary">
                          <th className="py-2 text-left font-medium text-foreground-secondary">{t('comparison.feature')}</th>
                          <th className="py-2 text-center font-medium text-foreground-secondary">Starter</th>
                          <th className="py-2 text-center font-medium text-foreground-secondary">Business</th>
                          <th className="py-2 text-center font-medium text-foreground-secondary">Enterprise</th>
                        </tr>
                      </thead>
                      <tbody>
                        {category.items.map((item, itemIndex) => (
                          <tr key={itemIndex} className="border-b border-surface-tertiary last:border-0">
                            <td className="py-3 text-foreground">{item.name}</td>
                            <td className="py-3 text-center">
                              {item.starter ? (
                                <Check className="mx-auto h-4 w-4 text-success" aria-label={t('included')} />
                              ) : (
                                <span className="text-foreground-tertiary" aria-label={t('notIncluded')}>—</span>
                              )}
                            </td>
                            <td className="py-3 text-center">
                              {item.business ? (
                                <Check className="mx-auto h-4 w-4 text-success" aria-label={t('included')} />
                              ) : (
                                <span className="text-foreground-tertiary" aria-label={t('notIncluded')}>—</span>
                              )}
                            </td>
                            <td className="py-3 text-center">
                              {item.enterprise ? (
                                <Check className="mx-auto h-4 w-4 text-success" aria-label={t('included')} />
                              ) : (
                                <span className="text-foreground-tertiary" aria-label={t('notIncluded')}>—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="flex items-center justify-between rounded-lg border border-surface-tertiary bg-background-secondary p-6">
          <div>
            <h3 className="font-medium text-foreground">{t('cta.title')}</h3>
            <p className="mt-1 text-sm text-foreground-secondary">{t('cta.description')}</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link href="/enterprise/apply">{t('cta.back')}</Link>
            </Button>
            <Button asChild>
              <Link href={`/enterprise/apply/kyb?plan=${selectedPlan}`}>{t('cta.continue')}</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
