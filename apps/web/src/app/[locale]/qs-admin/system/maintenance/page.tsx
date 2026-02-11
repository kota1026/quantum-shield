'use client';

import { QSAdminLayout } from '@/components/qs-admin/Layout';
import { MaintenanceManagement } from '@/components/qs-admin/System/MaintenanceManagement';

export default function QSAdminSystemMaintenancePage() {
  return (
    <QSAdminLayout>
      <MaintenanceManagement />
    </QSAdminLayout>
  );
}
