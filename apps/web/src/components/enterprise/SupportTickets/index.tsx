'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  LifeBuoy,
  Plus,
  Search,
  Clock,
  ChevronRight,
  X,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { EnterpriseSidebar } from '@/components/enterprise/Dashboard/EnterpriseSidebar';
import { EnterpriseTopBar } from '@/components/enterprise/Dashboard/EnterpriseTopBar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type TicketStatus = 'open' | 'inProgress' | 'waitingCustomer' | 'resolved' | 'closed';
type TicketPriority = 'critical' | 'high' | 'medium' | 'low';
type TicketCategory = 'technical' | 'billing' | 'account' | 'feature' | 'other';

interface Ticket {
  id: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  created: string;
  updated: string;
}

const DEMO_TICKETS: Ticket[] = [
  {
    id: 'TKT-001',
    subject: 'API rate limit exceeded unexpectedly',
    status: 'inProgress',
    priority: 'high',
    category: 'technical',
    created: '2024-12-10',
    updated: '2024-12-12',
  },
  {
    id: 'TKT-002',
    subject: 'Request for additional user seats',
    status: 'waitingCustomer',
    priority: 'medium',
    category: 'billing',
    created: '2024-12-08',
    updated: '2024-12-11',
  },
  {
    id: 'TKT-003',
    subject: 'Feature request: Bulk export functionality',
    status: 'open',
    priority: 'low',
    category: 'feature',
    created: '2024-12-05',
    updated: '2024-12-05',
  },
  {
    id: 'TKT-004',
    subject: 'Prover node connectivity issues',
    status: 'resolved',
    priority: 'critical',
    category: 'technical',
    created: '2024-12-01',
    updated: '2024-12-03',
  },
];

const STATS = {
  open: DEMO_TICKETS.filter((t) => t.status === 'open').length,
  inProgress: DEMO_TICKETS.filter((t) => t.status === 'inProgress').length,
  resolved: DEMO_TICKETS.filter((t) => t.status === 'resolved').length,
  avgResponse: '2.4h',
};

function StatusBadge({ status }: { status: TicketStatus }) {
  const t = useTranslations('enterprise.supportTickets');

  const config: Record<TicketStatus, { color: string; bg: string }> = {
    open: { color: 'text-info', bg: 'bg-info/10' },
    inProgress: { color: 'text-warning', bg: 'bg-warning/10' },
    waitingCustomer: { color: 'text-gold', bg: 'bg-gold/10' },
    resolved: { color: 'text-success', bg: 'bg-success/10' },
    closed: { color: 'text-foreground-tertiary', bg: 'bg-white/5' },
  };

  return (
    <span className={cn('px-2 py-1 rounded text-xs font-medium', config[status].bg, config[status].color)}>
      {t(`statuses.${status}`)}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: TicketPriority }) {
  const t = useTranslations('enterprise.supportTickets');

  const variants: Record<TicketPriority, string> = {
    critical: 'bg-danger/10 text-danger border-danger/30',
    high: 'bg-warning/10 text-warning border-warning/30',
    medium: 'bg-gold/10 text-gold border-gold/30',
    low: 'bg-white/5 text-foreground-secondary border-white/10',
  };

  return (
    <Badge className={cn('text-xs border', variants[priority])}>
      {t(`priorities.${priority}`)}
    </Badge>
  );
}

interface CreateTicketFormProps {
  onClose: () => void;
  onSubmit: (data: Partial<Ticket>) => void;
}

