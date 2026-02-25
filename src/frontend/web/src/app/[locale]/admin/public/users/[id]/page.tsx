import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { PublicUserDetail } from '@/components/admin/public/PublicUserDetail';

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: 'admin.publicUserDetail.meta' });

  return {
    title: t('title', { id }),
    description: t('description'),
  };
}

export default async function PublicUserDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <PublicUserDetail userId={id} />;
}
