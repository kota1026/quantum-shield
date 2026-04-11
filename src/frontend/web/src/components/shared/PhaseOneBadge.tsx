'use client';

/**
 * PhaseOneBadge — Honest disclosure banner for Phase 1 operational mode.
 *
 * Displayed on flows that have known Phase 1 bridges:
 * - L1 Vault uses `_verifySimplified` (not full FIPS 205 on-chain verification)
 * - Prover signing is AI-assisted (Claude confidence scoring + real SLH-DSA)
 * - VRF may fall back to block.prevrandao when Chainlink contract unset
 * - Emergency bond is calculated but not collected on-chain
 *
 * Rationale: rather than silently hiding known Phase 1 limitations from users,
 * we show them explicitly so expectations match implementation. See:
 * - docs/ACTUAL_STATE.md §"Phase 1 Honesty Disclosure"
 * - docs/WHITEPAPER.md §2.1 Phase 1 disclosure
 *
 * Accessibility: role="status", aria-live="polite", 44px tap target for dismiss.
 */

import { useTranslations } from 'next-intl';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type PhaseOneScope =
  | 'sphincs-verify'   // L1 _verifySimplified
  | 'ai-prover'        // AI-assisted Prover signing
  | 'vrf-fallback'     // block.prevrandao fallback
  | 'bond-calc-only';  // Emergency bond not collected

interface PhaseOneBadgeProps {
  /** Which Phase 1 bridge is relevant to this screen */
  scope: PhaseOneScope;
  /** Optional additional class names */
  className?: string;
  /** Test id for Playwright */
  'data-testid'?: string;
}

/**
 * Displays a small honest-disclosure banner telling users which Phase 1 bridge
 * is active on the current screen. Always visible (never dismissible) so the
 * disclosure cannot be hidden from audit.
 */
export function PhaseOneBadge({
  scope,
  className,
  'data-testid': testId = 'phase-one-badge',
}: PhaseOneBadgeProps) {
  const t = useTranslations('common.phaseOne');

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex items-start gap-2 rounded-md border border-amber-400/40 bg-amber-50/60 px-3 py-2 text-xs text-amber-900',
        'dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-200',
        className,
      )}
      data-testid={testId}
      data-scope={scope}
    >
      <AlertTriangle
        className="mt-0.5 h-4 w-4 flex-shrink-0"
        aria-hidden="true"
      />
      <div className="min-w-0">
        <p className="font-semibold">{t('title')}</p>
        <p className="mt-0.5">{t(`scope.${scope}`)}</p>
        <p className="mt-0.5">
          <a
            href="https://github.com/kota1026/quantum-shield/blob/main/docs/ACTUAL_STATE.md#%EF%B8%8F-phase-1-honesty-disclosure-2026-04-11-%E8%BF%BD%E8%A8%98"
            className="underline underline-offset-2 hover:text-amber-700 dark:hover:text-amber-100"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('learnMore')}
          </a>
        </p>
      </div>
    </div>
  );
}
