import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { SaasOperatorDetail } from '@/components/admin/saas/SaasOperatorDetail';

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: 'admin.operatorDetail.meta' });

  return {
    title: t('title', { id }),
    description: t('description'),
  };
}

export default async function SaasOperatorDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <SaasOperatorDetail operatorId={id} />;
}
