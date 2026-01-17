'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { EnterpriseSidebar } from '../Dashboard/EnterpriseSidebar';
import { Button } from '@/components/ui/button';

export type AuditCategory = 'auth' | 'transactions' | 'users' | 'api' | 'settings' | 'security';

export interface AuditEvent {
  id: string;
  category: AuditCategory;
  icon: string;
  actor: string;
  action: string;
  details: string;
  timestamp: string;
  ipAddress: string;
}

// Mock data
const MOCK_AUDIT_EVENTS: AuditEvent[] = [
  {
    id: '1',
    category: 'auth',
    icon: '🔐',
    actor: '佐藤 太郎',
    action: 'login',
    details: 'Browser: Chrome 120 • OS: macOS',
    timestamp: '2026-01-11 14:32:15',
    ipAddress: '203.0.113.42',
  },
  {
    id: '2',
    category: 'transactions',
    icon: '📝',
    actor: 'API',
    action: 'lockTx',
    details: 'TX: 0x7a3f...9c2d • Amount: 5.00 ETH • API Key: qs_live_...7a3f',
    timestamp: '2026-01-11 14:32:00',
    ipAddress: '198.51.100.10',
  },
  {
    id: '3',
    category: 'users',
    icon: '👤',
    actor: '佐藤 太郎',
    action: 'inviteUser',
    details: 'Email: yamamoto@acme.co.jp • Role: Member',
    timestamp: '2026-01-11 13:45:22',
    ipAddress: '203.0.113.42',
  },
  {
    id: '4',
    category: 'api',
    icon: '🔑',
    actor: '田中 花子',
    action: 'createApiKey',
    details: 'Key: qs_live_...9c2d • Environment: Production',
    timestamp: '2026-01-11 11:20:05',
    ipAddress: '203.0.113.55',
  },
  {
    id: '5',
    category: 'settings',
    icon: '⚙️',
    actor: '佐藤 太郎',
    action: 'updateSettings',
    details: 'Changed: Session timeout (15min → 30min)',
    timestamp: '2026-01-11 10:15:33',
    ipAddress: '203.0.113.42',
  },
  {
    id: '6',
    category: 'security',
    icon: '🛡️',
    actor: 'System',
    action: 'blockedLogin',
    details: 'Email: sato@acme.co.jp • Reason: Unknown IP address',
    timestamp: '2026-01-11 09:45:12',
    ipAddress: '192.0.2.99',
  },
  {
    id: '7',
    category: 'transactions',
    icon: '📝',
    actor: 'API',
    action: 'unlockTx',
    details: 'TX: 0x3b2e...1f4a • Amount: 2.50 ETH • API Key: qs_live_...7a3f',
    timestamp: '2026-01-11 09:15:00',
    ipAddress: '198.51.100.10',
  },
  {
    id: '8',
    category: 'auth',
    icon: '🔐',
    actor: '鈴木 一郎',
    action: 'enabled2fa',
    details: 'Method: TOTP (Authenticator App)',
    timestamp: '2026-01-10 16:30:45',
    ipAddress: '203.0.113.78',
  },
];

const CATEGORY_STYLES: Record<AuditCategory, string> = {
  auth: 'bg-info/10 text-info',
  transactions: 'bg-hinomaru/10 text-hinomaru',
  users: 'bg-success/10 text-success',
  api: 'bg-gold/10 text-gold',
  settings: 'bg-warning/10 text-warning',
  security: 'bg-red-500/10 text-red-500',
};

interface AuditLogProps {
  className?: string;
}

