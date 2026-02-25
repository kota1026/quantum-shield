'use client';

import { QSAdminLayout } from '@/components/qs-admin/Layout';
import { ProposalsList } from '@/components/qs-admin/Governance/ProposalsList';

export default function QSAdminGovernanceProposalsPage() {
  return (
    <QSAdminLayout>
      <ProposalsList />
    </QSAdminLayout>
  );
}
