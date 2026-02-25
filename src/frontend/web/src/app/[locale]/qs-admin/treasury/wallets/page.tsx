'use client';

import { QSAdminLayout } from '@/components/qs-admin/Layout';
import { WalletsList } from '@/components/qs-admin/Treasury/WalletsList';

export default function QSAdminTreasuryWalletsPage() {
  return (
    <QSAdminLayout>
      <WalletsList />
    </QSAdminLayout>
  );
}
