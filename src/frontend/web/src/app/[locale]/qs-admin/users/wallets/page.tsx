'use client';

import { QSAdminLayout } from '@/components/qs-admin/Layout';
import { UsersWallets } from '@/components/qs-admin/Users/UsersWallets';

export default function QSAdminUsersWalletsPage() {
  return (
    <QSAdminLayout>
      <UsersWallets />
    </QSAdminLayout>
  );
}
