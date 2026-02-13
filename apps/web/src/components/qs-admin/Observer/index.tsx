'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Eye,
  Shield,
  TrendingUp,
  Coins,
  Search,
  Filter,
  Download,
  ExternalLink,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const STATUS_COLORS = {
  active: 'bg-success/10 text-success',
  inactive: 'bg-foreground-tertiary/10 text-foreground-tertiary',
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: { value: number; isPositive: boolean; label: string };
}

function StatCard({ title, value, icon: Icon, trend }: StatCardProps) {
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
}

export function ObserverDashboard() {
  const t = useTranslations('qsAdmin.observer');
  const tCommon = useTranslations('qsAdmin.common');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const filters = [
    { key: 'all', label: tCommon('all') },
    { key: 'active', label: t('status.active') },
    { key: 'inactive', label: t('status.inactive') },
  ];

  const observers: { id: string; wallet: string; challenges: number; successRate: string; earnings: string; lastActive: string; status: string }[] = [];

  const filteredObservers = observers.filter(observer => {
    if (activeFilter !== 'all' && observer.status !== activeFilter) return false;
    if (searchQuery && !observer.wallet.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
          <p className="text-foreground-secondary">{t('subtitle')}</p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          {tCommon('export')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={t('stats.activeObservers')} value={0} icon={Eye} />
        <StatCard title={t('stats.totalChallenges')} value={0} icon={Shield} />
        <StatCard title={t('stats.successRate')} value="-" icon={TrendingUp} />
        <StatCard title={t('stats.totalEarnings')} value="-" icon={Coins} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">{t('title')}</CardTitle>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-tertiary" />
              <Input type="text" placeholder={tCommon('search')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 w-64" />
            </div>
            <Button variant="outline" size="icon"><Filter className="h-4 w-4" /></Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2 mb-4 border-b border-border">
            {filters.map((filter) => (
              <button key={filter.key} onClick={() => setActiveFilter(filter.key)} className={cn('px-4 py-3 min-h-[44px] text-sm font-medium border-b-2 -mb-px transition-colors', activeFilter === filter.key ? 'border-hinomaru text-hinomaru' : 'border-transparent text-foreground-secondary hover:text-foreground')}>
                {filter.label}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('table.wallet')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('table.challenges')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('table.successRate')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('table.earnings')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('table.lastActive')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('table.status')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('table.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredObservers.map((observer) => (
                  <tr key={observer.id} className="border-b border-border hover:bg-surface transition-colors">
                    <td className="py-3 px-4"><code className="text-sm font-mono">{observer.wallet}</code></td>
                    <td className="py-3 px-4">{observer.challenges}</td>
                    <td className="py-3 px-4">{observer.successRate}</td>
                    <td className="py-3 px-4 font-medium">{observer.earnings}</td>
                    <td className="py-3 px-4 text-foreground-secondary">{observer.lastActive}</td>
                    <td className="py-3 px-4">
                      <span className={cn('inline-flex items-center px-2 py-1 rounded-md text-xs font-medium', STATUS_COLORS[observer.status as keyof typeof STATUS_COLORS])}>
                        {t(`status.${observer.status}`)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Button variant="ghost" size="sm"><ExternalLink className="h-4 w-4" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