function CreateTicketForm({ onClose, onSubmit }: CreateTicketFormProps) {
  const t = useTranslations('enterprise.supportTickets');
  const [formData, setFormData] = useState({
    subject: '',
    category: 'technical' as TicketCategory,
    priority: 'medium' as TicketPriority,
    description: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <Card className="w-full max-w-lg mx-4">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h3 className="text-lg font-semibold">{t('createTicket.title')}</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">{t('createTicket.subject')}</label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder={t('createTicket.subjectPlaceholder')}
              className="w-full px-3 py-2 bg-background-secondary border border-white/10 rounded-lg text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t('createTicket.category')}</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as TicketCategory })}
                className="w-full px-3 py-2 bg-background-secondary border border-white/10 rounded-lg text-sm"
              >
                {(['technical', 'billing', 'account', 'feature', 'other'] as TicketCategory[]).map((cat) => (
                  <option key={cat} value={cat}>{t(`categories.${cat}`)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t('createTicket.priority')}</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as TicketPriority })}
                className="w-full px-3 py-2 bg-background-secondary border border-white/10 rounded-lg text-sm"
              >
                {(['critical', 'high', 'medium', 'low'] as TicketPriority[]).map((p) => (
                  <option key={p} value={p}>{t(`priorities.${p}`)}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t('createTicket.description')}</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={t('createTicket.descriptionPlaceholder')}
              rows={4}
              className="w-full px-3 py-2 bg-background-secondary border border-white/10 rounded-lg text-sm resize-none"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={onClose}>
              {t('createTicket.cancel')}
            </Button>
            <Button type="submit">{t('createTicket.submit')}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export function EnterpriseSupportTickets() {
  const t = useTranslations('enterprise.supportTickets');
  const tCommon = useTranslations('enterprise');
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tickets, setTickets] = useState(DEMO_TICKETS);

  const filteredTickets = tickets.filter((ticket) =>
    ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateTicket = (data: Partial<Ticket>) => {
    const newTicket: Ticket = {
      id: `TKT-${String(tickets.length + 1).padStart(3, '0')}`,
      subject: data.subject || '',
      status: 'open',
      priority: data.priority || 'medium',
      category: data.category || 'other',
      created: new Date().toISOString().split('T')[0],
      updated: new Date().toISOString().split('T')[0],
    };
    setTickets([newTicket, ...tickets]);
  };

  return (
    <div className="min-h-screen bg-background flex">
      <EnterpriseSidebar />

      <div className="flex-1 ml-[260px]">
        <EnterpriseTopBar
          pageTitle={t('pageTitle')}
          userName={tCommon('dashboard.demoUser.name')}
          userInitial={tCommon('dashboard.demoUser.initial')}
        />

        <main className="p-8" role="main" aria-label={t('ariaLabel')}>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="p-4 bg-info/5 border-info/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-info/10 rounded-lg">
                  <MessageSquare className="h-5 w-5 text-info" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-info">{STATS.open}</div>
                  <div className="text-xs text-foreground-secondary">{t('stats.open')}</div>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-warning/5 border-warning/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-warning/10 rounded-lg">
                  <Loader2 className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-warning">{STATS.inProgress}</div>
                  <div className="text-xs text-foreground-secondary">{t('stats.inProgress')}</div>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-success/5 border-success/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-success/10 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-success">{STATS.resolved}</div>
                  <div className="text-xs text-foreground-secondary">{t('stats.resolved')}</div>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-background-secondary/50 border-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/5 rounded-lg">
                  <Clock className="h-5 w-5 text-foreground-secondary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{STATS.avgResponse}</div>
                  <div className="text-xs text-foreground-secondary">{t('stats.avgResponse')}</div>
                </div>
              </div>
            </Card>
          </div>

          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-tertiary" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tickets..."
                className="w-full pl-10 pr-4 py-2 bg-background-secondary border border-white/10 rounded-lg text-sm"
              />
            </div>
            <Button size="sm" className="gap-2" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4" />
              {t('newTicket')}
            </Button>
          </div>

          {/* Tickets Table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10 bg-background-tertiary/50">
                    <th className="text-left px-6 py-4 text-xs font-semibold text-foreground-secondary uppercase tracking-wider">
                      {t('table.id')}
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-foreground-secondary uppercase tracking-wider">
                      {t('table.subject')}
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-foreground-secondary uppercase tracking-wider">
                      {t('table.status')}
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-foreground-secondary uppercase tracking-wider">
                      {t('table.priority')}
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-foreground-secondary uppercase tracking-wider">
                      {t('table.updated')}
                    </th>
                    <th className="text-right px-6 py-4 text-xs font-semibold text-foreground-secondary uppercase tracking-wider">
                      {t('table.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-6 py-4 font-mono text-sm">{ticket.id}</td>
                      <td className="px-6 py-4">
                        <div className="font-medium">{ticket.subject}</div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={ticket.status} />
                      </td>
                      <td className="px-6 py-4">
                        <PriorityBadge priority={ticket.priority} />
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground-secondary">
                        {ticket.updated}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="sm" className="gap-1">
                          {t('viewDetails')}
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredTickets.length === 0 && (
              <div className="p-12 text-center">
                <LifeBuoy className="h-12 w-12 text-foreground-tertiary mx-auto mb-4" />
                <p className="text-foreground-secondary">No tickets found</p>
              </div>
            )}
          </Card>
        </main>

        {showForm && <CreateTicketForm onClose={() => setShowForm(false)} onSubmit={handleCreateTicket} />}
      </div>
    </div>
  );
}

export default EnterpriseSupportTickets;
