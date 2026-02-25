import { QSAdminLayout } from '@/components/qs-admin/Layout';
import { ObserverDetail } from '@/components/qs-admin/Observer/ObserverDetail';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ObserverDetailPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <QSAdminLayout>
      <ObserverDetail id={id} />
    </QSAdminLayout>
  );
}
