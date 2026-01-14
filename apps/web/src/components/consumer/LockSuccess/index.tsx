'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Check, ExternalLink, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

// Demo data
const DEMO_LOCK_AMOUNT = '5.00 ETH';
const DEMO_STATUS = 'Locked';
const DEMO_DATE = '2026-01-07 12:34:56';
const DEMO_TX_HASH = '0x7a3f...8a0b';
const DEMO_TX_URL = 'https://sepolia.etherscan.io/tx/0x7a3f9c2d';
const DEMO_GAS_FEE = '0.0025 ETH';

const CONFETTI_COLORS = ['#bc002d', '#c9a962', '#00c896', '#ffffff', '#e8334d'];

export function LockSuccess() {
  const t = useTranslations('consumer.lockSuccess');
  const confettiRef = useRef<HTMLDivElement>(null);

  // Generate confetti on mount
  useEffect(() => {
    if (!confettiRef.current) return;

    const container = confettiRef.current;
    const pieces: HTMLDivElement[] = [];

    for (let i = 0; i < 50; i++) {
      const piece = document.createElement('div');
      piece.className = 'absolute w-2.5 h-2.5 opacity-0';
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.backgroundColor =
        CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
      piece.style.animationDelay = `${Math.random() * 2}s`;
      piece.style.animation = 'confetti-fall 3s ease-out forwards';
      container.appendChild(piece);
      pieces.push(piece);
    }

    return () => {
      pieces.forEach((piece) => piece.remove());
    };
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      {/* Confetti animation styles */}
      <style jsx global>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(-100px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>

      {/* Background Glow - Success color */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        aria-hidden="true"
      >
        <div
          className={cn(
            'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
            'w-[600px] h-[600px]',
            'bg-[radial-gradient(circle,rgba(0,200,150,0.12),transparent_60%)]',
            'opacity-50'
          )}
        />
      </div>

      {/* Confetti Container */}
      <div
        ref={confettiRef}
        className="fixed inset-0 pointer-events-none z-50"
        aria-hidden="true"
      />

      {/* Main Content */}
      <div className="relative z-10 text-center px-6 max-w-[440px] w-full">
        {/* Success Icon */}
        <div
          className={cn(
            'w-24 h-24 mx-auto mb-6',
            'bg-success/10 rounded-full',
            'flex items-center justify-center',
            'animate-[pop_0.5s_ease-out]'
          )}
          role="img"
          aria-label={t('successIconLabel')}
        >
          <Check className="w-12 h-12 text-success" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-success mb-2">
          {t('title')}
        </h1>
        <p className="text-[15px] text-foreground-secondary mb-8">
          {t('subtitle')}
        </p>

        {/* Result Card */}
        <div
          className={cn(
            'bg-card border border-border-subtle rounded-qs-xl p-6 mb-6',
            'text-left'
          )}
        >
          <div className="flex justify-between items-center py-3 border-b border-border-subtle">
            <span className="text-xs text-foreground-tertiary">
              {t('result.amount')}
            </span>
            <span className="text-lg font-medium text-hinomaru-light">
              {DEMO_LOCK_AMOUNT}
            </span>
          </div>

          <div className="flex justify-between items-center py-3 border-b border-border-subtle">
            <span className="text-xs text-foreground-tertiary">
              {t('result.status')}
            </span>
            <span className="text-sm font-medium text-success flex items-center gap-1.5">
              <span aria-hidden="true">🔒</span>
              {DEMO_STATUS}
            </span>
          </div>

          <div className="flex justify-between items-center py-3 border-b border-border-subtle">
            <span className="text-xs text-foreground-tertiary">
              {t('result.date')}
            </span>
            <span className="text-sm font-medium font-mono">
              {DEMO_DATE}
            </span>
          </div>

          <div className="flex justify-between items-center py-3 border-b border-border-subtle">
            <span className="text-xs text-foreground-tertiary">
              {t('result.txHash')}
            </span>
            <a
              href={DEMO_TX_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono text-gold hover:underline flex items-center gap-1"
            >
              {DEMO_TX_HASH}
              <ExternalLink className="w-3 h-3" aria-hidden="true" />
            </a>
          </div>

          <div className="flex justify-between items-center py-3">
            <span className="text-xs text-foreground-tertiary">
              {t('result.gasFee')}
            </span>
            <span className="text-sm font-medium">
              {DEMO_GAS_FEE}
            </span>
          </div>
        </div>

        {/* Info Box */}
        <div
          className={cn(
            'flex items-start gap-3 p-4 mb-6',
            'bg-gold/10 border border-gold rounded-qs-lg',
            'text-left'
          )}
        >
          <Info className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-sm text-foreground-secondary leading-relaxed">
            {t('info')}
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <Link
            href="/consumer/dashboard"
            className={cn(
              'flex-1 py-4 rounded-qs-lg text-center',
              'bg-gradient-hinomaru text-white font-semibold text-sm',
              'hover:shadow-glow-hinomaru hover:-translate-y-0.5',
              'transition-all'
            )}
          >
            {t('buttons.dashboard')}
          </Link>
          <Link
            href="/consumer/history"
            className={cn(
              'flex-1 py-4 rounded-qs-lg text-center',
              'bg-surface-secondary border border-border text-foreground-secondary font-semibold text-sm',
              'hover:border-border-emphasis hover:text-foreground',
              'transition-all'
            )}
          >
            {t('buttons.history')}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default LockSuccess;
