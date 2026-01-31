import { QSAdminLayout } from '@/components/qs-admin/Layout';
import { ProposalDetail } from '@/components/qs-admin/Governance/ProposalDetail';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProposalDetailPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <QSAdminLayout>
      <ProposalDetail id={id} />
    </QSAdminLayout>
  );
}
