'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

export interface TokenVolume {
  id: string;
  symbol: string;
  name: string;
  volume: string;
  percentage: number;
  change: string;
  isPositive: boolean;
}

interface TokenBreakdownProps {
  tokens: TokenVolume[];
  className?: string;
}

export function TokenBreakdown({ tokens, className }: TokenBreakdownProps) {
  const t = useTranslations('enterprise.volume.tokenBreakdown');

  return (
    <section
      className={cn(
        'bg-background-secondary border border-white/5 rounded-xl overflow-hidden',
        className
      )}
      aria-labelledby="token-breakdown-title"
    >
      {/* Card Header */}
      <div className="px-6 py-4 border-b border-white/5">
        <h2 id="token-breakdown-title" className="text-base font-semibold text-foreground">
          {t('title')}
        </h2>
      </div>

      {/* Card Body - Token List */}
      <div className="p-6">
        <ul className="space-y-4" aria-label={t('ariaLabel')}>
          {tokens.map((token) => (
            <li
              key={token.id}
              className="flex items-center gap-4 p-4 bg-background rounded-lg"
            >
              {/* Token Icon */}
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold',
                  token.symbol === 'ETH' && 'bg-[#627EEA]/20 text-[#627EEA]',
                  token.symbol === 'WBTC' && 'bg-[#F7931A]/20 text-[#F7931A]',
                  token.symbol === 'USDC' && 'bg-[#2775CA]/20 text-[#2775CA]',
                  !['ETH', 'WBTC', 'USDC'].includes(token.symbol) && 'bg-gold/20 text-gold'
                )}
                aria-hidden="true"
              >
                {token.symbol.substring(0, 2)}
              </div>

              {/* Token Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">{token.symbol}</span>
                  <span className="text-sm text-muted-foreground">{token.name}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div
                    className="h-1.5 bg-gold/30 rounded-full flex-1 max-w-[120px]"
                    role="progressbar"
                    aria-valuenow={token.percentage}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={t('volumeShare', { percent: token.percentage })}
                  >
                    <div
                      className="h-full bg-gold rounded-full"
                      style={{ width: `${token.percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {t('percentOfTotal', { percent: token.percentage })}
                  </span>
                </div>
              </div>

              {/* Volume & Change */}
              <div className="text-right">
                <div className="font-semibold text-foreground">{token.volume}</div>
                <div
                  className={cn(
                    'text-sm',
                    token.isPositive ? 'text-success' : 'text-destructive'
                  )}
                >
                  {token.isPositive ? '+' : ''}{token.change}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
