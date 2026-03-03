'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useState } from 'react';
import {
  ChevronRight,
  Package,
  Check,
  X,
  Edit,
  Plus,
  Users,
  Zap,
  Shield,
  Crown,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AdminSidebarV2 } from '../AdminSidebarV2';

// Mock data
const SAMPLE_PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    icon: Zap,
    monthlyPrice: 500000,
    yearlyPrice: 5000000,
    activeSubscribers: 12,
    features: {
      maxUsers: 100,
      maxProvers: 2,
      slaTarget: 99.5,
      supportLevel: 'email',
      apiRateLimit: 1000,
      customBranding: false,
      dedicatedProvers: false,
      prioritySupport: false,
    },
    status: 'active',
  },
  {
    id: 'professional',
    name: 'Professional',
    icon: Shield,
    monthlyPrice: 2000000,
    yearlyPrice: 20000000,
    activeSubscribers: 8,
    features: {
      maxUsers: 1000,
      maxProvers: 5,
      slaTarget: 99.9,
      supportLevel: 'priority',
      apiRateLimit: 10000,
      customBranding: true,
      dedicatedProvers: false,
      prioritySupport: true,
    },
    status: 'active',
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    icon: Crown,
    monthlyPrice: 5000000,
    yearlyPrice: 50000000,
    activeSubscribers: 3,
    features: {
      maxUsers: -1,
      maxProvers: -1,
      slaTarget: 99.99,
      supportLevel: 'dedicated',
      apiRateLimit: -1,
      customBranding: true,
      dedicatedProvers: true,
      prioritySupport: true,
    },
    status: 'active',
  },
];

const DEFAULT_PLAN_USAGE = {
  starter: { revenue: 72000000, mrr: 6000000 },
  professional: { revenue: 192000000, mrr: 16000000 },
  enterprise: { revenue: 180000000, mrr: 15000000 },
};

function formatPrice(amount: number): string {
  return `¥${amount.toLocaleString()}`;
}

