'use client';

import { QSAdminLayout } from '@/components/qs-admin/Layout';
import { MembersDashboard } from '@/components/qs-admin/Members';

export default function QSAdminMembersPage() {
  return (
    <QSAdminLayout>
      <MembersDashboard />
    </QSAdminLayout>
  );
}
