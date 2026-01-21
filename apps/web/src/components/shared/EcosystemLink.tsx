'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { HelpCircle, ArrowRight, Shield, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EcosystemLinkProps {
  variant?: 'inline' | 'card' | 'banner' | 'footer';
  className?: string;
}

/**
 * 各アプリのLPから「Quantum Shieldとは？」へ共通でリンクするコンポーネント
 *
 * Usage:
 * - variant="inline": テキストリンク形式（ヘッダーやフッターに）
 * - variant="card": カード形式（サイドバーやセクション内に）
 * - variant="banner": バナー形式（ページ上部に）
 * - variant="footer": フッター専用の控えめなスタイル
 */
export function EcosystemLink({ variant = 'inline', className }: EcosystemLinkProps) {
  const t = useTranslations('common.ecosystemLink');

  if (variant === 'inline') {
    return (
      <Link
        href="/ecosystem"
        className={cn(
          'inline-flex items-center gap-1.5 text-sm text-foreground-tertiary',
          'hover:text-gold transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded',
          className
        )}
      >
        <HelpCircle className="w-4 h-4" aria-hidden="true" />
        <span>{t('title')}</span>
      </Link>
    );
  }

  if (variant === 'card') {
    return (
      <Link
        href="/ecosystem"
        className={cn(
          'group block p-4 rounded-xl border border-border/50 bg-card',
          'hover:border-gold/50 hover:bg-gold/5 transition-all',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          className
        )}
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-hinomaru/10 flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-hinomaru" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm group-hover:text-gold transition-colors">
              {t('title')}
            </div>
            <p className="text-xs text-foreground-tertiary mt-0.5 line-clamp-2">
              {t('description')}
            </p>
          </div>
          <ArrowRight
            className="w-4 h-4 text-foreground-tertiary group-hover:text-gold group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-1"
            aria-hidden="true"
          />
        </div>
      </Link>
    );
  }

  if (variant === 'banner') {
    return (
      <Link
        href="/ecosystem"
        className={cn(
          'block w-full p-4 rounded-xl',
          'bg-gradient-to-r from-hinomaru/10 via-gold/5 to-hinomaru/10',
          'border border-hinomaru/20',
          'hover:border-hinomaru/40 transition-all',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          className
        )}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-hinomaru/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-hinomaru" aria-hidden="true" />
            </div>
            <div>
              <div className="font-semibold text-sm">{t('title')}</div>
              <p className="text-xs text-foreground-secondary">{t('description')}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-sm text-gold font-medium">
            {t('cta')}
            <ExternalLink className="w-4 h-4" aria-hidden="true" />
          </div>
        </div>
      </Link>
    );
  }

  // footer variant
  return (
    <Link
      href="/ecosystem"
      className={cn(
        'inline-flex items-center gap-1 text-xs text-foreground-tertiary',
        'hover:text-foreground-secondary transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded',
        className
      )}
    >
      <span>{t('footerText')}</span>
      <ExternalLink className="w-3 h-3" aria-hidden="true" />
    </Link>
  );
}

export default EcosystemLink;
