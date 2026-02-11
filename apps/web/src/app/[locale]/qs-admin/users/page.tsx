'use client';

import { QSAdminLayout } from '@/components/qs-admin/Layout';
import { UsersDashboard } from '@/components/qs-admin/Users';

export default function QSAdminUsersPage() {
  return (
    <QSAdminLayout>
      <UsersDashboard />
    </QSAdminLayout>
  );
}
