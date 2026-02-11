'use client';

import { QSAdminLayout } from '@/components/qs-admin/Layout';
import { ProverDetail } from '@/components/qs-admin/Prover/ProverDetail';
import { use } from 'react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ProverDetailPage({ params }: PageProps) {
  const { id } = use(params);

  return (
    <QSAdminLayout>
      <ProverDetail id={id} />
    </QSAdminLayout>
  );
}
