'use client';

import { use } from 'react';
import { ProposalDetail } from '@/components/governance/ProposalDetail';

interface PageProps {
  params: Promise<{
    id: string;
    locale: string;
  }>;
}

export default function ProposalDetailPage({ params }: PageProps) {
  const { id } = use(params);

  return <ProposalDetail proposalId={id} />;
}
