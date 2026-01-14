import * as React from 'react';
import { Clock, AlertTriangle, CheckCircle } from 'lucide-react';

import { cn, formatDuration } from '../lib/utils';
import { Progress } from './progress';
import { Badge } from './badge';

export interface TimeLockCountdownProps {
  /** Target unlock time in Unix timestamp (seconds) */
  unlockTime: number;
  /** Start time for calculating progress (optional) */
  startTime?: number;
  /** Type of time lock */
  type?: 'normal' | 'emergency';
  /** Custom label */
  label?: string;
  /** Called when countdown reaches zero */
  onComplete?: () => void;
  className?: string;
}

function TimeLockCountdown({
  unlockTime,
  startTime,
  type = 'normal',
  label,
  onComplete,
  className,
}: TimeLockCountdownProps) {
  const [timeLeft, setTimeLeft] = React.useState(0);
  const [isComplete, setIsComplete] = React.useState(false);

  React.useEffect(() => {
    const calculateTimeLeft = () => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = unlockTime - now;
      return Math.max(0, remaining);
    };

    setTimeLeft(calculateTimeLeft());

    const interval = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);

      if (remaining === 0 && !isComplete) {
        setIsComplete(true);
        onComplete?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [unlockTime, isComplete, onComplete]);

  const totalDuration = startTime
    ? unlockTime - startTime
    : type === 'emergency'
      ? 7 * 24 * 60 * 60
      : 24 * 60 * 60;
  const progress = startTime
    ? ((totalDuration - timeLeft) / totalDuration) * 100
    : 0;

  const typeLabel = type === 'emergency' ? 'Emergency' : 'Normal';
  const displayLabel = label || `${typeLabel} Time Lock`;

  if (isComplete) {
    return (
      <div className={cn('space-y-2', className)}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            {displayLabel}
          </span>
          <Badge variant="success">
            <CheckCircle className="mr-1 h-3 w-3" />
            Ready
          </Badge>
        </div>
        <p className="text-sm text-qs-success-500">Time lock complete. Ready to execute.</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          {displayLabel}
        </span>
        <Badge variant={type === 'emergency' ? 'warning' : 'secondary'}>
          {type === 'emergency' ? (
            <AlertTriangle className="mr-1 h-3 w-3" />
          ) : (
            <Clock className="mr-1 h-3 w-3" />
          )}
          {formatDuration(timeLeft)}
        </Badge>
      </div>

      {startTime && <Progress value={progress} className="h-2" />}

      <p className="text-xs text-muted-foreground">
        Unlock available at{' '}
        {new Date(unlockTime * 1000).toLocaleString()}
      </p>
    </div>
  );
}

export { TimeLockCountdown };
