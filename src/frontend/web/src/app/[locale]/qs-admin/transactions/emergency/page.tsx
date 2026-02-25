'use client';

import { QSAdminLayout } from '@/components/qs-admin/Layout';
import { EmergencyTransactions } from '@/components/qs-admin/Transactions/EmergencyTransactions';

export default function QSAdminTransactionsEmergencyPage() {
  return (
    <QSAdminLayout>
      <EmergencyTransactions />
    </QSAdminLayout>
  );
}
