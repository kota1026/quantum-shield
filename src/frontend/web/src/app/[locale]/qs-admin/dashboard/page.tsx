'use client';

import { QSAdminLayout } from '@/components/qs-admin/Layout';
import { Dashboard } from '@/components/qs-admin/Dashboard';

export default function QSAdminDashboardPage() {
  return (
    <QSAdminLayout>
      <Dashboard />
    </QSAdminLayout>
  );
}
