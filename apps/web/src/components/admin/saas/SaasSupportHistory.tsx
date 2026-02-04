'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useState } from 'react';
import {
  MessageSquare,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  Clock,
  CheckCircle,
  Star,
  BarChart3,
  Calendar,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AdminSidebarV2 } from '../AdminSidebarV2';

interface StatCardProps {
  label: string;
  value: string;
  subValue?: string;
  trend?: { value: string; direction: 'up' | 'down' };
  icon: React.ReactNode;
  status?: 'success' | 'warning' | 'danger';
}

function StatCard({ label, value, subValue, trend, icon, status = 'success' }: StatCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={cn(
          'flex h-10 w-10 items-center justify-center rounded-lg',
          status === 'success' && 'bg-success/10 text-success',
          status === 'warning' && 'bg-warning/10 text-warning',
          status === 'danger' && 'bg-danger/10 text-danger'
        )}>
          {icon}
        </div>
        <div className="flex-1">
          <div className="text-xs text-foreground-tertiary">{label}</div>
          <div className="flex items-center gap-2">
            <div className="text-xl font-bold text-foreground">{value}</div>
            {trend && (
              <span className={cn(
                'flex items-center text-xs',
                trend.direction === 'up' ? 'text-success' : 'text-danger'
              )}>
                {trend.direction === 'up' ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {trend.value}
              </span>
            )}
          </div>
          {subValue && <div className="text-xs text-foreground-secondary">{subValue}</div>}
        </div>
      </div>
    </Card>
  );
}

// Mock data
const mockHistoryData = {
  overview: {
    totalTickets: '1,234',
    resolvedTickets: '1,156',
    avgResolutionTime: '4.2h',
    avgCsat: '4.5',
    firstResponseTime: '15m',
    slaCompliance: '96.5%',
  },
  timeRanges: ['7d', '30d', '90d', '1y'] as const,
  tickets: [
    {
      id: 'TKT-1234',
      subject: 'API接続エラーの調査',
      operator: 'GFC Holdings',
      category: 'technical',
      priority: 'high',
      status: 'resolved',
      createdAt: '2026-01-15',
      resolvedAt: '2026-01-15',
      resolutionTime: '2.5h',
      csat: 5,
    },
    {
      id: 'TKT-1233',
      subject: '請求書の再発行依頼',
      operator: 'ABG Bank',
      category: 'billing',
      priority: 'medium',
      status: 'resolved',
      createdAt: '2026-01-14',
      resolvedAt: '2026-01-14',
      resolutionTime: '1.2h',
      csat: 4,
    },
    {
      id: 'TKT-1232',
      subject: '新規Proverのプロビジョニング',
      operator: 'Crypto Trust',
      category: 'provisioning',
      priority: 'medium',
      status: 'resolved',
      createdAt: '2026-01-13',
      resolvedAt: '2026-01-14',
      resolutionTime: '18.5h',
      csat: 3,
    },
    {
      id: 'TKT-1231',
      subject: 'セキュリティ監査レポート依頼',
      operator: 'SecureVault',
      category: 'security',
      priority: 'low',
      status: 'resolved',
      createdAt: '2026-01-12',
      resolvedAt: '2026-01-13',
      resolutionTime: '8.0h',
      csat: 5,
    },
    {
      id: 'TKT-1230',
      subject: 'API レート制限の引き上げ',
      operator: 'GFC Holdings',
      category: 'technical',
      priority: 'high',
      status: 'resolved',
      createdAt: '2026-01-11',
      resolvedAt: '2026-01-11',
      resolutionTime: '3.0h',
      csat: 4,
    },
  ],
  categoryStats: [
    { category: 'technical', count: 456, percentage: 37 },
    { category: 'billing', count: 321, percentage: 26 },
    { category: 'provisioning', count: 234, percentage: 19 },
    { category: 'security', count: 223, percentage: 18 },
  ],
  monthlyTrend: [
    { month: '8月', tickets: 145, resolved: 142 },
    { month: '9月', tickets: 168, resolved: 165 },
    { month: '10月', tickets: 189, resolved: 185 },
    { month: '11月', tickets: 201, resolved: 198 },
    { month: '12月', tickets: 178, resolved: 175 },
    { month: '1月', tickets: 156, resolved: 148 },
  ],
};

