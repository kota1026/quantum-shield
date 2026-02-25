import { QSAdminLayout } from '@/components/qs-admin/Layout';
import { TransactionDetail } from '@/components/qs-admin/Transactions/TransactionDetail';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function LockTransactionDetailPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <QSAdminLayout>
      <TransactionDetail type="lock" id={id} />
    </QSAdminLayout>
  );
}
