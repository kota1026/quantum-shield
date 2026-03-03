'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useState } from 'react';
import {
  Headphones,
  ChevronRight,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Building2,
  User,
  Search,
  Filter,
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
                <TrendingUp className={cn('h-3 w-3', trend.direction === 'down' && 'rotate-180')} />
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
const SAMPLE_TICKETS = [
  {
    id: 'TKT-001',
    subject: 'Prover APIのレスポンス遅延について',
    operatorId: 'op-001',
    operatorName: 'Global Finance Corp',
    priority: 'high',
    status: 'open',
    category: 'technical',
    createdAt: '2026-01-18 10:30',
    lastUpdated: '2026-01-18 14:15',
    assignee: '山田太郎',
    messages: 5,
  },
  {
    id: 'TKT-002',
    subject: 'SLAレポートの生成方法',
    operatorId: 'op-002',
    operatorName: 'Asian Banking Group',
    priority: 'medium',
    status: 'in_progress',
    category: 'billing',
    createdAt: '2026-01-17 15:45',
    lastUpdated: '2026-01-18 09:00',
    assignee: '佐藤花子',
    messages: 3,
  },
  {
    id: 'TKT-003',
    subject: '新しいノードの追加リクエスト',
    operatorId: 'op-003',
    operatorName: 'Nordic Crypto Exchange',
    priority: 'low',
    status: 'open',
    category: 'provisioning',
    createdAt: '2026-01-17 11:20',
    lastUpdated: '2026-01-17 11:20',
    assignee: null,
    messages: 1,
  },
  {
    id: 'TKT-004',
    subject: '証明書の更新について',
    operatorId: 'op-001',
    operatorName: 'Global Finance Corp',
    priority: 'high',
    status: 'waiting',
    category: 'security',
    createdAt: '2026-01-16 09:00',
    lastUpdated: '2026-01-17 16:30',
    assignee: '田中一郎',
    messages: 8,
  },
  {
    id: 'TKT-005',
    subject: '月次請求書の詳細について',
    operatorId: 'op-004',
    operatorName: 'Euro Securities Ltd',
    priority: 'medium',
    status: 'resolved',
    category: 'billing',
    createdAt: '2026-01-15 14:00',
    lastUpdated: '2026-01-16 10:00',
    assignee: '佐藤花子',
    messages: 4,
  },
];

const DEFAULT_METRICS = {
  openTickets: 23,
  avgResponseTime: '2.5h',
  avgResolutionTime: '18h',
  csat: 4.7,
  ticketsToday: 8,
};

export function SaasSupport() {
  const t = useTranslations('admin.saasSupport');
  const [activeTab, setActiveTab] = useState<'all' | 'open' | 'in_progress' | 'waiting' | 'resolved'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<typeof SAMPLE_TICKETS[0] | null>(SAMPLE_TICKETS[0]);

  const tabs = [
    { key: 'all', label: t('tabs.all'), count: SAMPLE_TICKETS.length },
    { key: 'open', label: t('tabs.open'), count: SAMPLE_TICKETS.filter(t => t.status === 'open').length },
    { key: 'in_progress', label: t('tabs.inProgress'), count: SAMPLE_TICKETS.filter(t => t.status === 'in_progress').length },
    { key: 'waiting', label: t('tabs.waiting'), count: SAMPLE_TICKETS.filter(t => t.status === 'waiting').length },
    { key: 'resolved', label: t('tabs.resolved'), count: SAMPLE_TICKETS.filter(t => t.status === 'resolved').length },
  ];

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="danger">{t('priority.high')}</Badge>;
      case 'medium':
        return <Badge variant="warning">{t('priority.medium')}</Badge>;
      case 'low':
        return <Badge variant="default">{t('priority.low')}</Badge>;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="gold">{t('status.open')}</Badge>;
      case 'in_progress':
        return <Badge variant="warning">{t('status.inProgress')}</Badge>;
      case 'waiting':
        return <Badge variant="default">{t('status.waiting')}</Badge>;
      case 'resolved':
        return <Badge variant="success">{t('status.resolved')}</Badge>;
      default:
        return null;
    }
  };

  const getCategoryLabel = (category: string) => {
    return t(`categories.${category}`);
  };

  const filteredTickets = SAMPLE_TICKETS.filter((ticket) => {
    const matchesSearch =
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.operatorName.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === 'all') return matchesSearch;
    return matchesSearch && ticket.status === activeTab;
  });

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
                SaaS
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground">{t('breadcrumb')}</span>
            </div>
            <h1 className="mt-2 text-3xl font-bold text-foreground">{t('title')}</h1>
            <p className="mt-1 text-sm text-foreground-secondary">{t('subtitle')}</p>
          </div>

          {/* Stats */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard
              label={t('stats.openTickets')}
              value={String(DEFAULT_METRICS.openTickets)}
              icon={<MessageSquare className="h-5 w-5" />}
              status="warning"
            />
            <StatCard
              label={t('stats.avgResponseTime')}
              value={DEFAULT_METRICS.avgResponseTime}
              trend={{ value: '-15%', direction: 'up' }}
              icon={<Clock className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.avgResolutionTime')}
              value={DEFAULT_METRICS.avgResolutionTime}
              icon={<CheckCircle className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.csat')}
              value={`${DEFAULT_METRICS.csat}/5`}
              icon={<TrendingUp className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.ticketsToday')}
              value={String(DEFAULT_METRICS.ticketsToday)}
              icon={<Headphones className="h-5 w-5" />}
            />
          </div>

          {/* Tabs */}
          <div className="mb-6 flex gap-1 rounded-lg border border-surface-tertiary bg-background-secondary p-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={cn(
                  'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all',
                  activeTab === tab.key
                    ? 'bg-gold text-background'
                    : 'text-foreground-secondary hover:text-foreground'
                )}
              >
                {tab.label}
                <Badge size="sm" variant={activeTab === tab.key ? 'gold' : 'default'}>
                  {tab.count}
                </Badge>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Ticket List */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">{t('ticketList.title')}</CardTitle>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-tertiary" />
                      <input
                        type="text"
                        placeholder={t('ticketList.searchPlaceholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="rounded-lg border border-surface-tertiary bg-background-secondary py-2 pl-10 pr-4 text-sm focus:border-gold focus:outline-none"
                      />
                    </div>
                    <Button variant="outline" size="sm" leftIcon={<Filter className="h-4 w-4" />}>
                      {t('ticketList.filter')}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {filteredTickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        onClick={() => setSelectedTicket(ticket)}
                        className={cn(
                          'cursor-pointer rounded-lg border p-4 transition-all',
                          selectedTicket?.id === ticket.id
                            ? 'border-gold bg-gold/5'
                            : 'border-surface-tertiary hover:border-gold/50',
                          ticket.priority === 'high' && ticket.status !== 'resolved' && 'border-l-4 border-l-danger'
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs text-foreground-tertiary">{ticket.id}</span>
                              {getPriorityBadge(ticket.priority)}
                            </div>
                            <div className="mt-1 font-medium text-foreground">{ticket.subject}</div>
                          </div>
                          {getStatusBadge(ticket.status)}
                        </div>

                        <div className="mt-3 flex items-center gap-4 text-xs text-foreground-tertiary">
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {ticket.operatorName}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {ticket.messages}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {ticket.lastUpdated}
                          </span>
                        </div>

                        {ticket.assignee && (
                          <div className="mt-2 flex items-center gap-1 text-xs">
                            <User className="h-3 w-3 text-foreground-tertiary" />
                            <span className="text-foreground-secondary">{ticket.assignee}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Ticket Detail Panel */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t('detail.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedTicket ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        {getPriorityBadge(selectedTicket.priority)}
                        {getStatusBadge(selectedTicket.status)}
                      </div>

                      <div>
                        <div className="text-xs text-foreground-tertiary">{t('detail.ticketId')}</div>
                        <div className="font-mono text-sm">{selectedTicket.id}</div>
                      </div>

                      <div>
                        <div className="text-xs text-foreground-tertiary">{t('detail.subject')}</div>
                        <div className="font-medium text-foreground">{selectedTicket.subject}</div>
                      </div>

                      <div>
                        <div className="text-xs text-foreground-tertiary">{t('detail.operator')}</div>
                        <Link
                          href={`/admin/saas/operators/${selectedTicket.operatorId}`}
                          className="text-sm text-gold hover:underline"
                        >
                          {selectedTicket.operatorName}
                        </Link>
                      </div>

                      <div>
                        <div className="text-xs text-foreground-tertiary">{t('detail.category')}</div>
                        <Badge variant="gold">{getCategoryLabel(selectedTicket.category)}</Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-foreground-tertiary">{t('detail.createdAt')}</div>
                          <div className="text-sm">{selectedTicket.createdAt}</div>
                        </div>
                        <div>
                          <div className="text-xs text-foreground-tertiary">{t('detail.lastUpdated')}</div>
                          <div className="text-sm">{selectedTicket.lastUpdated}</div>
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-foreground-tertiary">{t('detail.assignee')}</div>
                        <div className="flex items-center gap-2">
                          {selectedTicket.assignee ? (
                            <>
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gold/10">
                                <User className="h-3 w-3 text-gold" />
                              </div>
                              <span className="text-sm">{selectedTicket.assignee}</span>
                            </>
                          ) : (
                            <Badge variant="warning">{t('detail.unassigned')}</Badge>
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-foreground-tertiary">{t('detail.messages')}</div>
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-gold" />
                          <span className="text-lg font-bold">{selectedTicket.messages}</span>
                        </div>
                      </div>

                      <div className="border-t border-surface-tertiary pt-4">
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1" leftIcon={<MessageSquare className="h-4 w-4" />}>
                            {t('detail.actions.reply')}
                          </Button>
                          <Button size="sm" className="flex-1" leftIcon={<CheckCircle className="h-4 w-4" />}>
                            {t('detail.actions.resolve')}
                          </Button>
                        </div>
                        {!selectedTicket.assignee && (
                          <Button variant="outline" className="mt-2 w-full" leftIcon={<User className="h-4 w-4" />}>
                            {t('detail.actions.assign')}
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-64 items-center justify-center text-center text-foreground-tertiary">
                      <div>
                        <Headphones className="mx-auto h-12 w-12" />
                        <p className="mt-2">{t('detail.selectTicket')}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