export function SaasOperatorPlans() {
  const t = useTranslations('admin.operatorPlans');
  const [selectedPlan, setSelectedPlan] = useState<typeof SAMPLE_PLANS[0] | null>(SAMPLE_PLANS[1]);
  const [showEditModal, setShowEditModal] = useState(false);

  const totalMrr = Object.values(DEFAULT_PLAN_USAGE).reduce((sum, p) => sum + p.mrr, 0);
  const totalSubscribers = SAMPLE_PLANS.reduce((sum, p) => sum + p.activeSubscribers, 0);

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebarV2 />

      <main className="pl-[280px]" role="main" aria-label={t('ariaLabel')}>
        <div className="p-6 lg:p-8">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 text-sm text-foreground-tertiary">
              <Link href="/admin/dashboard" className="hover:text-foreground">
                Dashboard
              </Link>
              <ChevronRight className="h-4 w-4" />
              <Link href="/admin/saas/operators" className="hover:text-foreground">
                Operators
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground">{t('breadcrumb')}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>
                <p className="mt-1 text-sm text-foreground-secondary">{t('subtitle')}</p>
              </div>
              <Button leftIcon={<Plus className="h-4 w-4" />}>{t('createPlan')}</Button>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10">
                  <Package className="h-5 w-5 text-gold" />
                </div>
                <div>
                  <div className="text-xs text-foreground-tertiary">{t('stats.activePlans')}</div>
                  <div className="text-xl font-bold text-foreground">{SAMPLE_PLANS.length}</div>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                  <Users className="h-5 w-5 text-success" />
                </div>
                <div>
                  <div className="text-xs text-foreground-tertiary">{t('stats.totalSubscribers')}</div>
                  <div className="text-xl font-bold text-foreground">{totalSubscribers}</div>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10">
                  <Zap className="h-5 w-5 text-gold" />
                </div>
                <div>
                  <div className="text-xs text-foreground-tertiary">{t('stats.mrr')}</div>
                  <div className="text-xl font-bold text-foreground">{formatPrice(totalMrr)}</div>
                </div>
              </div>
            </Card>
          </div>

          {/* Plan Cards */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {SAMPLE_PLANS.map((plan) => {
              const PlanIcon = plan.icon;
              const usage = DEFAULT_PLAN_USAGE[plan.id as keyof typeof DEFAULT_PLAN_USAGE];

              return (
                <Card
                  key={plan.id}
                  className={cn(
                    'relative cursor-pointer transition-all',
                    selectedPlan?.id === plan.id && 'ring-2 ring-gold',
                    plan.popular && 'border-gold'
                  )}
                  onClick={() => setSelectedPlan(plan)}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge variant="gold">{t('popular')}</Badge>
                    </div>
                  )}
                  <CardHeader className="text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gold/10">
                      <PlanIcon className="h-6 w-6 text-gold" />
                    </div>
                    <CardTitle className="mt-4 text-xl">{plan.name}</CardTitle>
                    <div className="mt-2">
                      <span className="text-3xl font-bold">{formatPrice(plan.monthlyPrice)}</span>
                      <span className="text-sm text-foreground-tertiary">/{t('perMonth')}</span>
                    </div>
                    <div className="text-xs text-foreground-tertiary">
                      {formatPrice(plan.yearlyPrice)}/{t('perYear')}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-foreground-secondary">{t('features.maxUsers')}</span>
                        <span className="font-medium">
                          {plan.features.maxUsers === -1 ? t('unlimited') : plan.features.maxUsers.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-foreground-secondary">{t('features.maxProvers')}</span>
                        <span className="font-medium">
                          {plan.features.maxProvers === -1 ? t('unlimited') : plan.features.maxProvers}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-foreground-secondary">{t('features.slaTarget')}</span>
                        <span className="font-medium">{plan.features.slaTarget}%</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-foreground-secondary">{t('features.apiRateLimit')}</span>
                        <span className="font-medium">
                          {plan.features.apiRateLimit === -1
                            ? t('unlimited')
                            : `${plan.features.apiRateLimit.toLocaleString()}/min`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-foreground-secondary">{t('features.customBranding')}</span>
                        {plan.features.customBranding ? (
                          <Check className="h-4 w-4 text-success" />
                        ) : (
                          <X className="h-4 w-4 text-foreground-tertiary" />
                        )}
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-foreground-secondary">{t('features.dedicatedProvers')}</span>
                        {plan.features.dedicatedProvers ? (
                          <Check className="h-4 w-4 text-success" />
                        ) : (
                          <X className="h-4 w-4 text-foreground-tertiary" />
                        )}
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-foreground-secondary">{t('features.prioritySupport')}</span>
                        {plan.features.prioritySupport ? (
                          <Check className="h-4 w-4 text-success" />
                        ) : (
                          <X className="h-4 w-4 text-foreground-tertiary" />
                        )}
                      </div>
                    </div>

                    <div className="mt-6 border-t border-surface-tertiary pt-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-foreground-secondary">{t('subscribers')}</span>
                        <Badge variant="success">{plan.activeSubscribers}</Badge>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-sm">
                        <span className="text-foreground-secondary">{t('mrr')}</span>
                        <span className="font-mono font-medium text-gold">{formatPrice(usage.mrr)}</span>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        leftIcon={<Edit className="h-4 w-4" />}
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowEditModal(true);
                        }}
                      >
                        {t('edit')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Plan Comparison Table */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-base">{t('comparison.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-surface-tertiary">
                      <th className="pb-3 text-left text-sm font-medium text-foreground-tertiary">
                        {t('comparison.feature')}
                      </th>
                      {SAMPLE_PLANS.map((plan) => (
                        <th
                          key={plan.id}
                          className="pb-3 text-center text-sm font-medium text-foreground"
                        >
                          {plan.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-surface-tertiary/50">
                      <td className="py-3 text-sm text-foreground-secondary">{t('comparison.rows.monthlyPrice')}</td>
                      {SAMPLE_PLANS.map((plan) => (
                        <td key={plan.id} className="py-3 text-center font-mono text-sm">
                          {formatPrice(plan.monthlyPrice)}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-surface-tertiary/50">
                      <td className="py-3 text-sm text-foreground-secondary">{t('comparison.rows.maxUsers')}</td>
                      {SAMPLE_PLANS.map((plan) => (
                        <td key={plan.id} className="py-3 text-center text-sm">
                          {plan.features.maxUsers === -1 ? t('unlimited') : plan.features.maxUsers.toLocaleString()}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-surface-tertiary/50">
                      <td className="py-3 text-sm text-foreground-secondary">{t('comparison.rows.maxProvers')}</td>
                      {SAMPLE_PLANS.map((plan) => (
                        <td key={plan.id} className="py-3 text-center text-sm">
                          {plan.features.maxProvers === -1 ? t('unlimited') : plan.features.maxProvers}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-surface-tertiary/50">
                      <td className="py-3 text-sm text-foreground-secondary">{t('comparison.rows.sla')}</td>
                      {SAMPLE_PLANS.map((plan) => (
                        <td key={plan.id} className="py-3 text-center text-sm">
                          {plan.features.slaTarget}%
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-surface-tertiary/50">
                      <td className="py-3 text-sm text-foreground-secondary">{t('comparison.rows.support')}</td>
                      {SAMPLE_PLANS.map((plan) => (
                        <td key={plan.id} className="py-3 text-center text-sm capitalize">
                          {t(`supportLevels.${plan.features.supportLevel}`)}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-surface-tertiary/50">
                      <td className="py-3 text-sm text-foreground-secondary">{t('comparison.rows.customBranding')}</td>
                      {SAMPLE_PLANS.map((plan) => (
                        <td key={plan.id} className="py-3 text-center">
                          {plan.features.customBranding ? (
                            <Check className="mx-auto h-4 w-4 text-success" />
                          ) : (
                            <X className="mx-auto h-4 w-4 text-foreground-tertiary" />
                          )}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-3 text-sm text-foreground-secondary">{t('comparison.rows.dedicatedProvers')}</td>
                      {SAMPLE_PLANS.map((plan) => (
                        <td key={plan.id} className="py-3 text-center">
                          {plan.features.dedicatedProvers ? (
                            <Check className="mx-auto h-4 w-4 text-success" />
                          ) : (
                            <X className="mx-auto h-4 w-4 text-foreground-tertiary" />
                          )}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