export function SaasSupportHistory() {
  const t = useTranslations('admin.saasSupportHistory');
  const [selectedTimeRange, setSelectedTimeRange] = useState<typeof mockHistoryData.timeRanges[number]>('30d');
  const [searchQuery, setSearchQuery] = useState('');

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'technical':
        return <Badge variant="gold">{t('categories.technical')}</Badge>;
      case 'billing':
        return <Badge variant="success">{t('categories.billing')}</Badge>;
      case 'provisioning':
        return <Badge variant="warning">{t('categories.provisioning')}</Badge>;
      case 'security':
        return <Badge variant="danger">{t('categories.security')}</Badge>;
      default:
        return <Badge variant="default">{category}</Badge>;
    }
  };

  const getCsatStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              'h-3 w-3',
              star <= rating ? 'fill-gold text-gold' : 'text-foreground-tertiary'
            )}
          />
        ))}
      </div>
    );
  };

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
              <Link href="/admin/saas/support" className="hover:text-foreground">
                {t('breadcrumbParent')}
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground">{t('breadcrumb')}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>
                <p className="mt-1 text-sm text-foreground-secondary">{t('subtitle')}</p>
              </div>
              <div className="flex gap-2">
                {mockHistoryData.timeRanges.map((range) => (
                  <Button
                    key={range}
                    variant={selectedTimeRange === range ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedTimeRange(range)}
                  >
                    {range}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
            <StatCard
              label={t('stats.totalTickets')}
              value={mockHistoryData.overview.totalTickets}
              trend={{ value: '+8%', direction: 'up' }}
              icon={<MessageSquare className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.resolvedTickets')}
              value={mockHistoryData.overview.resolvedTickets}
              subValue="93.7%"
              icon={<CheckCircle className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.avgResolutionTime')}
              value={mockHistoryData.overview.avgResolutionTime}
              trend={{ value: '-12%', direction: 'up' }}
              icon={<Clock className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.avgCsat')}
              value={mockHistoryData.overview.avgCsat}
              subValue="/5.0"
              icon={<Star className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.firstResponseTime')}
              value={mockHistoryData.overview.firstResponseTime}
              icon={<BarChart3 className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.slaCompliance')}
              value={mockHistoryData.overview.slaCompliance}
              icon={<CheckCircle className="h-5 w-5" />}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Ticket History Table */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">{t('ticketHistory.title')}</CardTitle>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-tertiary" />
                      <input
                        type="text"
                        placeholder={t('ticketHistory.searchPlaceholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="rounded-lg border border-surface-tertiary bg-background-secondary py-2 pl-10 pr-4 text-sm focus:border-gold focus:outline-none"
                      />
                    </div>
                    <Button variant="outline" size="sm" leftIcon={<Filter className="h-4 w-4" />}>
                      {t('ticketHistory.filter')}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-surface-tertiary text-left text-xs text-foreground-tertiary">
                          <th className="pb-3 font-medium">{t('table.columns.ticket')}</th>
                          <th className="pb-3 font-medium">{t('table.columns.operator')}</th>
                          <th className="pb-3 font-medium">{t('table.columns.category')}</th>
                          <th className="pb-3 font-medium">{t('table.columns.resolutionTime')}</th>
                          <th className="pb-3 font-medium">{t('table.columns.csat')}</th>
                          <th className="pb-3"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {mockHistoryData.tickets.map((ticket) => (
                          <tr
                            key={ticket.id}
                            className="border-b border-surface-tertiary/50 hover:bg-background-secondary/50"
                          >
                            <td className="py-4">
                              <div>
                                <div className="font-mono text-xs text-gold">{ticket.id}</div>
                                <div className="mt-1 text-sm">{ticket.subject}</div>
                              </div>
                            </td>
                            <td className="py-4 text-sm">{ticket.operator}</td>
                            <td className="py-4">{getCategoryBadge(ticket.category)}</td>
                            <td className="py-4 text-sm">{ticket.resolutionTime}</td>
                            <td className="py-4">{getCsatStars(ticket.csat)}</td>
                            <td className="py-4">
                              <Link
                                href={`/admin/saas/support/${ticket.id}`}
                                className="text-gold hover:underline"
                              >
                                {t('table.viewDetail')}
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4 flex justify-center">
                    <Button variant="outline" size="sm">
                      {t('ticketHistory.loadMore')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar Stats */}
            <div className="space-y-6">
              {/* Category Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t('categoryBreakdown.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mockHistoryData.categoryStats.map((cat, index) => (
                      <div key={index}>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span>{t(`categories.${cat.category}`)}</span>
                          <span className="font-medium">{cat.count}</span>
                        </div>
                        <div className="h-2 rounded-full bg-background-secondary">
                          <div
                            className="h-2 rounded-full bg-gold"
                            style={{ width: `${cat.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Monthly Trend */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t('monthlyTrend.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-between gap-2">
                    {mockHistoryData.monthlyTrend.map((data, index) => (
                      <div key={index} className="flex flex-col items-center gap-1">
                        <div className="relative h-24 w-8">
                          <div
                            className="absolute bottom-0 w-8 rounded-t bg-gold/30"
                            style={{ height: `${(data.tickets / 220) * 100}%` }}
                          />
                          <div
                            className="absolute bottom-0 w-8 rounded-t bg-gold"
                            style={{ height: `${(data.resolved / 220) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-foreground-tertiary">{data.month}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center justify-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded bg-gold/30" />
                      <span className="text-xs text-foreground-secondary">{t('monthlyTrend.total')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded bg-gold" />
                      <span className="text-xs text-foreground-secondary">{t('monthlyTrend.resolved')}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
