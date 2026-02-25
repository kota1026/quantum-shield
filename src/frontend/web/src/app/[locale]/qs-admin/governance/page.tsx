'use client';

import { QSAdminLayout } from '@/components/qs-admin/Layout';
import { GovernanceDashboard } from '@/components/qs-admin/Governance';

export default function QSAdminGovernancePage() {
  return (
    <QSAdminLayout>
      <GovernanceDashboard />
    </QSAdminLayout>
  );
}
