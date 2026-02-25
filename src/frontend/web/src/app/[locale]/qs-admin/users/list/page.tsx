'use client';

import { QSAdminLayout } from '@/components/qs-admin/Layout';
import { UsersList } from '@/components/qs-admin/Users/UsersList';

export default function QSAdminUsersListPage() {
  return (
    <QSAdminLayout>
      <UsersList />
    </QSAdminLayout>
  );
}
