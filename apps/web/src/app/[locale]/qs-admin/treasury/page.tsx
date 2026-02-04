'use client';

import { QSAdminLayout } from '@/components/qs-admin/Layout';
import { TreasuryDashboard } from '@/components/qs-admin/Treasury';

export default function QSAdminTreasuryPage() {
  return (
    <QSAdminLayout>
      <TreasuryDashboard />
    </QSAdminLayout>
  );
}
