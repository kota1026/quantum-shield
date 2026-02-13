'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { ChevronDown, ChevronUp, ExternalLink, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PendingUnlock } from '@/lib/api/observer/types';

interface PendingUnlockRowProps {
  unlock: PendingUnlock;
}

export function PendingUnlockRow({ unlock }: PendingUnlockRowProps) {
  const t = useTranslations('observer.dashboard.pending');
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const typeBadgeStyles = {
    normal: 'bg-foreground-tertiary/10 text-foreground-tertiary',
    emergency: 'bg-warning/10 text-warning',
  };

  const statusBadgeStyles = {
    monitoring: 'bg-warning/10 text-warning',
    pending: 'bg-foreground-tertiary/10 text-foreground-tertiary',
    review: 'bg-warning/10 text-warning',
    lowRisk: 'bg-success/10 text-success',
  };

  const getRiskBadgeStyle = (score: number) => {
    if (score >= 70) return 'bg-danger/10 text-danger';
    if (score >= 40) return 'bg-warning/10 text-warning';
    return 'bg-success/10 text-success';
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const showChallengeButton =
    unlock.status === 'monitoring' ||
    unlock.status === 'review' ||
    (unlock.riskScore ?? 0) >= 40;

  return (
    <>
      <tr
        className={cn(
          'border-b border-border/30 cursor-pointer transition-colors',
          isExpanded ? 'bg-background-secondary' : 'hover:bg-background-secondary'
        )}
        onClick={() => setIsExpanded(!isExpanded)}
        role="row"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }
        }}
        aria-expanded={isExpanded}
      >
        <td className="px-4 py-4">
          <div className="flex items-center gap-2">
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-foreground-tertiary" />
            ) : (
              <ChevronDown className="w-4 h-4 text-foreground-tertiary" />
            )}
            <span className="font-mono text-sm text-foreground-secondary">
              {unlock.address}
            </span>
          </div>
        </td>
        <td className="px-4 py-4">
          <span className="font-mono font-semibold text-foreground">
            {unlock.amount}
          </span>
        </td>
        <td className="px-4 py-4">
          <span
            className={cn(
              'inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium',
              typeBadgeStyles[unlock.type]
            )}
          >
            {t(`filters.unlockType.${unlock.type}`)}
          </span>
        </td>
        <td className="px-4 py-4">
          <span className="font-mono text-warning">{unlock.timeRemaining}</span>
        </td>
        <td className="px-4 py-4">
          <span
            className={cn(
              'inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium',
              getRiskBadgeStyle(unlock.riskScore ?? 0)
            )}
          >
            {unlock.riskScore ?? 0}
          </span>
        </td>
        <td className="px-4 py-4">
          <span
            className={cn(
              'inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium',
              statusBadgeStyles[unlock.status]
            )}
          >
            {t(`statuses.${unlock.status}`)}
          </span>
        </td>
        <td className="px-4 py-4">
          {showChallengeButton ? (
            <Link
              href={`/observer/challenge/new?address=${unlock.address}`}
              className={cn(
                'inline-flex items-center px-3 py-1.5 min-h-[44px]',
                'bg-hinomaru text-white rounded text-xs font-medium',
                'hover:bg-hinomaru-400 transition-colors'
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {t('actions.challenge')}
            </Link>
          ) : (
            <button
              className={cn(
                'inline-flex items-center px-3 py-1.5 min-h-[44px]',
                'bg-transparent border border-border rounded text-xs',
                'text-foreground-secondary hover:border-gold hover:text-gold transition-colors'
              )}
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(true);
              }}
            >
              {t('actions.monitor')}
            </button>
          )}
        </td>
      </tr>

      {/* Expanded Detail Row */}
      {isExpanded && (
        <tr className="bg-background-secondary border-b border-border/30">
          <td colSpan={7} className="px-6 py-6">
            <div className="grid grid-cols-4 gap-6">
              <div>
                <div className="text-[11px] text-foreground-tertiary uppercase tracking-wider mb-1">
                  {t('detail.fullAddress')}
                </div>
                <div className="font-mono text-xs text-foreground break-all">
                  {unlock.fullAddress}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-foreground-tertiary uppercase tracking-wider mb-1">
                  {t('detail.startedAt')}
                </div>
                <div className="text-sm text-foreground">{unlock.startedAt}</div>
              </div>
              {unlock.bondPaid && (
                <div>
                  <div className="text-[11px] text-foreground-tertiary uppercase tracking-wider mb-1">
                    {t('detail.bondPaid')}
                  </div>
                  <div className="text-sm text-foreground">{unlock.bondPaid}</div>
                </div>
              )}
              <div>
                <div className="text-[11px] text-foreground-tertiary uppercase tracking-wider mb-1">
                  {t('detail.txHash')}
                </div>
                <div className="font-mono text-xs text-foreground">
                  {unlock.txHash}
                </div>
              </div>
              {unlock.accountAge && (
                <div>
                  <div className="text-[11px] text-foreground-tertiary uppercase tracking-wider mb-1">
                    {t('detail.accountAge')}
                  </div>
                  <div className="text-sm text-foreground">
                    {unlock.accountAge} days
                  </div>
                </div>
              )}
              {unlock.previousUnlocks !== undefined && (
                <div>
                  <div className="text-[11px] text-foreground-tertiary uppercase tracking-wider mb-1">
                    {t('detail.previousUnlocks')}
                  </div>
                  <div className="text-sm text-foreground">
                    {t('detail.previousUnlocksValue', {
                      count: unlock.previousUnlocks,
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Risk Factors */}
            {unlock.riskFactors && unlock.riskFactors.length > 0 && (
              <div className="mt-4 p-4 bg-danger/10 rounded-lg">
                <strong className="text-danger text-sm">
                  {t('detail.riskFactors')}:
                </strong>
                <ul className="mt-2 ml-6 list-disc text-sm text-foreground-secondary space-y-1">
                  {unlock.riskFactors.map((factor, index) => (
                    <li key={index}>{factor}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              {showChallengeButton && (
                <Link
                  href={`/observer/challenge/new?address=${unlock.address}`}
                  className={cn(
                    'inline-flex items-center gap-2 px-4 py-2',
                    'bg-hinomaru text-white rounded-lg text-sm font-medium',
                    'hover:bg-hinomaru-400 transition-colors'
                  )}
                >
                  {t('detail.challengeButton')}
                </Link>
              )}
              <a
                href={`https://etherscan.io/tx/${unlock.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-2',
                  'bg-transparent border border-border rounded-lg text-sm',
                  'text-foreground-secondary hover:border-gold hover:text-gold transition-colors'
                )}
              >
                <ExternalLink className="w-4 h-4" />
                {t('detail.viewOnExplorer')}
              </a>
              <button
                onClick={() => copyToClipboard(unlock.txHash ?? '')}
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-2',
                  'bg-transparent border border-border rounded-lg text-sm',
                  'text-foreground-secondary hover:border-gold hover:text-gold transition-colors'
                )}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-success" />
                    {t('detail.copySuccess')}
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    {t('detail.copyTxHash')}
                  </>
                )}
              </button>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
