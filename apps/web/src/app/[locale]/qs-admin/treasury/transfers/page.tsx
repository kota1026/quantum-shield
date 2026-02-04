'use client';

import { QSAdminLayout } from '@/components/qs-admin/Layout';
import { TransfersList } from '@/components/qs-admin/Treasury/TransfersList';

export default function QSAdminTreasuryTransfersPage() {
  return (
    <QSAdminLayout>
      <TransfersList />
    </QSAdminLayout>
  );
}
