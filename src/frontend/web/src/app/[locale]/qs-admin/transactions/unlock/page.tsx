'use client';

import { QSAdminLayout } from '@/components/qs-admin/Layout';
import { UnlockTransactions } from '@/components/qs-admin/Transactions/UnlockTransactions';

export default function QSAdminTransactionsUnlockPage() {
  return (
    <QSAdminLayout>
      <UnlockTransactions />
    </QSAdminLayout>
  );
}
