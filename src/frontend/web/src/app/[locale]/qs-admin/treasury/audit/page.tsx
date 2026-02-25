'use client';

import { QSAdminLayout } from '@/components/qs-admin/Layout';
import { AuditLog } from '@/components/qs-admin/Treasury/AuditLog';

export default function QSAdminTreasuryAuditPage() {
  return (
    <QSAdminLayout>
      <AuditLog />
    </QSAdminLayout>
  );
}
