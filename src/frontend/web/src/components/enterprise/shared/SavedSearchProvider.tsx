'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  Search,
  Star,
  StarOff,
  Clock,
  Trash2,
  X,
  Save,
  ChevronDown,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface SearchFilter {
  id: string;
  name: string;
  filters: Record<string, unknown>;
  isFavorite: boolean;
  createdAt: Date;
  lastUsedAt: Date;
}

interface SavedSearchContextType {
  searches: SearchFilter[];
  recentSearches: SearchFilter[];
  favoriteSearches: SearchFilter[];
  saveSearch: (name: string, filters: Record<string, unknown>) => void;
  deleteSearch: (id: string) => void;
  toggleFavorite: (id: string) => void;
  applySearch: (id: string) => Record<string, unknown> | null;
  updateLastUsed: (id: string) => void;
  currentScope: string;
  setCurrentScope: (scope: string) => void;
}

const SavedSearchContext = createContext<SavedSearchContextType | undefined>(undefined);

export function useSavedSearch() {
  const context = useContext(SavedSearchContext);
  if (!context) {
    throw new Error('useSavedSearch must be used within SavedSearchProvider');
  }
  return context;
}

const STORAGE_KEY = 'enterprise-saved-searches';

interface SavedSearchProviderProps {
  children: React.ReactNode;
  scope?: string;
}

export function SavedSearchProvider({
  children,
  scope = 'default',
}: SavedSearchProviderProps) {
  const [searches, setSearches] = useState<SearchFilter[]>([]);
  const [currentScope, setCurrentScope] = useState(scope);

  // Load searches from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          // Convert date strings back to Date objects
          const withDates = parsed.map((s: SearchFilter) => ({
            ...s,
            createdAt: new Date(s.createdAt),
            lastUsedAt: new Date(s.lastUsedAt),
          }));
          setSearches(withDates);
        }
      } catch (error) {
        console.error('Failed to load saved searches:', error);
      }
    }
  }, []);

  // Save to localStorage whenever searches change
  useEffect(() => {
    if (typeof window !== 'undefined' && searches.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(searches));
      } catch (error) {
        console.error('Failed to save searches:', error);
      }
    }
  }, [searches]);

  const scopedSearches = searches.filter((s) => s.id.startsWith(`${currentScope}:`));

  const recentSearches = [...scopedSearches]
    .sort((a, b) => b.lastUsedAt.getTime() - a.lastUsedAt.getTime())
    .slice(0, 5);

  const favoriteSearches = scopedSearches.filter((s) => s.isFavorite);

  const saveSearch = useCallback(
    (name: string, filters: Record<string, unknown>) => {
      const newSearch: SearchFilter = {
        id: `${currentScope}:${Date.now()}`,
        name,
        filters,
        isFavorite: false,
        createdAt: new Date(),
        lastUsedAt: new Date(),
      };
      setSearches((prev) => [...prev, newSearch]);
    },
    [currentScope]
  );

  const deleteSearch = useCallback((id: string) => {
    setSearches((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setSearches((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isFavorite: !s.isFavorite } : s))
    );
  }, []);

  const applySearch = useCallback(
    (id: string): Record<string, unknown> | null => {
      const search = searches.find((s) => s.id === id);
      if (search) {
        return search.filters;
      }
      return null;
    },
    [searches]
  );

  const updateLastUsed = useCallback((id: string) => {
    setSearches((prev) =>
      prev.map((s) => (s.id === id ? { ...s, lastUsedAt: new Date() } : s))
    );
  }, []);

  return (
    <SavedSearchContext.Provider
      value={{
        searches: scopedSearches,
        recentSearches,
        favoriteSearches,
        saveSearch,
        deleteSearch,
        toggleFavorite,
        applySearch,
        updateLastUsed,
        currentScope,
        setCurrentScope,
      }}
    >
      {children}
    </SavedSearchContext.Provider>
  );
}

interface SavedSearchSelectorProps {
  onApply: (filters: Record<string, unknown>) => void;
  currentFilters?: Record<string, unknown>;
  className?: string;
}

