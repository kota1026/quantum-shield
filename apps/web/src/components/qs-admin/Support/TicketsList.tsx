'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search,
  Filter,
  Download,
  ArrowLeft,
  MessageSquare,
  Clock,
  AlertCircle,
  CheckCircle,
  Eye,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { RefreshCw } from 'lucide-react';
import { useTicketsList } from '@/hooks/admin/useSupport';
import { MOCK_TICKETS, type Ticket } from '@/lib/api/admin/mock';

// Fallback data
const FALLBACK_TICKETS = MOCK_TICKETS;

const STATUS_COLORS = {
  open: 'bg-info/10 text-info',
  pending: 'bg-warning/10 text-warning',
  resolved: 'bg-success/10 text-success',
  closed: 'bg-foreground-tertiary/10 text-foreground-tertiary',
};

const STATUS_ICONS = {
  open: AlertCircle,
  pending: Clock,
  resolved: CheckCircle,
  closed: CheckCircle,
};

const PRIORITY_COLORS = {
  high: 'bg-danger/10 text-danger',
  medium: 'bg-warning/10 text-warning',
  low: 'bg-foreground-tertiary/10 text-foreground-tertiary',
};

// Loading Skeleton
function TicketsListSkeleton() {
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
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-surface rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Error State
function TicketsListError({ onRetry }: { onRetry: () => void }) {
  const t = useTranslations('qsAdmin.common');
  return (
    <Card>
      <CardContent className="p-6">
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-danger mx-auto mb-4" />
          <p className="text-foreground-secondary mb-4">{t('error')}</p>
          <Button variant="outline" onClick={onRetry}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('retry')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function TicketsList() {
  const t = useTranslations('qsAdmin.support');
  const tCommon = useTranslations('qsAdmin.common');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Fetch data using hooks
  const { data: ticketsData, isLoading, error, refetch } = useTicketsList();

  // Use API data with fallback
  const tickets = ticketsData?.tickets ?? FALLBACK_TICKETS;

  const statusFilters = [
    { key: 'all', label: tCommon('all') },
    { key: 'open', label: t('status.open') },
    { key: 'pending', label: t('status.pending') },
    { key: 'resolved', label: t('status.resolved') },
    { key: 'closed', label: t('status.closed') },
  ];

  const filteredTickets = tickets.filter(ticket => {
    if (statusFilter !== 'all' && ticket.status !== statusFilter) return false;
    if (searchQuery && !ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !ticket.id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  if (isLoading) {
    return <TicketsListSkeleton />;
  }

  if (error && !ticketsData) {
    return <TicketsListError onRetry={refetch} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/qs-admin/support">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('ticketsTitle')}</h1>
            <p className="text-foreground-secondary">{t('ticketsSubtitle')}</p>
          </div>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          {tCommon('export')}
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">{t('ticketsTitle')} ({filteredTickets.length})</CardTitle>
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
            {statusFilters.map((filter) => (
              <button key={filter.key} onClick={() => setStatusFilter(filter.key)} className={cn('px-4 py-3 min-h-[44px] text-sm font-medium border-b-2 -mb-px transition-colors', statusFilter === filter.key ? 'border-hinomaru text-hinomaru' : 'border-transparent text-foreground-secondary hover:text-foreground')}>
                {filter.label}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('table.id')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('table.subject')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('table.user')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('table.category')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('table.priority')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('table.status')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('table.updated')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('table.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((ticket) => {
                  const StatusIcon = STATUS_ICONS[ticket.status as keyof typeof STATUS_ICONS];
                  return (
                    <tr key={ticket.id} className={cn('border-b border-border hover:bg-surface transition-colors', ticket.priority === 'high' && ticket.status === 'open' && 'bg-danger/5')}>
                      <td className="py-3 px-4"><code className="text-sm font-mono text-hinomaru">{ticket.id}</code></td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">{ticket.subject}</p>
                          <p className="text-xs text-foreground-tertiary flex items-center mt-1">
                            <MessageSquare className="h-3 w-3 mr-1" />
                            {ticket.messages}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4"><code className="text-xs text-foreground-tertiary font-mono">{ticket.user}</code></td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-foreground-secondary">{t(`categories.${ticket.category}`)}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={cn('inline-flex items-center px-2 py-1 rounded-md text-xs font-medium', PRIORITY_COLORS[ticket.priority as keyof typeof PRIORITY_COLORS])}>
                          {t(`priority.${ticket.priority}`)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={cn('inline-flex items-center px-2 py-1 rounded-md text-xs font-medium', STATUS_COLORS[ticket.status as keyof typeof STATUS_COLORS])}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {t(`status.${ticket.status}`)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-foreground-secondary">{ticket.updated}</td>
                      <td className="py-3 px-4">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
