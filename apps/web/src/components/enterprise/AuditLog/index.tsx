'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { EnterpriseSidebar } from '../Dashboard/EnterpriseSidebar';
import { EnterpriseTopBar } from '../Dashboard/EnterpriseTopBar';
import { ExportButton } from '../shared/ExportButton';
import { AdvancedSearch, type AuditSearchFilters } from './AdvancedSearch';
import { SavedSearches } from './SavedSearches';
import { SavedSearchProvider } from '../shared/SavedSearchProvider';

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
  severity?: 'info' | 'warning' | 'critical';
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

const DEFAULT_FILTERS: AuditSearchFilters = {
  query: '',
  categories: [],
  users: [],
  actions: [],
  ipAddresses: [],
  dateFrom: '2026-01-01',
  dateTo: '2026-01-11',
  severity: 'all',
};

export function AuditLog({ className }: AuditLogProps) {
  const t = useTranslations('enterprise.auditLog');

  const [filters, setFilters] = useState<AuditSearchFilters>(DEFAULT_FILTERS);
  const [isSearchApplied, setIsSearchApplied] = useState(false);

  // Get unique users and actions for filter options
  const availableUsers = useMemo(
    () => Array.from(new Set(MOCK_AUDIT_EVENTS.map((e) => e.actor))),
    []
  );
  const availableActions = useMemo(
    () => Array.from(new Set(MOCK_AUDIT_EVENTS.map((e) => e.action))),
    []
  );

  // Filter events based on advanced search filters
  const filteredEvents = useMemo(() => {
    return MOCK_AUDIT_EVENTS.filter((event) => {
      // Query filter (search in action and details)
      if (filters.query) {
        const query = filters.query.toLowerCase();
        if (
          !event.action.toLowerCase().includes(query) &&
          !event.details.toLowerCase().includes(query) &&
          !event.actor.toLowerCase().includes(query)
        ) {
          return false;
        }
      }

      // Category filter
      if (filters.categories.length > 0 && !filters.categories.includes(event.category)) {
        return false;
      }

      // User filter
      if (filters.users.length > 0 && !filters.users.includes(event.actor)) {
        return false;
      }

      // Action filter
      if (filters.actions.length > 0 && !filters.actions.includes(event.action)) {
        return false;
      }

      // IP Address filter
      if (filters.ipAddresses.length > 0) {
        const matchesIp = filters.ipAddresses.some((ip) => event.ipAddress.includes(ip));
        if (!matchesIp) return false;
      }

      // Date filter
      if (filters.dateFrom) {
        const eventDate = new Date(event.timestamp.split(' ')[0]);
        const fromDate = new Date(filters.dateFrom);
        if (eventDate < fromDate) return false;
      }
      if (filters.dateTo) {
        const eventDate = new Date(event.timestamp.split(' ')[0]);
        const toDate = new Date(filters.dateTo);
        if (eventDate > toDate) return false;
      }

      // Severity filter
      if (filters.severity && filters.severity !== 'all' && event.severity !== filters.severity) {
        return false;
      }

      return true;
    });
  }, [filters]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const totalEvents = filteredEvents.length > 0 ? 1234 : 0; // Mock total
  const totalPages = Math.ceil(totalEvents / itemsPerPage);
  const showingStart = totalEvents > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const showingEnd = Math.min(currentPage * itemsPerPage, totalEvents);

  const handleSearch = () => {
    setIsSearchApplied(true);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setIsSearchApplied(false);
    setCurrentPage(1);
  };

  const handleLoadSavedSearch = (savedFilters: AuditSearchFilters) => {
    setFilters(savedFilters);
    setIsSearchApplied(true);
    setCurrentPage(1);
  };

  // Export data
  const exportData = filteredEvents.map((event) => ({
    id: event.id,
    category: event.category,
    actor: event.actor,
    action: event.action,
    details: event.details,
    timestamp: event.timestamp,
    ipAddress: event.ipAddress,
  }));

  const exportColumns = [
    { key: 'id', label: 'ID' },
    { key: 'timestamp', label: t('export.timestamp') },
    { key: 'category', label: t('export.category') },
    { key: 'actor', label: t('export.actor') },
    { key: 'action', label: t('export.action') },
    { key: 'details', label: t('export.details') },
    { key: 'ipAddress', label: t('export.ipAddress') },
  ];

  return (
    <SavedSearchProvider scope="audit-log">
      <div className={cn('flex min-h-screen bg-background', className)}>
        <EnterpriseSidebar />

        <main
          className="flex-1 ml-[260px] min-h-screen"
          role="main"
          aria-label={t('ariaLabel')}
        >
        {/* Top Bar */}
        <EnterpriseTopBar
          title={t('pageTitle')}
          actions={
            <ExportButton
              data={exportData}
              columns={exportColumns}
              filename="audit-log"
              title={t('pageTitle')}
            />
          }
        />

        {/* Page Content */}
        <div className="p-8">
          {/* Saved Searches */}
          <SavedSearches
            currentFilters={filters}
            onLoadSearch={handleLoadSavedSearch}
            className="mb-4"
          />

          {/* Advanced Search */}
          <AdvancedSearch
            filters={filters}
            onFiltersChange={setFilters}
            onSearch={handleSearch}
            onClear={handleClearFilters}
            availableUsers={availableUsers}
            availableActions={availableActions}
            className="mb-6"
          />

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
                  className="px-4 py-2 min-h-[44px] bg-background-primary border border-white/10 rounded-lg text-sm text-text-secondary disabled:opacity-50"
                >
                  ← {t('pagination.previous')}
                </button>
                {[1, 2, 3].map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={cn(
                      'px-4 py-2 min-h-[44px] min-w-[44px] rounded-lg text-sm',
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
                  className="px-4 py-2 min-h-[44px] min-w-[44px] bg-background-primary border border-white/10 rounded-lg text-sm text-text-secondary"
                >
                  {totalPages}
                </button>
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-4 py-2 min-h-[44px] bg-background-primary border border-white/10 rounded-lg text-sm text-text-secondary disabled:opacity-50"
                >
                  {t('pagination.next')} →
                </button>
              </div>
            </nav>
          </section>
        </div>
        </main>
      </div>
    </SavedSearchProvider>
  );
}
