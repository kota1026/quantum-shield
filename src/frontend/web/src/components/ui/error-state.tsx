'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface ErrorStateProps {
  title: string;
  description?: string;
  onRetry?: () => void;
  retryText?: string;
  className?: string;
}

export function ErrorState({
  title,
  description,
  onRetry,
  retryText = 'Retry',
  className,
}: ErrorStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
      <div className="rounded-full bg-danger/10 p-4">
        <AlertTriangle className="h-8 w-8 text-danger" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-foreground-secondary max-w-md">{description}</p>
      )}
      {onRetry && (
        <Button variant="outline" className="mt-4" onClick={onRetry}>
          <RefreshCw className="mr-2 h-4 w-4" />
          {retryText}
        </Button>
      )}
    </div>
  );
}
