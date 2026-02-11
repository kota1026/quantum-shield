'use client';

import { QSAdminLayout } from '@/components/qs-admin/Layout';
import { ProverList } from '@/components/qs-admin/Prover/ProverList';

export default function QSAdminProverListPage() {
  return (
    <QSAdminLayout>
      <ProverList />
    </QSAdminLayout>
  );
}
