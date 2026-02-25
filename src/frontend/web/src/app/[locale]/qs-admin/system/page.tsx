'use client';

import { QSAdminLayout } from '@/components/qs-admin/Layout';
import { SystemDashboard } from '@/components/qs-admin/System';

export default function QSAdminSystemPage() {
  return (
    <QSAdminLayout>
      <SystemDashboard />
    </QSAdminLayout>
  );
}
