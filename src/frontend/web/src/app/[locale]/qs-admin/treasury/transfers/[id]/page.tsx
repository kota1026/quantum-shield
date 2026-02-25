import { QSAdminLayout } from '@/components/qs-admin/Layout';
import { TransferDetail } from '@/components/qs-admin/Treasury/TransferDetail';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TransferDetailPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <QSAdminLayout>
      <TransferDetail id={id} />
    </QSAdminLayout>
  );
}
