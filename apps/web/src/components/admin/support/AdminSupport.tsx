'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  MessageSquare,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  User,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useSupportStats, useTicketsList } from '@/hooks/admin/useSupport';

type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
type TicketPriority = 'low' | 'medium' | 'high' | 'critical';

interface Ticket {
  id: string;
  subject: string;
  licensee: string;
  licenseeId: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
  updatedAt: string;
  assignee: string;
  responseTime?: string;
}

function StatusBadge({ status }: { status: TicketStatus }) {
  const t = useTranslations('admin.support');

  const config = {
    open: { color: 'bg-warning/10 text-warning', icon: AlertCircle },
    in_progress: { color: 'bg-info/10 text-info', icon: Clock },
    resolved: { color: 'bg-success/10 text-success', icon: CheckCircle2 },
    closed: { color: 'bg-foreground-tertiary/10 text-foreground-tertiary', icon: CheckCircle2 },
  };

  const { color, icon: Icon } = config[status];

  return (
    <Badge className={cn('gap-1', color)}>
      <Icon className="h-3 w-3" />
      {t(`status.${status}`)}
    </Badge>
  );
}

function PriorityBadge({ priority }: { priority: TicketPriority }) {
  const t = useTranslations('admin.support');

  const variants: Record<TicketPriority, 'default' | 'warning' | 'danger'> = {
    low: 'default',
    medium: 'warning',
    high: 'danger',
    critical: 'danger',
  };

  return (
    <Badge variant={variants[priority]}>
      {t(`priority.${priority}`)}
    </Badge>
  );
}

export function AdminSupport() {
  const t = useTranslations('admin.support');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | 'all'>('all');

  // Fetch tickets and stats from API
  const { data: statsData, isLoading: isLoadingStats } = useSupportStats();
  const { data: ticketsData, isLoading: isLoadingTickets, error: ticketsError } = useTicketsList({
    status: statusFilter !== 'all' ? statusFilter : undefined,
    priority: priorityFilter !== 'all' ? priorityFilter : undefined,
    search: searchQuery || undefined,
  });

  const allTickets: Ticket[] = (ticketsData?.tickets ?? []) as unknown as Ticket[];

  const filteredTickets = allTickets.filter((ticket) => {
    const matchesSearch =
      searchQuery === '' ||
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ticket.licensee ?? '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const stats = {
    total: statsData?.totalTickets ?? allTickets.length,
    open: statsData?.openTickets ?? allTickets.filter((tk) => tk.status === 'open').length,
    inProgress: allTickets.filter((tk) => tk.status === 'in_progress').length,
    avgResponseTime: statsData?.avgResponseTime ?? '-',
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="text-sm text-foreground-tertiary">{t('stats.total')}</div>
          <div className="mt-1 text-2xl font-bold">{stats.total}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-foreground-tertiary">{t('stats.open')}</div>
          <div className="mt-1 text-2xl font-bold text-warning">{stats.open}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-foreground-tertiary">{t('stats.inProgress')}</div>
          <div className="mt-1 text-2xl font-bold text-info">{stats.inProgress}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-foreground-tertiary">{t('stats.avgResponseTime')}</div>
          <div className="mt-1 text-2xl font-bold text-success">{stats.avgResponseTime}</div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-tertiary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className={cn(
                'w-full rounded-lg border border-border bg-surface py-2 pl-10 pr-4',
                'focus:border-gold focus:ring-1 focus:ring-gold'
              )}
              aria-label={t('searchAriaLabel')}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="flex gap-1">
              {(['all', 'open', 'in_progress', 'resolved'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                    statusFilter === status
                      ? 'bg-gold text-background'
                      : 'bg-surface text-foreground-secondary hover:text-foreground'
                  )}
                >
                  {t(`filters.${status}`)}
                </button>
              ))}
            </div>
            <div className="flex gap-1">
              {(['all', 'critical', 'high', 'medium', 'low'] as const).map((priority) => (
                <button
                  key={priority}
                  onClick={() => setPriorityFilter(priority)}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                    priorityFilter === priority
                      ? 'bg-gold text-background'
                      : 'bg-surface text-foreground-secondary hover:text-foreground'
                  )}
                >
                  {t(`priorityFilters.${priority}`)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Tickets Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-gold" />
            {t('tableTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full" aria-label={t('tableAriaLabel')}>
              <thead>
                <tr className="border-b border-border text-left text-sm text-foreground-tertiary">
                  <th className="pb-3 font-medium">{t('table.ticket')}</th>
                  <th className="pb-3 font-medium">{t('table.licensee')}</th>
                  <th className="pb-3 font-medium">{t('table.status')}</th>
                  <th className="pb-3 font-medium">{t('table.priority')}</th>
                  <th className="pb-3 font-medium">{t('table.assignee')}</th>
                  <th className="pb-3 font-medium">{t('table.responseTime')}</th>
                  <th className="pb-3 font-medium">{t('table.updated')}</th>
                  <th className="pb-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredTickets.map((ticket) => (
                  <tr key={ticket.id} className="group hover:bg-surface/50">
                    <td className="py-4">
                      <div>
                        <div className="font-mono text-xs text-foreground-tertiary">
                          {ticket.id}
                        </div>
                        <div className="font-medium">{ticket.subject}</div>
                      </div>
                    </td>
                    <td className="py-4">
                      <Link
                        href={`/admin/licensees/${ticket.licenseeId}`}
                        className="flex items-center gap-2 text-gold hover:underline"
                      >
                        <Building2 className="h-4 w-4" />
                        {ticket.licensee}
                      </Link>
                    </td>
                    <td className="py-4">
                      <StatusBadge status={ticket.status} />
                    </td>
                    <td className="py-4">
                      <PriorityBadge priority={ticket.priority} />
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-foreground-tertiary" />
                        <span className="text-sm">{ticket.assignee}</span>
                      </div>
                    </td>
                    <td className="py-4 text-sm">{ticket.responseTime}</td>
                    <td className="py-4 text-sm text-foreground-tertiary">
                      {new Date(ticket.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="py-4">
                      <Link href={`/admin/support/${ticket.id}`}>
                        <Button variant="ghost" size="sm">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredTickets.length === 0 && (
            <div className="py-12 text-center">
              <MessageSquare className="mx-auto h-12 w-12 text-foreground-tertiary" />
              <h3 className="mt-4 font-medium">{t('empty.title')}</h3>
              <p className="mt-1 text-sm text-foreground-tertiary">{t('empty.description')}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminSupport;
