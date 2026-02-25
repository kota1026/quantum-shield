'use client';

import { QSAdminLayout } from '@/components/qs-admin/Layout';
import { TransactionsDashboard } from '@/components/qs-admin/Transactions';

export default function QSAdminTransactionsPage() {
  return (
    <QSAdminLayout>
      <TransactionsDashboard />
    </QSAdminLayout>
  );
}
