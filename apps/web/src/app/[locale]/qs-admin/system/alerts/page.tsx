'use client';

import { QSAdminLayout } from '@/components/qs-admin/Layout';
import { AlertsList } from '@/components/qs-admin/System/AlertsList';

export default function QSAdminSystemAlertsPage() {
  return (
    <QSAdminLayout>
      <AlertsList />
    </QSAdminLayout>
  );
}
