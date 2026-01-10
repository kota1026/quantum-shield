import * as React from 'react';
import {
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';

import { cn } from '../lib/utils';
import { Badge } from './badge';
import { Button } from './button';

export type TransactionState =
  | 'pending'
  | 'confirming'
  | 'time_lock'
  | 'ready'
  | 'completed'
  | 'failed'
  | 'challenged';

export interface TransactionStatusProps {
  state: TransactionState;
  /** Transaction hash */
  txHash?: string;
  /** Explorer URL */
  explorerUrl?: string;
  /** Error message for failed state */
  errorMessage?: string;
  /** Number of confirmations */
  confirmations?: number;
  /** Required confirmations */
  requiredConfirmations?: number;
  className?: string;
}

const stateConfig: Record<
  TransactionState,
  {
    label: string;
    icon: typeof Clock;
    variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
  }
> = {
  pending: {
    label: 'Pending',
    icon: Loader2,
    variant: 'secondary',
  },
  confirming: {
    label: 'Confirming',
    icon: Loader2,
    variant: 'secondary',
  },
  time_lock: {
    label: 'Time Lock',
    icon: Clock,
    variant: 'warning',
  },
  ready: {
    label: 'Ready',
    icon: CheckCircle,
    variant: 'success',
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle,
    variant: 'success',
  },
  failed: {
    label: 'Failed',
    icon: XCircle,
    variant: 'destructive',
  },
  challenged: {
    label: 'Challenged',
    icon: AlertTriangle,
    variant: 'warning',
  },
};

function TransactionStatus({
  state,
  txHash,
  explorerUrl,
  errorMessage,
  confirmations,
  requiredConfirmations,
  className,
}: TransactionStatusProps) {
  const config = stateConfig[state];
  const Icon = config.icon;
  const isAnimated = state === 'pending' || state === 'confirming';

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <Badge variant={config.variant}>
          <Icon
            className={cn('mr-1 h-3 w-3', isAnimated && 'animate-spin')}
          />
          {config.label}
        </Badge>

        {txHash && explorerUrl && (
          <Button variant="ghost" size="sm" asChild>
            <a
              href={`${explorerUrl}/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="gap-1"
            >
              View TX
              <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
        )}
      </div>

      {state === 'confirming' &&
        confirmations !== undefined &&
        requiredConfirmations !== undefined && (
          <p className="text-xs text-muted-foreground">
            {confirmations} / {requiredConfirmations} confirmations
          </p>
        )}

      {state === 'failed' && errorMessage && (
        <p className="text-xs text-destructive">{errorMessage}</p>
      )}

      {state === 'challenged' && (
        <p className="text-xs text-qs-warning-700">
          This transaction has been challenged. Defense period in progress.
        </p>
      )}
    </div>
  );
}

export { TransactionStatus };
