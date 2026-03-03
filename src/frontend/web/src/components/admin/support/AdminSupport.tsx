'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  MessageSquare,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { LoadingState, TableSkeleton } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { useTicketsList, useSupportStats } from '@/hooks/admin/useSupport';
import type { Ticket } from '@/lib/api/admin/types';

type TicketStatus = Ticket['status'];
type TicketPriority = Ticket['priority'];

function StatusBadge({ status }: { status: TicketStatus }) {
  const t = useTranslations('admin.support');

  const config: Record<TicketStatus, { color: string; icon: typeof AlertCircle }> = {
    open: { color: 'bg-warning/10 text-warning', icon: AlertCircle },
    pending: { color: 'bg-info/10 text-info', icon: Clock },
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

  const {
    data: statsData,
    isLoading: statsLoading,
  } = useSupportStats();

  const {
    data: ticketsData,
    isLoading: ticketsLoading,
    error: ticketsError,
    refetch: refetchTickets,
  } = useTicketsList({
    status: statusFilter === 'all' ? undefined : statusFilter,
    priority: priorityFilter === 'all' ? undefined : priorityFilter,
    search: searchQuery || undefined,
  });

  const tickets = ticketsData?.tickets ?? [];

  const stats = {
    total: statsData?.totalTickets ?? 0,
    open: statsData?.openTickets ?? 0,
    inProgress: 0, // Derived from tickets if needed
    avgResponseTime: statsData?.avgResponseTime ?? '-',
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="text-sm text-foreground-tertiary">{t('stats.total')}</div>
          <div className="mt-1 text-2xl font-bold">
            {statsLoading ? '-' : stats.total}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-foreground-tertiary">{t('stats.open')}</div>
          <div className="mt-1 text-2xl font-bold text-warning">
            {statsLoading ? '-' : stats.open}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-foreground-tertiary">{t('stats.inProgress')}</div>
          <div className="mt-1 text-2xl font-bold text-info">
            {statsLoading ? '-' : stats.inProgress}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-foreground-tertiary">{t('stats.avgResponseTime')}</div>
          <div className="mt-1 text-2xl font-bold text-success">
            {statsLoading ? '-' : stats.avgResponseTime}
          </div>
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
              {(['all', 'open', 'pending', 'resolved'] as const).map((status) => (
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
              {(['all', 'high', 'medium', 'low'] as const).map((priority) => (
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
          {ticketsLoading && (
            <TableSkeleton rows={5} columns={7} />
          )}

          {ticketsError && (
            <ErrorState
              title={t('errorLoading')}
              description={ticketsError.message}
              onRetry={() => refetchTickets()}
            />
          )}

          {!ticketsLoading && !ticketsError && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full" aria-label={t('tableAriaLabel')}>
                  <thead>
                    <tr className="border-b border-border text-left text-sm text-foreground-tertiary">
                      <th className="pb-3 font-medium">{t('table.ticket')}</th>
                      <th className="pb-3 font-medium">{t('table.licensee')}</th>
                      <th className="pb-3 font-medium">{t('table.status')}</th>
                      <th className="pb-3 font-medium">{t('table.priority')}</th>
                      <th className="pb-3 font-medium">{t('table.category')}</th>
                      <th className="pb-3 font-medium">{t('table.updated')}</th>
                      <th className="pb-3 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {tickets.map((ticket) => (
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
                          <div className="flex items-center gap-2 text-foreground-secondary">
                            <Building2 className="h-4 w-4" />
                            {ticket.user}
                          </div>
                        </td>
                        <td className="py-4">
                          <StatusBadge status={ticket.status} />
                        </td>
                        <td className="py-4">
                          <PriorityBadge priority={ticket.priority} />
                        </td>
                        <td className="py-4 text-sm">{ticket.category}</td>
                        <td className="py-4 text-sm text-foreground-tertiary">
                          {ticket.updated}
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

              {tickets.length === 0 && (
                <div className="py-12 text-center">
                  <MessageSquare className="mx-auto h-12 w-12 text-foreground-tertiary" />
                  <h3 className="mt-4 font-medium">{t('empty.title')}</h3>
                  <p className="mt-1 text-sm text-foreground-tertiary">{t('empty.description')}</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminSupport;
