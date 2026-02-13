'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Wallet,
  Send,
  Clock,
  Shield,
  ArrowRight,
  ExternalLink,
  Users,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  icon: React.ElementType;
  trend?: { value: number; isPositive: boolean; label: string };
  href?: string;
}

function StatCard({ title, value, subValue, icon: Icon, trend, href }: StatCardProps) {
  const content = (
    <Card className={cn(href && 'hover:border-hinomaru/50 transition-colors cursor-pointer')}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-foreground-secondary">{title}</p>
            <p className="text-2xl font-bold mt-2">{value}</p>
            {subValue && (
              <p className="text-sm text-foreground-tertiary mt-1">{subValue}</p>
            )}
            {trend && (
              <p className={cn(
                'text-xs mt-2 flex items-center',
                trend.isPositive ? 'text-success' : 'text-danger'
              )}>
                {trend.isPositive ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1" />
                )}
                {trend.isPositive ? '+' : ''}{trend.value}% {trend.label}
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

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

export function TreasuryDashboard() {
  const t = useTranslations('qsAdmin.treasury');
  const tCommon = useTranslations('qsAdmin.common');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
          <p className="text-foreground-secondary">{t('subtitle')}</p>
        </div>
        <Button className="bg-gradient-hinomaru text-white">
          <Send className="h-4 w-4 mr-2" />
          {t('transfers.newTransfer')}
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('wallets.balance')}
          value="-"
          icon={Wallet}
        />
        <StatCard
          title={t('wallets.title')}
          value={0}
          icon={Shield}
          href="/qs-admin/treasury/wallets"
        />
        <StatCard
          title={t('transfers.pendingApprovals')}
          value={0}
          icon={Clock}
          href="/qs-admin/treasury/transfers"
        />
        <StatCard
          title={t('transfers.title')}
          value={0}
          icon={Send}
          href="/qs-admin/treasury/transfers"
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Wallets List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">{t('wallets.title')}</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/qs-admin/treasury/wallets">
                {tCommon('view')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Wallet className="h-8 w-8 text-foreground-tertiary mb-2" />
              <p className="text-sm text-foreground-secondary">{t('empty')}</p>
            </div>
          </CardContent>
        </Card>

        {/* Pending Approvals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center">
              {t('transfers.pendingApprovals')}
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/qs-admin/treasury/transfers">
                {tCommon('view')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Clock className="h-8 w-8 text-foreground-tertiary mb-2" />
              <p className="text-sm text-foreground-secondary">{t('empty')}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transfers */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">{t('transfers.history')}</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/qs-admin/treasury/transfers">
              {tCommon('view')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Send className="h-8 w-8 text-foreground-tertiary mb-2" />
            <p className="text-sm text-foreground-secondary">{t('empty')}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
