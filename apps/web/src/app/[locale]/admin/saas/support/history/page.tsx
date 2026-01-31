import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { SaasSupportHistory } from '@/components/admin/saas/SaasSupportHistory';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'admin.saasSupportHistory.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function SaasSupportHistoryPage() {
  return <SaasSupportHistory />;
}
