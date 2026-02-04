import { QSAdminLayout } from '@/components/qs-admin/Layout';
import { ProverRequestDetail } from '@/components/qs-admin/Prover/ProverRequestDetail';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProverRequestDetailPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <QSAdminLayout>
      <ProverRequestDetail id={id} />
    </QSAdminLayout>
  );
}
