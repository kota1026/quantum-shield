'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  total,
  pageSize,
  onPageChange,
}: PaginationProps) {
  const t = useTranslations('enterprise.transactions.pagination');

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, total);

  // Generate page numbers to show
  const getPageNumbers = (): (number | 'ellipsis')[] => {
    const pages: (number | 'ellipsis')[] = [];

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (currentPage > 3) {
        pages.push('ellipsis');
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('ellipsis');
      }

      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div
      className="flex items-center justify-between px-6 py-4 border-t border-white/5"
      role="navigation"
      aria-label={t('ariaLabel')}
    >
      <span className="text-sm text-muted-foreground">
        {t('showing', { start, end, total })}
      </span>

      <div className="flex items-center gap-2">
        {/* Previous */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={cn(
            'flex items-center gap-1 px-3 py-2 text-sm border rounded-lg transition-colors',
            'bg-background-secondary border-white/10',
            currentPage === 1
              ? 'opacity-50 cursor-not-allowed text-muted-foreground'
              : 'text-muted-foreground hover:border-hinomaru hover:text-hinomaru-400'
          )}
          aria-label={t('previous')}
        >
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          {t('previous')}
        </button>

        {/* Page numbers */}
        {getPageNumbers().map((page, index) =>
          page === 'ellipsis' ? (
            <span
              key={`ellipsis-${index}`}
              className="px-2 text-muted-foreground"
              aria-hidden="true"
            >
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={cn(
                'px-3 py-2 text-sm border rounded-lg transition-colors',
                page === currentPage
                  ? 'bg-hinomaru border-hinomaru text-white'
                  : 'bg-background-secondary border-white/10 text-muted-foreground hover:border-hinomaru hover:text-hinomaru-400'
              )}
              aria-current={page === currentPage ? 'page' : undefined}
              aria-label={t('page', { page })}
            >
              {page}
            </button>
          )
        )}

        {/* Next */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={cn(
            'flex items-center gap-1 px-3 py-2 text-sm border rounded-lg transition-colors',
            'bg-background-secondary border-white/10',
            currentPage === totalPages
              ? 'opacity-50 cursor-not-allowed text-muted-foreground'
              : 'text-muted-foreground hover:border-hinomaru hover:text-hinomaru-400'
          )}
          aria-label={t('next')}
        >
          {t('next')}
          <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
