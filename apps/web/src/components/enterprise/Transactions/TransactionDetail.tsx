'use client';

import { useTranslations } from 'next-intl';
import { EnterpriseSidebar } from '../Dashboard/EnterpriseSidebar';
import { TransactionInfoCard, TransactionInfo } from './TransactionInfoCard';
import { TransactionTimeline, TimelineEvent } from './TransactionTimeline';
import { ProverAttestationCard, ProverAttestation } from './ProverAttestationCard';
import { AuditTrailCard, AuditTrail } from './AuditTrailCard';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText } from 'lucide-react';
import Link from 'next/link';

// Demo data - In production, this would come from API
const FALLBACK_TRANSACTION: TransactionInfo = {
  txHash: '0x7a3f9d2e4b1c8f5a6d3e2b1a0c9f8e7d6c5b4a3f9d2e4b1c8f5a6d3e2b1a0c9f',
  type: 'lock',
  amount: '5.00 ETH',
  usdValue: '$12,450.00',
  fromAddress: '0x1234...5678',
  contractAddress: '0xQS01...7890',
  blockNumber: '19,234,567',
  gasUsed: '142,567',
  gasPrice: '25 Gwei',
  transactionFee: '0.00356 ETH ($8.87)',
  status: 'complete',
  isQuantumProtected: true,
  signatureAlgorithm: 'CRYSTALS-Dilithium',
};

const FALLBACK_TIMELINE: TimelineEvent[] = [
  { id: '1', titleKey: 'submitted', timestamp: '2026-01-11 14:32:15 JST', status: 'complete' },
  { id: '2', titleKey: 'quantumVerified', timestamp: '2026-01-11 14:32:16 JST', status: 'complete' },
  { id: '3', titleKey: 'proverAttestation', timestamp: '2026-01-11 14:32:18 JST', status: 'complete' },
  { id: '4', titleKey: 'blockConfirmation', timestamp: '2026-01-11 14:32:45 JST', status: 'complete' },
  { id: '5', titleKey: 'complete', timestamp: '2026-01-11 14:32:45 JST', status: 'complete' },
];

const FALLBACK_PROVER: ProverAttestation = {
  proverId: 'prover_001',
  attestationHash: '0xatt...789f',
  stakeAmount: '100 ETH',
  verificationTime: '1.2s',
};

const FALLBACK_AUDIT: AuditTrail = {
  organization: 'Acme Corp',
  apiKey: 'qs_live_...7a3f',
  ipAddress: '203.0.113.42',
  userAgent: 'QS-SDK/1.2.0',
};

interface TransactionDetailProps {
  transactionId?: string;
}

export function TransactionDetail({ transactionId }: TransactionDetailProps) {
  const t = useTranslations('enterprise.transactionDetail');

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <EnterpriseSidebar />

      {/* Main Content */}
      <div className="flex-1 ml-[260px]">
        {/* Top Bar */}
        <header
          className="flex items-center justify-between px-8 py-4 bg-background-secondary border-b border-white/5 sticky top-0 z-40"
          role="banner"
        >
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              asChild
              aria-label={t('backToList')}
            >
              <Link href="/enterprise/transactions">
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </Button>
            <h1 className="text-xl font-semibold text-foreground">{t('pageTitle')}</h1>
          </div>
          <Button variant="outline">
            <FileText className="w-4 h-4 mr-2" aria-hidden="true" />
            {t('exportPdf')}
          </Button>
        </header>

        {/* Page Content */}
        <main className="p-8" role="main" aria-label={t('ariaLabel')}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - 2/3 width */}
            <div className="lg:col-span-2 space-y-8">
              <TransactionInfoCard transaction={FALLBACK_TRANSACTION} />
              <ProverAttestationCard attestation={FALLBACK_PROVER} />
            </div>

            {/* Right Column - 1/3 width */}
            <div className="space-y-8">
              <TransactionTimeline events={FALLBACK_TIMELINE} />
              <AuditTrailCard audit={FALLBACK_AUDIT} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default TransactionDetail;
