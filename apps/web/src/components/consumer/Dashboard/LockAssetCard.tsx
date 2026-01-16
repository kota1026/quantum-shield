'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Lock, Shield } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { HinomaryVisual } from './HinomaryVisual';
import { Tooltip } from './Tooltip';

interface LockAssetCardProps {
  balance: number;
  onLock: (amount: number) => void;
  className?: string;
}

export function LockAssetCard({ balance, onLock, className }: LockAssetCardProps) {
  const t = useTranslations('consumer.dashboard.lockCard');
  const [amount, setAmount] = useState('');

  const handleQuickAmount = (percent: number) => {
    const calculatedAmount = (balance * percent / 100).toFixed(2);
    setAmount(calculatedAmount);
  };

  const handleSubmit = () => {
    const numAmount = parseFloat(amount);
    if (!isNaN(numAmount) && numAmount > 0) {
      onLock(numAmount);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only valid decimal numbers
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  return (
    <Card padding="none" className={cn('hover-gradient-border', className)}>
      {/* Header */}
      <div className="flex justify-between items-center p-5 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">{t('title')}</h2>
        <Tooltip content={t('badgeTooltip')}>
          <Badge variant="hinomaru" className="flex items-center gap-1.5 cursor-help">
            <Lock className="w-3 h-3" aria-hidden="true" />
            {t('badge')}
          </Badge>
        </Tooltip>
      </div>

      {/* Body */}
      <div className="p-6">
        {/* Visual */}
        <HinomaryVisual size="md" />

        {/* Input Section */}
        <div className="mt-5">
          <label
            htmlFor="lockAmount"
            className="block text-xs text-foreground-secondary mb-2"
          >
            {t('inputLabel')}
          </label>

          <div
            className={cn(
              'flex items-center gap-3',
              'bg-surface-secondary border border-border rounded-qs-lg',
              'px-4 py-3',
              'focus-within:border-hinomaru focus-within:ring-1 focus-within:ring-hinomaru/30',
              'transition-all'
            )}
          >
            <input
              id="lockAmount"
              type="text"
              inputMode="decimal"
              pattern="[0-9]*\.?[0-9]*"
              value={amount}
              onChange={handleAmountChange}
              placeholder={t('inputPlaceholder')}
              className={cn(
                'flex-1 bg-transparent border-none',
                'text-2xl font-semibold text-foreground',
                'placeholder:text-foreground-muted',
                'outline-none',
                'w-full'
              )}
              aria-describedby="lockAmountHelp"
            />
            <span id="lockAmountHelp" className="sr-only">
              Enter the amount of ETH you want to lock
            </span>
            <div
              className={cn(
                'flex items-center gap-2 px-3 py-1.5',
                'bg-surface-tertiary rounded-qs'
              )}
            >
              <div
                className={cn(
                  'w-6 h-6 rounded-full',
                  'bg-gradient-to-br from-[#627eea] to-[#3c3c3d]',
                  'flex items-center justify-center',
                  'text-xs text-white font-medium'
                )}
                aria-hidden="true"
              >
                Ξ
              </div>
              <span className="font-semibold text-sm">ETH</span>
            </div>
          </div>

          {/* Quick Amount Buttons */}
          <div
            className="flex gap-2 mt-3"
            role="group"
            aria-label="Quick amount selection"
          >
            {[25, 50, 75, 100].map((percent) => (
              <button
                key={percent}
                onClick={() => handleQuickAmount(percent)}
                className={cn(
                  'flex-1 py-2.5 text-sm font-medium',
                  'bg-surface-secondary border border-border rounded-qs',
                  'text-foreground-secondary',
                  'hover:bg-surface-tertiary hover:border-border-secondary hover:text-foreground',
                  'transition-all'
                )}
                aria-label={`Set to ${percent}% of balance`}
              >
                {percent === 100
                  ? t('quickAmounts.max')
                  : t(`quickAmounts.${percent}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Lock Button */}
        <div className="mt-6">
          <Button
            variant="primary"
            fullWidth
            onClick={handleSubmit}
            leftIcon={<Shield className="w-5 h-5" />}
            aria-label={t('lockButtonAriaLabel')}
          >
            {t('lockButton')}
          </Button>
          <p className="text-xs text-foreground-tertiary text-center mt-2 flex items-center justify-center gap-1">
            <span>Dilithium</span>
            <Tooltip content={t('dilithiumTooltip')} />
          </p>
        </div>
      </div>
    </Card>
  );
}
