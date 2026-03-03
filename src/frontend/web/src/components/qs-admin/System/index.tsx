'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Settings,
  AlertTriangle,
  FileText,
  Wrench,
  TrendingUp,
  ArrowRight,
  CheckCircle,
  Activity,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const DEFAULT_STATS = {
  activeAlerts: 2,
  systemHealth: '99.2%',
  uptime: '99.9%',
  lastMaintenance: '2024-01-15',
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: { value: number; isPositive: boolean };
  status?: 'success' | 'warning' | 'danger';
}

function StatCard({ title, value, icon: Icon, trend, status }: StatCardProps) {
  const tCommon = useTranslations('qsAdmin.common');
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-foreground-secondary">{title}</p>
            <p className={cn('text-2xl font-bold mt-2', status === 'success' && 'text-success', status === 'warning' && 'text-warning', status === 'danger' && 'text-danger')}>
              {value}
            </p>
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

export function SystemDashboard() {
  const t = useTranslations('qsAdmin.system');
  const tCommon = useTranslations('qsAdmin.common');

  const systemLinks = [
    {
      href: '/qs-admin/system/alerts',
      icon: AlertTriangle,
      title: t('alertsTitle'),
      subtitle: t('alertsSubtitle'),
      color: 'bg-warning/10 text-warning',
      badge: DEFAULT_STATS.activeAlerts,
    },
    {
      href: '/qs-admin/system/logs',
      icon: FileText,
      title: t('logsTitle'),
      subtitle: t('logsSubtitle'),
      color: 'bg-info/10 text-info',
    },
    {
      href: '/qs-admin/system/maintenance',
      icon: Wrench,
      title: t('maintenanceTitle'),
      subtitle: t('maintenanceSubtitle'),
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
        <StatCard
          title={t('stats.activeAlerts')}
          value={DEFAULT_STATS.activeAlerts}
          icon={AlertTriangle}
          status={DEFAULT_STATS.activeAlerts > 0 ? 'warning' : 'success'}
        />
        <StatCard
          title={t('stats.systemHealth')}
          value={DEFAULT_STATS.systemHealth}
          icon={Activity}
          status="success"
        />
        <StatCard
          title={t('stats.uptime')}
          value={DEFAULT_STATS.uptime}
          icon={CheckCircle}
          status="success"
        />
        <StatCard
          title={t('stats.lastMaintenance')}
          value={DEFAULT_STATS.lastMaintenance}
          icon={Wrench}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {systemLinks.map((link) => (
          <Link key={link.href} href={link.href} className="block">
            <Card className="hover:border-hinomaru transition-colors cursor-pointer h-full">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={cn('h-12 w-12 rounded-lg flex items-center justify-center', link.color)}>
                      <link.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center">
                        <h3 className="font-semibold">{link.title}</h3>
                        {link.badge && link.badge > 0 && (
                          <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-warning/10 text-warning rounded-full">
                            {link.badge}
                          </span>
                        )}
                      </div>
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

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { name: 'API Server', status: 'operational', latency: '45ms' },
              { name: 'Database', status: 'operational', latency: '12ms' },
              { name: 'Blockchain RPC', status: 'operational', latency: '120ms' },
              { name: 'Prover Network', status: 'degraded', latency: '350ms' },
              { name: 'Observer Network', status: 'operational', latency: '85ms' },
            ].map((service) => (
              <div key={service.name} className="flex items-center justify-between p-3 rounded-lg bg-surface">
                <div className="flex items-center space-x-3">
                  <div className={cn(
                    'h-3 w-3 rounded-full',
                    service.status === 'operational' && 'bg-success',
                    service.status === 'degraded' && 'bg-warning',
                    service.status === 'down' && 'bg-danger'
                  )} />
                  <span className="font-medium">{service.name}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-foreground-secondary">{service.latency}</span>
                  <span className={cn(
                    'text-xs px-2 py-0.5 rounded-full',
                    service.status === 'operational' && 'bg-success/10 text-success',
                    service.status === 'degraded' && 'bg-warning/10 text-warning',
                    service.status === 'down' && 'bg-danger/10 text-danger'
                  )}>
                    {service.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
