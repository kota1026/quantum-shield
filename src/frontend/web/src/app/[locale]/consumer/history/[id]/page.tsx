'use client';

import { useParams } from 'next/navigation';
import { formatEther } from 'viem';
import { HistoryDetail } from '@/components/consumer/HistoryDetail';
import { useTransactionDetail } from '@/hooks/consumer';
import type { HistoryTransaction, TransactionType, TransactionStatus } from '@/components/consumer/History/HistoryItem';
import { AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// Map API transaction type to component type
function mapTxType(txType: string): TransactionType {
  switch (txType) {
    case 'lock': return 'lock';
    case 'normal_unlock': return 'normalUnlock';
    case 'emergency_unlock': return 'emergencyUnlock';
    default: return 'lock';
  }
}

// Map API status to component status
function mapStatus(status: string, txType: string): TransactionStatus {
  if (status === 'completed') return 'complete';
  if (txType === 'emergency_unlock') return 'pending7d';
  return 'pending24h';
}

export default function HistoryDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data, isLoading, error } = useTransactionDetail(id);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-hinomaru mx-auto mb-4" />
          <p className="text-foreground-secondary">Loading transaction details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <div className="min-h-screen bg-background pb-8">
        <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
          <div className={cn(
            'absolute -top-48 left-1/2 -translate-x-1/2',
            'w-[800px] h-[600px]',
            'bg-gradient-radial-hinomaru opacity-30'
          )} />
        </div>

        <main className="relative z-10 max-w-[900px] mx-auto px-4 sm:px-6 pt-6">
          <header className="flex items-center gap-4 mb-6">
            <Link
              href="/consumer/history"
              className={cn(
                'w-11 h-11 flex items-center justify-center',
                'bg-surface border border-border rounded-qs',
                'text-foreground-secondary hover:border-hinomaru hover:text-hinomaru',
                'transition-all'
              )}
              aria-label="Back to history"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-foreground">Transaction Details</h1>
          </header>

          <div className="bg-surface border border-border rounded-qs-xl p-8 text-center">
            <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Transaction Not Found</h2>
            <p className="text-foreground-secondary mb-6">
              {error?.message || 'The transaction you are looking for could not be found.'}
            </p>
            <Button asChild variant="primary">
              <Link href="/consumer/history">Back to History</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // Transform API data to component format
  // Convert amount to ETH - handle both wei format (integer string) and ETH format (decimal string)
  let amountEth: string;
  try {
    if (data.transaction.amount.includes('.')) {
      // Already in ETH format
      amountEth = parseFloat(data.transaction.amount).toString();
    } else {
      // In wei format - convert to ETH
      amountEth = parseFloat(formatEther(BigInt(data.transaction.amount))).toString();
    }
  } catch {
    // Fallback: parse as float directly
    amountEth = parseFloat(data.transaction.amount).toString();
  }

  const transaction: HistoryTransaction = {
    id: data.transaction.id,
    type: mapTxType(data.transaction.txType),
    status: mapStatus(data.transaction.status, data.transaction.txType),
    amount: `${amountEth} ETH`,
    timestamp: new Date(data.transaction.createdAt * 1000).toLocaleString('ja-JP'),
    txHash: data.transaction.l1TxHash || data.transaction.id,
    blockConfirmed: data.transaction.status === 'completed' ? 12 : undefined,
    remainingTime: data.timeLockRemaining && data.timeLockRemaining > 0
      ? `${Math.floor(data.timeLockRemaining / 3600)}h ${Math.floor((data.timeLockRemaining % 3600) / 60)}m`
      : undefined,
  };

  return <HistoryDetail transaction={transaction} />;
}
