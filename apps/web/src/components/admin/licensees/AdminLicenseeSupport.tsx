'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  ArrowLeft,
  Building2,
  MessageSquare,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Send,
  Paperclip,
  User,
  Bot,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useLicenseeTickets, useLicenseeTicketMessages } from '@/hooks/admin/useLicensees';

interface LicenseeSupportProps {
  licenseeId: string;
}

type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
type TicketPriority = 'low' | 'medium' | 'high' | 'critical';

function StatusBadge({ status }: { status: TicketStatus }) {
  const t = useTranslations('admin.licenseeSupport');

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
      {t(`ticketStatus.${status}`)}
    </Badge>
  );
}

function PriorityBadge({ priority }: { priority: TicketPriority }) {
  const t = useTranslations('admin.licenseeSupport');

  const variants: Record<TicketPriority, 'default' | 'warning' | 'danger'> = {
    low: 'default',
    medium: 'warning',
    high: 'danger',
    critical: 'danger',
  };

  return (
    <Badge variant={variants[priority]}>
      {t(`ticketPriority.${priority}`)}
    </Badge>
  );
}

export function AdminLicenseeSupport({ licenseeId }: LicenseeSupportProps) {
  const t = useTranslations('admin.licenseeSupport');
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');

  // Fetch tickets and messages from API
  const { data: ticketsData, isLoading: isLoadingTickets, error: ticketsError } = useLicenseeTickets(licenseeId);
  const { data: messages, isLoading: isLoadingMessages } = useLicenseeTicketMessages(licenseeId, selectedTicket ?? '');

  const tickets = ticketsData?.tickets ?? [];

  // Auto-select first ticket when data loads
  if (tickets.length > 0 && selectedTicket === null) {
    setSelectedTicket(tickets[0].id);
  }

  const currentTicket = tickets.find((t) => t.id === selectedTicket);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/admin/licensees/${licenseeId}`}
            className="flex items-center gap-2 text-sm text-foreground-secondary hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('backToDetail')}
          </Link>
        </div>
        <Button variant="primary" size="sm">
          <Plus className="mr-2 h-4 w-4" />
          {t('newTicket')}
        </Button>
      </div>

      {/* Company Header */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="rounded-lg bg-gold/10 p-3">
            <Building2 className="h-6 w-6 text-gold" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Tokyo Financial Group</h1>
            <p className="text-sm text-foreground-secondary">{t('supportFor')}</p>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[350px_1fr]">
        {/* Ticket List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="h-5 w-5 text-gold" />
              {t('tickets')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 p-2">
            {tickets.length === 0 && !isLoadingTickets && (
              <div className="py-8 text-center text-sm text-foreground-tertiary">
                {t('empty.title')}
              </div>
            )}
            {tickets.map((ticket) => (
              <button
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket.id)}
                className={cn(
                  'w-full rounded-lg p-3 text-left transition-colors',
                  selectedTicket === ticket.id
                    ? 'bg-gold/10 border border-gold/30'
                    : 'hover:bg-surface'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{ticket.subject}</div>
                    <div className="mt-1 flex items-center gap-2">
                      <StatusBadge status={ticket.status} />
                      <PriorityBadge priority={ticket.priority} />
                    </div>
                    <div className="mt-2 text-xs text-foreground-tertiary">
                      {t('updatedAt')}: {new Date(ticket.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Conversation */}
        {currentTicket && (
          <Card className="flex flex-col">
            <CardHeader className="border-b border-border">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{currentTicket.subject}</CardTitle>
                  <div className="mt-2 flex items-center gap-2">
                    <StatusBadge status={currentTicket.status} />
                    <PriorityBadge priority={currentTicket.priority} />
                    <span className="text-sm text-foreground-tertiary">
                      {t('assignee')}: {currentTicket.assignee}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    {t('resolve')}
                  </Button>
                  <Button variant="outline" size="sm">
                    {t('escalate')}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                {(messages ?? []).length === 0 && !isLoadingMessages && (
                  <div className="py-8 text-center text-sm text-foreground-tertiary">
                    {t('noMessages')}
                  </div>
                )}
                {(messages ?? []).map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      'flex gap-3',
                      message.sender === 'support' && 'flex-row-reverse'
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-full',
                        message.sender === 'licensee'
                          ? 'bg-surface'
                          : 'bg-gold/10'
                      )}
                    >
                      {message.sender === 'licensee' ? (
                        <User className="h-4 w-4 text-foreground-tertiary" />
                      ) : (
                        <Bot className="h-4 w-4 text-gold" />
                      )}
                    </div>
                    <div
                      className={cn(
                        'flex-1 max-w-[80%] rounded-lg p-3',
                        message.sender === 'licensee'
                          ? 'bg-surface'
                          : 'bg-gold/10'
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{message.senderName}</span>
                        <span className="text-xs text-foreground-tertiary">
                          {new Date(message.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm">{message.content}</p>
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="mt-2 flex items-center gap-2">
                          <Paperclip className="h-3 w-3 text-foreground-tertiary" />
                          {message.attachments.map((file, index) => (
                            <span
                              key={index}
                              className="text-xs text-gold hover:underline cursor-pointer"
                            >
                              {file}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <div className="border-t border-border p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={t('messagePlaceholder')}
                  className={cn(
                    'flex-1 rounded-lg border border-border bg-surface px-4 py-2',
                    'focus:border-gold focus:ring-1 focus:ring-gold'
                  )}
                />
                <Button variant="ghost" size="sm">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button variant="primary" size="sm">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

export default AdminLicenseeSupport;
