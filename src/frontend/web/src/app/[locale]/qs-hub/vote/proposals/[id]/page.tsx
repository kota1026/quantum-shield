import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ProposalDetail } from '@/components/qs-hub/ProposalDetail';

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: 'qs-hub.vote.proposalDetail.meta' });

  return {
    title: t('title', { id }),
    description: t('description'),
  };
}

export default async function ProposalDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <ProposalDetail proposalId={id} />;
}
