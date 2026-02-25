import { QSAdminLayout } from '@/components/qs-admin/Layout';
import { TransactionDetail } from '@/components/qs-admin/Transactions/TransactionDetail';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ChallengeTransactionDetailPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <QSAdminLayout>
      <TransactionDetail type="challenge" id={id} />
    </QSAdminLayout>
  );
}
