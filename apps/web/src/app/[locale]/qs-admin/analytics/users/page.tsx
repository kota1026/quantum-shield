'use client';

import { QSAdminLayout } from '@/components/qs-admin/Layout';
import { UserAnalytics } from '@/components/qs-admin/Analytics/UserAnalytics';

export default function QSAdminAnalyticsUsersPage() {
  return (
    <QSAdminLayout>
      <UserAnalytics />
    </QSAdminLayout>
  );
}
