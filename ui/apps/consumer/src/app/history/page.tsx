'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  History,
  Lock,
  Unlock,
  Clock,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Filter,
  Search,
} from 'lucide-react';

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
} from '@quantum-shield/ui';

type TransactionType = 'lock' | 'unlock' | 'emergency';
type TransactionStatus = 'completed' | 'pending' | 'failed';

interface Transaction {
  id: string;
  type: TransactionType;
  amount: string;
  status: TransactionStatus;
  timestamp: string;
  txHash: string;
}

// Mock transaction history - in production, fetch from API
const mockTransactions: Transaction[] = [
  {
    id: '5',
    type: 'unlock',
    amount: '1.5 ETH',
    status: 'completed',
    timestamp: '2026-01-05 14:30',
    txHash: '0xabcd...ef12',
  },
  {
    id: '4',
    type: 'lock',
    amount: '2.0 ETH',
    status: 'pending',
    timestamp: '2026-01-05 10:15',
    txHash: '0x1234...5678',
  },
  {
    id: '3',
    type: 'lock',
    amount: '1.5 ETH',
    status: 'completed',
    timestamp: '2026-01-04 09:00',
    txHash: '0x9876...5432',
  },
  {
    id: '2',
    type: 'emergency',
    amount: '0.8 ETH',
    status: 'completed',
    timestamp: '2026-01-03 16:45',
    txHash: '0xfedc...ba98',
  },
  {
    id: '1',
    type: 'lock',
    amount: '0.8 ETH',
    status: 'completed',
    timestamp: '2026-01-01 12:00',
    txHash: '0x5555...1111',
  },
];

export default function HistoryPage() {
  const [filter, setFilter] = useState<'all' | TransactionType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTransactions = mockTransactions.filter((tx) => {
    if (filter !== 'all' && tx.type !== filter) return false;
    if (searchQuery && !tx.id.includes(searchQuery) && !tx.txHash.includes(searchQuery)) {
      return false;
    }
    return true;
  });

  const getTypeIcon = (type: TransactionType) => {
    switch (type) {
      case 'lock':
        return <Lock className="h-4 w-4" />;
      case 'unlock':
        return <Unlock className="h-4 w-4" />;
      case 'emergency':
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: TransactionType) => {
    switch (type) {
      case 'lock':
        return 'bg-qs-primary-100 text-qs-primary-700 dark:bg-qs-primary-900 dark:text-qs-primary-300';
      case 'unlock':
        return 'bg-qs-success-100 text-qs-success-700 dark:bg-qs-success-900 dark:text-qs-success-300';
      case 'emergency':
        return 'bg-qs-warning-100 text-qs-warning-700 dark:bg-qs-warning-900 dark:text-qs-warning-300';
    }
  };

  const getStatusIcon = (status: TransactionStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-qs-success-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-qs-warning-500" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-qs-error-500" />;
    }
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <History className="h-8 w-8 text-qs-primary-500" />
            <div>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>
                View all your lock and unlock transactions
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by ID or tx hash..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              {(['all', 'lock', 'unlock', 'emergency'] as const).map((f) => (
                <Button
                  key={f}
                  variant={filter === f ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter(f)}
                >
                  {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          {/* Transaction List */}
          <div className="space-y-3">
            {filteredTransactions.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                No transactions found
              </div>
            ) : (
              filteredTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${getTypeColor(
                        tx.type
                      )}`}
                    >
                      {getTypeIcon(tx.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium capitalize">{tx.type}</span>
                        <span className="text-sm text-muted-foreground">
                          #{tx.id}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{tx.timestamp}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold">{tx.amount}</p>
                      <div className="flex items-center gap-1 text-sm">
                        {getStatusIcon(tx.status)}
                        <span className="capitalize">{tx.status}</span>
                      </div>
                    </div>
                    <a
                      href={`https://sepolia.etherscan.io/tx/${tx.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-qs-primary-500 hover:text-qs-primary-600"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Back to Dashboard */}
          <div className="pt-4">
            <Button variant="outline" className="w-full" asChild>
              <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
