import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { HistoryDetail } from '@/components/consumer/HistoryDetail';
import type { HistoryTransaction } from '@/components/consumer/History/HistoryItem';

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

// Demo transaction data - In production, this would come from API
const FALLBACK_TRANSACTIONS: Record<string, HistoryTransaction> = {
  '1': {
    id: '1',
    type: 'lock',
    status: 'complete',
    amount: '5.00 ETH',
    timestamp: '2026-01-06 14:32',
    txHash: '0x7a3f...9c2d',
    blockConfirmed: 12,
  },
  '2': {
    id: '2',
    type: 'normalUnlock',
    status: 'pending24h',
    amount: '2.50 ETH',
    timestamp: '2026-01-05 09:15',
    txHash: '0x8b4c...1e5f',
    remainingTime: '23:41:02',
  },
  '3': {
    id: '3',
    type: 'emergencyUnlock',
    status: 'pending7d',
    amount: '0.75 ETH',
    timestamp: '2026-01-04 18:00',
    txHash: '0x2d7a...4f8b',
    bondAmount: '0.5 ETH',
  },
  '4': {
    id: '4',
    type: 'unlockComplete',
    status: 'complete',
    amount: '1.25 ETH',
    timestamp: '2026-01-03 18:45',
    txHash: '0x5e9c...3a7d',
    blockConfirmed: 12,
  },
  '5': {
    id: '5',
    type: 'lock',
    status: 'complete',
    amount: '10.00 ETH',
    timestamp: '2026-01-02 10:20',
    txHash: '0x1f4a...8c2e',
    blockConfirmed: 12,
  },
  '6': {
    id: '6',
    type: 'lock',
    status: 'complete',
    amount: '5.35 ETH',
    timestamp: '2026-01-01 08:00',
    txHash: '0x9b3e...7d1a',
    blockConfirmed: 12,
  },
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'consumer.historyDetail.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function HistoryDetailPage({ params }: PageProps) {
  const { id } = await params;

  // In production, fetch transaction from API
  const transaction = FALLBACK_TRANSACTIONS[id];

  if (!transaction) {
    notFound();
  }

  return <HistoryDetail transaction={transaction} />;
}
