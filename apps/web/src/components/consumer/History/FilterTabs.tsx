'use client';

import { useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Lock, Unlock, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type FilterType = 'all' | 'lock' | 'unlock' | 'pending' | 'emergency';

interface FilterTabsProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  className?: string;
}

const FILTERS: { type: FilterType; icon?: React.ReactNode }[] = [
  { type: 'all' },
  { type: 'lock', icon: <Lock className="w-3.5 h-3.5" aria-hidden="true" /> },
  { type: 'unlock', icon: <Unlock className="w-3.5 h-3.5" aria-hidden="true" /> },
  { type: 'pending', icon: <Clock className="w-3.5 h-3.5" aria-hidden="true" /> },
  { type: 'emergency', icon: <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" /> },
];

export function FilterTabs({
  activeFilter,
  onFilterChange,
  className,
}: FilterTabsProps) {
  const t = useTranslations('consumer.history.filter');
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, currentIndex: number) => {
      let newIndex = currentIndex;

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        newIndex = currentIndex === FILTERS.length - 1 ? 0 : currentIndex + 1;
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        newIndex = currentIndex === 0 ? FILTERS.length - 1 : currentIndex - 1;
      } else if (e.key === 'Home') {
        e.preventDefault();
        newIndex = 0;
      } else if (e.key === 'End') {
        e.preventDefault();
        newIndex = FILTERS.length - 1;
      } else {
        return;
      }

      tabsRef.current[newIndex]?.focus();
      onFilterChange(FILTERS[newIndex].type);
    },
    [onFilterChange]
  );

  return (
    <div
      className={cn(
        'flex gap-2 overflow-x-auto pb-2 scrollbar-hide',
        className
      )}
      role="tablist"
      aria-label="Filter transactions"
    >
      {FILTERS.map(({ type, icon }, index) => {
        const isActive = activeFilter === type;
        return (
          <button
            key={type}
            ref={(el) => { tabsRef.current[index] = el; }}
            role="tab"
            aria-selected={isActive}
            aria-controls="history-list"
            tabIndex={isActive ? 0 : -1}
            onClick={() => onFilterChange(type)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5',
              'rounded-full text-sm font-medium whitespace-nowrap',
              'border-2 transition-all',
              'focus:outline-none focus:ring-2 focus:ring-hinomaru/50 focus:ring-offset-2 focus:ring-offset-background',
              isActive
                ? 'bg-hinomaru/10 border-hinomaru text-hinomaru shadow-[0_0_8px_rgba(188,0,45,0.12)]'
                : 'bg-surface-secondary border-transparent text-foreground-secondary hover:border-border hover:text-foreground'
            )}
          >
            {icon}
            {t(type)}
          </button>
        );
      })}
    </div>
  );
}

export default FilterTabs;
