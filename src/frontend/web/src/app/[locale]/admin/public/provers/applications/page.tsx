import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { PublicProverApplications } from '@/components/admin/public/PublicProverApplications';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'admin.proverApplications.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function PublicProverApplicationsPage() {
  return <PublicProverApplications />;
}
