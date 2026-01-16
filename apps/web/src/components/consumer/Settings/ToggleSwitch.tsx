'use client';

import { cn } from '@/lib/utils';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

export function ToggleSwitch({
  checked,
  onChange,
  disabled = false,
  id,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
}: ToggleSwitchProps) {
  return (
    <label
      className={cn(
        'relative inline-block w-12 h-[26px]',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        className="sr-only peer"
      />
      <span
        className={cn(
          'absolute inset-0 rounded-full cursor-pointer transition-all duration-300',
          'bg-border-emphasis',
          'peer-checked:bg-hinomaru',
          'peer-focus-visible:ring-2 peer-focus-visible:ring-hinomaru/50 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background',
          disabled && 'cursor-not-allowed'
        )}
      >
        <span
          className={cn(
            'absolute w-5 h-5 left-[3px] bottom-[3px]',
            'bg-white rounded-full transition-transform duration-300',
            'peer-checked:translate-x-[22px]',
            checked && 'translate-x-[22px]'
          )}
        />
      </span>
    </label>
  );
}

export default ToggleSwitch;
