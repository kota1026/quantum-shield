'use client';

import { QSAdminLayout } from '@/components/qs-admin/Layout';
import { ProverDashboard } from '@/components/qs-admin/Prover';

export default function QSAdminProverPage() {
  return (
    <QSAdminLayout>
      <ProverDashboard />
    </QSAdminLayout>
  );
}
