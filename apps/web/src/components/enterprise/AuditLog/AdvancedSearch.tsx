'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  X,
  Calendar,
  User,
  Tag,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { AuditCategory } from './index';

export interface AuditSearchFilters {
  query: string;
  categories: AuditCategory[];
  users: string[];
  actions: string[];
  ipAddresses: string[];
  dateFrom: string;
  dateTo: string;
  severity?: 'all' | 'info' | 'warning' | 'critical';
}

interface AdvancedSearchProps {
  filters: AuditSearchFilters;
  onFiltersChange: (filters: AuditSearchFilters) => void;
  onSearch: () => void;
  onClear: () => void;
  availableUsers: string[];
  availableActions: string[];
  className?: string;
}

const CATEGORIES: AuditCategory[] = ['auth', 'transactions', 'users', 'api', 'settings', 'security'];

export function AdvancedSearch({
  filters,
  onFiltersChange,
  onSearch,
  onClear,
  availableUsers,
  availableActions,
  className,
}: AdvancedSearchProps) {
  const t = useTranslations('enterprise.auditLog.advancedSearch');
  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilter = <K extends keyof AuditSearchFilters>(
    key: K,
    value: AuditSearchFilters[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleCategory = (category: AuditCategory) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter((c) => c !== category)
      : [...filters.categories, category];
    updateFilter('categories', newCategories);
  };

  const toggleUser = (user: string) => {
    const newUsers = filters.users.includes(user)
      ? filters.users.filter((u) => u !== user)
      : [...filters.users, user];
    updateFilter('users', newUsers);
  };

  const toggleAction = (action: string) => {
    const newActions = filters.actions.includes(action)
      ? filters.actions.filter((a) => a !== action)
      : [...filters.actions, action];
    updateFilter('actions', newActions);
  };

  const activeFiltersCount =
    filters.categories.length +
    filters.users.length +
    filters.actions.length +
    (filters.dateFrom ? 1 : 0) +
    (filters.dateTo ? 1 : 0) +
    (filters.severity && filters.severity !== 'all' ? 1 : 0);

  return (
    <div className={cn('bg-background-secondary border border-white/5 rounded-2xl', className)}>
      {/* Quick Search Bar */}
      <div className="flex items-center gap-4 p-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            value={filters.query}
            onChange={(e) => updateFilter('query', e.target.value)}
            placeholder={t('placeholder')}
            className="w-full pl-10 pr-4 py-2.5 bg-background-primary border border-white/10 rounded-lg text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-hinomaru/50"
            aria-label={t('ariaLabel')}
          />
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2"
        >
          <Filter className="w-4 h-4" />
          {t('advancedFilters')}
          {activeFiltersCount > 0 && (
            <span className="px-1.5 py-0.5 bg-hinomaru/20 text-hinomaru text-xs rounded-full">
              {activeFiltersCount}
            </span>
          )}
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
        <Button variant="primary" size="sm" onClick={onSearch}>
          {t('search')}
        </Button>
      </div>

      {/* Advanced Filters Panel */}
      {isExpanded && (
        <div className="border-t border-white/5 p-4 space-y-4">
          {/* Date Range */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-text-tertiary" />
              <span className="text-xs text-text-tertiary">{t('dateRange')}:</span>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => updateFilter('dateFrom', e.target.value)}
                className="px-3 py-2 bg-background-primary border border-white/10 rounded-lg text-text-primary text-sm"
              />
              <span className="text-text-tertiary">〜</span>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => updateFilter('dateTo', e.target.value)}
                className="px-3 py-2 bg-background-primary border border-white/10 rounded-lg text-text-primary text-sm"
              />
            </div>

            {/* Severity */}
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-text-tertiary" />
              <span className="text-xs text-text-tertiary">{t('severity')}:</span>
              <select
                value={filters.severity || 'all'}
                onChange={(e) => updateFilter('severity', e.target.value as AuditSearchFilters['severity'])}
                className="px-3 py-2 bg-background-primary border border-white/10 rounded-lg text-text-primary text-sm"
              >
                <option value="all">{t('severityOptions.all')}</option>
                <option value="info">{t('severityOptions.info')}</option>
                <option value="warning">{t('severityOptions.warning')}</option>
                <option value="critical">{t('severityOptions.critical')}</option>
              </select>
            </div>
          </div>

          {/* Categories */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Tag className="w-4 h-4 text-text-tertiary" />
              <span className="text-xs text-text-tertiary">{t('categories')}:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => toggleCategory(category)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                    filters.categories.includes(category)
                      ? 'bg-hinomaru text-white'
                      : 'bg-background-primary border border-white/10 text-text-secondary hover:bg-white/5'
                  )}
                >
                  {t(`categoryOptions.${category}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Users */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-text-tertiary" />
              <span className="text-xs text-text-tertiary">{t('users')}:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {availableUsers.map((user) => (
                <button
                  key={user}
                  type="button"
                  onClick={() => toggleUser(user)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                    filters.users.includes(user)
                      ? 'bg-gold text-background-primary'
                      : 'bg-background-primary border border-white/10 text-text-secondary hover:bg-white/5'
                  )}
                >
                  {user}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-text-tertiary" />
              <span className="text-xs text-text-tertiary">{t('actions')}:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {availableActions.slice(0, 10).map((action) => (
                <button
                  key={action}
                  type="button"
                  onClick={() => toggleAction(action)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                    filters.actions.includes(action)
                      ? 'bg-info text-white'
                      : 'bg-background-primary border border-white/10 text-text-secondary hover:bg-white/5'
                  )}
                >
                  {action}
                </button>
              ))}
            </div>
          </div>

          {/* IP Address Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-tertiary">{t('ipAddress')}:</span>
            <input
              type="text"
              value={filters.ipAddresses.join(', ')}
              onChange={(e) => updateFilter('ipAddresses', e.target.value.split(',').map(ip => ip.trim()).filter(Boolean))}
              placeholder={t('ipPlaceholder')}
              className="flex-1 max-w-xs px-3 py-2 bg-background-primary border border-white/10 rounded-lg text-text-primary text-sm font-mono placeholder:text-text-muted"
            />
          </div>

          {/* Active Filters Summary */}
          {activeFiltersCount > 0 && (
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <div className="flex flex-wrap gap-2">
                {filters.categories.map((cat) => (
                  <span
                    key={cat}
                    className="flex items-center gap-1 px-2 py-1 bg-hinomaru/20 text-hinomaru text-xs rounded-full"
                  >
                    {t(`categoryOptions.${cat}`)}
                    <button
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      className="hover:text-white"
                      aria-label={t('removeFilter')}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {filters.users.map((user) => (
                  <span
                    key={user}
                    className="flex items-center gap-1 px-2 py-1 bg-gold/20 text-gold text-xs rounded-full"
                  >
                    {user}
                    <button
                      type="button"
                      onClick={() => toggleUser(user)}
                      className="hover:text-white"
                      aria-label={t('removeFilter')}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <Button variant="ghost" size="sm" onClick={onClear} className="text-text-tertiary">
                <X className="w-4 h-4 mr-1" />
                {t('clearAll')}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
