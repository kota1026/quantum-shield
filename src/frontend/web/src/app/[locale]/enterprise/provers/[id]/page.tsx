import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ProverDetail } from '@/components/enterprise/Provers/ProverDetail';

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'enterprise.proverDetail.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function ProverDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <ProverDetail proverId={id} />;
}