export function AuditLog({ className }: AuditLogProps) {
  const t = useTranslations('enterprise.auditLog');

  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Get unique users for filter
  const users = Array.from(new Set(MOCK_AUDIT_EVENTS.map((e) => e.actor)));

  // Filter events
  const filteredEvents = MOCK_AUDIT_EVENTS.filter((event) => {
    if (categoryFilter !== 'all' && event.category !== categoryFilter) return false;
    if (userFilter !== 'all' && event.actor !== userFilter) return false;
    if (searchQuery && !event.action.toLowerCase().includes(searchQuery.toLowerCase()) && !event.details.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const totalEvents = 1234;
  const totalPages = 62;
  const showingStart = (currentPage - 1) * 20 + 1;
  const showingEnd = Math.min(currentPage * 20, totalEvents);

  return (
    <div className={cn('flex min-h-screen bg-background', className)}>
      <EnterpriseSidebar />

      <main
        className="flex-1 ml-[260px] min-h-screen"
        role="main"
        aria-label={t('ariaLabel')}
      >
        {/* Top Bar */}
        <header
          className="flex items-center justify-between px-8 py-4 bg-background-secondary border-b border-white/5 sticky top-0 z-50"
          role="banner"
        >
          <h1 className="text-xl font-semibold text-text-primary">{t('pageTitle')}</h1>
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm">
              <span aria-hidden="true">📥</span> {t('exportCsv')}
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8">
          {/* Filter Bar */}
          <section
            className="flex flex-wrap gap-4 mb-6"
            aria-label={t('filters.ariaLabel')}
          >
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-tertiary">{t('filters.category.label')}:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-background-secondary border border-white/10 rounded-lg text-text-primary text-sm"
              >
                <option value="all">{t('filters.category.all')}</option>
                <option value="auth">{t('filters.category.auth')}</option>
                <option value="transactions">{t('filters.category.transactions')}</option>
                <option value="users">{t('filters.category.users')}</option>
                <option value="api">{t('filters.category.api')}</option>
                <option value="settings">{t('filters.category.settings')}</option>
                <option value="security">{t('filters.category.security')}</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-tertiary">{t('filters.user.label')}:</span>
              <select
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="px-3 py-2 bg-background-secondary border border-white/10 rounded-lg text-text-primary text-sm"
              >
                <option value="all">{t('filters.user.all')}</option>
                {users.map((user) => (
                  <option key={user} value={user}>{user}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-tertiary">{t('filters.date.label')}:</span>
              <input
                type="date"
                defaultValue="2026-01-01"
                className="px-3 py-2 bg-background-secondary border border-white/10 rounded-lg text-text-primary text-sm"
              />
              <span className="text-text-tertiary">{t('filters.date.to')}</span>
              <input
                type="date"
                defaultValue="2026-01-11"
                className="px-3 py-2 bg-background-secondary border border-white/10 rounded-lg text-text-primary text-sm"
              />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('filters.search.placeholder')}
              aria-label={t('filters.search.ariaLabel')}
              className="px-3 py-2 bg-background-secondary border border-white/10 rounded-lg text-text-primary text-sm w-48"
            />
            <Button variant="primary" size="sm">
              {t('filters.apply')}
            </Button>
          </section>

          {/* Audit Log List */}
          <section className="bg-background-secondary border border-white/5 rounded-2xl overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-white/5">
              <h2 id="audit-log-title" className="text-base font-semibold text-text-primary">
                {t('list.title')}
              </h2>
              <span className="text-sm text-text-tertiary">
                {t('list.period')} • {totalEvents.toLocaleString()} {t('list.events')}
              </span>
            </div>

            <ul aria-labelledby="audit-log-title" className="divide-y divide-white/5">
              {filteredEvents.map((event) => (
                <li
                  key={event.id}
                  className="flex items-start gap-4 p-4 hover:bg-background-elevated transition-colors"
                >
                  <div
                    className={cn(
                      'w-8 h-8 flex items-center justify-center rounded-lg text-sm flex-shrink-0',
                      CATEGORY_STYLES[event.category]
                    )}
                    aria-hidden="true"
                  >
                    {event.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary">
                      <strong className="text-gold">{event.actor}</strong>{' '}
                      {t(`event.actions.${event.action}`)}
                    </p>
                    <p className="text-xs text-text-tertiary font-mono truncate">
                      {event.details}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-[11px] text-text-tertiary font-mono">{event.timestamp}</span>
                    <span className="text-[10px] text-text-muted font-mono">{event.ipAddress}</span>
                  </div>
                </li>
              ))}
            </ul>

            {/* Pagination */}
            <nav
              className="flex items-center justify-between px-6 py-4 border-t border-white/5"
              aria-label={t('pagination.ariaLabel')}
            >
              <span className="text-sm text-text-tertiary">
                {t('pagination.showing', { start: showingStart, end: showingEnd, total: totalEvents })}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-4 py-2 bg-background-primary border border-white/10 rounded-lg text-sm text-text-secondary disabled:opacity-50"
                >
                  ← {t('pagination.previous')}
                </button>
                {[1, 2, 3].map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={cn(
                      'px-4 py-2 rounded-lg text-sm',
                      page === currentPage
                        ? 'bg-hinomaru text-white'
                        : 'bg-background-primary border border-white/10 text-text-secondary'
                    )}
                    aria-current={page === currentPage ? 'page' : undefined}
                  >
                    {page}
                  </button>
                ))}
                <span className="px-2 py-2 text-text-tertiary">...</span>
                <button
                  type="button"
                  onClick={() => setCurrentPage(totalPages)}
                  className="px-4 py-2 bg-background-primary border border-white/10 rounded-lg text-sm text-text-secondary"
                >
                  {totalPages}
                </button>
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-4 py-2 bg-background-primary border border-white/10 rounded-lg text-sm text-text-secondary disabled:opacity-50"
                >
                  {t('pagination.next')} →
                </button>
              </div>
            </nav>
          </section>
        </div>
      </main>
    </div>
  );
}
