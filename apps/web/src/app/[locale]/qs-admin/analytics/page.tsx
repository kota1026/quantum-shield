'use client';

import { QSAdminLayout } from '@/components/qs-admin/Layout';
import { AnalyticsDashboard } from '@/components/qs-admin/Analytics';

export default function QSAdminAnalyticsPage() {
  return (
    <QSAdminLayout>
      <AnalyticsDashboard />
    </QSAdminLayout>
  );
}
