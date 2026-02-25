'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

export interface Asset {
  id: string;
  symbol: string;
  name: string;
  value: string;
  percentage: number;
  iconType: 'eth' | 'btc' | 'usdc' | 'default';
}

interface AssetBreakdownProps {
  assets: Asset[];
  className?: string;
}

const ICON_STYLES: Record<string, { bg: string; text: string; icon: string }> = {
  eth: { bg: 'bg-gradient-to-br from-[#627eea] to-[#3c3c3d]', text: 'text-white', icon: 'Ξ' },
  btc: { bg: 'bg-[#f7931a]', text: 'text-white', icon: '₿' },
  usdc: { bg: 'bg-[#2775ca]', text: 'text-white', icon: '$' },
  default: { bg: 'bg-gold/20', text: 'text-gold', icon: '•' },
};

export function AssetBreakdown({ assets, className }: AssetBreakdownProps) {
  const t = useTranslations('enterprise.tvl.assetBreakdown');

  return (
    <div
      className={cn(
        'bg-card border border-white/5 rounded-2xl overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <div className="flex justify-between items-center p-6 border-b border-white/5">
        <h2 className="text-base font-semibold text-foreground">{t('title')}</h2>
      </div>

      {/* Assets Grid */}
      <div className="p-6">
        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
          role="list"
          aria-label={t('ariaLabel')}
        >
          {assets.map((asset) => {
            const iconStyle = ICON_STYLES[asset.iconType] || ICON_STYLES.default;
            return (
              <div
                key={asset.id}
                className="bg-background-secondary rounded-lg p-4"
                role="listitem"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium',
                      iconStyle.bg,
                      iconStyle.text
                    )}
                    aria-hidden="true"
                  >
                    {iconStyle.icon}
                  </div>
                  <span className="text-sm font-medium text-foreground">{asset.name}</span>
                </div>
                <div className="font-mono text-lg font-bold text-foreground">{asset.value}</div>
                <div className="text-xs text-foreground-tertiary">
                  {t('percentOfTotal', { percent: asset.percentage.toFixed(1) })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
