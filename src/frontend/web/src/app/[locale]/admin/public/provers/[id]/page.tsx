import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { PublicProverDetail } from '@/components/admin/public/PublicProverDetail';

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: 'admin.proverDetail.meta' });

  return {
    title: t('title', { id }),
    description: t('description'),
  };
}

export default async function PublicProverDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <PublicProverDetail proverId={id} />;
}
