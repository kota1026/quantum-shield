'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

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
    { label: t('proverId'), value: attestation.proverId, mono: true },
    { label: t('attestationHash'), value: attestation.attestationHash, mono: true, gold: true },
    { label: t('stakeAmount'), value: attestation.stakeAmount, mono: true },
    { label: t('verificationTime'), value: attestation.verificationTime, mono: true },
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
        <h2 id="prover-title" className="text-base font-semibold text-foreground">
          {t('title')}
        </h2>
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
              <dt className="text-sm text-muted-foreground">{row.label}</dt>
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
