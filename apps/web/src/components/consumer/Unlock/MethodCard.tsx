'use client';

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Lock, AlertTriangle, HelpCircle, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InlineTooltipProps {
  content: string;
  children: React.ReactNode;
}

function InlineTooltip({ content, children }: InlineTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(true);
  };

  const hideTooltip = () => {
    timeoutRef.current = setTimeout(() => setIsVisible(false), 150);
  };

  return (
    <span
      className="relative inline-flex items-center gap-1 cursor-help"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      <HelpCircle className="w-3 h-3 text-foreground-tertiary" aria-hidden="true" />
      {isVisible && (
        <span
          role="tooltip"
          className={cn(
            'absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2',
            'px-4 py-2.5 w-max',
            'text-sm leading-relaxed text-foreground bg-surface-secondary',
            'border border-border rounded-qs shadow-lg',
            'whitespace-normal text-left'
          )}
          style={{ maxWidth: 'min(400px, calc(100vw - 2rem))' }}
        >
          {content}
          <span
            className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-border"
            aria-hidden="true"
          />
        </span>
      )}
    </span>
  );
}

type MethodType = 'normal' | 'emergency';

interface MethodCardProps {
  type: MethodType;
  selected: boolean;
  onSelect: () => void;
  onHelpClick?: () => void;
}

export function MethodCard({ type, selected, onSelect, onHelpClick }: MethodCardProps) {
  const t = useTranslations('consumer.unlock.selectMethod');
  const tTimeLock = useTranslations('consumer.unlock.timeLock');

  const isEmergency = type === 'emergency';

  const details = isEmergency
    ? [
        { label: t('emergency.waitTime'), value: t('emergency.waitTimeValue'), warning: true },
        { label: t('emergency.required'), value: t('emergency.requiredValue') },
        { label: t('emergency.bond'), value: t('emergency.bondValue'), warning: true, tooltip: t('emergency.bondTooltip') },
      ]
    : [
        { label: t('normal.waitTime'), value: t('normal.waitTimeValue') },
        { label: t('normal.required'), value: t('normal.requiredValue'), tooltip: t('normal.dilithiumTooltip') },
        { label: t('normal.fee'), value: t('normal.feeValue') },
      ];

  return (
    <div
      role="radio"
      aria-checked={selected}
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        'p-6 rounded-qs-xl border cursor-pointer transition-all',
        'bg-surface hover:border-border-secondary',
        selected ? 'border-hinomaru' : 'border-border'
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          'text-3xl mb-4',
          isEmergency ? 'text-warning' : 'text-foreground'
        )}
      >
        {isEmergency ? (
          <AlertTriangle className="w-8 h-8" />
        ) : (
          <Lock className="w-8 h-8" />
        )}
      </div>

      {/* Title & Description */}
      <h3 className="text-base font-semibold text-foreground mb-2">
        {isEmergency ? t('emergency.title') : t('normal.title')}
      </h3>
      <p className="text-sm text-foreground-secondary leading-relaxed mb-4">
        {isEmergency ? t('emergency.description') : t('normal.description')}
      </p>

      {/* Details */}
      <div className="space-y-2">
        {details.map((detail, index) => (
          <div key={index} className="flex justify-between text-xs">
            <span className="text-foreground-tertiary">{detail.label}</span>
            {detail.tooltip ? (
              <InlineTooltip content={detail.tooltip}>
                <span
                  className={cn(
                    'font-medium',
                    detail.warning ? 'text-warning' : 'text-foreground'
                  )}
                >
                  {detail.value}
                </span>
              </InlineTooltip>
            ) : (
              <span
                className={cn(
                  'font-medium',
                  detail.warning ? 'text-warning' : 'text-foreground'
                )}
              >
                {detail.value}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Time Lock Help (Normal method only) */}
      {!isEmergency && onHelpClick && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onHelpClick();
            }}
            className={cn(
              'mt-4 flex items-center gap-1.5',
              'text-xs text-gold hover:underline'
            )}
          >
            <span
              className={cn(
                'w-3.5 h-3.5 rounded-full',
                'bg-gold/10 border border-gold',
                'flex items-center justify-center',
                'text-[9px] font-semibold text-gold'
              )}
            >
              ?
            </span>
            {tTimeLock('helpLink')}
          </button>

          {/* Short explanation box */}
          <div
            className={cn(
              'mt-3 p-3 rounded-qs',
              'bg-gold/10 border border-gold/30',
              'flex items-start gap-2.5'
            )}
          >
            <Shield className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
            <div className="text-xs text-foreground-secondary leading-relaxed">
              <strong className="text-gold">{tTimeLock('shortExplanation')}</strong>
              <br />
              {tTimeLock('shortExplanationDetail')}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