export function SavedSearchSelector({
  onApply,
  currentFilters,
  className,
}: SavedSearchSelectorProps) {
  const t = useTranslations('enterprise.savedSearch');
  const {
    recentSearches,
    favoriteSearches,
    saveSearch,
    deleteSearch,
    toggleFavorite,
    applySearch,
    updateLastUsed,
  } = useSavedSearch();

  const [isOpen, setIsOpen] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState('');

  const handleApply = (id: string) => {
    const filters = applySearch(id);
    if (filters) {
      updateLastUsed(id);
      onApply(filters);
      setIsOpen(false);
    }
  };

  const handleSave = () => {
    if (saveName.trim() && currentFilters) {
      saveSearch(saveName.trim(), currentFilters);
      setSaveName('');
      setIsSaveDialogOpen(false);
    }
  };

  const hasFilters = currentFilters && Object.keys(currentFilters).length > 0;

  return (
    <div className={cn('relative', className)}>
      <div className="flex items-center gap-2">
        {/* Saved searches dropdown */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="gap-2"
          aria-expanded={isOpen}
          aria-haspopup="menu"
        >
          <Filter className="h-4 w-4" aria-hidden="true" />
          {t('button')}
          <ChevronDown
            className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')}
            aria-hidden="true"
          />
        </Button>

        {/* Save current search button */}
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSaveDialogOpen(true)}
            className="gap-2"
            aria-label={t('saveCurrentSearch')}
          >
            <Save className="h-4 w-4" aria-hidden="true" />
          </Button>
        )}
      </div>

      {/* Dropdown menu */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div
            className="absolute top-full left-0 mt-2 w-72 bg-background-secondary border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden"
            role="menu"
          >
            {/* Favorites */}
            {favoriteSearches.length > 0 && (
              <div className="p-2 border-b border-white/10">
                <div className="px-2 py-1 text-xs font-semibold text-foreground-tertiary uppercase tracking-wider flex items-center gap-2">
                  <Star className="h-3 w-3 text-gold" aria-hidden="true" />
                  {t('favorites')}
                </div>
                {favoriteSearches.map((search) => (
                  <SearchItem
                    key={search.id}
                    search={search}
                    onApply={() => handleApply(search.id)}
                    onToggleFavorite={() => toggleFavorite(search.id)}
                    onDelete={() => deleteSearch(search.id)}
                  />
                ))}
              </div>
            )}

            {/* Recent */}
            {recentSearches.length > 0 && (
              <div className="p-2">
                <div className="px-2 py-1 text-xs font-semibold text-foreground-tertiary uppercase tracking-wider flex items-center gap-2">
                  <Clock className="h-3 w-3" aria-hidden="true" />
                  {t('recent')}
                </div>
                {recentSearches.map((search) => (
                  <SearchItem
                    key={search.id}
                    search={search}
                    onApply={() => handleApply(search.id)}
                    onToggleFavorite={() => toggleFavorite(search.id)}
                    onDelete={() => deleteSearch(search.id)}
                  />
                ))}
              </div>
            )}

            {/* Empty state */}
            {favoriteSearches.length === 0 && recentSearches.length === 0 && (
              <div className="p-6 text-center">
                <Search
                  className="h-8 w-8 text-foreground-tertiary mx-auto mb-2"
                  aria-hidden="true"
                />
                <p className="text-sm text-foreground-secondary">{t('empty')}</p>
                <p className="text-xs text-foreground-tertiary mt-1">{t('emptyHint')}</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Save dialog */}
      {isSaveDialogOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setIsSaveDialogOpen(false)}
        >
          <div
            className="bg-background-secondary border border-white/10 rounded-xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="font-semibold">{t('saveDialog.title')}</h3>
              <button
                onClick={() => setIsSaveDialogOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/5"
                aria-label={t('close')}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <div className="p-4">
              <label className="block text-sm font-medium mb-2">
                {t('saveDialog.nameLabel')}
              </label>
              <input
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder={t('saveDialog.namePlaceholder')}
                className="w-full px-3 py-2 bg-background-tertiary border border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-hinomaru/50"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSave();
                  }
                }}
              />
            </div>
            <div className="flex justify-end gap-2 p-4 bg-background-tertiary/50 border-t border-white/10">
              <Button variant="ghost" size="sm" onClick={() => setIsSaveDialogOpen(false)}>
                {t('saveDialog.cancel')}
              </Button>
              <Button size="sm" onClick={handleSave} disabled={!saveName.trim()}>
                {t('saveDialog.save')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface SearchItemProps {
  search: SearchFilter;
  onApply: () => void;
  onToggleFavorite: () => void;
  onDelete: () => void;
}

function SearchItem({ search, onApply, onToggleFavorite, onDelete }: SearchItemProps) {
  return (
    <div className="group flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-white/5">
      <button
        onClick={onApply}
        className="flex-1 text-left text-sm font-medium truncate"
      >
        {search.name}
      </button>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onToggleFavorite}
          className="p-1 rounded hover:bg-white/10"
          aria-label={search.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          {search.isFavorite ? (
            <Star className="h-3.5 w-3.5 text-gold fill-gold" aria-hidden="true" />
          ) : (
            <StarOff className="h-3.5 w-3.5 text-foreground-tertiary" aria-hidden="true" />
          )}
        </button>
        <button
          onClick={onDelete}
          className="p-1 rounded hover:bg-danger/20"
          aria-label="Delete search"
        >
          <Trash2 className="h-3.5 w-3.5 text-foreground-tertiary hover:text-danger" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export default SavedSearchProvider;
