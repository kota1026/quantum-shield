'use client';

import { QSAdminLayout } from '@/components/qs-admin/Layout';
import { ObserverDashboard } from '@/components/qs-admin/Observer';

export default function QSAdminObserverPage() {
  return (
    <QSAdminLayout>
      <ObserverDashboard />
    </QSAdminLayout>
  );
}
