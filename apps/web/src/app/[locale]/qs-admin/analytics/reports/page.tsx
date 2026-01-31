'use client';

import { QSAdminLayout } from '@/components/qs-admin/Layout';
import { ReportsList } from '@/components/qs-admin/Analytics/ReportsList';

export default function QSAdminAnalyticsReportsPage() {
  return (
    <QSAdminLayout>
      <ReportsList />
    </QSAdminLayout>
  );
}
