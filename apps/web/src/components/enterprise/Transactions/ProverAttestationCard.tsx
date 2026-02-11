'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Tooltip } from '@/components/shared/Tooltip';

export interface ProverAttestation {
  proverId: string;
  attestationHash: string;
  stakeAmount: string;
  verificationTime: string;
}

interface ProverAttestationCardProps {
  attestation: ProverAttestation;
  className?: string;
}

export function ProverAttestationCard({ attestation, className }: ProverAttestationCardProps) {
  const t = useTranslations('enterprise.transactionDetail.prover');

  const rows = [
    { label: t('proverId'), value: attestation.proverId, mono: true, tooltipKey: 'proverId' },
    { label: t('attestationHash'), value: attestation.attestationHash, mono: true, gold: true, tooltipKey: 'attestationHash' },
    { label: t('stakeAmount'), value: attestation.stakeAmount, mono: true, tooltipKey: 'stakeAmount' },
    { label: t('verificationTime'), value: attestation.verificationTime, mono: true, tooltipKey: 'verificationTime' },
  ];

  return (
    <section
      className={cn(
        'bg-background-secondary border border-white/5 rounded-xl overflow-hidden',
        className
      )}
      aria-labelledby="prover-title"
    >
      {/* Card Header */}
      <div className="px-6 py-4 border-b border-white/5">
        <Tooltip content={t('tooltips.title')} showHelpIcon>
          <h2 id="prover-title" className="text-base font-semibold text-foreground">
            {t('title')}
          </h2>
        </Tooltip>
      </div>

      {/* Card Body */}
      <div className="p-6">
        <dl className="space-y-0">
          {rows.map((row, index) => (
            <div
              key={row.label}
              className={cn(
                'flex items-center justify-between py-4',
                index < rows.length - 1 && 'border-b border-white/5'
              )}
            >
              <dt className="text-sm text-muted-foreground">
                <Tooltip content={t(`tooltips.${row.tooltipKey}`)} showHelpIcon>
                  <span>{row.label}</span>
                </Tooltip>
              </dt>
              <dd
                className={cn(
                  'text-sm font-medium',
                  row.mono && 'font-mono',
                  row.gold && 'text-gold'
                )}
              >
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
