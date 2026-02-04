'use client';

import { QSAdminLayout } from '@/components/qs-admin/Layout';
import { RolesManagement } from '@/components/qs-admin/Members/RolesManagement';

export default function QSAdminMembersRolesPage() {
  return (
    <QSAdminLayout>
      <RolesManagement />
    </QSAdminLayout>
  );
}
