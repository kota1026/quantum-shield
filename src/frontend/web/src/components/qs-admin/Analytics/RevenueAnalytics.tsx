'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DollarSign,
  ArrowLeft,
  TrendingUp,
  Download,
  BarChart3,
  PieChart,
  Coins,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const DEFAULT_STATS = {
  totalRevenue: '125,000 QS',
  lockFees: '85,000 QS',
  unlockFees: '35,000 QS',
  emergencyFees: '5,000 QS',
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: { value: number; isPositive: boolean };
}

function StatCard({ title, value, icon: Icon, trend }: StatCardProps) {
  const tCommon = useTranslations('qsAdmin.common');
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-foreground-secondary">{title}</p>
            <p className="text-2xl font-bold mt-2">{value}</p>
            {trend && (
              <p className={cn('text-xs mt-2 flex items-center', trend.isPositive ? 'text-success' : 'text-danger')}>
                <TrendingUp className={cn('h-3 w-3 mr-1', !trend.isPositive && 'rotate-180')} />
                {trend.isPositive ? '+' : ''}{trend.value}% {tCommon('trend.fromLastWeek')}
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

export function RevenueAnalytics() {
  const t = useTranslations('qsAdmin.analytics');
  const tCommon = useTranslations('qsAdmin.common');
  const [period, setPeriod] = useState('month');

  const periods = [
    { key: 'day', label: t('periods.day') },
    { key: 'week', label: t('periods.week') },
    { key: 'month', label: t('periods.month') },
    { key: 'year', label: t('periods.year') },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/qs-admin/analytics">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('revenueTitle')}</h1>
            <p className="text-foreground-secondary">{t('revenueSubtitle')}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex border border-border rounded-lg">
            {periods.map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium transition-colors',
                  period === p.key
                    ? 'bg-hinomaru text-white'
                    : 'text-foreground-secondary hover:text-foreground'
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            {tCommon('export')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={t('stats.totalRevenue')} value={DEFAULT_STATS.totalRevenue} icon={DollarSign} trend={{ value: 15.2, isPositive: true }} />
        <StatCard title="Lock Fees" value={DEFAULT_STATS.lockFees} icon={Coins} trend={{ value: 12.8, isPositive: true }} />
        <StatCard title="Unlock Fees" value={DEFAULT_STATS.unlockFees} icon={Coins} trend={{ value: 8.5, isPositive: true }} />
        <StatCard title="Emergency Fees" value={DEFAULT_STATS.emergencyFees} icon={Coins} trend={{ value: 5.1, isPositive: true }} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('charts.transactionVolume')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-foreground-tertiary">
              <BarChart3 className="h-12 w-12 mr-2" />
              <span>{t('charts.transactionVolume')}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('charts.revenueBreakdown')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-foreground-tertiary">
              <PieChart className="h-12 w-12 mr-2" />
              <span>{t('charts.revenueBreakdown')}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
