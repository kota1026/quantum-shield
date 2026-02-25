import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { PublicUserStats } from '@/components/admin/public/PublicUserStats';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'admin.publicUserStats.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function PublicUserStatsPage() {
  return <PublicUserStats />;
}
