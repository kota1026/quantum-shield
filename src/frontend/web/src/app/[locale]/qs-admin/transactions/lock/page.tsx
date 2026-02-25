'use client';

import { QSAdminLayout } from '@/components/qs-admin/Layout';
import { LockTransactions } from '@/components/qs-admin/Transactions/LockTransactions';

export default function QSAdminTransactionsLockPage() {
  return (
    <QSAdminLayout>
      <LockTransactions />
    </QSAdminLayout>
  );
}
