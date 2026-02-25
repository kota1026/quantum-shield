'use client';

import { QSAdminLayout } from '@/components/qs-admin/Layout';
import { SupportDashboard } from '@/components/qs-admin/Support';

export default function QSAdminSupportPage() {
  return (
    <QSAdminLayout>
      <SupportDashboard />
    </QSAdminLayout>
  );
}
