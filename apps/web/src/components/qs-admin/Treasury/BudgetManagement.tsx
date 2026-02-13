'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Wallet,
  Download,
  ArrowLeft,
  TrendingUp,
  PieChart,
  BarChart3,
  Calendar,
  Edit,
  Plus,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useTreasuryBudget } from '@/hooks/admin/useTreasury';
import {
  type BudgetData,
  type BudgetCategory,
  type MonthlyBudget,
} from '@/lib/api/admin/types';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  subValue?: string;
  trend?: { value: number; isPositive: boolean };
}

function StatCard({ title, value, icon: Icon, subValue, trend }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-foreground-secondary">{title}</p>
            <p className="text-2xl font-bold mt-2">{value}</p>
            {subValue && <p className="text-sm text-foreground-tertiary mt-1">{subValue}</p>}
            {trend && (
              <p className={cn('text-xs mt-2 flex items-center', trend.isPositive ? 'text-success' : 'text-danger')}>
                <TrendingUp className={cn('h-3 w-3 mr-1', !trend.isPositive && 'rotate-180')} />
                {trend.isPositive ? '+' : ''}{trend.value}%
              </p>
            )}
          </div>
          <div className="h-12 w-12 rounded-lg bg-hinomaru/10 flex items-center justify-center">
            <Icon className="h-6 w-6 text-hinomaru" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Loading Skeleton
function BudgetSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="h-10 w-10 bg-surface rounded animate-pulse" />
          <div>
            <div className="h-6 w-48 bg-surface rounded animate-pulse" />
            <div className="h-4 w-32 bg-surface rounded animate-pulse mt-2" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-20 bg-surface rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-16 bg-surface rounded animate-pulse" />
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-surface rounded animate-pulse" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Error State
function BudgetError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const t = useTranslations('qsAdmin.common');
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <AlertCircle className="h-12 w-12 text-danger mb-4" />
      <p className="text-foreground-secondary mb-4">{error.message || t('error')}</p>
      <Button onClick={onRetry} variant="outline">
        <RefreshCw className="h-4 w-4 mr-2" />
        {t('retry')}
      </Button>
    </div>
  );
}

export function BudgetManagement() {
  const t = useTranslations('qsAdmin.treasury');
  const tCommon = useTranslations('qsAdmin.common');

  // Fetch data with hooks
  const budgetQuery = useTreasuryBudget();

  // Use API data or fallback
  const apiBudget = budgetQuery.data;
  const budget = apiBudget!;
  const categories: BudgetCategory[] = (apiBudget as { categories?: BudgetCategory[] })?.categories ?? [];
  const monthly: MonthlyBudget[] = (apiBudget as { monthly?: MonthlyBudget[] })?.monthly ?? [];

  // Show skeleton only on initial load
  if (budgetQuery.isLoading && !budgetQuery.data) {
    return <BudgetSkeleton />;
  }

  // Show error state
  if (budgetQuery.error && !budgetQuery.data) {
    return <BudgetError error={budgetQuery.error as Error} onRetry={() => budgetQuery.refetch()} />;
  }

  const totalAllocated = categories.reduce((sum, c) => sum + c.allocated, 0);
  const totalSpent = categories.reduce((sum, c) => sum + c.spent, 0);
  const utilizationRate = Math.round((totalSpent / totalAllocated) * 100);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/qs-admin/treasury">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('budget.title')}</h1>
            <p className="text-foreground-secondary">{t('budget.subtitle')} - {budget.period}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            {tCommon('export')}
          </Button>
          <Button className="bg-gradient-hinomaru text-white">
            <Edit className="h-4 w-4 mr-2" />
            {t('budget.editBudget')}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={t('budget.totalBudget')} value={budget.totalBudget} icon={Wallet} subValue={budget.period} />
        <StatCard title={t('budget.allocated')} value={budget.allocated} icon={PieChart} subValue={`${utilizationRate}% ${t('budget.utilization')}`} />
        <StatCard title={t('budget.spent')} value={budget.spent} icon={BarChart3} trend={{ value: 12, isPositive: false }} />
        <StatCard title={t('budget.remaining')} value={budget.remaining} icon={Calendar} />
      </div>

      {/* Budget Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Category */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">{t('budget.byCategory')}</CardTitle>
            <Button variant="ghost" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              {t('budget.addCategory')}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categories.map((category) => {
                const percentage = Math.round((category.spent / category.allocated) * 100);
                return (
                  <div key={category.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={cn('w-3 h-3 rounded-full', category.color)} />
                        <span className="font-medium">{category.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-medium">{category.spent.toLocaleString()}</span>
                        <span className="text-foreground-tertiary"> / {category.allocated.toLocaleString()} ETH</span>
                      </div>
                    </div>
                    <div className="h-2 bg-surface rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all', category.color, percentage > 90 && 'bg-danger')}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-foreground-tertiary">
                      <span>{percentage}% {t('budget.used')}</span>
                      <span>{(category.allocated - category.spent).toLocaleString()} ETH {t('budget.remaining').toLowerCase()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('budget.monthlyBreakdown')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {monthly.map((month) => {
                const percentage = Math.round((month.spent / month.budget) * 100);
                const isOverBudget = month.spent > month.budget;
                return (
                  <div key={month.month} className="p-4 rounded-lg bg-surface">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-foreground">{month.month}</span>
                      <span className={cn('text-sm font-medium', isOverBudget ? 'text-danger' : 'text-success')}>
                        {isOverBudget ? t('budget.overBudget') : t('budget.onTrack')}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-sm text-foreground-secondary">Budget</p>
                        <p className="font-bold">{month.budget.toLocaleString()} ETH</p>
                      </div>
                      <div>
                        <p className="text-sm text-foreground-secondary">Spent</p>
                        <p className="font-bold">{month.spent.toLocaleString()} ETH</p>
                      </div>
                    </div>
                    <div className="h-2 bg-background rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full', isOverBudget ? 'bg-danger' : 'bg-success')}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-foreground-tertiary mt-2">{percentage}% {t('budget.ofMonthlyBudget')}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('budget.quarterSummary')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-surface rounded-lg">
              <p className="text-sm text-foreground-secondary mb-2">{t('budget.budgetUtilization')}</p>
              <p className="text-4xl font-bold text-hinomaru">{utilizationRate}%</p>
              <p className="text-sm text-foreground-tertiary mt-2">{t('budget.ofAllocated')}</p>
            </div>
            <div className="text-center p-6 bg-surface rounded-lg">
              <p className="text-sm text-foreground-secondary mb-2">{t('budget.avgMonthlySpend')}</p>
              <p className="text-4xl font-bold">{Math.round(totalSpent / 3).toLocaleString()}</p>
              <p className="text-sm text-foreground-tertiary mt-2">ETH {t('budget.perMonth')}</p>
            </div>
            <div className="text-center p-6 bg-surface rounded-lg">
              <p className="text-sm text-foreground-secondary mb-2">{t('budget.projectedSurplus')}</p>
              <p className="text-4xl font-bold text-success">+{(totalAllocated - totalSpent * 1.5).toLocaleString()}</p>
              <p className="text-sm text-foreground-tertiary mt-2">ETH {t('budget.byQuarterEnd')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
