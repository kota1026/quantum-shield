'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  className,
}: PaginationProps) {
  const t = useTranslations('observer.dashboard.pending.pagination');

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (currentPage > 3) {
        pages.push('...');
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('...');
      }

      pages.push(totalPages);
    }

    return pages;
  };

  const pageButtonClasses = cn(
    'px-3 py-2 bg-background-secondary border border-border/30 rounded text-sm',
    'text-foreground-secondary hover:border-border hover:text-foreground transition-colors'
  );

  const activePageClasses = cn(
    'px-3 py-2 rounded text-sm font-medium',
    'bg-hinomaru/10 border border-hinomaru text-hinomaru'
  );

  return (
    <div
      className={cn(
        'flex justify-between items-center px-6 py-4 border-t border-border/30',
        className
      )}
    >
      <div className="text-sm text-foreground-secondary">
        {t('showing', { start: startItem, end: endItem, total: totalItems })}
      </div>

      <div className="flex gap-1" role="navigation" aria-label="Pagination">
        <button
          className={pageButtonClasses}
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label={t('prev')}
        >
          {t('prev')}
        </button>

        {getPageNumbers().map((page, index) =>
          page === '...' ? (
            <span
              key={`ellipsis-${index}`}
              className="px-3 py-2 text-foreground-tertiary"
            >
              ...
            </span>
          ) : (
            <button
              key={page}
              className={currentPage === page ? activePageClasses : pageButtonClasses}
              onClick={() => onPageChange(page as number)}
              aria-label={`Page ${page}`}
              aria-current={currentPage === page ? 'page' : undefined}
            >
              {page}
            </button>
          )
        )}

        <button
          className={pageButtonClasses}
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label={t('next')}
        >
          {t('next')}
        </button>
      </div>
    </div>
  );
}
