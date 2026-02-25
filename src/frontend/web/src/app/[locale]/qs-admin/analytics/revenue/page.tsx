'use client';

import { QSAdminLayout } from '@/components/qs-admin/Layout';
import { RevenueAnalytics } from '@/components/qs-admin/Analytics/RevenueAnalytics';

export default function QSAdminAnalyticsRevenuePage() {
  return (
    <QSAdminLayout>
      <RevenueAnalytics />
    </QSAdminLayout>
  );
}
