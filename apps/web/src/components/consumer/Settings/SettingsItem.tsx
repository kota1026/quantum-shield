'use client';

import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ToggleSwitch } from './ToggleSwitch';

type SettingsItemAction =
  | { type: 'navigate'; href?: string; onClick?: () => void }
  | { type: 'toggle'; checked: boolean; onChange: (checked: boolean) => void }
  | { type: 'value'; value: string; onClick?: () => void };

interface SettingsItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action: SettingsItemAction;
  variant?: 'default' | 'danger';
}

export function SettingsItem({
  icon,
  title,
  description,
  action,
  variant = 'default',
}: SettingsItemProps) {
  const isDanger = variant === 'danger';

  const handleClick = () => {
    if (action.type === 'navigate' && action.onClick) {
      action.onClick();
    } else if (action.type === 'value' && action.onClick) {
      action.onClick();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (
      (action.type === 'navigate' || action.type === 'value') &&
      (e.key === 'Enter' || e.key === ' ')
    ) {
      e.preventDefault();
      handleClick();
    }
  };

  const isInteractive = action.type === 'navigate' || action.type === 'value';

  const itemContent = (
    <>
      {/* Icon */}
      <div
        className={cn(
          'w-10 h-10 flex items-center justify-center rounded-qs text-lg flex-shrink-0',
          isDanger ? 'bg-danger/10 text-danger' : 'bg-surface-secondary'
        )}
        aria-hidden="true"
      >
        {icon}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <h4 className="text-[15px] font-semibold text-foreground mb-0.5">
          {title}
        </h4>
        <p className="text-xs text-foreground-tertiary">{description}</p>
      </div>

      {/* Action */}
      {action.type === 'toggle' && (
        <ToggleSwitch
          checked={action.checked}
          onChange={action.onChange}
          aria-label={title}
        />
      )}

      {action.type === 'value' && (
        <div className="flex items-center gap-2 text-foreground-secondary text-sm">
          <span className={action.value.startsWith('0x') ? 'font-mono' : ''}>
            {action.value}
          </span>
          <ChevronRight
            className="w-4 h-4 text-foreground-tertiary"
            aria-hidden="true"
          />
        </div>
      )}

      {action.type === 'navigate' && (
        <ChevronRight
          className="w-5 h-5 text-foreground-tertiary flex-shrink-0"
          aria-hidden="true"
        />
      )}
    </>
  );

  const baseClasses = cn(
    'flex items-center gap-4 px-6 py-5',
    'border-b border-border last:border-b-0',
    'transition-colors'
  );

  if (isInteractive) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={cn(
          baseClasses,
          'cursor-pointer',
          isDanger
            ? 'hover:bg-danger/5 focus:bg-danger/5'
            : 'hover:bg-surface-elevated focus:bg-surface-elevated',
          'focus:outline-none focus:ring-2 focus:ring-inset',
          isDanger ? 'focus:ring-danger/30' : 'focus:ring-hinomaru/30'
        )}
        aria-label={`${title}: ${description}`}
      >
        {itemContent}
      </div>
    );
  }

  return (
    <div className={baseClasses} aria-label={`${title}: ${description}`}>
      {itemContent}
    </div>
  );
}

export default SettingsItem;
