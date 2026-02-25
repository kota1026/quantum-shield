'use client';

import { QSAdminLayout } from '@/components/qs-admin/Layout';
import { ProverRequests } from '@/components/qs-admin/Prover/ProverRequests';

export default function QSAdminProverRequestsPage() {
  return (
    <QSAdminLayout>
      <ProverRequests />
    </QSAdminLayout>
  );
}
