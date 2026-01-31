'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BarChart3,
  Users,
  TrendingUp,
  DollarSign,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const DEMO_STATS = {
  dailyActiveUsers: 2450,
  monthlyActiveUsers: 12847,
  totalRevenue: '125,000 QS',
  avgTransactionValue: '2.5 ETH',
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

export function AnalyticsDashboard() {
  const t = useTranslations('qsAdmin.analytics');
  const tCommon = useTranslations('qsAdmin.common');

  const analyticsLinks = [
    {
      href: '/qs-admin/analytics/users',
      icon: Users,
      title: t('usersTitle'),
      subtitle: t('usersSubtitle'),
      color: 'bg-info/10 text-info',
    },
    {
      href: '/qs-admin/analytics/revenue',
      icon: DollarSign,
      title: t('revenueTitle'),
      subtitle: t('revenueSubtitle'),
      color: 'bg-success/10 text-success',
    },
    {
      href: '/qs-admin/analytics/reports',
      icon: BarChart3,
      title: t('reportsTitle'),
      subtitle: t('reportsSubtitle'),
      color: 'bg-gold/10 text-gold',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
        <p className="text-foreground-secondary">{t('subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={t('stats.dailyActiveUsers')} value={DEMO_STATS.dailyActiveUsers.toLocaleString()} icon={Users} trend={{ value: 5.2, isPositive: true }} />
        <StatCard title={t('stats.monthlyActiveUsers')} value={DEMO_STATS.monthlyActiveUsers.toLocaleString()} icon={Users} trend={{ value: 12.8, isPositive: true }} />
        <StatCard title={t('stats.totalRevenue')} value={DEMO_STATS.totalRevenue} icon={DollarSign} trend={{ value: 8.5, isPositive: true }} />
        <StatCard title={t('stats.avgTransactionValue')} value={DEMO_STATS.avgTransactionValue} icon={TrendingUp} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {analyticsLinks.map((link) => (
          <Link key={link.href} href={link.href} className="block">
            <Card className="hover:border-hinomaru transition-colors cursor-pointer h-full">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={cn('h-12 w-12 rounded-lg flex items-center justify-center', link.color)}>
                      <link.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{link.title}</h3>
                      <p className="text-sm text-foreground-secondary">{link.subtitle}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-foreground-tertiary" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('charts.userGrowth')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-foreground-tertiary">
              <BarChart3 className="h-12 w-12 mr-2" />
              <span>{t('charts.userGrowth')}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('charts.transactionVolume')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-foreground-tertiary">
              <TrendingUp className="h-12 w-12 mr-2" />
              <span>{t('charts.transactionVolume')}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
