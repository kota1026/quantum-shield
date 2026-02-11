import { QSAdminLayout } from '@/components/qs-admin/Layout';
import { UserDetail } from '@/components/qs-admin/Users/UserDetail';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function UserDetailPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <QSAdminLayout>
      <UserDetail id={id} />
    </QSAdminLayout>
  );
}
