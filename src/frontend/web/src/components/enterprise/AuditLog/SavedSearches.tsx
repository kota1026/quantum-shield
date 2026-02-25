'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Bookmark,
  Star,
  Clock,
  Trash2,
  Edit2,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useSavedSearch, type SearchFilter } from '../shared/SavedSearchProvider';
import type { AuditSearchFilters } from './AdvancedSearch';

type SavedSearch = SearchFilter;

interface SavedSearchesProps {
  currentFilters: AuditSearchFilters;
  onLoadSearch: (filters: AuditSearchFilters) => void;
  className?: string;
}

export function SavedSearches({
  currentFilters,
  onLoadSearch,
  className,
}: SavedSearchesProps) {
  const t = useTranslations('enterprise.auditLog.savedSearches');
  const {
    searches: savedSearches,
    recentSearches,
    saveSearch,
    deleteSearch,
    toggleFavorite,
    updateLastUsed,
  } = useSavedSearch();

  const [isExpanded, setIsExpanded] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [newSearchName, setNewSearchName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleSaveSearch = () => {
    if (newSearchName.trim()) {
      saveSearch(newSearchName.trim(), currentFilters as unknown as Record<string, unknown>);
      setNewSearchName('');
      setIsSaveModalOpen(false);
    }
  };

  const handleLoadSearch = (search: SavedSearch) => {
    onLoadSearch(search.filters as unknown as AuditSearchFilters);
    updateLastUsed(search.id);
  };

  const startEditing = (search: SavedSearch) => {
    setEditingId(search.id);
    setEditingName(search.name);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingName('');
  };

  const confirmEditing = (id: string) => {
    if (editingName.trim()) {
      // For now, we delete and recreate - a proper implementation would have an update method
      const search = savedSearches.find((s) => s.id === id);
      if (search) {
        deleteSearch(id);
        saveSearch(editingName.trim(), search.filters);
      }
    }
    setEditingId(null);
    setEditingName('');
  };

  const favoriteSearches = savedSearches.filter((s) => s.isFavorite);
  const regularSearches = savedSearches.filter((s) => !s.isFavorite);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getFilterSummary = (filters: AuditSearchFilters) => {
    const parts: string[] = [];
    if (filters.query) parts.push(`"${filters.query}"`);
    if (filters.categories.length) parts.push(`${filters.categories.length} ${t('categories')}`);
    if (filters.users.length) parts.push(`${filters.users.length} ${t('users')}`);
    if (filters.dateFrom || filters.dateTo) parts.push(t('dateFilter'));
    return parts.join(' • ') || t('noFilters');
  };

  return (
    <div className={cn('', className)}>
      {/* Compact Toggle Button */}
      <div className="flex items-center gap-2 mb-4">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2"
        >
          <Bookmark className="w-4 h-4" />
          {t('savedSearches')}
          {savedSearches.length > 0 && (
            <span className="px-1.5 py-0.5 bg-gold/20 text-gold text-xs rounded-full">
              {savedSearches.length}
            </span>
          )}
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsSaveModalOpen(true)}
          className="flex items-center gap-1 text-text-tertiary hover:text-text-primary"
        >
          <Plus className="w-4 h-4" />
          {t('saveCurrentSearch')}
        </Button>
      </div>

      {/* Save Modal */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background-secondary border border-white/10 rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-text-primary mb-4">{t('saveSearchTitle')}</h3>
            <input
              type="text"
              value={newSearchName}
              onChange={(e) => setNewSearchName(e.target.value)}
              placeholder={t('searchNamePlaceholder')}
              className="w-full px-4 py-3 bg-background-primary border border-white/10 rounded-lg text-text-primary placeholder:text-text-muted mb-4"
              autoFocus
            />
            <div className="text-xs text-text-tertiary mb-4">
              <p className="font-medium mb-1">{t('currentFilters')}:</p>
              <p>{getFilterSummary(currentFilters)}</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setIsSaveModalOpen(false)}>
                {t('cancel')}
              </Button>
              <Button variant="primary" onClick={handleSaveSearch} disabled={!newSearchName.trim()}>
                {t('save')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Expanded Panel */}
      {isExpanded && (
        <div className="bg-background-secondary border border-white/5 rounded-2xl p-4 space-y-4">
          {/* Favorite Searches */}
          {favoriteSearches.length > 0 && (
            <div>
              <h4 className="flex items-center gap-2 text-xs font-medium text-gold mb-2">
                <Star className="w-4 h-4 fill-gold" />
                {t('favorites')}
              </h4>
              <div className="space-y-2">
                {favoriteSearches.map((search) => (
                  <SearchItem
                    key={search.id}
                    search={search}
                    isEditing={editingId === search.id}
                    editingName={editingName}
                    onEditNameChange={setEditingName}
                    onLoad={() => handleLoadSearch(search)}
                    onEdit={() => startEditing(search)}
                    onConfirmEdit={() => confirmEditing(search.id)}
                    onCancelEdit={cancelEditing}
                    onDelete={() => deleteSearch(search.id)}
                    onToggleFavorite={() => toggleFavorite(search.id)}
                    getFilterSummary={getFilterSummary}
                    formatDate={formatDate}
                    t={t}
                  />
                ))}
              </div>
            </div>
          )}

          {/* All Saved Searches */}
          {regularSearches.length > 0 && (
            <div>
              <h4 className="flex items-center gap-2 text-xs font-medium text-text-tertiary mb-2">
                <Bookmark className="w-4 h-4" />
                {t('allSaved')}
              </h4>
              <div className="space-y-2">
                {regularSearches.map((search) => (
                  <SearchItem
                    key={search.id}
                    search={search}
                    isEditing={editingId === search.id}
                    editingName={editingName}
                    onEditNameChange={setEditingName}
                    onLoad={() => handleLoadSearch(search)}
                    onEdit={() => startEditing(search)}
                    onConfirmEdit={() => confirmEditing(search.id)}
                    onCancelEdit={cancelEditing}
                    onDelete={() => deleteSearch(search.id)}
                    onToggleFavorite={() => toggleFavorite(search.id)}
                    getFilterSummary={getFilterSummary}
                    formatDate={formatDate}
                    t={t}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div>
              <h4 className="flex items-center gap-2 text-xs font-medium text-text-tertiary mb-2">
                <Clock className="w-4 h-4" />
                {t('recent')}
              </h4>
              <div className="space-y-2">
                {recentSearches.slice(0, 5).map((search) => (
                  <button
                    key={search.id}
                    type="button"
                    onClick={() => handleLoadSearch(search)}
                    className="w-full flex items-center justify-between p-3 bg-background-primary border border-white/5 rounded-lg hover:bg-white/5 transition-colors text-left"
                  >
                    <span className="text-sm text-text-secondary truncate">
                      {getFilterSummary(search.filters as unknown as AuditSearchFilters)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {savedSearches.length === 0 && recentSearches.length === 0 && (
            <div className="text-center py-8">
              <Bookmark className="w-8 h-8 text-text-muted mx-auto mb-2" />
              <p className="text-sm text-text-tertiary">{t('emptyState')}</p>
              <p className="text-xs text-text-muted mt-1">{t('emptyStateHint')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface SearchItemProps {
  search: SavedSearch;
  isEditing: boolean;
  editingName: string;
  onEditNameChange: (name: string) => void;
  onLoad: () => void;
  onEdit: () => void;
  onConfirmEdit: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
  getFilterSummary: (filters: AuditSearchFilters) => string;
  formatDate: (date: Date) => string;
  t: (key: string) => string;
}

function SearchItem({
  search,
  isEditing,
  editingName,
  onEditNameChange,
  onLoad,
  onEdit,
  onConfirmEdit,
  onCancelEdit,
  onDelete,
  onToggleFavorite,
  getFilterSummary,
  formatDate,
  t,
}: SearchItemProps) {
  return (
    <div className="flex items-center gap-2 p-3 bg-background-primary border border-white/5 rounded-lg group">
      <button
        type="button"
        onClick={onToggleFavorite}
        className="flex-shrink-0"
        aria-label={search.isFavorite ? t('unfavorite') : t('favorite')}
      >
        <Star
          className={cn(
            'w-4 h-4 transition-colors',
            search.isFavorite ? 'fill-gold text-gold' : 'text-text-muted hover:text-gold'
          )}
        />
      </button>

      {isEditing ? (
        <input
          type="text"
          value={editingName}
          onChange={(e) => onEditNameChange(e.target.value)}
          className="flex-1 px-2 py-1 bg-background-secondary border border-white/10 rounded text-sm text-text-primary"
          autoFocus
        />
      ) : (
        <button
          type="button"
          onClick={onLoad}
          className="flex-1 text-left min-w-0"
        >
          <p className="text-sm font-medium text-text-primary truncate">{search.name}</p>
          <p className="text-xs text-text-muted truncate">
            {getFilterSummary(search.filters as unknown as AuditSearchFilters)}
          </p>
        </button>
      )}

      <span className="text-[10px] text-text-muted flex-shrink-0">
        {formatDate(search.createdAt)}
      </span>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {isEditing ? (
          <>
            <button
              type="button"
              onClick={onConfirmEdit}
              className="p-1 hover:bg-success/20 rounded text-success"
              aria-label={t('confirmEdit')}
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onCancelEdit}
              className="p-1 hover:bg-white/10 rounded text-text-tertiary"
              aria-label={t('cancelEdit')}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={onEdit}
              className="p-1 hover:bg-white/10 rounded text-text-tertiary"
              aria-label={t('edit')}
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="p-1 hover:bg-red-500/20 rounded text-red-400"
              aria-label={t('delete')}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
