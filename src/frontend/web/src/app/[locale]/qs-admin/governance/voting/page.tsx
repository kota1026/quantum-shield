'use client';

import { QSAdminLayout } from '@/components/qs-admin/Layout';
import { VotingStatus } from '@/components/qs-admin/Governance/VotingStatus';

export default function QSAdminGovernanceVotingPage() {
  return (
    <QSAdminLayout>
      <VotingStatus />
    </QSAdminLayout>
  );
}
